/**
 * Quiz Entity — PostgreSQL
 * Lưu trữ cấu trúc bộ câu hỏi trắc nghiệm sinh ra từ LLM
 * Spec: Sprint 4 — Proactive AI Capabilities
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClassroomEntity } from '../../classroom/entities/classroom.entity';

@Entity('quizzes')
export class QuizEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Liên kết với lớp học để theo dõi ngữ cảnh */
  @ManyToOne(() => ClassroomEntity)
  @JoinColumn({ name: 'class_id' })
  classroom: ClassroomEntity;

  @Column({ name: 'class_id' })
  classId: string;

  /** Chủ đề của quiz (e.g., "Xác suất có điều kiện") */
  @Column()
  topic: string;

  /** Độ khó: easy, medium, hard */
  @Column()
  difficulty: string;

  /**
   * Lưu trữ cấu trúc JSON mảng các câu hỏi, các lựa chọn, và đáp án đúng.
   * Dùng JSONB (PostgreSQL) để có thể query nội dung linh hoạt nếu cần sau này.
   */
  @Column({ type: 'jsonb' })
  questions: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
