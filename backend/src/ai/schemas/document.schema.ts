/**
 * Document Schema — MongoDB
 * Lưu trữ nội dung PDF đã OCR dưới dạng JSON document
 * Spec reference: AI_Classroom_Assistant_Spec.md Section 2.1
 *
 * Lý do dùng MongoDB:
 * - content là text dài, không cố định kích thước
 * - tags là mảng động, khác nhau giữa các tài liệu
 * - Không cần ACID hay JOIN — chỉ query theo classId/docId
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'documents', timestamps: true })
export class DocumentModel extends Document {
  /** ID tài liệu — UUID v4 */
  @Prop({ required: true, unique: true })
  docId: string;

  /** ID lớp học — tham chiếu đến ClassroomEntity (PostgreSQL) */
  @Prop({ required: true, index: true })
  classId: string;

  /** Tên file gốc */
  @Prop({ required: true })
  fileName: string;

  /** ID giáo viên upload — tham chiếu đến UserEntity (PostgreSQL) */
  @Prop({ required: true })
  uploadedBy: string;

  /** Nội dung text đầy đủ sau OCR */
  @Prop({ required: true })
  content: string;

  /** Số trang PDF gốc */
  @Prop({ default: 0 })
  pageCount: number;

  /** Tags phân loại — mảng động, giáo viên có thể thêm */
  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentModel);
