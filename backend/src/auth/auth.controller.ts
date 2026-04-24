/**
 * Auth Controller — endpoints cho đăng ký, đăng nhập, lấy profile
 * Tuân thủ API contract: testing-boundaries.md Section 1.6
 *
 * POST /api/auth/register  → AuthResponseDto
 * POST /api/auth/login     → AuthResponseDto
 * GET  /api/auth/profile   → UserProfileDto
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /** POST /api/auth/register — Đăng ký tài khoản mới */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** POST /api/auth/login — Đăng nhập */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** GET /api/auth/profile — Lấy thông tin user hiện tại (cần JWT) */
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = await this.userService.findById(req.user.id);
    return this.userService.toProfileDto(user);
  }
}
