/**
 * AI Module — đăng ký tất cả MongoDB schemas, services, và controllers
 *
 * Module này CHỈ tương tác với MongoDB (Mongoose).
 * Dữ liệu quan hệ (users, classrooms) được truy vấn qua
 * UserModule và ClassroomModule (PostgreSQL/TypeORM).
 *
 * 4 MongoDB Collections:
 * 1. documents      — tài liệu OCR từ PDF
 * 2. vector_chunks  — chunks đã embedding cho RAG
 * 3. chat_sessions  — phiên học + memory + conversation
 * 4. session_reports — báo cáo cuối buổi cho GV
 *
 * Sprint 3: Thêm DocumentService + DocumentController cho ingestion pipeline
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';

import { DocumentModel, DocumentSchema } from './schemas/document.schema';
import { VectorChunkModel, VectorChunkSchema } from './schemas/vector-chunk.schema';
import { ChatSessionModel, ChatSessionSchema } from './schemas/chat-session.schema';
import { SessionReportModel, SessionReportSchema } from './schemas/session-report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentModel.name, schema: DocumentSchema },
      { name: VectorChunkModel.name, schema: VectorChunkSchema },
      { name: ChatSessionModel.name, schema: ChatSessionSchema },
      { name: SessionReportModel.name, schema: SessionReportSchema },
    ]),
  ],
  controllers: [AiController, DocumentController],
  providers: [AiService, DocumentService],
  exports: [AiService, DocumentService],
})
export class AiModule {}
