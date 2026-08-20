import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SubmitActivityDto } from './dto/submit-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  async createActivity(@CurrentUser('id') teacherId: string, @Body() dto: CreateActivityDto) {
    return this.activitiesService.createActivity(teacherId, dto);
  }

  @Get()
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async findAllActivities(@CurrentUser() user: any) {
    return this.activitiesService.findAllActivities(user?.id);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async getActivityById(@Param('id') id: string, @CurrentUser() user: any) {
    const isTeacher = user.role === Role.TEACHER || user.role === Role.ADMIN;
    return this.activitiesService.getActivityById(id, isTeacher);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async submitActivity(
    @Param('id') id: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: SubmitActivityDto,
  ) {
    return this.activitiesService.submitActivity(id, studentId, dto);
  }

  @Get(':id/analytics')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getActivityAnalytics(@Param('id') id: string) {
    return this.activitiesService.getActivityAnalytics(id);
  }
}
