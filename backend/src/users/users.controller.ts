import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {

  @Get('admin')
  @Roles(Role.ADMIN)
  getAdminData(@CurrentUser() user: any) {
    return {
      message: 'Access granted to Admin Dashboard API',
      userRole: user.role,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      adminStats: {
        totalUsers: 142,
        systemHealth: 'Optimal',
        activeClasses: 28,
      },
    };
  }

  @Get('teacher')
  @Roles(Role.TEACHER, Role.ADMIN)
  getTeacherData(@CurrentUser() user: any) {
    return {
      message: 'Access granted to Teacher Portal API',
      userRole: user.role,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      teacherResources: [
        { id: '1', title: 'Mathematics 101 Curriculum', studentsEnrolled: 34 },
        { id: '2', title: 'Science Lab Assignments', studentsEnrolled: 29 },
      ],
    };
  }

  @Get('student')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  getStudentData(@CurrentUser() user: any) {
    return {
      message: 'Access granted to Student Learning Portal API',
      userRole: user.role,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      studentCourses: [
        { id: '101', name: 'Introduction to Computer Science', progress: '85%' },
        { id: '102', name: 'World History Overview', progress: '92%' },
      ],
    };
  }
}
