/**
 * Assessment Service — Sprint 4: Proactive AI Capabilities
 * Xử lý: Tạo quiz từ RAG (Vector DB) & tự động chấm điểm bài làm của học sinh
 * Lưu kết quả vào PostgreSQL (QuizEntity, StudentGradeEntity)
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';

import { QuizEntity } from './entities/quiz.entity';
import { StudentGradeEntity } from './entities/student-grade.entity';
import { AiService } from '../ai/ai.service';
import { ClassroomEntity } from '../classroom/entities/classroom.entity';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiService: AiService,

    @InjectRepository(QuizEntity)
    private readonly quizRepository: Repository<QuizEntity>,

    @InjectRepository(StudentGradeEntity)
    private readonly gradeRepository: Repository<StudentGradeEntity>,

    @InjectRepository(ClassroomEntity)
    private readonly classroomRepository: Repository<ClassroomEntity>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY', ''),
      timeout: 45_000,
      maxRetries: 2,
    });
  }

  // ════════════════════════════════════════════════════════════
  // 1. GENERATE QUIZ TỪ RAG
  // ════════════════════════════════════════════════════════════

  /**
   * Sinh ra bộ câu hỏi trắc nghiệm dựa trên ngữ cảnh lớp học
   */
  async generateQuiz(
    classId: string,
    topic: string,
    difficulty: string,
    numberOfQuestions: number,
  ): Promise<QuizEntity> {
    // 1. Kiểm tra lớp học
    const classroom = await this.classroomRepository.findOne({ where: { id: classId } });
    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    // 2. Kéo ngữ cảnh từ RAG (dùng AiService)
    const ragContext = await this.aiService.retrieveRAGContext(classId, topic);

    // 3. Prompt yêu cầu output chuẩn JSON object
    const systemPrompt = `Bạn là một giáo viên chuyên môn cao. Dựa trên tài liệu được cung cấp, hãy tạo một bộ câu hỏi trắc nghiệm.
Yêu cầu bắt buộc:
- Bám sát tài liệu, không tự bịa kiến thức.
- Tạo đúng ${numberOfQuestions} câu hỏi.
- Độ khó: ${difficulty}.
- TRẢ VỀ DUY NHẤT MỘT OBJECT JSON ĐÚNG ĐỊNH DẠNG THEO SCHEMA SAU, KHÔNG CÓ TEXT BAO QUANH:
{
  "questions": [
    {
      "question": "Nội dung câu hỏi",
      "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
      "correctAnswerIndex": 0,
      "explanation": "Giải thích vì sao đúng"
    }
  ]
}`;

    const userPrompt = `Tài liệu lớp học:
${ragContext}

Chủ đề cần kiểm tra: ${topic}
Số lượng câu hỏi: ${numberOfQuestions}
Độ khó: ${difficulty}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('LLM_MODEL', 'gpt-4o-mini'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }, // Ép GPT trả JSON object chuẩn
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      // 4. Parse JSON với chiến lược phòng ngừa lỗi markdown tags
      const sanitizedContent = this.sanitizeJsonOutput(content);
      const quizData = JSON.parse(sanitizedContent);

      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error('LLM trả về JSON không đúng format câu hỏi');
      }

      // 5. Lưu vào PostgreSQL
      const quiz = this.quizRepository.create({
        classId,
        topic,
        difficulty,
        questions: quizData.questions,
      });

      const savedQuiz = await this.quizRepository.save(quiz);
      this.logger.log(`Tạo quiz thành công (ID: ${savedQuiz.id}) cho lớp ${classId}`);
      return savedQuiz;

    } catch (error: any) {
      this.logger.error(`Lỗi generateQuiz: ${error.message}`);
      throw new BadRequestException('Không thể tạo quiz lúc này, vui lòng thử lại.');
    }
  }

  // ════════════════════════════════════════════════════════════
  // 2. AUTO-EVALUATE STUDENT ANSWER
  // ════════════════════════════════════════════════════════════

  /**
   * Chấm điểm tự luận/câu trả lời của học sinh và cho feedback
   */
  async evaluateAnswer(
    studentId: string,
    classId: string,
    quizId: string | null,
    questionText: string,
    studentAnswer: string,
  ): Promise<StudentGradeEntity> {
    // 1. Kéo context để đảm bảo chấm sát tài liệu
    const ragContext = await this.aiService.retrieveRAGContext(classId, questionText);

    // 2. Prompt yêu cầu output JSON chứa điểm và feedback
    const systemPrompt = `Bạn là một AI trợ giảng chấm bài. Hãy đánh giá câu trả lời của học sinh.
Yêu cầu:
- Khích lệ học sinh, chỉ ra chỗ sai một cách mang tính xây dựng.
- Điểm số thang 100.
- Dựa trên nội dung tài liệu sau nếu có:
${ragContext}

TRẢ VỀ DUY NHẤT MỘT JSON ĐÚNG SCHEMA, KHÔNG BỌC TRONG MARKDOWN:
{
  "score": 85,
  "feedback": "Phản hồi chi tiết và mang tính xây dựng..."
}`;

    const userPrompt = `Câu hỏi: ${questionText}
Câu trả lời của học sinh: ${studentAnswer}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('LLM_MODEL', 'gpt-4o-mini'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const sanitizedContent = this.sanitizeJsonOutput(content);
      const evalData = JSON.parse(sanitizedContent);

      if (typeof evalData.score !== 'number' || !evalData.feedback) {
        throw new Error('LLM trả về JSON thiếu field score/feedback');
      }

      // 3. Lưu kết quả chấm điểm vào PostgreSQL
      const grade = this.gradeRepository.create({
        studentId,
        classId,
        quizId,
        questionText,
        studentAnswer,
        score: evalData.score,
        feedback: evalData.feedback,
      });

      const savedGrade = await this.gradeRepository.save(grade);
      this.logger.log(`Chấm bài thành công cho HS ${studentId} (Score: ${savedGrade.score})`);
      return savedGrade;

    } catch (error: any) {
      this.logger.error(`Lỗi evaluateAnswer: ${error.message}`);
      throw new BadRequestException('Lỗi trong quá trình chấm điểm. Vui lòng thử lại.');
    }
  }

  // ════════════════════════════════════════════════════════════
  // UTILS
  // ════════════════════════════════════════════════════════════

  /**
   * Helper function cắt bỏ các tag \`\`\`json và \`\`\` thừa thãi thường sinh ra bởi LLM
   */
  private sanitizeJsonOutput(rawStr: string): string {
    let cleanStr = rawStr.trim();
    if (cleanStr.startsWith('\`\`\`json')) {
      cleanStr = cleanStr.substring(7);
    } else if (cleanStr.startsWith('\`\`\`')) {
      cleanStr = cleanStr.substring(3);
    }
    
    if (cleanStr.endsWith('\`\`\`')) {
      cleanStr = cleanStr.substring(0, cleanStr.length - 3);
    }
    
    return cleanStr.trim();
  }
}
