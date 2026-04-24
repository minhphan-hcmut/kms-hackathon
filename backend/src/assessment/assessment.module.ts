/**
 * Assessment Module — Sprint 4: Proactive AI Capabilities
 * Quản lý module đánh giá (sinh quiz, chấm điểm)
 * PostgreSQL kết hợp với AI Service
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { QuizEntity } from './entities/quiz.entity';
import { StudentGradeEntity } from './entities/student-grade.entity';
import { ClassroomEntity } from '../classroom/entities/classroom.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizEntity, StudentGradeEntity, ClassroomEntity]),
    AiModule, // Import AiModule để dùng AiService gọi retrieval RAG
  ],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
