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
    const rawId = payload.activityId || (payload as any).shareCode || '';
    const normalizedActId = rawId.trim().toUpperCase();
    const roomName = `activity_${normalizedActId}`;
    client.join(roomName);

    if (!this.liveTrackingMap.has(normalizedActId)) {
      this.liveTrackingMap.set(normalizedActId, new Map());
    }

    const activityStateMap = this.liveTrackingMap.get(normalizedActId)!;

    // Load initial student states from DB if in-memory map doesn't have them yet
    try {
      if (rawId) {
        const actSession = await this.prisma.activitySession.findFirst({
          where: {
            OR: [
              { shareCode: normalizedActId },
              { id: rawId },
              { activityVersion: { activityId: rawId } },
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
            const key = st.id;
            if (!activityStateMap.has(key)) {
              activityStateMap.set(key, {
                studentId: key,
                studentName: st.studentName,
                status: (st.status as any) || 'NOT_STARTED',
                progress: st.progress || 0,
                engagementScore: 0,
                performanceScore: st.score || 0,
                progressText: st.status === 'STUCK' ? 'Needs assistance' : `${st.progress || 0}% completed`,
                score: st.score || 0,
                lastUpdated: st.lastSeenAt ? st.lastSeenAt.toISOString() : new Date().toISOString(),
                helpRequested: st.status === 'STUCK',
              } as any);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching room state from database in handleJoinRoom:', e);
    }

    // Send current live states of all students to the client
    const currentStudents = Array.from(activityStateMap.values());
    client.emit('room_state', { activityId: rawId, students: currentStudents });
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
    const rawId = payload.activityId || (payload as any).shareCode || '';
    const normalizedActId = rawId.trim().toUpperCase();
    const roomName = `activity_${normalizedActId}`;

    if (!this.liveTrackingMap.has(normalizedActId)) {
      this.liveTrackingMap.set(normalizedActId, new Map());
    }

    const activityStateMap = this.liveTrackingMap.get(normalizedActId)!;
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

    // Broadcast updated state to room and globally
    this.server.to(roomName).emit('live_student_update', updatedState);
    this.server.emit('live_student_update', updatedState);

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
    const rawId = payload.activityId || (payload as any).shareCode || '';
    const normalizedActId = rawId.trim().toUpperCase();
    const roomName = `activity_${normalizedActId}`;

    if (!this.liveTrackingMap.has(normalizedActId)) {
      this.liveTrackingMap.set(normalizedActId, new Map());
    }

    const activityStateMap = this.liveTrackingMap.get(normalizedActId)!;

    let dbStudentSessionId: string | null = null;
    let dbStudentName = payload.studentName;
    let dbProgress = 0;
    let dbScore = 0;
    try {
      const actSession = await this.prisma.activitySession.findFirst({
        where: {
          OR: [
            { shareCode: normalizedActId },
            { id: rawId },
            { activityVersion: { activityId: rawId } },
          ],
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (actSession) {
        const trimmedName = payload.studentName?.trim();
        const studentSession = await this.prisma.studentSession.findFirst({
          where: {
            activitySessionId: actSession.id,
            OR: [
              { id: payload.studentId },
              { studentId: payload.studentId },
              ...(trimmedName ? [{ studentName: { equals: trimmedName, mode: 'insensitive' as const } }] : []),
            ],
          },
        });

        if (studentSession) {
          dbStudentSessionId = studentSession.id;
          dbStudentName = studentSession.studentName;
          dbProgress = studentSession.progress || 0;
          dbScore = studentSession.score || 0;
          await this.prisma.studentSession.update({
            where: { id: studentSession.id },
            data: { status: 'STUCK', lastSeenAt: new Date() },
          });
        } else {
          const newSession = await this.prisma.studentSession.create({
            data: {
              activitySessionId: actSession.id,
              studentId: payload.studentId && !payload.studentId.startsWith('student_guest') ? payload.studentId : null,
              studentName: trimmedName || 'Student',
              status: 'STUCK',
              progress: 0,
              score: 0,
            },
          });
          dbStudentSessionId = newSession.id;
        }
      }
    } catch (err) {
      console.warn('Failed to persist help request in DB:', err);
    }

    const effectiveStudentId = dbStudentSessionId || payload.studentId;
    const trimmedPayloadName = (payload.studentName || '').trim().toLowerCase();
    const existingInMap =
      activityStateMap.get(effectiveStudentId) ||
      activityStateMap.get(payload.studentId) ||
      Array.from(activityStateMap.values()).find(
        (s) => s.studentName && s.studentName.trim().toLowerCase() === trimmedPayloadName
      );

    const currentProgress =
      typeof existingInMap?.progress === 'number' && existingInMap.progress > 0
        ? existingInMap.progress
        : dbProgress;

    const currentEngagement =
      typeof existingInMap?.engagementScore === 'number' && existingInMap.engagementScore > 0
        ? existingInMap.engagementScore
        : currentProgress > 0
        ? Math.min(100, currentProgress + 10)
        : 0;

    const currentPerformance =
      typeof existingInMap?.performanceScore === 'number' && existingInMap.performanceScore > 0
        ? existingInMap.performanceScore
        : typeof (existingInMap as any)?.score === 'number' && (existingInMap as any).score > 0
        ? (existingInMap as any).score
        : dbScore;

    const stuckState: StudentProgressState & { helpRequested: boolean } = {
      studentId: effectiveStudentId,
      studentName: dbStudentName || payload.studentName || 'Student',
      status: 'STUCK',
      progress: currentProgress,
      engagementScore: currentEngagement,
      performanceScore: currentPerformance,
      progressText: payload.progressText || existingInMap?.progressText || 'Needs assistance',
      answers: existingInMap?.answers || {},
      score: currentPerformance,
      helpMessage: payload.helpMessage || 'Student requested help on exercise',
      lastUpdated: new Date().toISOString(),
      helpRequested: true,
    };

    activityStateMap.set(effectiveStudentId, stuckState);
    if (payload.studentId && payload.studentId !== effectiveStudentId) {
      activityStateMap.set(payload.studentId, stuckState);
    }

    // Broadcast stuck alert to room and globally
    this.server.to(roomName).emit('live_student_update', stuckState);
    this.server.to(roomName).emit('student_stuck_alert', stuckState);
    this.server.to(roomName).emit('request_help', stuckState);

    this.server.emit('live_student_update', stuckState);
    this.server.emit('student_stuck_alert', stuckState);
    this.server.emit('request_help', stuckState);
  }

  @SubscribeMessage('resolve_help')
  async handleResolveHelp(
    @MessageBody()
    payload: {
      activityId: string;
      studentId: string;
    },
  ) {
    const rawId = payload.activityId || (payload as any).shareCode || '';
    const normalizedActId = rawId.trim().toUpperCase();
    const roomName = `activity_${normalizedActId}`;

    let dbStudentSession: any = null;
    try {
      const actSession = await this.prisma.activitySession.findFirst({
        where: {
          OR: [
            { shareCode: normalizedActId },
            { id: rawId },
            { activityVersion: { activityId: rawId } },
          ],
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (actSession) {
        const trimmedId = payload.studentId;
        dbStudentSession = await this.prisma.studentSession.findFirst({
          where: {
            activitySessionId: actSession.id,
            OR: [
              { id: trimmedId },
              { studentId: trimmedId },
            ],
          },
        });

        if (dbStudentSession) {
          const resetStatus = dbStudentSession.progress >= 100 ? 'COMPLETED' : dbStudentSession.progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
          await this.prisma.studentSession.update({
            where: { id: dbStudentSession.id },
            data: { status: resetStatus },
          });
        }
      }
    } catch (err) {
      console.warn('Failed to reset student status on resolve_help:', err);
    }

    if (!this.liveTrackingMap.has(normalizedActId)) {
      this.liveTrackingMap.set(normalizedActId, new Map());
    }
    const activityStateMap = this.liveTrackingMap.get(normalizedActId)!;

    const targetKey =
      (activityStateMap.has(payload.studentId) && payload.studentId) ||
      (dbStudentSession && activityStateMap.has(dbStudentSession.id) && dbStudentSession.id) ||
      (dbStudentSession?.studentId && activityStateMap.has(dbStudentSession.studentId) && dbStudentSession.studentId) ||
      Array.from(activityStateMap.keys()).find((k) => {
        const s = activityStateMap.get(k);
        return s && (s.studentId === payload.studentId || (dbStudentSession && s.studentId === dbStudentSession.id));
      }) ||
      payload.studentId;

    const existingState = activityStateMap.get(targetKey);
    const progressVal =
      typeof existingState?.progress === 'number' && existingState.progress > 0
        ? existingState.progress
        : dbStudentSession?.progress || 0;

    const engagementVal =
      typeof existingState?.engagementScore === 'number' && existingState.engagementScore > 0
        ? existingState.engagementScore
        : progressVal > 0
        ? Math.min(100, progressVal + 10)
        : 0;

    const performanceVal =
      typeof existingState?.performanceScore === 'number' && existingState.performanceScore > 0
        ? existingState.performanceScore
        : typeof (existingState as any)?.score === 'number' && (existingState as any).score > 0
        ? (existingState as any).score
        : dbStudentSession?.score || 0;

    const statusVal = progressVal >= 100 ? 'COMPLETED' : progressVal > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

    const updatedState: StudentProgressState & { helpRequested: boolean } = {
      studentId: dbStudentSession?.id || payload.studentId,
      studentName: dbStudentSession?.studentName || existingState?.studentName || 'Student',
      status: statusVal,
      progress: progressVal,
      engagementScore: engagementVal,
      performanceScore: performanceVal,
      progressText: `${progressVal}% completed`,
      answers: existingState?.answers || {},
      score: performanceVal,
      helpMessage: undefined,
      lastUpdated: new Date().toISOString(),
      helpRequested: false,
    };

    activityStateMap.set(payload.studentId, updatedState);
    if (dbStudentSession?.id) {
      activityStateMap.set(dbStudentSession.id, updatedState);
    }

    this.server.to(roomName).emit('live_student_update', updatedState);
    this.server.emit('live_student_update', updatedState);

    this.server.to(roomName).emit('help_resolved', {
      studentId: payload.studentId,
      studentName: updatedState.studentName,
      activityId: rawId,
    });
    this.server.emit('help_resolved', {
      studentId: payload.studentId,
      studentName: updatedState.studentName,
      activityId: rawId,
    });
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

  @SubscribeMessage('send_intervention')
  handleSendIntervention(
    @MessageBody()
    payload: {
      activityId: string;
      studentId: string;
      studentName?: string;
      interventionType: 'desk_checkin' | 'discreet_reminder' | string;
    },
  ) {
    const rawId = payload.activityId || (payload as any).shareCode || '';
    const normalizedActId = rawId.trim().toUpperCase();
    const roomName = `activity_${normalizedActId}`;

    const title =
      payload.interventionType === 'desk_checkin'
        ? 'In-Person Desk Check-In'
        : 'Focus Reminder';
    const message =
      payload.interventionType === 'desk_checkin'
        ? 'I am coming to your desk to help you.'
        : 'Focus on your activity.';
    const badge =
      payload.interventionType === 'desk_checkin'
        ? '📍 TEACHER SUPPORT'
        : '💬 TEACHER GUIDANCE';

    const eventData = {
      activityId: normalizedActId,
      studentId: payload.studentId,
      studentName: payload.studentName,
      interventionType: payload.interventionType,
      title,
      message,
      badge,
      timestamp: new Date().toISOString(),
    };

    this.server.to(roomName).emit('receive_intervention', eventData);
    this.server.to(roomName).emit('teacher_intervention', eventData);
    this.server.emit('receive_intervention', eventData);
    this.server.emit('teacher_intervention', eventData);
  }

  emitIntervention(data: {
    activityId: string;
    studentId: string;
    realStudentId?: string | null;
    studentName: string;
    interventionType: string;
    title: string;
    message: string;
    badge: string;
  }) {
    if (this.server) {
      const roomName = `activity_${data.activityId.toUpperCase()}`;
      const payload = {
        ...data,
        timestamp: new Date().toISOString(),
      };
      this.server.to(roomName).emit('receive_intervention', payload);
      this.server.to(roomName).emit('teacher_intervention', payload);
      this.server.emit('receive_intervention', payload);
      this.server.emit('teacher_intervention', payload);
    }
  }

  emitActivityPublished(data: {
    classroomId?: string;
    activityId: string;
    activityTitle: string;
    shareCode: string;
    teacherName?: string;
    timerMode?: string;
    rewardMode?: string;
    targetScope?: string;
  }) {
    if (this.server) {
      this.server.emit('activity_published', data);
      if (data.classroomId) {
        this.server.to(`classroom_${data.classroomId}`).emit('activity_published', data);
      }
    }
  }

  emitAwardIssued(data: {
    studentSessionId: string;
    studentId?: string | null;
    studentName: string;
    category: string;
    reward: string;
    deliveryMode?: string;
    shareCode?: string;
    activityId?: string;
    totalAcademicStars?: number;
    totalAcademicPoints?: number;
    totalBehavioralStars?: number;
    totalBehavioralPoints?: number;
  }) {
    if (this.server) {
      this.server.emit('award_issued', data);
      if (data.shareCode) {
        this.server.to(`activity_${data.shareCode}`).emit('award_issued', data);
      }
      if (data.activityId) {
        this.server.to(`activity_${data.activityId}`).emit('award_issued', data);
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
            score: payload.score ?? performanceScore ?? 0,
          },
        });
      }
    } catch (err) {
      console.warn('Failed to persist student progress to database:', err);
    }
  }
}



