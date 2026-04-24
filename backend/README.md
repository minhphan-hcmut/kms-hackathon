# 🚀 BrainLift Backend - Nền tảng "AI Classroom Assistant"

**Chủ đề Hackathon:** AI Education (Giáo dục ứng dụng AI)

BrainLift là một trợ giảng AI thế hệ mới, biến đổi trải nghiệm "Brainrot" thụ động thành "Học qua Dạy" (Learn-by-Teaching) chủ động. Backend của chúng tôi đóng vai trò là "bộ não" lõi, điều phối hệ thống RAG thông minh, lưu trữ kiến thức và tự động hóa quá trình đánh giá học sinh với độ chính xác cao.

---

## ✨ Điểm Nhấn Công Nghệ (The Wow Factor)

- 🧠 **Động cơ Trí nhớ 3 Lớp (3-Layer AI Memory Engine):** Không chỉ trả lời câu hỏi, AI của chúng tôi ghi nhớ hội thoại qua 3 tầng (Ngắn hạn, Tóm tắt luân phiên, và Báo cáo dài hạn). Điều này giúp AI tự học được điểm mạnh/yếu của từng học sinh để cá nhân hóa lộ trình.
- 🗄️ **Kiến trúc Hybrid Database (PostgreSQL + MongoDB):** Phân tách xuất sắc giữa dữ liệu quan hệ (Người dùng, Lớp học, Điểm số) và dữ liệu phi cấu trúc (Lịch sử hội thoại linh hoạt, Vector Embeddings).
- 🎯 **Đánh giá Chủ động (Proactive Assessment):** AI tự động sinh ra các bài Quiz (định dạng JSON) thông qua kỹ thuật RAG từ tài liệu lớp học, đồng thời chấm bài tự luận và đưa ra nhận xét mang tính xây dựng như một giáo viên thực thụ.
- 📚 **Nhúng Dữ liệu Tự động (RAG Document Ingestion):** Pipeline tự động xử lý file PDF, trích xuất văn bản, chia nhỏ (chunking) thông minh với kỹ thuật bảo toàn ngữ nghĩa, và gọi API để sinh vector embeddings.

---

## 🏗 Kiến trúc Hệ thống & Lựa chọn Công nghệ

Sự khác biệt lớn nhất của BrainLift nằm ở cách chúng tôi thiết kế cơ sở dữ liệu. Chúng tôi cố tình xây dựng kiến trúc **Hybrid DB** để tối ưu hóa triệt để:

1. **🐘 PostgreSQL (TypeORM):** Được sử dụng làm Single Source of Truth cho các thực thể mang tính giao dịch và quan hệ chặt chẽ (Users, Classrooms, Quiz Structures, Student Grades). Đảm bảo tính toàn vẹn ACID.
2. **🍃 MongoDB (Mongoose):** Là "mỏ vàng" lưu trữ dữ liệu AI. Vector Embeddings (với hàng nghìn chiều), lịch sử hội thoại liên tục thay đổi (Chat Logs), và các Document OCR thô được lưu trữ tại đây nhờ vào tính linh hoạt (schema-less) và khả năng mở rộng cực tốt của NoSQL.

---

## 🛠 Hướng dẫn Khởi chạy (Quick Start Guide)

Chỉ với 4 bước, Ban Giám Khảo có thể khởi động ngay lập tức hệ thống Backend của BrainLift.

### Bước 1: Cài đặt Dependencies
```bash
npm install
```

### Bước 2: Cấu hình Môi trường (.env)
Tạo file `.env` tại thư mục `backend/` dựa trên mẫu sau:
```env
# Server
PORT=3000

# JWT Auth
JWT_SECRET=super_secret_jwt_key_hackathon_2026

# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=brainlift

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/brainlift_ai

# OpenAI / LLM
OPENAI_API_KEY=sk-your-openai-api-key
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

### Bước 3: Khởi động Server
```bash
npm run start:dev
```
*(PostgreSQL sẽ tự động đồng bộ hóa các bảng nhờ tính năng `synchronize: true` trong môi trường dev).*

### Bước 4: Tạo Dữ liệu Mẫu (Demo Seeding)
Đừng mất thời gian tạo dữ liệu thủ công! Hãy chạy lệnh dưới đây để tự động bơm Giáo viên, Học sinh, Lớp học và Vector Document mẫu vào cả 2 Database:
```bash
npx ts-node src/scripts/seed.ts
```

---

## 📖 Tài liệu API (Swagger UI)

Hệ thống được tích hợp sẵn OpenAPI (Swagger) với độ chi tiết cao, đi kèm đầy đủ Schema và DTO descriptions.

Sau khi khởi động server, truy cập vào giao diện Swagger UI tại:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

Tại đây, bạn có thể dễ dàng test mọi Endpoint (RAG, Chat, Assessment) mà không cần dùng đến Postman!
