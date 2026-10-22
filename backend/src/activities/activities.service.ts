import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesGateway } from './activities.gateway';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SubmitActivityDto } from './dto/submit-activity.dto';
import { ActivityDefinition, ActivityBlock } from './types/activityDsl';
import { ActivityValidator } from './validation/activityValidator';

export interface ActivityFilterOptions {
  subject?: string;
  yearGroup?: string;
  gradeLevel?: string;
  activityType?: string;
  search?: string;
}

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private activitiesGateway: ActivitiesGateway,
  ) {}

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

  async publishActivity(
    teacherId: string,
    params: {
      activityId: string;
      classroomId?: string;
      timerMode?: string;
      rewardMode?: string;
      targetScope?: string;
      targetGroupStudents?: any;
      dueAt?: string;
    } | string,
  ) {
    const activityId = typeof params === 'string' ? params : params.activityId;
    const classroomId = typeof params === 'object' ? params.classroomId : undefined;
    const timerMode = typeof params === 'object' ? params.timerMode : undefined;
    const rewardMode = typeof params === 'object' ? params.rewardMode : undefined;
    const targetScope = typeof params === 'object' ? params.targetScope : undefined;
    const targetGroupStudents = typeof params === 'object' ? params.targetGroupStudents : undefined;
    const dueAt = typeof params === 'object' && params.dueAt ? new Date(params.dueAt) : undefined;
    const forceRepublish = typeof params === 'object' && (params as any).forceRepublish === true;

    // 1. Check if selected class already has an active activity assignment
    if (classroomId && !forceRepublish) {
      const activeClassAssignment = await this.prisma.activityAssignment.findFirst({
        where: {
          classroomId,
          status: 'ACTIVE',
        },
        include: {
          activity: true,
          classroom: true,
        },
      });

      if (activeClassAssignment) {
        const isSameActivity = activeClassAssignment.activityId === activityId;
        return {
          classHasActiveAssignment: true,
          message: isSameActivity
            ? `Class "${activeClassAssignment.classroom.subject} (${activeClassAssignment.classroom.grade})" already has this activity ("${activeClassAssignment.activity.title}") assigned and in progress. You cannot assign it again while a session is active.`
            : `Class "${activeClassAssignment.classroom.subject} (${activeClassAssignment.classroom.grade})" already has an activity in progress ("${activeClassAssignment.activity.title}"). You cannot assign another activity while a session is active.`,
          existingActivityTitle: activeClassAssignment.activity.title,
          className: `${activeClassAssignment.classroom.subject} - ${activeClassAssignment.classroom.grade}`,
          existingActivityId: activeClassAssignment.activityId,
          isSameActivity,
        };
      }
    }

    if (classroomId && forceRepublish) {
      // Complete existing active assignments and sessions for this class/teacher
      await this.prisma.activityAssignment.updateMany({
        where: {
          classroomId,
          status: 'ACTIVE',
        },
        data: {
          status: 'COMPLETED',
        },
      });

      await this.prisma.activitySession.updateMany({
        where: {
          teacherId,
          status: 'ACTIVE',
        },
        data: {
          status: 'COMPLETED',
        },
      });
    }

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

    // Ensure targetGroupStudents contains all enrolled classroom students when full classroom scope is selected
    let finalTargetGroupStudents = targetGroupStudents;
    if (classroomId && (!finalTargetGroupStudents || (Array.isArray(finalTargetGroupStudents) && finalTargetGroupStudents.length === 0) || targetScope === 'Full Classroom Scope')) {
      const classroomRecord = await this.prisma.classroom.findUnique({
        where: { id: classroomId },
        include: { students: true },
      });
      if (classroomRecord?.students && classroomRecord.students.length > 0) {
        finalTargetGroupStudents = classroomRecord.students.map((s) => `${s.firstName} ${s.lastName}`.trim());
      }
    }

    // Create live ActivitySession for classroom join
    const session = await this.prisma.activitySession.create({
      data: {
        activityVersionId: publishedVersion.id,
        teacherId,
        shareCode,
        classroomId: classroomId || null,
        timerMode: timerMode || 'Untimed Practice Session',
        rewardMode: rewardMode || 'Engagement Points + Stickers',
        targetScope: targetScope || 'Full Classroom Scope',
        targetGroupStudents: finalTargetGroupStudents || null,
        status: 'ACTIVE',
      },
    });

    let assignment: any = null;
    let provisionedStudentSessionsCount = 0;

    if (classroomId) {
      assignment = await this.prisma.activityAssignment.create({
        data: {
          activityId: activity.id,
          assignedByTeacherId: teacherId,
          classroomId: classroomId,
          timerMode: timerMode || 'Untimed Practice Session',
          rewardMode: rewardMode || 'Engagement Points + Stickers',
          targetScope: targetScope || 'Full Classroom Scope',
          targetGroupStudents: finalTargetGroupStudents || null,
          dueAt: dueAt || null,
          status: 'ACTIVE',
        },
        include: {
          classroom: {
            include: {
              students: true,
            },
          },
        },
      });

      // Auto-provision StudentSession for all students in the assigned class
      const students = assignment.classroom?.students || [];
      for (const student of students) {
        await this.prisma.studentSession.create({
          data: {
            activitySessionId: session.id,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`.trim(),
            status: 'NOT_STARTED',
            progress: 0,
            score: 0,
          },
        });
        provisionedStudentSessionsCount++;
      }

      // Fetch teacher details for notification
      let teacherName = 'Your Teacher';
      try {
        const teacherUser = await this.prisma.user.findUnique({
          where: { id: teacherId },
          select: { firstName: true, lastName: true },
        });
        if (teacherUser) {
          teacherName = `${teacherUser.firstName} ${teacherUser.lastName}`.trim() || 'Your Teacher';
        }
      } catch (err) {
        // Fallback
      }

      this.activitiesGateway.emitActivityPublished({
        classroomId,
        activityId: activity.id,
        activityTitle: activity.title,
        shareCode,
        teacherName,
        timerMode: timerMode || 'Untimed Practice Session',
        rewardMode: rewardMode || 'Engagement Points + Stickers',
        targetScope: targetScope || 'Full Classroom Scope',
      });
    }

    return {
      activity,
      publishedVersion,
      session,
      shareCode,
      assignment,
      provisionedStudentSessionsCount,
    };
  }

  async checkClassActiveAssignment(classroomId: string) {
    const activeAssignment = await this.prisma.activityAssignment.findFirst({
      where: {
        classroomId,
        status: 'ACTIVE',
      },
      include: {
        activity: true,
        classroom: true,
      },
    });

    return {
      hasActiveAssignment: !!activeAssignment,
      assignment: activeAssignment,
    };
  }

  async getAssignmentsByClassroom(classroomId: string) {
    return this.prisma.activityAssignment.findMany({
      where: { classroomId },
      include: {
        activity: true,
        assignedByTeacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        classroom: {
          include: { students: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getAssignmentsForStudent(loginCode: string) {
    const student = await this.prisma.student.findFirst({
      where: { loginCode: loginCode.trim() },
      include: { classroom: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with login code "${loginCode}" not found.`);
    }

    const assignments = await this.prisma.activityAssignment.findMany({
      where: { classroomId: student.classroomId, status: 'ACTIVE' },
      include: {
        activity: {
          include: {
            versions: {
              where: { status: 'PUBLISHED' },
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        },
        assignedByTeacher: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return {
      student,
      assignments,
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
      timerMode: session.timerMode || 'Untimed Practice Session',
      rewardMode: session.rewardMode || 'Engagement Points + Stickers',
      targetScope: session.targetScope || 'Full Classroom Scope',
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
    let studentSession = await this.prisma.studentSession.findUnique({
      where: { id: studentSessionId },
    });

    if (!studentSession) {
      // Auto-provision a standalone StudentSession if it doesn't exist yet
      let actSession = await this.prisma.activitySession.findFirst();
      if (!actSession) {
        let version = await this.prisma.activityVersion.findFirst();
        if (!version) {
          const act = await this.prisma.activity.findFirst();
          if (act) {
            version = await this.prisma.activityVersion.create({
              data: {
                activityId: act.id,
                version: 1,
                definition: act.content as any,
                status: 'PUBLISHED',
                shareCode: `AUTO_VER_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              },
            });
          }
        }
        if (version) {
          const teacher = await this.prisma.user.findFirst({ where: { role: 'TEACHER' } });
          const uniqueShareCode = `AUTO_SESS_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          actSession = await this.prisma.activitySession.create({
            data: {
              activityVersionId: version.id,
              teacherId: teacher?.id || 'system',
              shareCode: uniqueShareCode,
              status: 'ACTIVE',
            },
          });
        }
      }

      if (actSession) {
        studentSession = await this.prisma.studentSession.create({
          data: {
            id: studentSessionId,
            activitySessionId: actSession.id,
            studentName: payload?.actor?.name || 'Student Learner',
            status: 'IN_PROGRESS',
            progress: 0,
            score: 0,
          },
        });
      } else {
        throw new NotFoundException(`Student session "${studentSessionId}" not found`);
      }
    }

    const event = await this.prisma.activityEvent.create({
      data: {
        studentSessionId,
        type,
        blockId: blockId || null,
        payload: payload || {},
      },
    });

    // Compute tri-dimension metrics (Progress, Performance, Engagement) from session events
    const allEvents = await this.prisma.activityEvent.findMany({
      where: { studentSessionId },
      orderBy: { createdAt: 'asc' },
    });

    const sessionWithDef = await this.prisma.studentSession.findUnique({
      where: { id: studentSessionId },
      include: {
        activitySession: {
          include: {
            activityVersion: true,
          },
        },
      },
    });

    const def = (sessionWithDef?.activitySession?.activityVersion?.definition as any) || {};
    const totalBlocksCount = Array.isArray(def.blocks) && def.blocks.length > 0 ? def.blocks.length : 1;

    let updatedStatus = studentSession.status;
    if (type === 'ANSWERED' || type === 'ANSWER_SUBMITTED') {
      updatedStatus = 'IN_PROGRESS';
    } else if (type === 'COMPLETED' || type === 'ACTIVITY_COMPLETED') {
      updatedStatus = 'COMPLETED';
    } else if (type === 'INTERACTED') {
      if (updatedStatus === 'NOT_STARTED') {
        updatedStatus = 'IN_PROGRESS';
      }
    } else if (type === 'ASKED') {
      updatedStatus = 'STUCK';
    } else if (type === 'TEACHER_INTERVENTION') {
      if (payload?.action === 'SHOW_HINT' || payload?.action === 'RESET_BLOCK') {
        updatedStatus = 'IN_PROGRESS';
      }
    }

    // 1. Progress (P): proportion of activity blocks completed
    const completedBlockIds = new Set<string>();
    allEvents.forEach((ev) => {
      if (
        ev.blockId &&
        (ev.type === 'ANSWERED' ||
          ev.type === 'ANSWER_SUBMITTED' ||
          ev.type === 'COMPLETED' ||
          ev.type === 'ACTIVITY_COMPLETED')
      ) {
        completedBlockIds.add(ev.blockId);
      }
    });

    let updatedProgress = Math.min(
      100,
      Math.round((completedBlockIds.size / totalBlocksCount) * 100)
    );
    if (type === 'COMPLETED' || type === 'ACTIVITY_COMPLETED') {
      updatedProgress = 100;
    }

    // 2. Performance (S): accuracy & effort across answered blocks
    const blockScores: number[] = [];
    allEvents.forEach((ev) => {
      if (ev.type === 'ANSWERED' || ev.type === 'ANSWER_SUBMITTED') {
        const p = (ev.payload as any) || {};
        if (typeof p.isCorrect === 'boolean') {
          blockScores.push(p.isCorrect ? 100 : 0);
        } else if (typeof p.score === 'number') {
          blockScores.push(Math.min(100, Math.max(0, p.score)));
        } else if (p.response && typeof p.response === 'string') {
          // Open-ended response effort heuristic: >= 10 words = 100%, < 10 words = 50%
          const wordCount = p.response.trim().split(/\s+/).filter(Boolean).length;
          blockScores.push(wordCount >= 10 ? 100 : wordCount > 0 ? 50 : 0);
        } else {
          blockScores.push(100);
        }
      }
    });

    const calculatedPerformanceScore =
      blockScores.length > 0
        ? Math.round(blockScores.reduce((a, b) => a + b, 0) / blockScores.length)
        : 0;

    // 3. Engagement (E): volume, recency, and proactivity
    const totalEventCount = allEvents.length;
    const volumeRatio = Math.min(100, Math.round((totalEventCount / (totalBlocksCount * 3)) * 100));

    // Recency score (seconds since last event)
    const nowMs = Date.now();
    const lastEventMs = allEvents.length > 0 ? new Date(allEvents[allEvents.length - 1].createdAt).getTime() : nowMs;
    const diffSec = Math.floor((nowMs - lastEventMs) / 1000);
    const recencyScore = diffSec <= 60 ? 100 : diffSec <= 180 ? 75 : diffSec <= 300 ? 40 : 10;

    let proactivityModifier = 0;
    if (blockScores.length > 0) proactivityModifier += 15;
    if (updatedStatus === 'STUCK') proactivityModifier -= 20;

    const calculatedEngagementScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(0.45 * volumeRatio + 0.35 * recencyScore + 0.20 * (50 + proactivityModifier))
      )
    );

    const updatedStudentSession = await this.prisma.studentSession.update({
      where: { id: studentSessionId },
      data: {
        status: updatedStatus,
        progress: updatedProgress,
        score: calculatedPerformanceScore,
        performanceScore: calculatedPerformanceScore,
        engagementScore: calculatedEngagementScore,
        currentBlockId: blockId || studentSession.currentBlockId,
        lastSeenAt: new Date(),
      },
    });

    return {
      event,
      studentSession: updatedStudentSession,
    };
  }

  async issueAward(
    studentSessionId: string,
    category: string,
    reward: string,
  ) {
    const studentSession = await this.prisma.studentSession.findUnique({
      where: { id: studentSessionId },
    });

    if (!studentSession) {
      throw new NotFoundException(`Student session with ID "${studentSessionId}" not found.`);
    }

    let addStars = 0;
    let addPoints = 0;

    if (reward.includes('1 Star')) {
      addStars = 1;
    } else if (reward.includes('3 Stars')) {
      addStars = 3;
    } else if (reward.includes('50 Pts') || reward.includes('50')) {
      addPoints = 50;
    }

    const isAcademic = category === 'Academic Effort';

    const updatedSession = await this.prisma.studentSession.update({
      where: { id: studentSessionId },
      data: {
        academicStars: isAcademic ? { increment: addStars } : undefined,
        academicPoints: isAcademic ? { increment: addPoints } : undefined,
        behavioralStars: !isAcademic ? { increment: addStars } : undefined,
        behavioralPoints: !isAcademic ? { increment: addPoints } : undefined,
        lastSeenAt: new Date(),
      },
    });

    const event = await this.prisma.activityEvent.create({
      data: {
        studentSessionId,
        type: 'AWARD_ISSUED',
        payload: {
          category,
          reward,
          addStars,
          addPoints,
          totalAcademicStars: updatedSession.academicStars,
          totalAcademicPoints: updatedSession.academicPoints,
          totalBehavioralStars: updatedSession.behavioralStars,
          totalBehavioralPoints: updatedSession.behavioralPoints,
        },
      },
    });

    return {
      message: `Successfully issued ${reward} (${category}) to ${updatedSession.studentName}`,
      studentSession: updatedSession,
      event,
    };
  }

  async getTeacherDashboardState(shareCode: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { shareCode: shareCode.toUpperCase() },
      include: {
        activityVersion: {
          include: {
            activity: {
              include: {
                assignments: {
                  include: {
                    classroom: {
                      include: {
                        students: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
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

    const activityTitle =
      session.activityVersion?.activity?.title ||
      (session.activityVersion?.definition as any)?.title ||
      'Interactive Activity';

    const assignments = session.activityVersion?.activity?.assignments || [];
    const activeAssignment = assignments.find((a) => a.status === 'ACTIVE') || assignments[0];

    // Ensure all enrolled classroom students are auto-provisioned into this session
    if (activeAssignment?.classroom?.students?.length) {
      const existingStudentIds = new Set(
        session.studentSessions.map((st) => st.studentId).filter(Boolean),
      );
      const existingStudentNames = new Set(
        session.studentSessions.map((st) => st.studentName.toLowerCase().trim()),
      );

      for (const student of activeAssignment.classroom.students) {
        const studentFullName = `${student.firstName} ${student.lastName}`.trim();
        if (
          !existingStudentIds.has(student.id) &&
          !existingStudentNames.has(studentFullName.toLowerCase())
        ) {
          try {
            await this.prisma.studentSession.create({
              data: {
                activitySessionId: session.id,
                studentId: student.id,
                studentName: studentFullName,
                status: 'NOT_STARTED',
                progress: 0,
                score: 0,
                performanceScore: 0,
                engagementScore: 0,
              },
            });
            existingStudentIds.add(student.id);
            existingStudentNames.add(studentFullName.toLowerCase());
          } catch (e) {
            // Ignore race conditions if already provisioned
          }
        }
      }
    }

    // Re-fetch all student sessions for this activity session to include any newly provisioned students
    const allStudentSessions = await this.prisma.studentSession.findMany({
      where: { activitySessionId: session.id },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: [
        { progress: 'desc' },
        { studentName: 'asc' },
      ],
    });

    const classroomInfo = activeAssignment?.classroom
      ? {
          id: activeAssignment.classroom.id,
          subject: activeAssignment.classroom.subject,
          grade: activeAssignment.classroom.grade,
          year: activeAssignment.classroom.year,
        }
      : null;

    return {
      session,
      activityTitle,
      status: session.status,
      students: allStudentSessions,
      classroom: classroomInfo,
    };
  }

  async stopActiveSession(shareCode: string, teacherId: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { shareCode: shareCode.toUpperCase() },
      include: {
        activityVersion: {
          include: {
            activity: {
              include: {
                assignments: {
                  where: { status: 'ACTIVE' },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Activity session with share code "${shareCode}" not found.`);
    }

    const updatedSession = await this.prisma.activitySession.update({
      where: { id: session.id },
      data: { status: 'COMPLETED' },
    });

    // Update active assignments for this activity / teacher to COMPLETED
    await this.prisma.activityAssignment.updateMany({
      where: {
        assignedByTeacherId: teacherId,
        status: 'ACTIVE',
      },
      data: {
        status: 'COMPLETED',
      },
    });

    return {
      message: `Session "${shareCode}" stopped successfully. Class is now free for new activity publishing.`,
      session: updatedSession,
    };
  }

  async getTeacherActiveSessions(teacherId: string) {
    const sessions = await this.prisma.activitySession.findMany({
      where: {
        teacherId,
        status: 'ACTIVE',
      },
      include: {
        activityVersion: {
          include: {
            activity: {
              include: {
                assignments: {
                  where: { status: 'ACTIVE' },
                  include: {
                    classroom: {
                      select: {
                        id: true,
                        subject: true,
                        grade: true,
                        year: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        studentSessions: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => {
      const activeAssignment = s.activityVersion?.activity?.assignments?.[0];
      return {
        id: s.id,
        shareCode: s.shareCode,
        status: s.status,
        createdAt: s.createdAt,
        activityTitle: s.activityVersion?.activity?.title || 'Interactive Activity',
        classroom: activeAssignment?.classroom || null,
        studentCount: s.studentSessions.length,
      };
    });
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
  // EXISTING API METHODS (WITH FILTERING SUPPORT)
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

  async findAllActivities(filters?: ActivityFilterOptions) {
    const activities = await this.prisma.activity.findMany({
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

    if (!filters) return activities;

    const { subject, yearGroup, gradeLevel, activityType, search } = filters;

    const targetGrade = (yearGroup || gradeLevel || '').trim().toLowerCase();
    const targetSubject = (subject || '').trim().toLowerCase();
    const targetType = (activityType || '').trim().toLowerCase();
    const targetSearch = (search || '').trim().toLowerCase();

    return activities.filter((act) => {
      const content = (act.content as any) || {};

      // Filter by subject
      if (targetSubject && targetSubject !== 'all') {
        const actSubject = (content.subject || '').toLowerCase();
        const actTitle = act.title.toLowerCase();
        if (!actSubject.includes(targetSubject) && !actTitle.includes(targetSubject)) {
          return false;
        }
      }

      // Filter by yearGroup / gradeLevel
      if (targetGrade && targetGrade !== 'all') {
        const actGrade = (content.gradeLevel || '').toLowerCase();
        const actTitle = act.title.toLowerCase();
        if (!actGrade.includes(targetGrade) && !actTitle.includes(targetGrade)) {
          return false;
        }
      }

      // Filter by activityType (check if any block in DSL matches activityType)
      if (targetType && targetType !== 'all') {
        const blocks = Array.isArray(content.blocks) ? content.blocks : [];
        const hasBlockType = blocks.some((b: any) => b.type === targetType);
        if (!hasBlockType && act.type.toLowerCase() !== targetType) {
          return false;
        }
      }

      // Search filter
      if (targetSearch) {
        const matchTitle = act.title.toLowerCase().includes(targetSearch);
        const matchDesc = (act.description || '').toLowerCase().includes(targetSearch);
        const matchSub = (content.subject || '').toLowerCase().includes(targetSearch);
        if (!matchTitle && !matchDesc && !matchSub) {
          return false;
        }
      }

      return true;
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

  async getTeacherHomeOverview(teacherId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // 1. Total Classes
    const totalClasses = await this.prisma.classroom.count({
      where: { teacherId },
    });

    // 2. Total Activities
    const totalActivities = await this.prisma.activity.count({
      where: { teacherId },
    });

    // 3. Total Engaged Students (distinct students with checkins/hints or session interactions)
    const distinctEngagedSessions = await this.prisma.studentSession.findMany({
      where: {
        activitySession: { teacherId },
        events: {
          some: {
            type: {
              in: [
                'HINT_SENT',
                'REMINDER_SENT',
                'TEACHER_HINT',
                'TEACHER_CHECKIN',
                'DISCREET_CHECKIN',
                'CHECKIN',
                'SUPPORT_MESSAGE',
              ],
            },
          },
        },
      },
      select: { studentName: true, studentId: true },
    });

    const engagedSet = new Set<string>();
    distinctEngagedSessions.forEach((s) => {
      engagedSet.add(s.studentId || s.studentName);
    });

    let totalEngagedStudents = engagedSet.size;
    if (totalEngagedStudents === 0) {
      const allSessions = await this.prisma.studentSession.findMany({
        where: { activitySession: { teacherId } },
        select: { studentName: true, studentId: true },
      });
      const allSet = new Set<string>();
      allSessions.forEach((s) => allSet.add(s.studentId || s.studentName));
      totalEngagedStudents = allSet.size;
    }

    // 4. Your Classes
    const classrooms = await this.prisma.classroom.findMany({
      where: { teacherId },
      include: {
        students: true,
        assignments: {
          include: {
            activity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const yourClasses = classrooms.map((cls) => {
      const activeAssignmentsCount = cls.assignments.filter((a) => a.status === 'ACTIVE').length;
      return {
        id: cls.id,
        subject: cls.subject,
        grade: cls.grade,
        year: cls.year,
        studentCount: cls.students.length,
        activeActivitiesCount: activeAssignmentsCount,
        averageCompletionRate: 0,
      };
    });

    // 5. Top 5 Used Activities by Teacher
    const teacherActivities = await this.prisma.activity.findMany({
      where: { teacherId },
      include: {
        versions: {
          include: {
            sessions: true,
          },
        },
      },
    });

    const mappedActivities = teacherActivities.map((act) => {
      const usageCount = act.versions.reduce((sum, v) => sum + v.sessions.length, 0);
      return {
        id: act.id,
        title: act.title,
        usageCount,
      };
    });

    mappedActivities.sort((a, b) => b.usageCount - a.usageCount);
    const top5UsedActivities = mappedActivities.slice(0, 5);

    // 6. Recent Activities
    const recentSessions = await this.prisma.activitySession.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        activityVersion: {
          include: {
            activity: true,
          },
        },
        studentSessions: true,
      },
    });

    const recentActivities = recentSessions.map((sess) => ({
      id: sess.id,
      shareCode: sess.shareCode,
      activityTitle: sess.activityVersion.activity.title,
      status: sess.status,
      createdAt: sess.createdAt,
      studentCount: sess.studentSessions.length,
    }));

    // 7. Most Engaged Activities in School
    const allSchoolActivities = await this.prisma.activity.findMany({
      include: {
        versions: {
          include: {
            sessions: {
              include: {
                studentSessions: true,
              },
            },
          },
        },
      },
    });

    const schoolEngagedActivities = allSchoolActivities.map((act) => {
      let totalStudents = 0;
      let totalProgressSum = 0;

      for (const ver of act.versions) {
        for (const sess of ver.sessions) {
          for (const sSess of sess.studentSessions) {
            totalStudents++;
            totalProgressSum += sSess.progress || 0;
          }
        }
      }

      const engagementScore =
        totalStudents > 0
          ? Math.min(100, Math.round(totalProgressSum / totalStudents))
          : 0;

      return {
        id: act.id,
        title: act.title,
        engagementScore,
        totalStudents,
      };
    });

    schoolEngagedActivities.sort((a, b) => {
      if (b.engagementScore !== a.engagementScore) {
        return b.engagementScore - a.engagementScore;
      }
      return b.totalStudents - a.totalStudents;
    });

    const mostEngagedSchoolActivities = schoolEngagedActivities.slice(0, 5);

    return {
      teacher: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
      },
      stats: {
        totalClasses,
        totalActivities,
        totalEngagedStudents,
      },
      yourClasses,
      top5UsedActivities,
      recentActivities,
      mostEngagedSchoolActivities,
    };
  }
}
