/**
 * Vector Chunk Schema — MongoDB
 * Lưu trữ chunks đã embedding từ tài liệu, dùng cho RAG
 * Spec reference: AI_Classroom_Assistant_Spec.md Section 2.2
 *
 * Lý do dùng MongoDB:
 * - embedding là mảng số thực kích thước lớn (1024+ dimensions)
 * - metadata là nested object linh hoạt
 * - Write-heavy khi ingest tài liệu mới
 * - Query chủ yếu theo classId + vector similarity
 *
 * Ghi chú: Nếu cần vector search thực sự, có thể dùng MongoDB Atlas
 * Vector Search hoặc migrate sang pgvector/Qdrant sau.
 * Cho hackathon demo, lưu embeddings ở đây và search bằng cosine similarity thủ công.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** Sub-document: metadata đính kèm mỗi chunk */
class ChunkMetadata {
  @Prop() fileName: string;
  @Prop() pageNumber: number;
  @Prop({ type: [String], default: [] }) tags: string[];
}

@Schema({ collection: 'vector_chunks', timestamps: true })
export class VectorChunkModel extends Document {
  /** ID chunk — UUID */
  @Prop({ required: true, unique: true })
  vectorId: string;

  /** Tham chiếu đến document gốc (MongoDB docId) */
  @Prop({ required: true, index: true })
  docId: string;

  /** ID lớp học — dùng để filter khi RAG search */
  @Prop({ required: true, index: true })
  classId: string;

  /** Thứ tự chunk trong tài liệu */
  @Prop({ required: true })
  chunkIndex: number;

  /** Nội dung text của chunk (~500 tokens, overlap 50) */
  @Prop({ required: true })
  chunkText: string;

  /** Vector embedding — mảng số thực */
  @Prop({ type: [Number], required: true })
  embedding: number[];

  /** Metadata: tên file, số trang, tags — phục vụ trích dẫn nguồn */
  @Prop({ type: ChunkMetadata })
  metadata: ChunkMetadata;
}

export const VectorChunkSchema = SchemaFactory.createForClass(VectorChunkModel);
