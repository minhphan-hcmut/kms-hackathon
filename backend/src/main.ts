/**
 * Main entry point — khởi động Nest.js với validation pipe
 * ValidationPipe đảm bảo mọi request đều được validate theo DTOs
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Tích hợp Swagger (API Documentation) ─────────────────────
  const config = new DocumentBuilder()
    .setTitle('AI Classroom Assistant API')
    .setDescription('Tài liệu API chi tiết cho hệ thống BrainLift Hackathon (Core: AI Agent, RAG, Assessment)')
    .setVersion('1.0')
    .addBearerAuth() // Cho phép nhập JWT token trên giao diện Swagger
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Bật ValidationPipe toàn cục — class-validator sẽ validate mọi DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Loại bỏ field không có trong DTO
      forbidNonWhitelisted: true, // Ném lỗi nếu gửi field lạ
      transform: true,           // Tự động transform types
    }),
  );

  // Bật CORS cho Frontend (React dev server)
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 BrainLift Backend đang chạy tại http://localhost:${port}`);
}
bootstrap();
