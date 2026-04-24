/**
 * DTOs cho module Auth — tuân thủ testing-boundaries.md Section 1.2
 * Sử dụng class-validator để validate input từ Frontend
 */

import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../shared/enums';

/** DTO đăng ký tài khoản mới */
export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsEnum(UserRole, { message: 'Vai trò phải là student hoặc teacher' })
  role: UserRole;
}

/** DTO đăng nhập */
export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

/** Response trả về sau khi auth thành công */
export interface AuthResponseDto {
  accessToken: string;
  user: UserProfileDto;
}

/** Thông tin user trả về cho Frontend — KHÔNG chứa passwordHash */
export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}
