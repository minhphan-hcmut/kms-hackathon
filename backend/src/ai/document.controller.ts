/**
 * Document Controller — Sprint 3: File Upload + Document Management
 * Sprint 5: Tích hợp Swagger (OpenAPI) Documentation
 * Endpoint: POST /api/teacher/upload-document
 * Spec: AI_Classroom_Assistant_Spec.md Section 4
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiProperty } from '@nestjs/swagger';
import { DocumentService } from './document.service';

/** Giới hạn: 20MB per file */
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// ─── DTOs với Swagger Decoration ──────────────────────────────

export class UploadDocumentDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File PDF giáo trình hoặc tài liệu (Tối đa 20MB)' })
  file: any;

  @ApiProperty({ description: 'ID của lớp học', example: 'class_abc123' })
  classId: string;

  @ApiProperty({ description: 'ID của giáo viên upload file', example: 'teacher_xyz789' })
  uploadedBy: string;

  @ApiProperty({ description: 'Các thẻ phân loại tài liệu, cách nhau bằng dấu phẩy', example: 'xác suất, chương 1, toán', required: false })
  tags?: string;
}

@ApiTags('Document Ingestion (RAG)')
@ApiBearerAuth()
@Controller('api/teacher')
@UseGuards(AuthGuard('jwt'))
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @ApiOperation({ summary: 'Upload và xử lý tài liệu PDF (OCR & Embedding)', description: 'Tải lên PDF, tự động trích xuất nội dung, chia nhỏ thành các chunks và vector hóa bằng OpenAI để phục vụ tìm kiếm RAG.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentDto })
  @ApiResponse({ status: 201, description: 'Upload và xử lý tài liệu thành công, trả về số lượng chunks tạo ra.' })
  @ApiResponse({ status: 400, description: 'Lỗi định dạng file hoặc trích xuất PDF thất bại.' })
  @Post('upload-document')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: MAX_FILE_SIZE,
            message: 'File quá lớn — tối đa 20MB',
          }),
          new FileTypeValidator({
            fileType: 'application/pdf',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('classId') classId: string,
    @Body('uploadedBy') uploadedBy: string,
    @Body('tags') tagsRaw?: string,
  ) {
    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const result = await this.documentService.ingestPdf(
      file,
      classId,
      uploadedBy,
      tags,
    );

    return {
      message: 'Upload và xử lý tài liệu thành công',
      docId: result.document.docId,
      fileName: result.document.fileName,
      pageCount: result.document.pageCount,
      chunksCreated: result.chunksCreated,
    };
  }

  @ApiOperation({ summary: 'Lấy danh sách tài liệu theo lớp', description: 'Trả về metadata các tài liệu PDF đã upload cho lớp học (không kèm nội dung text để tối ưu).' })
  @ApiResponse({ status: 200, description: 'Thành công.' })
  @Get('documents')
  async getDocuments(@Query('classId') classId: string) {
    return this.documentService.getDocumentsByClass(classId);
  }

  @ApiOperation({ summary: 'Xóa tài liệu', description: 'Xóa vĩnh viễn tài liệu và toàn bộ các Vector Chunks liên quan đến nó khỏi hệ thống RAG.' })
  @ApiResponse({ status: 204, description: 'Xóa thành công.' })
  @Delete('documents/:docId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('docId') docId: string) {
    await this.documentService.deleteDocument(docId);
  }
}
