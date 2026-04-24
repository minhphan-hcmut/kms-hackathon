/**
 * Document Service — Sprint 3: Knowledge Ingestion Pipeline
 * Pipeline: PDF Upload → Text Extraction → Chunking → Embedding → MongoDB
 *
 * Tuân thủ nghiêm ngặt:
 * - DocumentModel schema (docId, classId, fileName, uploadedBy, content, pageCount, tags)
 * - VectorChunkModel schema (vectorId, docId, classId, chunkIndex, chunkText, embedding, metadata)
 * - Spec: AI_Classroom_Assistant_Spec.md Section 2.1 + 2.2
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

import { DocumentModel } from './schemas/document.schema';
import { VectorChunkModel } from './schemas/vector-chunk.schema';

// ─── Hằng số chunking (Spec Section 2.2) ────────────────────
/** Kích thước mỗi chunk tính theo ký tự (~500 tokens ≈ 2000 chars tiếng Việt) */
const CHUNK_SIZE = 2000;
/** Overlap giữa các chunk để không mất ngữ cảnh ở ranh giới (Spec: 50 tokens ≈ 200 chars) */
const CHUNK_OVERLAP = 200;
/** Số chunks gửi embedding cùng lúc — tránh rate-limit API */
const EMBEDDING_BATCH_SIZE = 10;

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,

    @InjectModel(DocumentModel.name)
    private readonly documentModel: Model<DocumentModel>,

    @InjectModel(VectorChunkModel.name)
    private readonly vectorChunkModel: Model<VectorChunkModel>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY', ''),
      timeout: 60_000,   // 60s timeout cho embedding batches
      maxRetries: 2,
    });
  }

  // ════════════════════════════════════════════════════════════
  // 1. PIPELINE CHÍNH: Upload → Extract → Chunk → Embed → Save
  // ════════════════════════════════════════════════════════════

  /**
   * Ingest toàn bộ pipeline cho một file PDF
   * @param file - Buffer file PDF từ Multer
   * @param classId - ID lớp học (tham chiếu PostgreSQL)
   * @param uploadedBy - ID giáo viên upload (tham chiếu PostgreSQL)
   * @param tags - Tags phân loại tùy chọn
   * @returns DocumentModel đã lưu + số chunks đã tạo
   */
  async ingestPdf(
    file: Express.Multer.File,
    classId: string,
    uploadedBy: string,
    tags: string[] = [],
  ): Promise<{ document: DocumentModel; chunksCreated: number }> {
    this.logger.log(`Bắt đầu ingest: ${file.originalname} | Lớp: ${classId}`);

    // ── Bước 1: Trích xuất text từ PDF ───────────────────────
    const { text, pageCount } = await this.extractTextFromPdf(file.buffer);

    if (!text || text.trim().length < 50) {
      throw new BadRequestException(
        'Không trích xuất được nội dung từ PDF. File có thể là scan image — cần OCR riêng.',
      );
    }

    // ── Bước 2: Lưu document gốc vào MongoDB ────────────────
    const docId = uuidv4();
    const document = new this.documentModel({
      docId,
      classId,
      fileName: file.originalname,
      uploadedBy,
      content: text,
      pageCount,
      tags,
    });
    await document.save();
    this.logger.log(`Document lưu thành công: ${docId} | ${pageCount} trang`);

    // ── Bước 3: Chunking thông minh ──────────────────────────
    const chunks = this.chunkText(text, file.originalname, tags);
    this.logger.log(`Đã tạo ${chunks.length} chunks từ ${file.originalname}`);

    // ── Bước 4: Embedding + lưu vector chunks (batch) ────────
    const chunksCreated = await this.embedAndSaveChunks(chunks, docId, classId);

    this.logger.log(
      `✅ Ingest hoàn tất: ${file.originalname} → ${chunksCreated} vector chunks`,
    );

    return { document, chunksCreated };
  }

  // ════════════════════════════════════════════════════════════
  // 2. TEXT EXTRACTION — Trích xuất text từ PDF
  // ════════════════════════════════════════════════════════════

  /**
   * Parse PDF buffer → trả về text thuần và số trang
   * Sử dụng pdf-parse — không block event loop (đọc từ buffer)
   */
  private async extractTextFromPdf(
    buffer: Buffer,
  ): Promise<{ text: string; pageCount: number }> {
    try {
      const result = await pdfParse(buffer);
      return {
        text: result.text,
        pageCount: result.numpages,
      };
    } catch (error: any) {
      this.logger.error(`PDF parse lỗi: ${error.message}`);
      throw new BadRequestException('Không thể đọc file PDF. Vui lòng kiểm tra file.');
    }
  }

  // ════════════════════════════════════════════════════════════
  // 3. INTELLIGENT CHUNKING — Recursive Character Text Splitting
  // ════════════════════════════════════════════════════════════

  /**
   * Tách text thành chunks có overlap, ưu tiên ranh giới tự nhiên
   *
   * Chiến lược (theo Spec Section 2.2):
   * - Chunk size: ~500 tokens (≈2000 chars tiếng Việt)
   * - Overlap: 50 tokens (≈200 chars)
   * - Ưu tiên cắt theo: paragraph → sentence → word
   * - Mỗi chunk kèm metadata (fileName, estimated pageNumber, tags)
   */
  private chunkText(
    fullText: string,
    fileName: string,
    tags: string[],
  ): Array<{ text: string; chunkIndex: number; metadata: any }> {
    // Danh sách separators ưu tiên — cắt theo ranh giới tự nhiên nhất
    const separators = ['\n\n', '\n', '. ', ', ', ' '];
    const rawChunks = this.recursiveSplit(fullText, separators);

    // Ước lượng page number dựa trên vị trí trong text
    const totalLength = fullText.length;

    return rawChunks.map((text, index) => {
      // Tính vị trí tương đối trong văn bản để ước lượng trang
      const position = fullText.indexOf(text);
      const estimatedPage = Math.max(
        1,
        Math.ceil((position / totalLength) * (totalLength / 3000)), // ~3000 chars/page ước lượng
      );

      return {
        text,
        chunkIndex: index,
        metadata: {
          fileName,
          pageNumber: estimatedPage,
          tags,
        },
      };
    });
  }

  /**
   * Recursive split — tách text theo separators ưu tiên
   * Nếu đoạn vẫn quá dài → thử separator tiếp theo
   * Đảm bảo overlap giữa các chunks liền kề
   */
  private recursiveSplit(text: string, separators: string[]): string[] {
    if (text.length <= CHUNK_SIZE) return [text.trim()].filter(Boolean);

    const results: string[] = [];
    const separator = separators[0] || ' ';
    const parts = text.split(separator);

    let currentChunk = '';

    for (const part of parts) {
      const candidate = currentChunk
        ? currentChunk + separator + part
        : part;

      if (candidate.length <= CHUNK_SIZE) {
        currentChunk = candidate;
      } else {
        // Chunk hiện tại đã đủ lớn → lưu lại
        if (currentChunk.trim()) {
          results.push(currentChunk.trim());
        }
        // Overlap: giữ lại phần cuối của chunk trước
        if (currentChunk.length > CHUNK_OVERLAP) {
          const overlapText = currentChunk.slice(-CHUNK_OVERLAP);
          currentChunk = overlapText + separator + part;
        } else {
          currentChunk = part;
        }

        // Nếu part đơn lẻ vẫn quá dài → đệ quy với separator nhỏ hơn
        if (currentChunk.length > CHUNK_SIZE && separators.length > 1) {
          const subChunks = this.recursiveSplit(currentChunk, separators.slice(1));
          results.push(...subChunks.slice(0, -1));
          currentChunk = subChunks[subChunks.length - 1] || '';
        }
      }
    }

    // Chunk cuối cùng
    if (currentChunk.trim()) {
      results.push(currentChunk.trim());
    }

    return results.filter(Boolean);
  }

  // ════════════════════════════════════════════════════════════
  // 4. EMBEDDING GENERATION — Batch processing + error handling
  // ════════════════════════════════════════════════════════════

  /**
   * Tạo embeddings cho danh sách chunks và lưu vào VectorChunkModel
   * Xử lý theo batch để tránh rate-limit OpenAI API
   *
   * @returns Số chunks đã lưu thành công
   */
  private async embedAndSaveChunks(
    chunks: Array<{ text: string; chunkIndex: number; metadata: any }>,
    docId: string,
    classId: string,
  ): Promise<number> {
    const embeddingModel = this.configService.get<string>(
      'EMBEDDING_MODEL',
      'text-embedding-3-small',
    );
    let savedCount = 0;

    // Chia thành batches
    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const texts = batch.map((c) => c.text);

      try {
        // Gọi Embedding API — 1 request cho cả batch
        const response = await this.openai.embeddings.create({
          model: embeddingModel,
          input: texts,
        });

        // Tạo VectorChunk documents cho MongoDB
        const vectorDocs = batch.map((chunk, batchIdx) => ({
          vectorId: uuidv4(),
          docId,
          classId,
          chunkIndex: chunk.chunkIndex,
          chunkText: chunk.text,
          embedding: response.data[batchIdx].embedding,
          metadata: chunk.metadata,
        }));

        // Bulk insert vào MongoDB — nhanh hơn save từng document
        await this.vectorChunkModel.insertMany(vectorDocs);
        savedCount += vectorDocs.length;

        this.logger.log(
          `Batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}: ${vectorDocs.length} chunks embedded + saved`,
        );
      } catch (error: any) {
        // Rate-limit: đợi rồi retry batch này
        if (error.status === 429) {
          this.logger.warn('Rate-limit — đợi 5 giây rồi retry...');
          await this.sleep(5000);
          i -= EMBEDDING_BATCH_SIZE; // Retry batch hiện tại
          continue;
        }
        // Lỗi khác: log warning nhưng tiếp tục batch tiếp theo
        this.logger.error(
          `Embedding batch lỗi (chunk ${i}-${i + batch.length}): ${error.message}`,
        );
        // Lưu chunks không có embedding (vector rỗng) để không mất data
        const fallbackDocs = batch.map((chunk) => ({
          vectorId: uuidv4(),
          docId,
          classId,
          chunkIndex: chunk.chunkIndex,
          chunkText: chunk.text,
          embedding: [],  // Rỗng — RAG sẽ fallback sang text search
          metadata: chunk.metadata,
        }));
        await this.vectorChunkModel.insertMany(fallbackDocs);
        savedCount += fallbackDocs.length;
      }
    }

    return savedCount;
  }

  /** Utility: sleep không block event loop */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ════════════════════════════════════════════════════════════
  // 5. QUERY METHODS — dùng bởi Controller
  // ════════════════════════════════════════════════════════════

  /** Lấy danh sách tài liệu theo lớp */
  async getDocumentsByClass(classId: string): Promise<DocumentModel[]> {
    return this.documentModel.find({ classId }).select('-content').exec();
  }

  /** Xoá tài liệu + vector chunks liên quan */
  async deleteDocument(docId: string): Promise<void> {
    await this.vectorChunkModel.deleteMany({ docId }).exec();
    await this.documentModel.deleteOne({ docId }).exec();
    this.logger.log(`Đã xoá document ${docId} + vector chunks`);
  }
}
