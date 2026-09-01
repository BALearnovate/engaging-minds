import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { AiActivityGeneratorService } from './ai/activityGenerator.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SubmitActivityDto } from './dto/submit-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private activitiesService: ActivitiesService,
    private aiGeneratorService: AiActivityGeneratorService,
  ) {}

  // AI DSL Generation Endpoint
  @Post('generate-dsl')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async generateDsl(
    @Body() body: { prompt: string; subject?: string; gradeLevel?: string },
  ) {
    return this.aiGeneratorService.generate(body.prompt, body.subject, body.gradeLevel);
  }

  // AI Block Improvement Endpoint
  @Post('improve-block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async improveBlock(@Body() body: { block: any; prompt: string }) {
    return this.aiGeneratorService.improveBlock(body.block, body.prompt);
  }

  // Save Draft Endpoint
  @Post('save-draft')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async saveDraft(
    @CurrentUser('id') teacherId: string,
    @Body() body: { activityId?: string; title: string; description?: string; definition: any },
  ) {
    return this.activitiesService.saveDraft(
      teacherId,
      body.activityId,
      body.title,
      body.description,
      body.definition,
    );
  }

  // Publish Activity Version Endpoint
  @Post('publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async publishActivity(
    @CurrentUser('id') teacherId: string,
    @Body() body: { activityId: string },
  ) {
    return this.activitiesService.publishActivity(teacherId, body.activityId);
  }

  // Public Session Lookup for Students (No Auth required to load session)
  @Get('session/:shareCode')
  async getPublishedSessionByCode(@Param('shareCode') shareCode: string) {
    return this.activitiesService.getPublishedSessionByCode(shareCode);
  }

  // Student Join Session Endpoint
  @Post('student-session/join')
  async joinStudentSession(
    @Body() body: { shareCode: string; studentName: string; studentId?: string },
  ) {
    return this.activitiesService.joinStudentSession(
      body.shareCode,
      body.studentName,
      body.studentId,
    );
  }

  // Record Student Event / Action / Intervention
  @Post('event')
  async recordStudentEvent(
    @Body()
    body: {
      studentSessionId: string;
      type: string;
      blockId?: string;
      payload: any;
    },
  ) {
    return this.activitiesService.recordStudentEvent(
      body.studentSessionId,
      body.type,
      body.blockId,
      body.payload,
    );
  }

  // Teacher Live Dashboard State Endpoint
  @Get('session/:shareCode/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async getTeacherDashboardState(@Param('shareCode') shareCode: string) {
    return this.activitiesService.getTeacherDashboardState(shareCode);
  }

  // Existing Endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async createActivity(@CurrentUser('id') teacherId: string, @Body() dto: CreateActivityDto) {
    return this.activitiesService.createActivity(teacherId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async findAllActivities(@CurrentUser() user: any) {
    return this.activitiesService.findAllActivities(user?.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async getActivityById(@Param('id') id: string, @CurrentUser() user: any) {
    const isTeacher = user.role === Role.TEACHER || user.role === Role.ADMIN;
    return this.activitiesService.getActivityById(id, isTeacher);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async submitActivity(
    @Param('id') id: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: SubmitActivityDto,
  ) {
    return this.activitiesService.submitActivity(id, studentId, dto);
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async getActivityAnalytics(@Param('id') id: string) {
    return this.activitiesService.getActivityAnalytics(id);
  }
}
