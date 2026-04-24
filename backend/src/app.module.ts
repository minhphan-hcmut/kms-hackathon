/**
 * App Module — Điểm vào chính của ứng dụng Nest.js
 *
 * CẤU HÌNH HYBRID DATABASE:
 * - PostgreSQL (TypeORM): dữ liệu quan hệ — users, courses, scores
 * - MongoDB (Mongoose): dữ liệu linh hoạt — AI sessions, profiles, quiz content
 *
 * Cả hai database được kết nối đồng thời trong cùng một backend.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ClassroomModule } from './classroom/classroom.module';
import { AiModule } from './ai/ai.module';
import { AssessmentModule } from './assessment/assessment.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // ─── Cấu hình biến môi trường ──────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─── PostgreSQL (TypeORM) ───────────────────────────────
    // Lưu trữ: users, courses, enrollments, quiz_results, mastery_scores
    // Lý do: cần ACID transactions, FK constraints, JOINs, aggregate reporting
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('PG_HOST', 'localhost'),
        port: configService.get<number>('PG_PORT', 5432),
        username: configService.get<string>('PG_USER', 'brainlift'),
        password: configService.get<string>('PG_PASSWORD', 'brainlift123'),
        database: configService.get<string>('PG_DATABASE', 'brainlift'),
        autoLoadEntities: true,
        // synchronize: true CHỈ dùng cho dev/hackathon — KHÔNG dùng production
        synchronize: true,
      }),
    }),

    // ─── MongoDB (Mongoose) ─────────────────────────────────
    // Lưu trữ: teaching_sessions, learning_profiles, quiz_content, analytics
    // Lý do: schema linh hoạt, nested documents, write-heavy, không cần ACID
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/brainlift',
        ),
      }),
    }),

    // ─── Feature Modules ────────────────────────────────────
    UserModule,
    AuthModule,
    ClassroomModule,  // PostgreSQL — quản lý lớp học
    AiModule,         // MongoDB — AI Agent, sessions, reports
    AssessmentModule, // PostgreSQL — Quizzes và Grades
  ],
  controllers: [AppController],
})
export class AppModule {}
