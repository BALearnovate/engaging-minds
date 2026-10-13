import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || Role.STUDENT,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Registration successful',
      user,
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    const { password, ...userProfile } = user;

    return {
      message: 'Login successful',
      user: userProfile,
      accessToken: token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }

    return user;
  }

  async verifyJoinCode(code: string) {
    const cleanCode = (code || '').trim();
    if (!cleanCode) {
      throw new UnauthorizedException('Join code is required');
    }

    // First search in Student table by loginCode
    const student = await this.prisma.student.findFirst({
      where: {
        loginCode: {
          equals: cleanCode,
          mode: 'insensitive',
        },
      },
      include: {
        classroom: {
          include: {
            teacher: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (student) {
      const initials = `${student.firstName[0] || ''}${student.lastName[0] || ''}`.toUpperCase() || 'ST';
      return {
        found: true,
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          displayName: `${student.firstName} ${student.lastName}`.trim(),
          initials,
          email: student.email || '',
          loginCode: student.loginCode,
        },
        classroom: {
          id: student.classroom.id,
          schoolName: 'Westbridge High School',
          title: `${student.classroom.year} ${student.classroom.subject}`.trim(),
          details: `Year ${student.classroom.grade} • ${student.classroom.subject} (${student.classroom.teacher.firstName} ${student.classroom.teacher.lastName})`.trim(),
        },
      };
    }

    // Check if code matches an ActivitySession shareCode
    const session = await this.prisma.activitySession.findFirst({
      where: { shareCode: { equals: cleanCode, mode: 'insensitive' } },
      include: {
        activityVersion: {
          include: {
            activity: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });

    if (session) {
      return {
        found: true,
        student: {
          id: `temp_${Date.now()}`,
          firstName: 'Student',
          lastName: 'Guest',
          displayName: 'Student Guest',
          initials: 'SG',
          email: '',
          loginCode: cleanCode,
        },
        classroom: {
          id: session.id,
          schoolName: 'Engaging Minds Academy',
          title: session.activityVersion.activity.title,
          details: `Live Activity Session (${session.activityVersion.activity.teacher.firstName} ${session.activityVersion.activity.teacher.lastName})`,
        },
      };
    }

    throw new UnauthorizedException('Invalid Join Code. No student or class found with this code.');
  }

  async completeStudentOnboarding(dto: {
    studentId?: string;
    loginCode?: string;
    displayName?: string;
    email?: string;
    pin: string;
    avatar?: string;
  }) {
    let student: any = null;

    if (dto.studentId && !dto.studentId.startsWith('temp_')) {
      student = await this.prisma.student.findUnique({
        where: { id: dto.studentId },
        include: { classroom: true },
      });
    } else if (dto.loginCode) {
      student = await this.prisma.student.findFirst({
        where: { loginCode: { equals: dto.loginCode.trim(), mode: 'insensitive' } },
        include: { classroom: true },
      });
    }

    if (student) {
      const nameParts = dto.displayName ? dto.displayName.trim().split(' ') : [];
      const updatedFirstName = nameParts[0] || student.firstName;
      const updatedLastName = nameParts.slice(1).join(' ') || student.lastName;

      const updated = await this.prisma.student.update({
        where: { id: student.id },
        data: {
          pin: dto.pin,
          email: dto.email ? dto.email.toLowerCase() : student.email,
          firstName: updatedFirstName,
          lastName: updatedLastName,
        },
      });

      const userObj = {
        id: updated.id,
        email: updated.email || `${updated.loginCode}@student.em`,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: 'STUDENT',
      };

      const token = this.generateToken(userObj.id, userObj.email, userObj.role);

      return {
        message: 'Onboarding complete',
        user: userObj,
        accessToken: token,
      };
    }

    // Fallback if student not pre-created in DB, create new student User record
    const emailVal = dto.email ? dto.email.toLowerCase() : `student_${Date.now()}@student.em`;
    const hashedPassword = await bcrypt.hash(dto.pin || '1234', 10);
    const nameParts = (dto.displayName || 'Student User').trim().split(' ');

    const newUser = await this.prisma.user.create({
      data: {
        email: emailVal,
        password: hashedPassword,
        firstName: nameParts[0] || 'Student',
        lastName: nameParts.slice(1).join(' ') || 'User',
        role: Role.STUDENT,
      },
    });

    const token = this.generateToken(newUser.id, newUser.email, newUser.role);

    return {
      message: 'Onboarding complete',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: 'STUDENT',
      },
      accessToken: token,
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }
}
