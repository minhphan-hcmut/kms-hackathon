/**
 * AI Service — Sprint 2: Core Agent Execution Logic
 * Implement: LLM Provider + 3-Layer Memory Engine + Chat Pipeline
 * Spec: AI_Classroom_Assistant_Spec.md Section 2.3 + 4
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

import { DocumentModel } from './schemas/document.schema';
import { VectorChunkModel } from './schemas/vector-chunk.schema';
import { ChatSessionModel } from './schemas/chat-session.schema';
import { SessionReportModel } from './schemas/session-report.schema';

// ─── Hằng số cấu hình Agent ────────────────────────────────
/** Số tin nhắn gần nhất giữ trong short-term memory (Spec: 5-10) */
const SHORT_TERM_LIMIT = 10;
/** Số chunks RAG trả về (Spec: top_k default 5) */
const RAG_TOP_K = 5;
/** Ngưỡng similarity tối thiểu — dưới mức này Agent sẽ báo ngoài tài liệu */
const RAG_SIMILARITY_THRESHOLD = 0.3;
/** Mỗi bao nhiêu lượt thì cập nhật rolling summary (Spec: mỗi 10 lượt) */
const ROLLING_SUMMARY_INTERVAL = 10;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,

    @InjectModel(DocumentModel.name)
    private readonly documentModel: Model<DocumentModel>,

    @InjectModel(VectorChunkModel.name)
    private readonly vectorChunkModel: Model<VectorChunkModel>,

    @InjectModel(ChatSessionModel.name)
    private readonly chatSessionModel: Model<ChatSessionModel>,

    @InjectModel(SessionReportModel.name)
    private readonly sessionReportModel: Model<SessionReportModel>,
  ) {
    // ─── Khởi tạo OpenAI client với timeout và retry ─────────
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY', ''),
      timeout: 30_000,  // 30 giây timeout
      maxRetries: 2,    // Retry tối đa 2 lần khi rate-limit
    });
  }

  // ════════════════════════════════════════════════════════════
  // 1. LLM PROVIDER — gọi LLM với error handling
  // ════════════════════════════════════════════════════════════

  /**
   * Gọi LLM — wrapper xử lý timeout, rate-limit, lỗi mạng
   * Trả về nội dung text hoặc fallback message khi lỗi
   */
  private async callLLM(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    try {
      const model = this.configService.get<string>('LLM_MODEL', 'gpt-4o-mini');
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      return response.choices[0]?.message?.content ?? 'Xin lỗi, mình không thể trả lời lúc này.';
    } catch (error: any) {
      this.logger.error(`LLM call thất bại: ${error.message}`);

      // Xử lý rate-limit (HTTP 429)
      if (error.status === 429) {
        return 'Hệ thống đang quá tải, em thử lại sau vài giây nhé!';
      }
      // Xử lý timeout
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        return 'Kết nối AI bị timeout. Em thử gửi lại tin nhắn nhé!';
      }
      // Fallback chung
      return 'Xin lỗi, mình gặp lỗi kỹ thuật. Em thử lại sau nhé!';
    }
  }

  /**
   * Gọi Embedding API — tạo vector từ text
   * Dùng để tính similarity khi RAG search
   */
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.configService.get<string>(
        'EMBEDDING_MODEL',
        'text-embedding-3-small',
      );
      const response = await this.openai.embeddings.create({
        model: embeddingModel,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error: any) {
      this.logger.error(`Embedding thất bại: ${error.message}`);
      return []; // Trả mảng rỗng — RAG sẽ fallback sang text search
    }
  }

  // ════════════════════════════════════════════════════════════
  // 2. 3-LAYER MEMORY ENGINE (Spec Section 2.3)
  // ════════════════════════════════════════════════════════════

  /**
   * Layer 1: Short-term Memory
   * Lấy N tin nhắn gần nhất từ conversation (raw messages)
   * Spec: "5-10 tin nhắn gần nhất, cập nhật mỗi lượt chat"
   */
  private getShortTermMemory(
    session: ChatSessionModel,
  ): string {
    const recent = session.conversation.slice(-SHORT_TERM_LIMIT);
    if (recent.length === 0) return '(Chưa có lịch sử hội thoại)';

    return recent
      .map((msg) => {
        const label = msg.role === 'student' ? 'Học sinh' : 'Trợ giảng AI';
        return `${label}: ${msg.content}`;
      })
      .join('\n');
  }

  /**
   * Layer 2: Session Summary (Rolling)
   * Lấy tóm tắt tích lũy từ session memory
   * Spec: "Tóm tắt rolling các chủ đề, quiz, điểm yếu"
   */
  private getSessionSummary(session: ChatSessionModel): string {
    const mem = session.memory;
    const parts: string[] = [];

    if (mem?.topicsCovered?.length > 0) {
      parts.push(`Chủ đề đã học: ${mem.topicsCovered.join(', ')}`);
    }
    if (mem?.quizHistory?.length > 0) {
      const quizStr = mem.quizHistory
        .map(
          (q) =>
            `[${q.topic}] "${q.question}" → HS trả lời: "${q.studentAnswer}" → ${q.isCorrect ? '✓ Đúng' : '✗ Sai'}`,
        )
        .join('\n');
      parts.push(`Quiz đã hỏi:\n${quizStr}`);
    }
    if (mem?.weakPoints?.length > 0) {
      parts.push(`Điểm yếu ghi nhận: ${mem.weakPoints.join('; ')}`);
    }
    if (mem?.strongPoints?.length > 0) {
      parts.push(`Điểm mạnh: ${mem.strongPoints.join('; ')}`);
    }
    if (mem?.rollingSummary) {
      parts.push(`Tóm tắt phiên: ${mem.rollingSummary}`);
    }

    return parts.length > 0 ? parts.join('\n') : '(Phiên học mới bắt đầu)';
  }

  /**
   * Layer 3: RAG / Knowledge Retrieval
   * Tìm chunks có nội dung liên quan đến câu hỏi của HS
   * Sử dụng cosine similarity giữa embedding câu hỏi và embedding chunks
   *
   * Fallback: nếu embedding thất bại → dùng text search ($regex)
   */
  public async retrieveRAGContext(
    classId: string,
    query: string,
  ): Promise<string> {
    // Thử vector search trước
    const queryEmbedding = await this.getEmbedding(query);

    if (queryEmbedding.length > 0) {
      // Lấy tất cả chunks của lớp rồi tính cosine similarity thủ công
      // (Hackathon approach — production nên dùng pgvector hoặc Qdrant)
      const allChunks = await this.vectorChunkModel
        .find({ classId })
        .select('chunkText embedding metadata')
        .lean()
        .exec();

      if (allChunks.length === 0) return '(Chưa có tài liệu nào được upload cho lớp này)';

      // Tính cosine similarity cho từng chunk
      const scored = allChunks
        .map((chunk) => ({
          text: chunk.chunkText,
          metadata: chunk.metadata,
          score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
        }))
        .filter((c) => c.score >= RAG_SIMILARITY_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, RAG_TOP_K);

      if (scored.length === 0) {
        return '(Không tìm thấy đoạn tài liệu liên quan. Câu hỏi có thể nằm ngoài nội dung tài liệu.)';
      }

      return scored
        .map(
          (c, i) =>
            `[Nguồn ${i + 1} — ${c.metadata?.fileName ?? 'N/A'}, trang ${c.metadata?.pageNumber ?? '?'}]\n${c.text}`,
        )
        .join('\n\n');
    }

    // Fallback: text search nếu embedding thất bại
    const textResults = await this.vectorChunkModel
      .find({ classId, chunkText: { $regex: query.slice(0, 50), $options: 'i' } })
      .limit(RAG_TOP_K)
      .lean()
      .exec();

    if (textResults.length === 0) return '(Không tìm thấy tài liệu liên quan)';

    return textResults
      .map((c, i) => `[Nguồn ${i + 1}]\n${c.chunkText}`)
      .join('\n\n');
  }

  /** Tính cosine similarity giữa hai vectors */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * buildContextPrompt — orchestrate 3 layers thành context window hoàn chỉnh
   * Output: chuỗi context đúng format trong spec Section 2.3
   * Giữ dưới ~8K tokens theo yêu cầu spec Section 7
   */
  private async buildContextPrompt(
    session: ChatSessionModel,
    studentMessage: string,
  ): Promise<string> {
    // Layer 3: RAG — tìm kiến thức liên quan
    const ragContext = await this.retrieveRAGContext(
      session.classId,
      studentMessage,
    );

    // Layer 2: Session summary — tóm tắt tích lũy
    const sessionSummary = this.getSessionSummary(session);

    // Layer 1: Short-term — tin nhắn gần nhất
    const shortTerm = this.getShortTermMemory(session);

    // Ghép theo đúng format Context Prompt trong spec
    return `=== BỐI CẢNH TÀI LIỆU (RAG) ===
${ragContext}

=== LỊCH SỬ HỘI THOẠI GẦN ĐÂY ===
${shortTerm}

=== MEMORY PHIÊN HỌC ===
${sessionSummary}

=== TIN NHẮN MỚI NHẤT CỦA HỌC SINH ===
${studentMessage}`;
  }

  /**
   * buildSystemPrompt — tạo system prompt theo đúng spec Section 2.3
   */
  private buildSystemPrompt(session: ChatSessionModel): string {
    const docList =
      session.documentIds.length > 0
        ? session.documentIds.join(', ')
        : '(Chưa có tài liệu)';

    return `Bạn là AI trợ giảng của lớp học. Nhiệm vụ của bạn là:
1. Giảng giải tài liệu học phần cho học sinh một cách rõ ràng, ngắn gọn, dễ hiểu.
2. Trả lời câu hỏi của học sinh dựa trên tài liệu được cung cấp (không bịa thêm thông tin ngoài tài liệu).
3. Chủ động tạo quiz trắc nghiệm hoặc câu hỏi tự luận ngắn để kiểm tra mức độ hiểu bài của học sinh.
4. Ghi nhớ những gì học sinh đã học, những gì họ còn nhầm lẫn, và điều chỉnh cách giảng phù hợp.
5. Khuyến khích học sinh, không chê bai khi học sinh trả lời sai.

Nguyên tắc:
- CHỈ dựa vào tài liệu đã được cung cấp. Nếu câu hỏi nằm ngoài tài liệu, hãy nói rõ.
- Khi tạo quiz, luôn kèm đáp án đúng ẩn để kiểm tra sau.
- Dùng tiếng Việt trừ khi học sinh hỏi bằng tiếng Anh.
- Tóm tắt ngắn gọn sau mỗi chủ đề đã giảng xong.

Thông tin phiên học hiện tại:
- Class ID: ${session.classId}
- Student ID: ${session.studentId}
- Session ID: ${session.sessionId}
- Tài liệu trong buổi học: ${docList}`;
  }

  // ════════════════════════════════════════════════════════════
  // 3. AGENT ORCHESTRATION — Chat Pipeline
  // ════════════════════════════════════════════════════════════

  /**
   * startSession — POST /api/session/start
   * Tạo phiên học mới trong MongoDB, gắn danh sách tài liệu của lớp
   */
  async startSession(
    studentId: string,
    classId: string,
  ): Promise<ChatSessionModel> {
    // Lấy danh sách tài liệu đã upload cho lớp này
    const docs = await this.documentModel
      .find({ classId })
      .select('docId')
      .lean()
      .exec();
    const documentIds = docs.map((d) => d.docId);

    const session = new this.chatSessionModel({
      sessionId: uuidv4(),
      studentId,
      classId,
      status: 'active',
      documentIds,
      conversation: [],
      memory: {
        topicsCovered: [],
        quizHistory: [],
        weakPoints: [],
        strongPoints: [],
        conversationTurns: 0,
        rollingSummary: '',
      },
      durationMinutes: null,
    });

    await session.save();
    this.logger.log(`Phiên học mới: ${session.sessionId} | HS: ${studentId} | Lớp: ${classId}`);
    return session;
  }

  /**
   * chat — POST /api/session/chat
   * Pipeline chính: message → RAG → context → LLM → persist → response
   */
  async chat(
    sessionId: string,
    studentMessage: string,
  ): Promise<{ reply: string; sessionId: string }> {
    // ── Bước 1: Tìm và validate session ─────────────────────
    const session = await this.chatSessionModel
      .findOne({ sessionId })
      .exec();
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên học');
    }
    if (session.status !== 'active') {
      throw new BadRequestException('Phiên học đã kết thúc');
    }

    // ── Bước 2: Lưu tin nhắn học sinh vào conversation ──────
    session.conversation.push({
      role: 'student',
      content: studentMessage,
      timestamp: new Date(),
    } as any);

    // ── Bước 3: Build context window (3-layer memory engine) ─
    const systemPrompt = this.buildSystemPrompt(session);
    const contextPrompt = await this.buildContextPrompt(session, studentMessage);

    // ── Bước 4: Gọi LLM ─────────────────────────────────────
    const aiReply = await this.callLLM(systemPrompt, contextPrompt);

    // ── Bước 5: Lưu phản hồi AI vào conversation ────────────
    session.conversation.push({
      role: 'agent',
      content: aiReply,
      timestamp: new Date(),
    } as any);

    // ── Bước 6: Cập nhật memory counters ─────────────────────
    session.memory.conversationTurns += 1;

    // ── Bước 7: Rolling summary — cập nhật mỗi 10 lượt ──────
    if (session.memory.conversationTurns % ROLLING_SUMMARY_INTERVAL === 0) {
      await this.updateRollingSummary(session);
    }

    // ── Bước 8: Persist toàn bộ thay đổi vào MongoDB ────────
    await session.save();

    this.logger.log(
      `Chat [${sessionId}] turn ${session.memory.conversationTurns}: ${studentMessage.slice(0, 50)}...`,
    );

    return { reply: aiReply, sessionId };
  }

  /**
   * updateRollingSummary — gọi LLM để tóm tắt cuộc hội thoại hiện tại
   * Spec: "cập nhật mỗi 10 lượt hoặc khi đổi chủ đề"
   * Rolling summary không vượt quá 300 tokens (Spec Section 7)
   */
  private async updateRollingSummary(session: ChatSessionModel): Promise<void> {
    const recentMessages = session.conversation
      .slice(-20)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const summaryPrompt = `Tóm tắt cuộc hội thoại sau thành MỘT đoạn văn ngắn (tối đa 300 tokens).
Ghi rõ: chủ đề đã thảo luận, câu hỏi quiz nếu có, điểm mạnh/yếu của học sinh.

Hội thoại:
${recentMessages}`;

    const summary = await this.callLLM(
      'Bạn là hệ thống tóm tắt hội thoại. Trả lời bằng tiếng Việt, ngắn gọn.',
      summaryPrompt,
    );

    session.memory.rollingSummary = summary;
    this.logger.log(`Rolling summary cập nhật cho session ${session.sessionId}`);
  }

  // ════════════════════════════════════════════════════════════
  // SESSION END + REPORT (Skeleton — deferred detail to Sprint 3)
  // ════════════════════════════════════════════════════════════

  /**
   * endSession — POST /api/session/end
   * Kết thúc phiên, tính duration, tạo report qua Summary LLM
   */
  async endSession(sessionId: string): Promise<SessionReportModel> {
    const session = await this.chatSessionModel.findOne({ sessionId }).exec();
    if (!session) throw new NotFoundException('Không tìm thấy phiên học');
    if (session.status !== 'active') {
      throw new BadRequestException('Phiên học đã kết thúc trước đó');
    }

    // Tính thời lượng phiên (phút)
    const startTime = (session as any).createdAt as Date;
    const durationMs = Date.now() - startTime.getTime();
    session.durationMinutes = Math.round(durationMs / 60000);
    session.status = 'completed';
    await session.save();

    // Gọi Summary LLM để tạo báo cáo
    const report = await this.generateSessionReport(session);
    return report;
  }

  /**
   * generateSessionReport — gọi Summary LLM, parse JSON, lưu MongoDB
   * Spec: AI_Classroom_Assistant_Spec.md Section 2.5
   */
  private async generateSessionReport(
    session: ChatSessionModel,
  ): Promise<SessionReportModel> {
    const mem = session.memory;

    const inputPrompt = `Dữ liệu buổi học:
- Học sinh: ${session.studentId} | Lớp: ${session.classId}
- Thời lượng: ${session.durationMinutes} phút | Số lượt hỏi đáp: ${mem.conversationTurns}
- Tài liệu đã học: ${session.documentIds.join(', ') || 'N/A'}

Lịch sử quiz:
${JSON.stringify(mem.quizHistory, null, 2)}

Memory tích lũy:
- Chủ đề đã cover: ${mem.topicsCovered.join(', ') || 'N/A'}
- Điểm yếu: ${mem.weakPoints.join(', ') || 'N/A'}
- Điểm mạnh: ${mem.strongPoints.join(', ') || 'N/A'}

Tóm tắt hội thoại rolling:
${mem.rollingSummary || '(Không có)'}

Hãy tạo báo cáo theo đúng JSON schema đã định nghĩa.`;

    const systemPrompt = `Bạn là hệ thống phân tích học tập. Tạo báo cáo NGẮN GỌN, CÓ CẤU TRÚC.
Yêu cầu bắt buộc:
- Báo cáo KHÔNG ĐƯỢC vượt quá 600 tokens.
- Phải có đủ 6 mục: topics_learned, quiz_results, weak_points, strong_points, learning_trend, recommendation.
- Đánh giá KHÁCH QUAN dựa trên dữ liệu.
- Dùng tiếng Việt.
- Trả về DUY NHẤT một JSON object với key "summary" chứa 6 mục trên.`;

    const rawResponse = await this.callLLM(systemPrompt, inputPrompt);

    // Parse JSON — có retry nếu lỗi (Spec Section 7: Graceful Fallback)
    let summaryData: any;
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      summaryData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      this.logger.warn('Summary LLM trả về JSON lỗi, dùng fallback');
      summaryData = null;
    }

    const summary = summaryData?.summary ?? {
      topicsLearned: mem.topicsCovered,
      quizResults: {
        total: mem.quizHistory.length,
        correct: mem.quizHistory.filter((q) => q.isCorrect).length,
        incorrect: mem.quizHistory.filter((q) => !q.isCorrect).length,
        scorePercent: mem.quizHistory.length > 0
          ? Math.round((mem.quizHistory.filter((q) => q.isCorrect).length / mem.quizHistory.length) * 100)
          : 0,
        details: [],
      },
      weakPoints: mem.weakPoints,
      strongPoints: mem.strongPoints,
      learningTrend: mem.rollingSummary || 'Chưa đủ dữ liệu để đánh giá.',
      recommendation: 'Cần thêm dữ liệu phiên học để đưa ra đề xuất chính xác.',
    };

    const report = new this.sessionReportModel({
      reportId: uuidv4(),
      sessionId: session.sessionId,
      studentId: session.studentId,
      classId: session.classId,
      durationMinutes: session.durationMinutes,
      turnCount: mem.conversationTurns,
      documentsCovered: session.documentIds,
      summary,
      metadata: {
        agentModel: this.configService.get('LLM_MODEL', 'gpt-4o-mini'),
        summaryModel: this.configService.get('LLM_MODEL', 'gpt-4o-mini'),
        embeddingModel: this.configService.get('EMBEDDING_MODEL', 'text-embedding-3-small'),
        sessionLanguage: 'vi',
      },
    });

    await report.save();
    this.logger.log(`Báo cáo tạo thành công: ${report.reportId}`);
    return report;
  }

  // ════════════════════════════════════════════════════════════
  // DOCUMENT & REPORT QUERIES (giữ nguyên từ Sprint 1)
  // ════════════════════════════════════════════════════════════

  async ingestDocument(
    classId: string, uploadedBy: string, fileName: string,
    content: string, pageCount: number, tags: string[],
  ): Promise<DocumentModel> {
    // TODO Sprint 3: OCR pipeline + chunking + embedding
    throw new Error('Chưa implement — Sprint 3');
  }

  async getDocumentsByClass(classId: string): Promise<DocumentModel[]> {
    return this.documentModel.find({ classId }).exec();
  }

  async getReportsByClass(classId: string): Promise<SessionReportModel[]> {
    return this.sessionReportModel.find({ classId }).sort({ createdAt: -1 }).exec();
  }

  async getReportById(reportId: string): Promise<SessionReportModel> {
    const report = await this.sessionReportModel.findOne({ reportId }).exec();
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
    return report;
  }
}
