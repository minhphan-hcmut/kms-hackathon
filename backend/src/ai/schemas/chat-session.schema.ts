/**
 * Chat Session Schema — MongoDB
 * Lưu trữ phiên học + memory 3 lớp theo spec Section 2.3
 * Spec reference: AI_Classroom_Assistant_Spec.md Section 2.3 Memory Management
 *
 * Lý do dùng MongoDB:
 * - conversation là mảng messages kích thước biến đổi (append-heavy)
 * - memory là nested object phức tạp, schema thay đổi theo phiên
 * - quizHistory bên trong memory có schema linh hoạt
 * - Không cần JOIN — query theo sessionId hoặc studentId
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** Một tin nhắn trong cuộc hội thoại */
class ChatMessage {
  @Prop({ required: true, enum: ['student', 'agent'] })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: () => new Date() })
  timestamp: Date;
}

/** Kết quả một câu quiz trong phiên */
class QuizEntry {
  @Prop() quizId: string;
  @Prop() question: string;
  @Prop() correctAnswer: string;
  @Prop() studentAnswer: string;
  @Prop() isCorrect: boolean;
  @Prop() topic: string;
}

/** Memory phiên học — chiến lược 3 lớp theo spec */
class SessionMemory {
  /** Chủ đề đã cover trong phiên */
  @Prop({ type: [String], default: [] })
  topicsCovered: string[];

  /** Lịch sử quiz — danh sách câu hỏi và kết quả */
  @Prop({ type: [QuizEntry], default: [] })
  quizHistory: QuizEntry[];

  /** Điểm yếu ghi nhận */
  @Prop({ type: [String], default: [] })
  weakPoints: string[];

  /** Điểm mạnh ghi nhận */
  @Prop({ type: [String], default: [] })
  strongPoints: string[];

  /** Tổng số lượt hội thoại */
  @Prop({ default: 0 })
  conversationTurns: number;

  /** Tóm tắt rolling — cập nhật mỗi 10 lượt hoặc đổi chủ đề */
  @Prop({ default: '' })
  rollingSummary: string;
}

@Schema({ collection: 'chat_sessions', timestamps: true })
export class ChatSessionModel extends Document {
  /** ID phiên học — UUID */
  @Prop({ required: true, unique: true })
  sessionId: string;

  /** ID học sinh — tham chiếu đến UserEntity (PostgreSQL) */
  @Prop({ required: true, index: true })
  studentId: string;

  /** ID lớp học — tham chiếu đến ClassroomEntity (PostgreSQL) */
  @Prop({ required: true, index: true })
  classId: string;

  /** Trạng thái phiên: active | completed */
  @Prop({ required: true, enum: ['active', 'completed'], default: 'active' })
  status: string;

  /** Danh sách tài liệu được sử dụng trong phiên */
  @Prop({ type: [String], default: [] })
  documentIds: string[];

  /**
   * Lịch sử chat — Short-term memory (raw messages)
   * Chỉ giữ 5-10 tin nhắn gần nhất trong context prompt
   * Nhưng lưu toàn bộ vào DB để tạo report sau
   */
  @Prop({ type: [ChatMessage], default: [] })
  conversation: ChatMessage[];

  /** Session memory — chứa topics, quiz history, weak/strong points */
  @Prop({ type: SessionMemory, default: () => ({}) })
  memory: SessionMemory;

  /** Thời lượng phiên (phút) — tính khi kết thúc */
  @Prop({ type: Number })
  durationMinutes?: number;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSessionModel);
