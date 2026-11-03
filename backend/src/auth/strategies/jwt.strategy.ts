import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'engaging-minds-super-secret-jwt-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (user) {
      return user;
    }

    // Check Student table for student credentials
    const student = await this.prisma.student.findUnique({
      where: { id: payload.sub },
    });

    if (student) {
      return {
        id: student.id,
        email: student.email || `${student.loginCode}@student.em`,
        firstName: student.firstName,
        lastName: student.lastName,
        loginCode: student.loginCode,
        classroomId: student.classroomId,
        role: 'STUDENT',
      };
    }

    // Support demo/temporary student session tokens
    if (payload.role === 'STUDENT' || payload.sub?.startsWith('demo_') || payload.sub?.startsWith('temp_')) {
      return {
        id: payload.sub,
        email: payload.email || 'student@student.em',
        firstName: 'Student',
        lastName: 'User',
        role: 'STUDENT',
      };
    }

    throw new UnauthorizedException('User no longer exists');
  }
}
