/**
 * User Service — xử lý logic nghiệp vụ cho User module
 * Chỉ tương tác với PostgreSQL thông qua TypeORM Repository
 */

import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/auth.dto';
import { UserProfileDto } from '../auth/dto/auth.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Tạo user mới — dùng cho luồng đăng ký
   * Hash password trước khi lưu vào PostgreSQL
   * @throws ConflictException nếu email đã tồn tại
   */
  async create(dto: RegisterDto): Promise<UserEntity> {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash mật khẩu với bcrypt — không bao giờ lưu plaintext
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Tạo entity và lưu vào PostgreSQL
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
    });

    return this.userRepository.save(user);
  }

  /**
   * Tìm user theo email — dùng cho luồng đăng nhập
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Tìm user theo ID
   * @throws NotFoundException nếu không tìm thấy
   */
  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  /**
   * Chuyển đổi UserEntity → UserProfileDto
   * Đảm bảo KHÔNG bao giờ trả passwordHash về Frontend
   */
  toProfileDto(user: UserEntity): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
