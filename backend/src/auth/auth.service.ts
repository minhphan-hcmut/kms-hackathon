/**
 * Auth Service — xử lý logic đăng ký, đăng nhập, tạo JWT
 * Kết hợp UserService (PostgreSQL) + JwtService
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản mới
   * Tạo user trong PostgreSQL → ký JWT → trả về token + profile
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Tạo user mới (UserService xử lý hash + kiểm tra trùng email)
    const user = await this.userService.create(dto);

    // Ký JWT với payload chứa userId và role
    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: this.userService.toProfileDto(user),
    };
  }

  /**
   * Đăng nhập
   * Kiểm tra credentials → ký JWT → trả về token + profile
   * @throws UnauthorizedException nếu email/password sai
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Tìm user theo email trong PostgreSQL
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // So sánh password với hash trong DB
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Ký JWT
    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: this.userService.toProfileDto(user),
    };
  }
}
