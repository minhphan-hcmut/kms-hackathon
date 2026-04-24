/**
 * Classroom Entity — PostgreSQL
 * Dữ liệu quan hệ: lớp học, liên kết với giáo viên
 * Spec reference: AI_Classroom_Assistant_Spec.md Section 3.1
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

@Entity('classrooms')
export class ClassroomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tên lớp học — hiển thị trong System Prompt Agent */
  @Column()
  name: string;

  /** Mô tả ngắn về lớp học / môn học */
  @Column({ nullable: true })
  description: string;

  /** Môn học — dùng cho context prompt */
  @Column()
  subject: string;

  /** Giáo viên phụ trách — FK đến bảng users (PostgreSQL) */
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher: UserEntity;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
