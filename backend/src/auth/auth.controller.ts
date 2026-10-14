import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('student-login')
  async studentLogin(@Body() dto: { studentCode: string; pin: string }) {
    return this.authService.studentLogin(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-join-code')
  async verifyJoinCode(@Body('code') code: string) {
    return this.authService.verifyJoinCode(code);
  }

  @HttpCode(HttpStatus.OK)
  @Post('student-onboarding')
  async studentOnboarding(
    @Body()
    dto: {
      studentId?: string;
      loginCode?: string;
      displayName?: string;
      email?: string;
      pin: string;
      avatar?: string;
    },
  ) {
    return this.authService.completeStudentOnboarding(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
