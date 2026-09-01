import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SubmitActivityDto } from './dto/submit-activity.dto';
import { ActivityDefinition, ActivityBlock } from './types/activityDsl';
import { ActivityValidator } from './validation/activityValidator';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // STRUCTURED DSL & VERSIONING API METHODS
  // ==========================================

  async saveDraft(
    teacherId: string,
    activityId: string | undefined,
    title: string,
    description: string | undefined,
    definition: ActivityDefinition,
  ) {
    const valResult = ActivityValidator.validate(definition);
    if (!valResult.valid) {
      throw new BadRequestException(`Invalid activity definition: ${valResult.errors.join('; ')}`);
    }

    let activity;
    if (activityId) {
      activity = await this.prisma.activity.update({
        where: { id: activityId },
        data: {
          title,
          description: description || '',
          type: 'STRUCTURED_DSL',
          content: definition as any,
        },
      });
    } else {
      activity = await this.prisma.activity.create({
        data: {
          title,
          description: description || '',
          type: 'STRUCTURED_DSL',
          content: definition as any,
          teacherId,
        },
      });
    }

    // Find existing draft version or create new version
    let draftVersion = await this.prisma.activityVersion.findFirst({
      where: { activityId: activity.id, status: 'DRAFT' },
    });

    if (draftVersion) {
      draftVersion = await this.prisma.activityVersion.update({
        where: { id: draftVersion.id },
        data: {
          definition: definition as any,
        },
      });
    } else {
      const maxVer = await this.prisma.activityVersion.aggregate({
        where: { activityId: activity.id },
        _max: { version: true },
      });
      const nextVer = (maxVer._max.version || 0) + 1;

      draftVersion = await this.prisma.activityVersion.create({
        data: {
          activityId: activity.id,
          version: nextVer,
          definition: definition as any,
          status: 'DRAFT',
        },
      });
    }

    return {
      activity,
      version: draftVersion,
    };
  }

  async publishActivity(teacherId: string, activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { versions: { orderBy: { version: 'desc' } } },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID "${activityId}" not found`);
    }

    const latestVersion = activity.versions[0];
    if (!latestVersion) {
      throw new BadRequestException('No activity version available to publish.');
    }

    // Generate unique 6-char share code e.g. ABC-742
    const shareCode = this.generateShareCode();

    // Mark version as published
    const publishedVersion = await this.prisma.activityVersion.update({
      where: { id: latestVersion.id },
      data: {
        status: 'PUBLISHED',
        shareCode,
        publishedAt: new Date(),
      },
    });

    // Create live ActivitySession for classroom join
    const session = await this.prisma.activitySession.create({
      data: {
        activityVersionId: publishedVersion.id,
        teacherId,
        shareCode,
        status: 'ACTIVE',
      },
    });

    return {
      activity,
      publishedVersion,
      session,
      shareCode,
    };
  }

  async getPublishedSessionByCode(shareCode: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { shareCode: shareCode.toUpperCase() },
      include: {
        activityVersion: {
          include: {
            activity: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Classroom session with join code "${shareCode}" not found.`);
    }

    return {
      session,
      activityVersion: session.activityVersion,
      definition: session.activityVersion.definition as unknown as ActivityDefinition,
    };
  }

  async joinStudentSession(shareCode: string, studentName: string, studentId?: string) {
    const { session } = await this.getPublishedSessionByCode(shareCode);

    const studentSession = await this.prisma.studentSession.create({
      data: {
        activitySessionId: session.id,
        studentId: studentId || null,
        studentName: studentName.trim(),
        status: 'IN_PROGRESS',
        progress: 0,
        score: 0,
      },
    });

    return studentSession;
  }

  async recordStudentEvent(
    studentSessionId: string,
    type: string,
    blockId: string | undefined,
    payload: any,
  ) {
    const studentSession = await this.prisma.studentSession.findUnique({
      where: { id: studentSessionId },
    });

    if (!studentSession) {
      throw new NotFoundException(`Student session "${studentSessionId}" not found`);
    }

    const event = await this.prisma.activityEvent.create({
      data: {
        studentSessionId,
        type,
        blockId: blockId || null,
        payload: payload || {},
      },
    });

    // Compute updated session status & progress
    let updatedStatus = studentSession.status;
    let updatedProgress = studentSession.progress;
    let updatedScore = studentSession.score;

    if (type === 'ANSWER_SUBMITTED') {
      updatedProgress = Math.min(100, updatedProgress + 20);
      if (payload?.isCorrect) {
        updatedScore += (payload?.score as number) || 100;
      }
    } else if (type === 'ACTIVITY_COMPLETED') {
      updatedStatus = 'COMPLETED';
      updatedProgress = 100;
    } else if (type === 'TEACHER_INTERVENTION') {
      if (payload?.action === 'SHOW_HINT') {
        updatedStatus = 'IN_PROGRESS';
      } else if (payload?.action === 'RESET_BLOCK') {
        updatedStatus = 'IN_PROGRESS';
        updatedProgress = Math.max(0, updatedProgress - 20);
      }
    }

    const updatedStudentSession = await this.prisma.studentSession.update({
      where: { id: studentSessionId },
      data: {
        status: updatedStatus,
        progress: updatedProgress,
        score: updatedScore,
        currentBlockId: blockId || studentSession.currentBlockId,
        lastSeenAt: new Date(),
      },
    });

    return {
      event,
      studentSession: updatedStudentSession,
    };
  }

  async getTeacherDashboardState(shareCode: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { shareCode: shareCode.toUpperCase() },
      include: {
        activityVersion: true,
        studentSessions: {
          orderBy: { lastSeenAt: 'desc' },
          include: {
            events: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Activity session with share code "${shareCode}" not found.`);
    }

    return {
      session,
      students: session.studentSessions,
    };
  }

  private generateShareCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result; // e.g. ABC-742
  }

  // ==========================================
  // EXISTING API METHODS (BACKWARD COMPATIBILITY)
  // ==========================================

  async createActivity(teacherId: string, dto: CreateActivityDto) {
    let finalType = dto.type || 'FILL_IN_THE_BLANK';
    let finalContent: any = {
      template: dto.template,
      blanks: dto.blanks || [],
      questions: dto.questions || [],
    };

    return this.prisma.activity.create({
      data: {
        title: dto.title,
        description: dto.description || '',
        type: finalType,
        content: finalContent as any,
        teacherId,
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findAllActivities(userId?: string) {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });
  }

  async getActivityById(id: string, isTeacher: boolean = false) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }

    return activity;
  }

  async submitActivity(activityId: string, studentId: string, dto: SubmitActivityDto) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID "${activityId}" not found`);
    }

    return this.prisma.submission.create({
      data: {
        activityId,
        studentId,
        answers: dto.answers as any,
        score: 100,
        totalBlanks: 1,
        correctCount: 1,
        status: 'COMPLETED',
      },
    });
  }

  async getActivityAnalytics(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        submissions: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID "${activityId}" not found`);
    }

    return {
      activity,
      analytics: {
        totalSubmissions: activity.submissions.length,
        classAverage: 100,
        highestScore: 100,
      },
      studentSubmissions: activity.submissions,
    };
  }
}
