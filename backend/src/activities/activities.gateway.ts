import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

export interface StudentProgressState {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'STUCK' | 'COMPLETED';
  progress?: number;
  engagementScore?: number;
  performanceScore?: number;
  progressText?: string;
  answers?: Record<string, string>;
  helpMessage?: string;
  score?: number;
  lastUpdated: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ActivitiesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  // In-memory live activity tracking: activityId -> Map<studentId, StudentProgressState>
  private liveTrackingMap = new Map<string, Map<string, StudentProgressState>>();

  handleConnection(client: Socket) {
    console.log(`Client connected to WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { activityId: string; userId: string; role: string; userName?: string },
  ) {
    const roomName = `activity_${payload.activityId}`;
    client.join(roomName);

    if (!this.liveTrackingMap.has(payload.activityId)) {
      this.liveTrackingMap.set(payload.activityId, new Map());
    }

    const activityStateMap = this.liveTrackingMap.get(payload.activityId)!;

    // Load initial student states from DB if in-memory map doesn't have them yet
    try {
      if (payload.activityId) {
        const actSession = await this.prisma.activitySession.findFirst({
          where: {
            OR: [
              { shareCode: payload.activityId.toUpperCase() },
              { id: payload.activityId },
              { activityVersion: { activityId: payload.activityId } },
            ],
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'desc' },
          include: {
            studentSessions: true,
          },
        });

        if (actSession && actSession.studentSessions) {
          for (const st of actSession.studentSessions) {
            const key = st.studentId || st.id;
            if (!activityStateMap.has(key)) {
              activityStateMap.set(key, {
                studentId: key,
                studentName: st.studentName,
                status: (st.status as any) || 'NOT_STARTED',
                progress: st.progress || 0,
                engagementScore: st.engagementScore || 0,
                performanceScore: st.performanceScore || 0,
                progressText: `${st.progress || 0}% completed`,
                score: st.score || 0,
                lastUpdated: st.lastSeenAt ? st.lastSeenAt.toISOString() : new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching room state from database in handleJoinRoom:', e);
    }

    // Send current live states of all students to the client
    const currentStudents = Array.from(activityStateMap.values());
    client.emit('room_state', { activityId: payload.activityId, students: currentStudents });
  }

  @SubscribeMessage('update_progress')
  async handleUpdateProgress(
    @MessageBody()
    payload: {
      activityId: string;
      studentId: string;
      studentName: string;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'STUCK' | 'COMPLETED';
      progress?: number;
      engagementScore?: number;
      performanceScore?: number;
      progressText?: string;
      answers?: Record<string, string>;
      score?: number;
    },
  ) {
    const roomName = `activity_${payload.activityId}`;

    if (!this.liveTrackingMap.has(payload.activityId)) {
      this.liveTrackingMap.set(payload.activityId, new Map());
    }

    const activityStateMap = this.liveTrackingMap.get(payload.activityId)!;
    const existing = activityStateMap.get(payload.studentId);

    const progressVal = typeof payload.progress === 'number' ? payload.progress : existing?.progress || 0;
    const engagementVal = typeof payload.engagementScore === 'number' ? payload.engagementScore : existing?.engagementScore || 0;
    const performanceVal = typeof payload.performanceScore === 'number' ? payload.performanceScore : existing?.performanceScore || 0;

    const updatedState: StudentProgressState = {
      studentId: payload.studentId,
      studentName: payload.studentName,
      status: payload.status,
      progress: progressVal,
      engagementScore: engagementVal,
      performanceScore: performanceVal,
      progressText: payload.progressText || `${progressVal}% completed`,
      answers: payload.answers || existing?.answers || {},
      score: payload.score ?? existing?.score,
      helpMessage: payload.status === 'COMPLETED' ? undefined : existing?.helpMessage,
      lastUpdated: new Date().toISOString(),
    };

    activityStateMap.set(payload.studentId, updatedState);

    // Broadcast updated state to room
    this.server.to(roomName).emit('live_student_update', updatedState);

    // Asynchronously persist progress update to database
    this.persistStudentProgress(payload, progressVal, engagementVal, performanceVal).catch((err) => {
      console.warn('Failed to persist student progress:', err);
    });
  }

  @SubscribeMessage('request_help')
  async handleRequestHelp(
    @MessageBody()
    payload: {
      activityId: string;
      studentId: string;
      studentName: string;
      helpMessage?: string;
      progressText?: string;
    },
  ) {
    const roomName = `activity_${payload.activityId}`;

    if (!this.liveTrackingMap.has(payload.activityId)) {
      this.liveTrackingMap.set(payload.activityId, new Map());
    }

    const activityStateMap = this.liveTrackingMap.get(payload.activityId)!;
    const existing = activityStateMap.get(payload.studentId);

    const stuckState: StudentProgressState = {
      studentId: payload.studentId,
      studentName: payload.studentName,
      status: 'STUCK',
      progressText: payload.progressText || existing?.progressText || 'Needs assistance',
      answers: existing?.answers || {},
      helpMessage: payload.helpMessage || 'Student requested help on exercise',
      lastUpdated: new Date().toISOString(),
    };

    activityStateMap.set(payload.studentId, stuckState);

    // Broadcast stuck alert to room
    this.server.to(roomName).emit('live_student_update', stuckState);
    this.server.to(roomName).emit('student_stuck_alert', stuckState);

    this.persistStudentProgress(
      {
        activityId: payload.activityId,
        studentId: payload.studentId,
        studentName: payload.studentName,
        status: 'STUCK',
      },
      existing?.progress || 0,
      existing?.engagementScore || 0,
      existing?.performanceScore || 0,
    ).catch(() => {});
  }

  @SubscribeMessage('send_hint')
  handleSendHint(
    @MessageBody()
    payload: {
      activityId: string;
      studentId: string;
      teacherName: string;
      hintText: string;
    },
  ) {
    const roomName = `activity_${payload.activityId}`;

    // Broadcast hint targeted for student
    this.server.to(roomName).emit('receive_hint', {
      studentId: payload.studentId,
      teacherName: payload.teacherName,
      hintText: payload.hintText,
      timestamp: new Date().toISOString(),
    });

    // Update student status back to IN_PROGRESS (Hint Received)
    const activityStateMap = this.liveTrackingMap.get(payload.activityId);
    if (activityStateMap && activityStateMap.has(payload.studentId)) {
      const studentState = activityStateMap.get(payload.studentId)!;
      studentState.status = 'IN_PROGRESS';
      studentState.progressText = 'Hint Received from Teacher';
      studentState.lastUpdated = new Date().toISOString();
      this.server.to(roomName).emit('live_student_update', studentState);

      this.persistStudentProgress(
        {
          activityId: payload.activityId,
          studentId: payload.studentId,
          studentName: studentState.studentName,
          status: 'IN_PROGRESS',
        },
        studentState.progress || 0,
        studentState.engagementScore || 0,
        studentState.performanceScore || 0,
      ).catch(() => {});
    }
  }

  emitActivityPublished(data: {
    classroomId?: string;
    activityId: string;
    activityTitle: string;
    shareCode: string;
    teacherName?: string;
  }) {
    if (this.server) {
      this.server.emit('activity_published', data);
      if (data.classroomId) {
        this.server.to(`classroom_${data.classroomId}`).emit('activity_published', data);
      }
    }
  }

  private async persistStudentProgress(
    payload: {
      activityId: string;
      studentId: string;
      studentName: string;
      status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'STUCK' | 'COMPLETED';
      score?: number;
    },
    progress: number,
    engagementScore: number,
    performanceScore: number,
  ) {
    if (!payload.activityId) return;

    try {
      const actSession = await this.prisma.activitySession.findFirst({
        where: {
          OR: [
            { shareCode: payload.activityId.toUpperCase() },
            { id: payload.activityId },
            { activityVersion: { activityId: payload.activityId } },
          ],
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!actSession) return;

      const trimmedName = payload.studentName?.trim();

      let studentSession = await this.prisma.studentSession.findFirst({
        where: {
          activitySessionId: actSession.id,
          OR: [
            { id: payload.studentId },
            { studentId: payload.studentId },
            ...(trimmedName
              ? [{ studentName: { equals: trimmedName, mode: 'insensitive' as const } }]
              : []),
          ],
        },
      });

      const effectiveStatus =
        payload.status ||
        (progress === 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');

      if (studentSession) {
        await this.prisma.studentSession.update({
          where: { id: studentSession.id },
          data: {
            status: effectiveStatus,
            progress: progress,
            engagementScore: engagementScore,
            performanceScore: performanceScore,
            score: payload.score ?? performanceScore ?? studentSession.score,
            lastSeenAt: new Date(),
          },
        });
      } else {
        await this.prisma.studentSession.create({
          data: {
            activitySessionId: actSession.id,
            studentId:
              payload.studentId && !payload.studentId.startsWith('student_guest')
                ? payload.studentId
                : null,
            studentName: trimmedName || 'Student',
            status: effectiveStatus,
            progress: progress,
            engagementScore: engagementScore,
            performanceScore: performanceScore,
            score: payload.score ?? performanceScore ?? 0,
          },
        });
      }
    } catch (err) {
      console.warn('Failed to persist student progress to database:', err);
    }
  }
}



