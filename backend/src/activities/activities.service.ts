import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SubmitActivityDto } from './dto/submit-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async createActivity(teacherId: string, dto: CreateActivityDto) {
    let finalType = dto.type || 'FILL_IN_THE_BLANK';
    let finalContent: any = {
      template: dto.template,
      blanks: dto.blanks || [],
      questions: dto.questions || [],
    };

    // Auto-detection parser for raw uploaded document or text
    if (dto.rawContent || dto.type === 'DYNAMIC_DOCUMENT' || dto.type === 'AUTO_DETECT') {
      const parsed = this.autoDetectAndParseContent(dto.rawContent || dto.template || '');
      finalType = parsed.type;
      finalContent = parsed.content;
    }

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

    if (!userId) return activities;

    const userSubmissions = await this.prisma.submission.findMany({
      where: { studentId: userId },
    });

    const submissionMap = new Map(userSubmissions.map((s) => [s.activityId, s]));

    return activities.map((activity) => {
      const mySubmission = submissionMap.get(activity.id);
      return {
        ...activity,
        mySubmission: mySubmission
          ? {
              id: mySubmission.id,
              score: mySubmission.score,
              correctCount: mySubmission.correctCount,
              totalBlanks: mySubmission.totalBlanks,
              createdAt: mySubmission.createdAt,
            }
          : null,
      };
    });
  }

  async getActivityById(id: string, isTeacher: boolean = false) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }

    if (!isTeacher) {
      const content = activity.content as any;
      if (activity.type === 'FILL_IN_THE_BLANK') {
        return {
          ...activity,
          content: {
            template: content.template,
            blankIds: content.blanks ? content.blanks.map((b: any) => b.id) : [],
          },
        };
      } else if (activity.type === 'MULTIPLE_CHOICE') {
        return {
          ...activity,
          content: {
            questions: (content.questions || []).map((q: any) => ({
              id: q.id,
              question: q.question,
              options: q.options,
            })),
          },
        };
      }
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

    const content = activity.content as any;
    let correctCount = 0;
    let totalItems = 1;
    let evaluationDetails: Record<string, any> = {};

    if (activity.type === 'FILL_IN_THE_BLANK') {
      const blanks = content.blanks || [];
      totalItems = blanks.length || 1;

      blanks.forEach((blank: any) => {
        const studentAns = (dto.answers[blank.id] || '').trim();
        const expectedAns = (blank.answer || '').trim();
        const isCorrect = studentAns.toLowerCase() === expectedAns.toLowerCase();

        if (isCorrect) correctCount += 1;

        evaluationDetails[blank.id] = {
          studentAnswer: studentAns,
          correctAnswer: expectedAns,
          isCorrect,
        };
      });
    } else if (activity.type === 'MULTIPLE_CHOICE') {
      const questions = content.questions || [];
      totalItems = questions.length || 1;

      questions.forEach((q: any) => {
        const studentAns = (dto.answers[q.id] || '').trim();
        const expectedAns = (q.correctAnswer || '').trim();
        const isCorrect = studentAns.toLowerCase() === expectedAns.toLowerCase();

        if (isCorrect) correctCount += 1;

        evaluationDetails[q.id] = {
          studentAnswer: studentAns,
          correctAnswer: expectedAns,
          isCorrect,
        };
      });
    } else {
      // SHORT_ANSWER or DYNAMIC_DOCUMENT
      const answersList = Object.values(dto.answers);
      correctCount = answersList.filter((a) => a && a.trim().length > 0).length;
      totalItems = Math.max(answersList.length, 1);
      evaluationDetails = dto.answers;
    }

    const score = Math.round((correctCount / totalItems) * 100 * 10) / 10;

    const existingSubmission = await this.prisma.submission.findFirst({
      where: { activityId, studentId },
    });

    let submission;
    if (existingSubmission) {
      submission = await this.prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          answers: dto.answers as any,
          score,
          totalBlanks: totalItems,
          correctCount,
          status: 'COMPLETED',
        },
      });
    } else {
      submission = await this.prisma.submission.create({
        data: {
          activityId,
          studentId,
          answers: dto.answers as any,
          score,
          totalBlanks: totalItems,
          correctCount,
          status: 'COMPLETED',
        },
      });
    }

    return {
      message: 'Exercise submitted successfully!',
      submission,
      evaluation: {
        score,
        correctCount,
        totalBlanks: totalItems,
        details: evaluationDetails,
      },
    };
  }

  async getActivityAnalytics(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        submissions: {
          orderBy: { createdAt: 'desc' },
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

    const totalSubmissions = activity.submissions.length;
    const classAverage =
      totalSubmissions > 0
        ? Math.round(
            (activity.submissions.reduce((acc, sub) => acc + sub.score, 0) / totalSubmissions) * 10,
          ) / 10
        : 0;

    const highestScore =
      totalSubmissions > 0 ? Math.max(...activity.submissions.map((s) => s.score)) : 0;

    return {
      activity: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        type: activity.type,
        content: activity.content,
        createdAt: activity.createdAt,
        teacher: activity.teacher,
      },
      analytics: {
        totalSubmissions,
        classAverage,
        highestScore,
      },
      studentSubmissions: activity.submissions.map((sub) => ({
        id: sub.id,
        student: sub.student,
        score: sub.score,
        correctCount: sub.correctCount,
        totalBlanks: sub.totalBlanks,
        answers: sub.answers,
        submittedAt: sub.createdAt,
      })),
    };
  }

  /**
   * Auto-detection parser for uploaded/unstructured raw activity content
   */
  private autoDetectAndParseContent(rawText: string) {
    const text = rawText.trim();

    // Check for fill-in-the-blank markers like {1}, [blank], ___
    if (text.includes('{') || text.includes('[blank]') || text.includes('___')) {
      let counter = 1;
      const normalizedTemplate = text
        .replace(/\[blank\]/gi, () => `{${counter++}}`)
        .replace(/___+/g, () => `{${counter++}}`);

      const matches = normalizedTemplate.match(/\{(\d+)\}/g) || [];
      const blanks = Array.from(new Set(matches)).map((m) => {
        const id = m.replace(/[\{\}]/g, '');
        return { id, answer: `Answer ${id}` };
      });

      return {
        type: 'FILL_IN_THE_BLANK',
        content: {
          template: normalizedTemplate,
          blanks,
        },
      };
    }

    // Check for Multiple Choice format (e.g. A), B), C) or 1. Question? A)...)
    if (/\b[A-D]\)/i.test(text) || /\b[A-D]\./i.test(text)) {
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const questions: any[] = [];
      let currentQ: any = null;

      lines.forEach((line, idx) => {
        if (/^\d+[\.\)]/.test(line.trim()) || line.toLowerCase().startsWith('q:')) {
          if (currentQ) questions.push(currentQ);
          currentQ = {
            id: `q${questions.length + 1}`,
            question: line.replace(/^\d+[\.\)]\s*/, '').replace(/^q:\s*/i, ''),
            options: [],
            correctAnswer: '',
          };
        } else if (/^[A-D][\.\)]/i.test(line.trim())) {
          if (!currentQ) {
            currentQ = { id: 'q1', question: 'Question 1', options: [], correctAnswer: '' };
          }
          const optionText = line.trim();
          currentQ.options.push(optionText);
          if (!currentQ.correctAnswer) {
            currentQ.correctAnswer = optionText; // Default first option as target
          }
        } else if (currentQ) {
          currentQ.question += ' ' + line.trim();
        }
      });

      if (currentQ) questions.push(currentQ);

      return {
        type: 'MULTIPLE_CHOICE',
        content: { questions },
      };
    }

    // Default: Short Answer / Essay question
    return {
      type: 'SHORT_ANSWER',
      content: {
        prompt: text,
        questions: [
          { id: '1', question: text },
        ],
      },
    };
  }
}
