# 📚 AI Classroom Assistant — Tài Liệu Đặc Tả Dự Án

> **Phiên bản:** 1.0 — Demo Single Classroom  
> **Mục tiêu:** Hệ thống AI hỗ trợ học sinh học tập trong lớp, đồng thời tự động tổng hợp báo cáo giúp giáo viên nắm bắt tình hình học tập.

---

## 1. Tổng Quan Kiến Trúc

```
[Teacher uploads PDF]
        │
        ▼
[OCR Module] ──────────────────────────► [Raw Document DB (JSON)]
        │                                         │
        │                                         ▼
        │                               [Embedding Module]
        │                                         │
        │                                         ▼
        │                               [Vector Database (RAG)]
        │                                         │
        ▼                                         ▼
[Session Start] ◄──────────────── [Agent (RAG + Memory + Tools)]
        │                                         │
        │                                         ▼
        │                                   [Student Chat]
        │                                         │
        ▼                                         │
[End Session Button] ◄────────────────────────────┘
        │
        ▼
[Summary LLM] ──► [Session Report DB (JSON, no embedding)]
        │
        ▼
[Teacher Dashboard — View Reports]
```

---

## 2. Các Thành Phần Hệ Thống

### 2.1 OCR & Document Ingestion

**Mô tả:** Giáo viên upload file PDF. Hệ thống dùng OCR để trích xuất nội dung, lưu vào database dưới dạng JSON.

**Schema JSON lưu document:**
```json
{
  "doc_id": "uuid-v4",
  "class_id": "class_001",
  "file_name": "chuong_1_co_so_toan.pdf",
  "uploaded_by": "teacher_id",
  "uploaded_at": "2025-04-24T10:00:00Z",
  "content": "Toàn bộ nội dung text được trích xuất từ PDF...",
  "page_count": 15,
  "tags": ["chương 1", "cơ sở toán", "xác suất"]
}
```

**Gợi ý thư viện:**
- OCR: `pytesseract` + `pdf2image`, hoặc dùng LLM Vision (GPT-4o, Claude) để OCR chính xác hơn
- Lưu trữ: MongoDB hoặc PostgreSQL với cột JSONB

**Flow:**
1. Teacher upload PDF qua giao diện
2. Hệ thống convert PDF → image từng trang
3. OCR trích xuất text từng trang, ghép lại thành `content`
4. Lưu JSON vào Document DB
5. Gọi Embedding Module để vector hóa và lưu vào Vector DB

---

### 2.2 Vector Database (RAG)

**Mô tả:** Toàn bộ nội dung tài liệu được embedding và lưu vào vector database để Agent truy xuất theo ngữ nghĩa.

**Schema vector record:**
```json
{
  "vector_id": "uuid",
  "doc_id": "uuid-v4",
  "class_id": "class_001",
  "chunk_index": 3,
  "chunk_text": "Đoạn văn bản chunk...",
  "embedding": [0.123, -0.456, ...],
  "metadata": {
    "file_name": "chuong_1_co_so_toan.pdf",
    "page_number": 4,
    "tags": ["xác suất"]
  }
}
```

**Chiến lược chunking:**
- Chunk size: ~500 tokens, overlap 50 tokens
- Ưu tiên chunk theo đoạn văn/heading tự nhiên nếu có thể parse được
- Mỗi chunk lưu kèm `metadata` để LLM có thể trích dẫn nguồn khi trả lời

**Gợi ý:**
- Vector DB: `Qdrant`, `Weaviate`, hoặc `pgvector` (PostgreSQL extension)
- Embedding model: `text-embedding-3-small` (OpenAI) hoặc `bge-m3` (multilingual, phù hợp tiếng Việt)

---

### 2.3 Agent (Core)

**Mô tả:** Agent là trung tâm của hệ thống. Agent tương tác với học sinh, sử dụng RAG để truy xuất kiến thức, quản lý memory, và gọi tools để tạo quiz, kiểm tra đáp án, v.v.

#### System Prompt — Agent

```
Bạn là AI trợ giảng của lớp học [CLASS_NAME]. Nhiệm vụ của bạn là:
1. Giảng giải tài liệu học phần cho học sinh một cách rõ ràng, ngắn gọn, dễ hiểu.
2. Trả lời câu hỏi của học sinh dựa trên tài liệu được cung cấp (không bịa thêm thông tin ngoài tài liệu).
3. Chủ động tạo quiz trắc nghiệm hoặc câu hỏi tự luận ngắn để kiểm tra mức độ hiểu bài của học sinh.
4. Ghi nhớ những gì học sinh đã học, những gì họ còn nhầm lẫn, và điều chỉnh cách giảng phù hợp.
5. Khuyến khích học sinh, không chê bai khi học sinh trả lời sai.

Nguyên tắc:
- CHỈ dựa vào tài liệu đã được cung cấp. Nếu câu hỏi nằm ngoài tài liệu, hãy nói rõ.
- Khi tạo quiz, luôn ghi lại đáp án đúng và lý do vào memory.
- Dùng tiếng Việt trừ khi học sinh hỏi bằng tiếng Anh.
- Tóm tắt ngắn gọn sau mỗi chủ đề đã giảng xong.

Thông tin phiên học hiện tại:
- Class ID: {class_id}
- Student ID: {student_id}  
- Session ID: {session_id}
- Tài liệu trong buổi học: {document_list}
```

#### Context Prompt (kèm mỗi lượt hỏi)

```
=== BỐI CẢNH TÀI LIỆU (RAG) ===
{retrieved_chunks}

=== LỊCH SỬ HỘI THOẠI (tóm tắt) ===
{conversation_summary}

=== MEMORY PHIÊN HỌC ===
Chủ đề đã học: {topics_covered}
Quiz đã hỏi: {quiz_history}   [câu hỏi | đáp án đúng | học sinh trả lời | kết quả]
Điểm yếu ghi nhận: {weak_points}

=== TIN NHẮN MỚI NHẤT CỦA HỌC SINH ===
{student_message}
```

#### Memory Management

**Không lưu toàn bộ lịch sử chat vào context** (tốn token và gây nhiễu). Thay vào đó dùng chiến lược 3 lớp:

| Lớp | Nội dung | Cập nhật khi nào |
|-----|----------|-----------------|
| **Short-term** | 5–10 tin nhắn gần nhất (raw) | Mỗi lượt chat |
| **Session Summary** | Tóm tắt rolling các chủ đề, quiz, điểm yếu | Mỗi 10 lượt hoặc khi đổi chủ đề |
| **Long-term (Report)** | Báo cáo cuối buổi học | Khi nhấn "Kết thúc buổi học" |

**Schema memory trong session (lưu in-memory hoặc Redis):**
```json
{
  "session_id": "sess_001",
  "student_id": "stu_001",
  "class_id": "class_001",
  "topics_covered": ["Định nghĩa xác suất", "Biến cố độc lập"],
  "quiz_history": [
    {
      "question": "P(A∪B) = ?",
      "correct_answer": "P(A) + P(B) - P(A∩B)",
      "student_answer": "P(A) + P(B)",
      "is_correct": false,
      "topic": "Công thức xác suất"
    }
  ],
  "weak_points": ["Quên trừ P(A∩B) trong công thức cộng xác suất"],
  "strong_points": ["Hiểu tốt định nghĩa biến cố"],
  "conversation_turns": 24,
  "rolling_summary": "Học sinh đã học qua định nghĩa xác suất cổ điển và đang gặp khó khăn với công thức xác suất hợp..."
}
```

#### Tools của Agent

```python
tools = [
    {
        "name": "search_knowledge_base",
        "description": "Tìm kiếm trong tài liệu học phần bằng RAG. Dùng khi cần trả lời câu hỏi hoặc giảng bài.",
        "parameters": {"query": "string", "top_k": "int (default 5)"}
    },
    {
        "name": "create_quiz",
        "description": "Tạo 1 câu quiz trắc nghiệm (4 đáp án) về chủ đề vừa học.",
        "parameters": {"topic": "string", "difficulty": "easy|medium|hard"}
    },
    {
        "name": "check_answer",
        "description": "Kiểm tra đáp án của học sinh và lưu kết quả vào memory.",
        "parameters": {"quiz_id": "string", "student_answer": "string"}
    },
    {
        "name": "update_memory",
        "description": "Cập nhật weak_points, strong_points, hoặc rolling_summary.",
        "parameters": {"type": "weak|strong|summary", "content": "string"}
    },
    {
        "name": "get_session_memory",
        "description": "Lấy toàn bộ memory phiên học hiện tại.",
        "parameters": {}
    }
]
```

---

### 2.4 Student Interface

**Mô tả:** Giao diện chat đơn giản cho học sinh. Demo dùng 1 lớp, 1 học sinh.

**Các thành phần UI:**
- Khung chat (tin nhắn học sinh + phản hồi Agent)
- Nút **"Kết thúc buổi học"** (nổi bật, màu đỏ)
- Hiển thị tên tài liệu đang học
- (Tùy chọn) Hiển thị điểm quiz real-time

---

### 2.5 Session Summary — Báo Cáo Cuối Buổi

Khi học sinh/giáo viên nhấn **"Kết thúc buổi học"**, hệ thống gọi một LLM riêng để tạo báo cáo.

#### System Prompt — Summary LLM

```
Bạn là hệ thống phân tích học tập. Nhiệm vụ của bạn là tạo báo cáo NGẮN GỌN, CÓ CẤU TRÚC
về một buổi học dựa trên dữ liệu được cung cấp.

Yêu cầu bắt buộc:
- Báo cáo KHÔNG ĐƯỢC vượt quá 600 tokens.
- Phải có đủ 6 mục theo cấu trúc JSON dưới đây.
- Đánh giá phải KHÁCH QUAN dựa trên dữ liệu, không suy đoán.
- Dùng tiếng Việt.

Trả về DUY NHẤT một JSON object, không có text bên ngoài JSON.
```

#### Input Prompt cho Summary LLM

```
Dữ liệu buổi học:
- Học sinh: {student_id} | Lớp: {class_id} | Ngày: {date}
- Thời lượng: {duration_minutes} phút | Số lượt hỏi đáp: {turn_count}
- Tài liệu đã học: {documents_covered}

Lịch sử quiz:
{quiz_history_json}

Memory tích lũy:
- Chủ đề đã cover: {topics_covered}
- Điểm yếu: {weak_points}
- Điểm mạnh: {strong_points}

Tóm tắt hội thoại rolling:
{rolling_summary}

Hãy tạo báo cáo theo đúng JSON schema đã định nghĩa.
```

#### Schema JSON Báo Cáo (lưu vào Report DB, KHÔNG embedding)

```json
{
  "report_id": "uuid-v4",
  "session_id": "sess_001",
  "student_id": "stu_001",
  "class_id": "class_001",
  "created_at": "2025-04-24T11:30:00Z",
  "duration_minutes": 45,
  "turn_count": 28,
  "documents_covered": ["chuong_1_co_so_toan.pdf"],

  "summary": {
    "topics_learned": [
      "Định nghĩa xác suất cổ điển",
      "Biến cố và các phép toán",
      "Công thức xác suất cộng"
    ],
    "quiz_results": {
      "total": 5,
      "correct": 3,
      "incorrect": 2,
      "score_percent": 60,
      "details": [
        {
          "topic": "Công thức xác suất hợp",
          "question_summary": "Tính P(A∪B)",
          "is_correct": false,
          "mistake_note": "Quên trừ P(A∩B)"
        }
      ]
    },
    "weak_points": [
      "Công thức cộng xác suất (quên trừ giao)",
      "Phân biệt biến cố xung khắc và độc lập"
    ],
    "strong_points": [
      "Định nghĩa và tính toán xác suất cổ điển"
    ],
    "learning_trend": "Học sinh có nền tảng ổn nhưng hay nhầm ở bước cuối công thức. Cần ôn lại chương 2 về biến cố độc lập.",
    "recommendation": "Giáo viên nên cho thêm bài tập về công thức xác suất hợp và cung cấp bảng tóm tắt các công thức."
  },

  "metadata": {
    "agent_model": "claude-sonnet-4",
    "summary_model": "claude-sonnet-4",
    "embedding_model": "bge-m3",
    "session_language": "vi"
  }
}
```

---

### 2.6 Teacher Dashboard

**Mô tả:** Giáo viên truy cập để xem danh sách báo cáo các buổi học.

**Tính năng cần có (demo):**
- Upload tài liệu PDF cho lớp học
- Xem danh sách báo cáo buổi học theo học sinh
- Xem chi tiết từng báo cáo: topics learned, quiz score, weak points, recommendation
- (Nâng cao) LLM trả lời câu hỏi của giáo viên dựa trên tập hợp nhiều report (dùng RAG nếu số lượng report lớn)

> **Lưu ý về RAG cho Report:** Demo 1 lớp, ít học sinh → không cần RAG. Khi hệ thống mở rộng (nhiều lớp, nhiều học sinh), nên embed `summary.topics_learned`, `weak_points` và `learning_trend` để giáo viên có thể query kiểu: *"Học sinh nào đang gặp khó khăn với xác suất hợp?"*

---

## 3. Database Schema Tổng Hợp

### 3.1 Document DB (MongoDB / PostgreSQL JSONB)

| Collection/Table | Mô tả |
|-----------------|-------|
| `documents` | Tài liệu OCR từ PDF |
| `sessions` | Thông tin phiên học (start time, student, class) |
| `session_memory` | Memory in-session (quiz history, weak/strong points) |
| `reports` | Báo cáo cuối buổi học |

### 3.2 Vector DB (Qdrant / pgvector)

| Collection | Mô tả |
|-----------|-------|
| `document_chunks` | Chunks từ tài liệu, dùng cho RAG khi Agent trả lời |

> **Không embedding report** — report lưu dạng JSON thuần để truy xuất trực tiếp theo `student_id`, `class_id`, `created_at`.

---

## 4. API Endpoints (Backend)

```
POST   /api/teacher/upload-document      # Upload PDF, trigger OCR + embedding
GET    /api/teacher/documents            # Lấy danh sách tài liệu của lớp
POST   /api/session/start               # Bắt đầu phiên học mới
POST   /api/session/chat                # Gửi tin nhắn, nhận phản hồi Agent
POST   /api/session/end                 # Kết thúc buổi học, trigger summary
GET    /api/teacher/reports             # Lấy danh sách báo cáo
GET    /api/teacher/reports/:report_id  # Xem chi tiết báo cáo
```

---

## 5. Tech Stack Đề Xuất (Demo)

| Thành phần | Công nghệ |
|-----------|-----------|
| Backend | Python (FastAPI) |
| Frontend | React hoặc Streamlit (demo nhanh) |
| OCR | pytesseract + pdf2image, hoặc Claude Vision |
| LLM (Agent) | Claude claude-sonnet-4 / GPT-4o |
| LLM (Summary) | Claude claude-sonnet-4 (cùng model) |
| Embedding | `bge-m3` (local) hoặc OpenAI `text-embedding-3-small` |
| Vector DB | Qdrant (self-hosted, miễn phí) |
| Document DB | MongoDB Atlas hoặc PostgreSQL + JSONB |
| Session Memory | Redis (TTL 24h) hoặc in-memory dict (demo) |

---

## 6. Flow Hoàn Chỉnh (Step-by-Step)

```
1. Giáo viên upload PDF
   → OCR trích xuất text
   → Lưu JSON vào Document DB
   → Chunk + embed → Lưu vào Vector DB

2. Học sinh bắt đầu buổi học
   → POST /api/session/start
   → Khởi tạo session + memory trống

3. Học sinh gửi tin nhắn
   → Agent nhận tin nhắn
   → Gọi tool search_knowledge_base (RAG)
   → Kết hợp retrieved chunks + session memory + short-term history
   → LLM sinh phản hồi (giảng bài / hỏi quiz / giải thích)
   → Cập nhật short-term memory
   → Mỗi 10 lượt: gọi update_memory để cập nhật rolling summary

4. Học sinh nhấn "Kết thúc buổi học"
   → POST /api/session/end
   → Thu thập toàn bộ session memory
   → Gọi Summary LLM với system prompt + input prompt đã chuẩn bị
   → Parse JSON báo cáo
   → Lưu vào Report DB
   → Redirect giáo viên đến trang xem báo cáo

5. Giáo viên xem báo cáo
   → GET /api/teacher/reports
   → Hiển thị danh sách + chi tiết từng báo cáo
```

---

## 7. Những Điểm Cần Lưu Ý Khi Triển Khai

### ⚠️ Token Budget
- Context của Agent phải giữ dưới 8K tokens mỗi lượt để tối ưu chi phí và tốc độ
- Rolling summary không được vượt quá 300 tokens
- Báo cáo cuối buổi không được vượt quá 600 tokens

### ⚠️ Chất Lượng RAG
- Chunk overlap đủ lớn (50 tokens) để không mất ngữ cảnh ở ranh giới chunk
- Metadata phong phú (page number, file name, tags) giúp Agent trích dẫn nguồn chính xác
- Nếu tài liệu tiếng Việt: ưu tiên model embedding hỗ trợ multilingual

### ⚠️ Quiz Consistency
- Mỗi quiz phải được gán ID duy nhất và lưu vào memory ngay khi tạo
- Agent phải tự kiểm tra không hỏi lại câu quiz đã hỏi trong cùng phiên

### ⚠️ Graceful Fallback
- Nếu RAG không tìm được chunk liên quan (score < threshold): Agent thông báo câu hỏi nằm ngoài tài liệu
- Nếu Summary LLM trả về JSON lỗi: retry tối đa 2 lần, nếu vẫn lỗi lưu raw text

---

## 8. Hướng Mở Rộng (Sau Demo)

- Hỗ trợ nhiều học sinh / nhiều lớp
- Giáo viên query báo cáo bằng ngôn ngữ tự nhiên (RAG trên reports)
- Adaptive learning: Agent tự điều chỉnh độ khó bài giảng dựa trên lịch sử nhiều buổi
- Tích hợp speech-to-text để học sinh nói chuyện thay vì gõ
- Export báo cáo dạng PDF cho giáo viên

---

*Tài liệu này được thiết kế cho team demo. Mọi thay đổi về schema hoặc prompt cần được cập nhật đồng bộ tại đây.*
