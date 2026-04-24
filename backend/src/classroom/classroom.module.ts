/**
 * Classroom Module — quản lý lớp học trong PostgreSQL
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassroomEntity } from './entities/classroom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassroomEntity])],
  exports: [TypeOrmModule],
})
export class ClassroomModule {}
