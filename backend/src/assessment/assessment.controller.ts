/**
 * Assessment Controller — Sprint 4: Proactive AI Capabilities
 * Sprint 5: Tích hợp Swagger (OpenAPI) Documentation
 * API routes: POST /api/assessment/generate-quiz, POST /api/assessment/evaluate-answer
 */

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Max, Min } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';

// ─── DTOs với validation & Swagger Decoration ────────────────

export class GenerateQuizDto {
  @ApiProperty({ description: 'ID của lớp học', example: 'class_abc123' })
  @IsString() @IsNotEmpty({ message: 'classId không được trống' })
  classId: string;

  @ApiProperty({ description: 'Chủ đề của bài kiểm tra (LLM sẽ dựa vào đây để truy vấn RAG)', example: 'Xác suất thống kê - Định lý Bayes' })
  @IsString() @IsNotEmpty({ message: 'topic không được trống' })
  topic: string;

  @ApiProperty({ description: 'Độ khó của quiz', example: 'medium', enum: ['easy', 'medium', 'hard'] })
  @IsString() @IsNotEmpty({ message: 'difficulty không được trống' })
  difficulty: string;

  @ApiProperty({ description: 'Số lượng câu hỏi cần tạo', example: 5, minimum: 1, maximum: 20 })
  @IsNumber() @Min(1) @Max(20)
  numberOfQuestions: number;
}

export class EvaluateAnswerDto {
  @ApiProperty({ description: 'ID của học sinh nộp câu trả lời', example: 'student_xyz789' })
  @IsString() @IsNotEmpty({ message: 'studentId không được trống' })
  studentId: string;

  @ApiProperty({ description: 'ID của lớp học', example: 'class_abc123' })
  @IsString() @IsNotEmpty({ message: 'classId không được trống' })
  classId: string;

  @ApiProperty({ description: 'ID của Quiz (nếu câu hỏi thuộc một bộ Quiz cụ thể)', required: false })
  @IsOptional() @IsString()
  quizId?: string;

  @ApiProperty({ description: 'Nội dung câu hỏi tự luận/trắc nghiệm', example: 'Hãy giải thích ngắn gọn Định lý Bayes là gì?' })
  @IsString() @IsNotEmpty({ message: 'questionText không được trống' })
  questionText: string;

  @ApiProperty({ description: 'Câu trả lời của học sinh', example: 'Định lý Bayes là công thức tính xác suất của một biến cố khi biết trước một biến cố khác đã xảy ra.' })
  @IsString() @IsNotEmpty({ message: 'studentAnswer không được trống' })
  studentAnswer: string;
}

@ApiTags('Assessment & Auto-Grading')
@ApiBearerAuth()
@Controller('api/assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @ApiOperation({ summary: 'Tạo bộ câu hỏi trắc nghiệm tự động bằng RAG', description: 'Trích xuất nội dung từ Vector DB dựa trên chủ đề yêu cầu, gửi vào LLM để sinh ra bộ câu hỏi chuẩn JSON, lưu vào PostgreSQL.' })
  @ApiResponse({ status: 201, description: 'Quiz đã được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Không thể tạo quiz (VD: LLM trả JSON lỗi hoặc RAG không tìm thấy thông tin).' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lớp học.' })
  @Post('generate-quiz')
  @UseGuards(AuthGuard('jwt'))
  async generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.assessmentService.generateQuiz(
      dto.classId,
      dto.topic,
      dto.difficulty,
      dto.numberOfQuestions,
    );
  }

  @ApiOperation({ summary: 'Chấm điểm và nhận feedback từ AI cho câu trả lời', description: 'Học sinh nộp câu trả lời. AI đóng vai trò giáo viên đánh giá, cho điểm (0-100) và nhận xét mang tính xây dựng. Kết quả được lưu vào PostgreSQL.' })
  @ApiResponse({ status: 201, description: 'Chấm điểm hoàn tất, trả về Score và Feedback.' })
  @ApiResponse({ status: 400, description: 'Lỗi trong quá trình chấm điểm.' })
  @Post('evaluate-answer')
  @UseGuards(AuthGuard('jwt'))
  async evaluateAnswer(@Body() dto: EvaluateAnswerDto) {
    return this.assessmentService.evaluateAnswer(
      dto.studentId,
      dto.classId,
      dto.quizId || null,
      dto.questionText,
      dto.studentAnswer,
    );
  }
}
