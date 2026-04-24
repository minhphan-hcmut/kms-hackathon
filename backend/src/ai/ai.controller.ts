/**
 * AI Controller — endpoints cho AI Agent và Teacher Dashboard
 * Sprint 5: Tích hợp Swagger (OpenAPI) Documentation
 * Spec: AI_Classroom_Assistant_Spec.md Section 4
 */

import {
  Controller, Post, Get, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { AiService } from './ai.service';

// ─── DTOs với validation & Swagger Decoration ────────────────

export class StartSessionDto {
  @ApiProperty({ description: 'ID của học sinh tham gia phiên học', example: 'e3b0c442-989b-464c-8650-123456789012' })
  @IsString() @IsNotEmpty({ message: 'studentId không được trống' })
  studentId: string;

  @ApiProperty({ description: 'ID của lớp học', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsString() @IsNotEmpty({ message: 'classId không được trống' })
  classId: string;
}

export class ChatDto {
  @ApiProperty({ description: 'ID của phiên học hiện tại', example: 'sess_123abc' })
  @IsString() @IsNotEmpty({ message: 'sessionId không được trống' })
  sessionId: string;

  @ApiProperty({ description: 'Nội dung tin nhắn từ học sinh gửi đến AI', example: 'Thầy giải thích lại giúp em định lý Bayes được không?' })
  @IsString() @IsNotEmpty({ message: 'message không được trống' })
  message: string;
}

export class EndSessionDto {
  @ApiProperty({ description: 'ID của phiên học cần kết thúc', example: 'sess_123abc' })
  @IsString() @IsNotEmpty({ message: 'sessionId không được trống' })
  sessionId: string;
}

@ApiTags('AI Core & Sessions')
@ApiBearerAuth()
@Controller('api')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ─── Teacher Endpoints ──────────────────────────────────────

  @ApiOperation({ summary: 'Lấy danh sách tài liệu theo lớp học', description: 'Dành cho giáo viên xem lại các tài liệu PDF đã upload cho một lớp cụ thể.' })
  @ApiResponse({ status: 200, description: 'Danh sách tài liệu đã được OCR.' })
  @Get('teacher/documents')
  @UseGuards(AuthGuard('jwt'))
  async getDocuments(@Query('classId') classId: string) {
    return this.aiService.getDocumentsByClass(classId);
  }

  @ApiOperation({ summary: 'Lấy danh sách báo cáo buổi học', description: 'Lấy toàn bộ các báo cáo tổng kết do AI sinh ra sau khi kết thúc các phiên học.' })
  @ApiResponse({ status: 200, description: 'Danh sách Session Reports.' })
  @Get('teacher/reports')
  @UseGuards(AuthGuard('jwt'))
  async getReports(@Query('classId') classId: string) {
    return this.aiService.getReportsByClass(classId);
  }

  @ApiOperation({ summary: 'Xem chi tiết một báo cáo buổi học', description: 'Truy xuất chi tiết điểm mạnh, điểm yếu, và tóm tắt buổi học dựa trên reportId.' })
  @ApiResponse({ status: 200, description: 'Chi tiết Session Report.' })
  @Get('teacher/reports/:reportId')
  @UseGuards(AuthGuard('jwt'))
  async getReportDetail(@Param('reportId') reportId: string) {
    return this.aiService.getReportById(reportId);
  }

  // ─── Session Endpoints — wired to full Agent logic ─────────

  @ApiOperation({ summary: 'Bắt đầu phiên học mới', description: 'Tạo session mới, khởi tạo bộ nhớ 3 lớp (Short-term, Summary, RAG) cho AI Agent.' })
  @ApiResponse({ status: 201, description: 'Phiên học mới được tạo thành công.' })
  @Post('session/start')
  @UseGuards(AuthGuard('jwt'))
  async startSession(@Body() dto: StartSessionDto) {
    return this.aiService.startSession(dto.studentId, dto.classId);
  }

  @ApiOperation({ summary: 'Gửi tin nhắn cho AI Agent', description: 'Luồng chính: Nhận tin nhắn -> RAG -> Build Context -> Gọi LLM -> Trả lời.' })
  @ApiResponse({ status: 201, description: 'AI Agent đã phản hồi.' })
  @ApiResponse({ status: 400, description: 'Phiên học đã kết thúc hoặc không hợp lệ.' })
  @Post('session/chat')
  @UseGuards(AuthGuard('jwt'))
  async chat(@Body() dto: ChatDto) {
    return this.aiService.chat(dto.sessionId, dto.message);
  }

  @ApiOperation({ summary: 'Kết thúc phiên học', description: 'Đóng session, kích hoạt Summary LLM để tổng hợp báo cáo đánh giá.' })
  @ApiResponse({ status: 201, description: 'Báo cáo phiên học đã được tạo thành công.' })
  @Post('session/end')
  @UseGuards(AuthGuard('jwt'))
  async endSession(@Body() dto: EndSessionDto) {
    return this.aiService.endSession(dto.sessionId);
  }
}
