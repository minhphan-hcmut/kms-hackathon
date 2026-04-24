/**
 * Demo Seeding Script — Sprint 5: System Audit & Demo Preparation
 * Script này khởi tạo dữ liệu mẫu (Teacher, Students, Classroom, Vector Document)
 * giúp Ban giám khảo (Judges) có thể test API ngay lập tức mà không cần manual data entry.
 *
 * Cách chạy: npx ts-node src/scripts/seed.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { UserRole } from '../shared/enums';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getModelToken } from '@nestjs/mongoose';
import { ClassroomEntity } from '../classroom/entities/classroom.entity';
import { DocumentModel } from '../ai/schemas/document.schema';
import { VectorChunkModel } from '../ai/schemas/vector-chunk.schema';
import { v4 as uuidv4 } from 'uuid';

async function bootstrap() {
  console.log('🌱 Bắt đầu chạy Seeding Script...');
  
  // Khởi tạo NestJS application context (không mở HTTP port)
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userService = app.get(UserService);
  const classroomRepo = app.get<Repository<ClassroomEntity>>(getRepositoryToken(ClassroomEntity));
  const documentModel = app.get(getModelToken(DocumentModel.name));
  const vectorChunkModel = app.get(getModelToken(VectorChunkModel.name));

  try {
    // ─── 1. Khởi tạo Users (PostgreSQL) ─────────────────────────
    console.log('1️⃣ Khởi tạo Giáo viên và Học sinh...');
    
    // Xoá dữ liệu cũ nếu chạy lại (dựa trên email)
    const emails = ['teacher@brainlift.edu', 'student1@brainlift.edu', 'student2@brainlift.edu'];
    for (const email of emails) {
      const existing = await userService.findByEmail(email);
      if (existing) {
         // Trong thực tế cần cascade delete, ở script demo ta bỏ qua hoặc skip tạo mới
         console.log(`User ${email} đã tồn tại, skip tạo mới.`);
      }
    }

    const teacher = await userService.findByEmail('teacher@brainlift.edu') || await userService.create({
      email: 'teacher@brainlift.edu',
      password: 'password123',
      fullName: 'Giáo viên Demo',
      role: UserRole.TEACHER,
    });

    const student1 = await userService.findByEmail('student1@brainlift.edu') || await userService.create({
      email: 'student1@brainlift.edu',
      password: 'password123',
      fullName: 'Học sinh Alice',
      role: UserRole.STUDENT,
    });

    const student2 = await userService.findByEmail('student2@brainlift.edu') || await userService.create({
      email: 'student2@brainlift.edu',
      password: 'password123',
      fullName: 'Học sinh Bob',
      role: UserRole.STUDENT,
    });

    // ─── 2. Khởi tạo Classroom (PostgreSQL) ─────────────────────
    console.log('2️⃣ Khởi tạo Lớp học...');
    let classroom = await classroomRepo.findOne({ where: { name: 'Toán Cao Cấp 101' } });
    if (!classroom) {
      classroom = classroomRepo.create({
        name: 'Toán Cao Cấp 101',
        description: 'Lớp demo Hackathon - Định lý Bayes và Xác suất',
        subject: 'Toán Học',
        teacher: teacher,
      });
      classroom = await classroomRepo.save(classroom);
    }

    // ─── 3. Khởi tạo Vector Document (MongoDB) ──────────────────
    console.log('3️⃣ Khởi tạo Dữ liệu RAG (MongoDB)...');
    
    const docId = uuidv4();
    const existingDocs = await documentModel.find({ classId: classroom.id });
    
    if (existingDocs.length === 0) {
      const mockDoc = new documentModel({
        docId: docId,
        classId: classroom.id,
        fileName: 'syllabus_toan_cao_cap.pdf',
        uploadedBy: teacher.id,
        content: 'Định lý Bayes mô tả xác suất của một sự kiện, dựa trên kiến thức trước đó về các điều kiện có thể liên quan đến sự kiện đó. P(A|B) = P(B|A) * P(A) / P(B).',
        pageCount: 1,
        tags: ['toan_hoc', 'xac_suat', 'bayes'],
      });
      await mockDoc.save();

      // Giả lập 2 chunk đã được embedding
      const chunks = [
        {
          vectorId: uuidv4(),
          docId: docId,
          classId: classroom.id,
          chunkIndex: 0,
          chunkText: 'Định lý Bayes mô tả xác suất của một sự kiện, dựa trên kiến thức trước đó về các điều kiện có thể liên quan đến sự kiện đó.',
          embedding: Array(1536).fill(0.01), // Giả lập vector 1536 chiều của OpenAI
          metadata: { fileName: 'syllabus_toan_cao_cap.pdf', pageNumber: 1, tags: ['toan_hoc'] },
        },
        {
          vectorId: uuidv4(),
          docId: docId,
          classId: classroom.id,
          chunkIndex: 1,
          chunkText: 'Công thức toán học của định lý Bayes là: P(A|B) = P(B|A) * P(A) / P(B). Trong đó P(A|B) là xác suất hậu nghiệm.',
          embedding: Array(1536).fill(0.02),
          metadata: { fileName: 'syllabus_toan_cao_cap.pdf', pageNumber: 1, tags: ['bayes'] },
        }
      ];
      await vectorChunkModel.insertMany(chunks);
      console.log('   ✅ Đã insert tài liệu mẫu và Vector Chunks vào MongoDB.');
    } else {
      console.log('   ✅ Tài liệu mẫu đã tồn tại trong MongoDB, skip insert.');
    }

    console.log('🎉 Seeding hoàn tất thành công!');
    console.log(`
      [THÔNG TIN TEST]
      Teacher Email : teacher@brainlift.edu
      Student Email : student1@brainlift.edu
      Password      : password123
      Classroom ID  : ${classroom.id}
    `);

  } catch (error) {
    console.error('❌ Có lỗi xảy ra trong quá trình seeding:', error);
  } finally {
    // Đóng kết nối DB và thoát script
    await app.close();
    process.exit(0);
  }
}

bootstrap();
