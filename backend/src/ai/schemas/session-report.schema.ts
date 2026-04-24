/**
 * Session Report Schema — MongoDB
 * Báo cáo cuối buổi học, tạo bởi Summary LLM
 * Spec reference: AI_Classroom_Assistant_Spec.md Section 2.5
 *
 * Lý do dùng MongoDB:
 * - summary là nested object phức tạp (topics, quiz details, recommendations)
 * - metadata chứa thông tin model AI đã dùng — schema linh hoạt
 * - KHÔNG cần embedding — chỉ query trực tiếp theo studentId/classId
 * - Lưu dạng JSON thuần để truy xuất nhanh cho Teacher Dashboard
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** Chi tiết một câu quiz trong báo cáo */
class QuizDetail {
  @Prop() topic: string;
  @Prop() questionSummary: string;
  @Prop() isCorrect: boolean;
  @Prop() mistakeNote: string;
}

/** Kết quả quiz tổng hợp */
class QuizResults {
  @Prop() total: number;
  @Prop() correct: number;
  @Prop() incorrect: number;
  @Prop() scorePercent: number;
  @Prop({ type: [QuizDetail], default: [] }) details: QuizDetail[];
}

/** Nội dung tóm tắt báo cáo — đúng 6 mục theo spec */
class ReportSummary {
  @Prop({ type: [String] }) topicsLearned: string[];
  @Prop({ type: QuizResults }) quizResults: QuizResults;
  @Prop({ type: [String] }) weakPoints: string[];
  @Prop({ type: [String] }) strongPoints: string[];
  @Prop() learningTrend: string;
  @Prop() recommendation: string;
}

/** Metadata về AI models đã sử dụng */
class ReportMetadata {
  @Prop() agentModel: string;
  @Prop() summaryModel: string;
  @Prop() embeddingModel: string;
  @Prop({ default: 'vi' }) sessionLanguage: string;
}

@Schema({ collection: 'session_reports', timestamps: true })
export class SessionReportModel extends Document {
  /** ID báo cáo — UUID */
  @Prop({ required: true, unique: true })
  reportId: string;

  /** ID phiên học tương ứng */
  @Prop({ required: true, index: true })
  sessionId: string;

  /** ID học sinh — tham chiếu đến PostgreSQL */
  @Prop({ required: true, index: true })
  studentId: string;

  /** ID lớp học — tham chiếu đến PostgreSQL */
  @Prop({ required: true, index: true })
  classId: string;

  /** Thời lượng phiên (phút) */
  @Prop() durationMinutes: number;

  /** Tổng số lượt hỏi đáp */
  @Prop() turnCount: number;

  /** Danh sách tài liệu đã cover */
  @Prop({ type: [String], default: [] })
  documentsCovered: string[];

  /** Nội dung tóm tắt báo cáo — 6 mục bắt buộc */
  @Prop({ type: ReportSummary })
  summary: ReportSummary;

  /** Metadata AI models */
  @Prop({ type: ReportMetadata })
  metadata: ReportMetadata;
}

export const SessionReportSchema = SchemaFactory.createForClass(SessionReportModel);
