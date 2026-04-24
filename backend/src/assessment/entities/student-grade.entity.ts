/**
 * Student Grade Entity — PostgreSQL
 * Lưu trữ điểm số và feedback chi tiết từ AI khi chấm điểm câu trả lời của học sinh
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
import { UserEntity } from '../../user/entities/user.entity';
import { ClassroomEntity } from '../../classroom/entities/classroom.entity';
import { QuizEntity } from './quiz.entity';

@Entity('student_grades')
export class StudentGradeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Liên kết với học sinh */
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'student_id' })
  student: UserEntity;

  @Column({ name: 'student_id' })
  studentId: string;

  /** Liên kết với lớp học */
  @ManyToOne(() => ClassroomEntity)
  @JoinColumn({ name: 'class_id' })
  classroom: ClassroomEntity;

  @Column({ name: 'class_id' })
  classId: string;

  /** Liên kết trực tiếp với QuizEntity */
  @ManyToOne(() => QuizEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: QuizEntity;

  /** ID của quiz nếu câu trả lời này thuộc một bộ quiz (tuỳ chọn) */
  @Column({ type: 'uuid', name: 'quiz_id', nullable: true })
  quizId: string | null;

  /** Nội dung câu hỏi được đặt ra */
  @Column({ type: 'text' })
  questionText: string;

  /** Câu trả lời thực tế của học sinh */
  @Column({ type: 'text' })
  studentAnswer: string;

  /** Điểm số do AI chấm (0 - 100) */
  @Column({ type: 'int' })
  score: number;

  /** Feedback chi tiết mang tính xây dựng từ AI */
  @Column({ type: 'text' })
  feedback: string;

  @CreateDateColumn({ name: 'evaluated_at' })
  evaluatedAt: Date;
}
