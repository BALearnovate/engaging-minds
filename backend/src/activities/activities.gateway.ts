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

export interface StudentProgressState {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'STUCK' | 'COMPLETED';
  progressText: string;
  answers: Record<string, string>;
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


  // In-memory live activity tracking: activityId -> Map<studentId, StudentProgressState>
  private liveTrackingMap = new Map<string, Map<string, StudentProgressState>>();

  handleConnection(client: Socket) {
    console.log(`Client connected to WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { activityId: string; userId: string; role: string; userName?: string },
  ) {
    const roomName = `activity_${payload.activityId}`;
    client.join(roomName);

    if (!this.liveTrackingMap.has(payload.activityId)) {
      this.liveTrackingMap.set(payload.activityId, new Map());
    }

    const activityStateMap = this.liveTrackingMap.get(payload.activityId)!;

    // Send current live states of all students to the client
    const currentStudents = Array.from(activityStateMap.values());
    client.emit('room_state', { activityId: payload.activityId, students: currentStudents });
  }

  @SubscribeMessage('update_progress')
  handleUpdateProgress(
    @MessageBody()
    payload: {
      activityId: string;
      studentId: string;
      studentName: string;
      status: 'IN_PROGRESS' | 'COMPLETED';
      progressText: string;
      answers: Record<string, string>;
      score?: number;
    },
  ) {
    const roomName = `activity_${payload.activityId}`;

    if (!this.liveTrackingMap.has(payload.activityId)) {
      this.liveTrackingMap.set(payload.activityId, new Map());
    }

    const activityStateMap = this.liveTrackingMap.get(payload.activityId)!;
    const existing = activityStateMap.get(payload.studentId);

    const updatedState: StudentProgressState = {
      studentId: payload.studentId,
      studentName: payload.studentName,
      status: payload.status,
      progressText: payload.progressText,
      answers: payload.answers || {},
      score: payload.score,
      helpMessage: payload.status === 'COMPLETED' ? undefined : existing?.helpMessage,
      lastUpdated: new Date().toISOString(),
    };

    activityStateMap.set(payload.studentId, updatedState);

    // Broadcast updated state to room
    this.server.to(roomName).emit('live_student_update', updatedState);
  }

  @SubscribeMessage('request_help')
  handleRequestHelp(
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
    }
  }
}
