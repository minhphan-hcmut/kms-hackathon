# 📚 PROJECT CHARTER & KNOWLEDGE BASE

## Hackathon Giáo Dục HCMUT 2026 — "Nền tảng học tập thông minh"

> **Đội ngũ kỹ thuật:** React.js · Nest.js · MongoDB + PostgreSQL  
> **Thời lượng thi đấu:** 5 tiếng (09:00 → 14:00)  
> **Quy mô:** 3–4 thành viên / đội  
> **Ngày tạo tài liệu:** 24/04/2026

---

## Mục lục

1. [Tổng quan & Mục tiêu cốt lõi](#1-tổng-quan--mục-tiêu-cốt-lõi)
2. [Đối tượng người dùng](#2-đối-tượng-người-dùng)
3. [Chức năng bắt buộc (Must-Have)](#3-chức-năng-bắt-buộc-must-have)
4. [Kết quả đầu ra cần nộp](#4-kết-quả-đầu-ra-cần-nộp)
5. [Ánh xạ Tech Stack vào yêu cầu](#5-ánh-xạ-tech-stack-vào-yêu-cầu)
6. [Chiến lược Hybrid Database: MongoDB + PostgreSQL](#6-chiến-lược-hybrid-database-mongodb--postgresql)
7. [Tiêu chí chấm điểm & Chiến lược tối ưu](#7-tiêu-chí-chấm-điểm--chiến-lược-tối-ưu)
8. [Ràng buộc: Được phép & Không được phép](#8-ràng-buộc-được-phép--không-được-phép)
9. [Lưu ý kỹ thuật quan trọng](#9-lưu-ý-kỹ-thuật-quan-trọng)
10. [Quản lý thời gian đề xuất](#10-quản-lý-thời-gian-đề-xuất)

---

## 1. Tổng quan & Mục tiêu cốt lõi

### 1.1 Bối cảnh vấn đề

Đề bài xoay quanh hiện tượng **"brainrot"** (thối não) — hệ quả của việc người học phụ thuộc AI một cách thụ động. Thay vì tư duy, học sinh/sinh viên sử dụng AI như **máy photocopy đáp án**, dẫn đến não bộ lười biếng và mất khả năng tư duy độc lập.

### 1.2 Triết lý cốt lõi

> **"Không cấm AI — mà dạy con người cách làm chủ AI."**

Sản phẩm phải chứng minh rằng công nghệ có thể giúp con người **thông minh hơn**, chứ không phải **thụ động hơn**.

### 1.3 Mục tiêu sản phẩm

Xây dựng **nền tảng học tập thông minh (LMS tích hợp AI)** với 3 mục tiêu trọng yếu:

| # | Mục tiêu | Mô tả |
|---|----------|-------|
| 1 | **Cá nhân hoá lộ trình học** | Phân tích nhu cầu từng người học, đề xuất lộ trình phù hợp |
| 2 | **Hỗ trợ giảng viên** | Dashboard theo dõi tiến độ, cảnh báo sớm học sinh tụt hậu |
| 3 | **Phát triển tư duy chủ động** | AI gợi ý câu hỏi, hỏi ngược thay vì đưa đáp án |

---

## 2. Đối tượng người dùng

| Vai trò | Nhu cầu chính | Giao diện tương ứng |
|---------|---------------|---------------------|
| **Học sinh / Sinh viên** | Công cụ hỗ trợ phát triển tư duy, không chỉ cung cấp đáp án | Student Portal |
| **Giảng viên / Giáo viên** | Hiểu rõ từng học viên, cá nhân hoá truyền đạt, theo dõi tiến độ | Teacher Dashboard |

---

## 3. Chức năng bắt buộc (Must-Have)

> [!IMPORTANT]
> Đây là 4 chức năng **bắt buộc** theo đề bài. Thiếu bất kỳ chức năng nào sẽ ảnh hưởng nghiêm trọng đến điểm số.

### 3.1 Phân tích nhu cầu & Đề xuất lộ trình học

- Phân tích dựa trên: **lịch sử học**, **kết quả kiểm tra**, **phong cách học**, **mục tiêu cá nhân**
- Đầu ra: lộ trình học cá nhân hoá cho từng học sinh

### 3.2 AI tích hợp có định hướng ("Hỏi ngược")

- **Không trả lời thẳng** — AI phải hỏi ngược để kích thích tư duy
- Ví dụ minh hoạ từ đề bài:
  - Học sinh: *"Kết quả bài tập 3 là gì?"*
  - Hệ thống: *"Em đã thử cách nào rồi?"*
- Đây là **điểm sáng tạo trọng yếu** — chiếm 25/100 điểm

### 3.3 Kiểm tra kiến thức & Ôn tập cá nhân

- **Adaptive Quiz**: tự điều chỉnh độ khó theo năng lực người học
- **Tổng kết điểm yếu**: xác định lỗ hổng kiến thức
- **Đề xuất tài liệu ôn tập**: có mục tiêu, gắn với điểm yếu cụ thể

### 3.4 Dashboard giáo viên

- Theo dõi **toàn lớp** và **từng học sinh**
- Thống kê: tiến độ, điểm số, thói quen học tập
- **Cảnh báo sớm**: phát hiện học sinh có nguy cơ tụt hậu

---

## 4. Kết quả đầu ra cần nộp

### Hạng mục 1: Slides thuyết trình

| Nội dung bắt buộc | Chi tiết |
|--------------------|----------|
| Xác định vấn đề | "Brainrot" là gì, tại sao cần giải quyết |
| Giải pháp đề xuất | Tổng quan nền tảng, đối tượng, luồng tương tác chính |
| **Kiến trúc hệ thống** | Sơ đồ frontend ↔ backend ↔ AI service ↔ database (***bắt buộc***) |
| Tính năng nổi bật | Điểm sáng tạo của đội |
| Roadmap | Kế hoạch phát triển tiếp theo (nếu kịp) |

### Hạng mục 2: Demo sản phẩm (tối đa 5 phút)

| Luồng demo bắt buộc | Ghi chú |
|----------------------|---------|
| Đăng ký / Đăng nhập | Cả học sinh và giáo viên |
| AI đề xuất lộ trình hoặc "hỏi ngược" | Luồng AI cốt lõi |
| Quiz / Kiểm tra thích nghi | Ít nhất 1 bài quiz adaptive |
| Dashboard giáo viên | Có thể là mockup nếu backend chưa hoàn thiện |

> [!NOTE]
> Prototype / mockup có thể thay thế demo thực nếu chức năng AI chưa tích hợp đủ. Tuy nhiên, demo thực sẽ ghi điểm cao hơn.

### Thời gian trình bày

- **Thuyết trình:** ~7 phút
- **Vấn đáp:** ~7 phút
- **Tổng:** 15–17 phút / đội

---

## 5. Ánh xạ Tech Stack vào yêu cầu

### Tổng quan kiến trúc

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  React.js   │────▶│   Nest.js    │────▶│  AI Service  │
│  (Frontend) │◀────│  (Backend)   │◀────│ (Gemini API) │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
              ┌─────▼─────┐ ┌─────▼──────┐
              │ PostgreSQL │ │  MongoDB   │
              │ (Quan hệ)  │ │ (Linh hoạt)│
              └───────────┘ └────────────┘
```

### Ánh xạ từng thành phần

| Thành phần | Công nghệ | Vai trò trong sản phẩm |
|------------|-----------|------------------------|
| **Frontend** | React.js | Giao diện Student Portal & Teacher Dashboard. SPA với routing cho từng vai trò |
| **Backend** | Nest.js | REST/GraphQL API, xử lý logic nghiệp vụ, kết nối AI, quản lý auth, orchestrate quiz engine |
| **AI Service** | Gemini API (hoặc OpenAI) | Phân tích lộ trình, tạo câu hỏi gợi ý ("hỏi ngược"), adaptive quiz content |
| **CSDL quan hệ** | PostgreSQL | Dữ liệu có cấu trúc chặt: users, courses, enrollments, quiz scores, class assignments |
| **CSDL linh hoạt** | MongoDB | Dữ liệu phi cấu trúc / bán cấu trúc: chat logs AI, learning profiles, quiz content động, analytics events |

---

## 6. Chiến lược Hybrid Database: MongoDB + PostgreSQL

> [!IMPORTANT]
> Đây là điểm khác biệt kiến trúc quan trọng nhất của đội. Cần giải thích rõ ràng trong slides tại sao sử dụng hybrid, không phải chỉ vì "bắt buộc" mà vì **phù hợp với bản chất dữ liệu**.

### 6.1 PostgreSQL — Dữ liệu có cấu trúc, tính toàn vẹn cao

| Module | Dữ liệu lưu trữ | Lý do dùng PostgreSQL |
|--------|-------------------|----------------------|
| **Auth & Users** | Thông tin tài khoản, vai trò (student/teacher), profile cơ bản | Cần ràng buộc unique, foreign key, ACID transactions |
| **Courses & Enrollments** | Danh sách môn học, lớp, phân công GV-HS | Quan hệ nhiều-nhiều, cần JOIN phức tạp |
| **Quiz Scores & Grades** | Điểm số, lịch sử làm bài, kết quả kiểm tra | Cần tính toán aggregate (trung bình, xếp hạng), reporting chính xác |
| **Classroom Management** | Danh sách lớp, thời khoá biểu, liên kết GV | Dữ liệu cố định, ít thay đổi schema |

### 6.2 MongoDB — Dữ liệu linh hoạt, phi cấu trúc

| Module | Dữ liệu lưu trữ | Lý do dùng MongoDB |
|--------|-------------------|-------------------|
| **Learning Profile** | Phong cách học, mục tiêu, sở thích, lịch sử tương tác | Schema thay đổi liên tục theo từng cá nhân, nested objects phức tạp |
| **AI Conversation Logs** | Lịch sử chat AI, câu hỏi gợi ý, context tư duy | Dữ liệu dạng document, kích thước không cố định, append-heavy |
| **Adaptive Quiz Content** | Ngân hàng câu hỏi, metadata độ khó, tags chủ đề | Cấu trúc câu hỏi đa dạng (trắc nghiệm, tự luận, kéo thả...), cần flexibility |
| **Learning Path / Roadmap** | Lộ trình học cá nhân, milestones, tiến độ chi tiết | Cấu trúc cây (tree/graph), khác nhau giữa các học sinh |
| **Analytics Events** | Hành vi học tập, click tracking, thời gian dành cho từng bài | Time-series data, write-heavy, không cần ACID |

### 6.3 Nguyên tắc phân chia

```
Dữ liệu CẦN toàn vẹn, quan hệ, reporting ─────▶ PostgreSQL
Dữ liệu CẦN linh hoạt, biến đổi, AI context ──▶ MongoDB
```

> [!TIP]
> Trong slides, nên vẽ sơ đồ minh hoạ rõ ràng dữ liệu nào chảy vào DB nào. Đây sẽ là điểm nhấn kiến trúc (chiếm **20/100 điểm**).

---

## 7. Tiêu chí chấm điểm & Chiến lược tối ưu

### Bảng phân bổ điểm

| Tiêu chí | Điểm tối đa | Tỷ trọng | Mức ưu tiên |
|----------|-------------|-----------|-------------|
| **Giải quyết vấn đề** (brainrot) | 25 | 25% | 🔴 Cao nhất |
| **Tính năng AI** (tư duy chủ động) | 25 | 25% | 🔴 Cao nhất |
| **Kiến trúc hệ thống** | 20 | 20% | 🟠 Cao |
| **Demo / Prototype** | 20 | 20% | 🟠 Cao |
| **Thuyết trình** | 10 | 10% | 🟡 Trung bình |
| **Tổng** | **100** | **100%** | |

### Chiến lược tối ưu theo từng tiêu chí

#### 🔴 Giải quyết vấn đề (25 điểm)
- **Phải làm:** Sản phẩm phải thể hiện rõ ràng rằng nó **giải quyết brainrot** — không chỉ là LMS thông thường
- **Chiến thuật:** Mọi tính năng đều phải quay về câu hỏi: *"Điều này giúp người học TƯ DUY CHỦ ĐỘNG như thế nào?"*
- **Điểm nhấn:** Cơ chế "hỏi ngược" là minh chứng trực quan nhất

#### 🔴 Tính năng AI (25 điểm)
- **Phải làm:** AI không chỉ là chatbot trả lời — AI phải **kích thích tư duy**
- **Chiến thuật:** Implement Socratic method — AI đặt câu hỏi dẫn dắt thay vì đưa đáp án
- **Cảnh báo:** Nếu AI chỉ đơn thuần đưa đáp án ➜ **mất điểm nặng**

#### 🟠 Kiến trúc hệ thống (20 điểm)
- **Phải làm:** Sơ đồ kiến trúc **rõ ràng, hợp lý, có khả năng mở rộng**
- **Chiến thuật:** Thể hiện rõ 4 lớp: Frontend (React) → Backend (Nest.js) → AI Service → Database (Hybrid)
- **Điểm cộng:** Giải thích được TẠI SAO dùng hybrid database (không phải chỉ vì "bắt buộc")

#### 🟠 Demo / Prototype (20 điểm)
- **Phải làm:** Sản phẩm phải **chạy được** và thể hiện luồng sử dụng thực tế
- **Chiến thuật:** Ưu tiên hoàn thiện happy path end-to-end hơn là nhiều tính năng dở dang
- **Lưu ý:** Mockup được chấp nhận cho Dashboard GV nếu chưa kịp làm backend

#### 🟡 Thuyết trình (10 điểm)
- **Phải làm:** Trình bày rõ ràng, mạch lạc, trả lời được câu hỏi vấn đáp
- **Chiến thuật:** Chuẩn bị trước câu trả lời cho các câu hỏi dự kiến từ BGK

---

## 8. Ràng buộc: Được phép & Không được phép

### ✅ ĐƯỢC PHÉP (Do's)

| # | Hành động | Ghi chú |
|---|-----------|---------|
| 1 | Sử dụng AI (ChatGPT, Claude, Gemini, Copilot...) để hỗ trợ lập trình, thiết kế, viết nội dung | Không hạn chế loại AI |
| 2 | Sử dụng thư viện, framework, mã nguồn mở | **Phải ghi rõ nguồn gốc** |
| 3 | Dùng dịch vụ API miễn phí (OpenAI free tier, Firebase free plan...) | Tự chịu phí nếu dùng bản trả phí |
| 4 | Tham khảo tài liệu kỹ thuật, hướng dẫn trực tuyến | Trong suốt thời gian thi |

### ❌ KHÔNG ĐƯỢC PHÉP (Don'ts)

| # | Vi phạm | Hậu quả |
|---|---------|---------|
| 1 | Sao chép nguyên xi sản phẩm từ đội khác hoặc dự án thương mại | Loại |
| 2 | Nhờ người ngoài đội tham gia (kể cả remote/online) | Loại |
| 3 | Sử dụng dữ liệu cá nhân thật của HS/GV mà không có sự đồng ý | Vi phạm quy định |

---

## 9. Lưu ý kỹ thuật quan trọng

> [!WARNING]
> Các lưu ý này ảnh hưởng trực tiếp đến khả năng demo thành công.

| # | Lưu ý | Hành động cần làm |
|---|-------|-------------------|
| 1 | Demo phải chạy được trong **môi trường offline** hoặc có kết nối mạng ổn định | Chuẩn bị fallback data / mock responses cho AI nếu mất mạng |
| 2 | API có phí → đội tự chịu trách nhiệm | Ưu tiên Gemini API (free tier rộng rãi hơn) hoặc chuẩn bị mock |
| 3 | Khuyến khích dùng môi trường **local / sandbox** | Chạy database local, tránh phụ thuộc cloud service cho demo |
| 4 | Prototype / mockup được chấp nhận | Nhưng demo thực sẽ ghi điểm cao hơn — ưu tiên làm thật nếu kịp |

---

## 10. Quản lý thời gian đề xuất

> [!NOTE]
> Bảng dưới đây kết hợp timeline từ đề bài với chiến lược của đội dựa trên tech stack React + Nest.js + Hybrid DB.

| Khung giờ | Giai đoạn | Hoạt động chính |
|-----------|-----------|-----------------|
| 09:00 – 09:30 | **Kickoff** | Đọc đề, phân công, xác định MVP, finalize kiến trúc |
| 09:30 – 11:00 | **Sprint 1** | Dựng Nest.js API + DB schemas, wireframe React UI, bắt đầu auth flow |
| 11:00 – 12:30 | **Sprint 2** | Tích hợp AI (hỏi ngược + lộ trình), adaptive quiz engine, kết nối FE-BE |
| 12:30 – 13:15 | **Slides + Polish** | Soạn slides (kiến trúc, demo flow), hoàn thiện UI |
| 13:15 – 13:45 | **QA & Backup** | Test toàn bộ luồng, quay video backup, fix critical bugs |
| 13:45 – 14:00 | **Nộp bài** | Upload slides, link repo, kiểm tra lần cuối |

---

## 📌 Tóm tắt nhanh — Những điều QUAN TRỌNG NHẤT

1. **50% điểm** nằm ở "Giải quyết vấn đề" + "Tính năng AI" → **AI hỏi ngược là linh hồn sản phẩm**
2. **Kiến trúc hybrid database** phải được giải thích hợp lý trong slides — đây là điểm nhấn kỹ thuật
3. **Demo end-to-end** ưu tiên hơn nhiều tính năng nửa vời — tập trung vào happy path
4. **Sẵn sàng offline** — chuẩn bị mock data / fallback cho AI service
5. **Ghi nguồn** tất cả thư viện, framework, mã nguồn mở sử dụng

---

> *Tài liệu này được tổng hợp từ `spec.md` — Hackathon Giáo Dục HCMUT 2026.*  
> *Không chứa thông tin bịa đặt hoặc yêu cầu ngoài đề bài.*  
> *Phiên bản: 1.0 — 24/04/2026*
