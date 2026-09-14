import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateClassroomDto {
  subject: string;
  grade: string;
  year: string;
}

export class StudentInputDto {
  firstName: string;
  lastName?: string;
}

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  // Generate a random 4-digit numeric login code
  private generateLoginCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Find all classrooms for a specific teacher
  async getClassroomsByTeacher(teacherId: string) {
    return this.prisma.classroom.findMany({
      where: { teacherId },
      include: {
        students: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create a new classroom profile
  async createClassroom(teacherId: string, dto: CreateClassroomDto) {
    return this.prisma.classroom.create({
      data: {
        subject: dto.subject.trim(),
        grade: dto.grade.trim(),
        year: dto.year.trim(),
        teacherId,
      },
      include: {
        students: true,
      },
    });
  }

  // Delete a classroom profile
  async deleteClassroom(teacherId: string, classroomId: string) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, teacherId },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found or unauthorized');
    }

    return this.prisma.classroom.delete({
      where: { id: classroomId },
    });
  }

  // Add students to a classroom (supports single or bulk array)
  async addStudents(
    teacherId: string,
    classroomId: string,
    studentInputs: StudentInputDto[],
  ) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, teacherId },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found or unauthorized');
    }

    const studentData = studentInputs
      .filter((s) => s.firstName && s.firstName.trim().length > 0)
      .map((s) => ({
        firstName: s.firstName.trim(),
        lastName: (s.lastName || 'S.').trim(),
        loginCode: this.generateLoginCode(),
        classroomId,
      }));

    if (studentData.length === 0) {
      return [];
    }

    await this.prisma.student.createMany({
      data: studentData,
    });

    // Return the updated list of students for this classroom
    return this.prisma.student.findMany({
      where: { classroomId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Remove a student record from a classroom
  async deleteStudent(teacherId: string, classroomId: string, studentId: string) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, teacherId },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found or unauthorized');
    }

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, classroomId },
    });

    if (!student) {
      throw new NotFoundException('Student not found in this classroom');
    }

    await this.prisma.student.delete({
      where: { id: studentId },
    });

    return { success: true, studentId };
  }
}
