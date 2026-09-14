import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClassroomsService, CreateClassroomDto, StudentInputDto } from './classrooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER, Role.ADMIN)
export class ClassroomsController {
  constructor(private classroomsService: ClassroomsService) {}

  // GET /classrooms - Get all classrooms owned by logged-in teacher
  @Get()
  async getClassrooms(@CurrentUser('id') teacherId: string) {
    return this.classroomsService.getClassroomsByTeacher(teacherId);
  }

  // POST /classrooms - Create a new classroom
  @Post()
  async createClassroom(
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateClassroomDto,
  ) {
    return this.classroomsService.createClassroom(teacherId, dto);
  }

  // DELETE /classrooms/:id - Delete a classroom profile
  @Delete(':id')
  async deleteClassroom(
    @CurrentUser('id') teacherId: string,
    @Param('id') classroomId: string,
  ) {
    return this.classroomsService.deleteClassroom(teacherId, classroomId);
  }

  // POST /classrooms/:id/students - Add students (manual or bulk array)
  @Post(':id/students')
  async addStudents(
    @CurrentUser('id') teacherId: string,
    @Param('id') classroomId: string,
    @Body() body: { students: StudentInputDto[] },
  ) {
    return this.classroomsService.addStudents(teacherId, classroomId, body.students);
  }

  // DELETE /classrooms/:id/students/:studentId - Remove a student record
  @Delete(':id/students/:studentId')
  async deleteStudent(
    @CurrentUser('id') teacherId: string,
    @Param('id') classroomId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classroomsService.deleteStudent(teacherId, classroomId, studentId);
  }
}

