# 🎓 HACKATHON GIÁO DỤC 2026

## ĐỀ THI CHÍNH THỨC
### Nền tảng học tập thông minh: Giải phóng tư duy, không phụ thuộc AI

**Thời gian làm bài:** 5 tiếng (09:00 - 14:00)  
**Quy mô đội:** 3 hoặc 4 thành viên / đội

---

## I. BỐI CẢNH & VẤN ĐỀ ĐẶT RA

Chúng ta đang sống trong thời đại AI lên ngôi. Chỉ cần vài dòng chat, bất kỳ ai cũng có thể nhận được câu trả lời cho hầu hết mọi câu hỏi. Nhưng đây cũng chính là lúc một nghịch lý xuất hiện:

> *Nếu chúng ta không thật sự hiểu mình đang cần gì, thì AI chỉ là chiếc gương phản chiếu lại sự mơ hồ của chính chúng ta.*

Trong môi trường học đường, hiện tượng này ngày càng rõ rệt. Học sinh, sinh viên đang có xu hướng hỏi AI như hỏi máy photocopy sao chép kết quả mà không cần hiểu quá trình. Thay vì hình thành tư duy, não bộ dần rơi vào trạng thái thụ động, phụ thuộc và lười biếng hiện tượng mà nhiều chuyên gia gọi là “brainrot” (thối não).

Vậy giải pháp là gì? Không phải cấm AI mà là dạy con người cách làm chủ AI. Và đó chính là thử thách dành cho các đội thi hôm nay.

## II. YÊU CẦU ĐỀ BÀI

Các đội cần thiết kế và demo một nền tảng học tập thông minh (LMS tích hợp AI) nhằm cá nhân hoá lộ trình học, hỗ trợ giảng viên và giúp người học phát triển tư duy chủ động, thay vì chỉ phụ thuộc vào AI.

### 2.1 Đối tượng hướng đến
* **Học sinh / sinh viên:** Cần một công cụ hỗ trợ học tập giúp phát triển tư duy, không chỉ cung cấp đáp án.
* **Giảng viên / giáo viên:** Cần hiểu rõ từng học viên để cá nhân hoá việc truyền đạt và theo dõi tiến độ.

### 2.2 Chức năng cốt lõi (bắt buộc phải có)
* **Phân tích nhu cầu học tập của từng cá nhân và đề xuất lộ trình học phù hợp.** Dựa trên lịch sử học, kết quả kiểm tra, phong cách học và mục tiêu cá nhân.
* **Tích hợp AI có định hướng (AI gợi ý câu hỏi, không trả lời thẳng).** Thay vì đưa đáp án, hệ thống nên hỏi ngược lại để kích thích tư duy.
    * *Ví dụ: Khi học sinh hỏi “Kết quả bài tập 3 là gì?”, hệ thống hỏi lại “Em đã thử cách nào rồi?”*
* **Kiểm tra kiến thức và ôn tập bài tập theo từng cá nhân.** Quiz thích nghi (adaptive quiz): tự điều chỉnh độ khó theo năng lực người học. Tổng kết điểm yếu và đề xuất tài liệu ôn tập có mục tiêu.
* **Dashboard cho giáo viên (theo dõi toàn lớp và từng học sinh).** Thống kê tiến độ, điểm số, thói quen học tập. Cảnh báo sớm học sinh có nguy cơ tụt hậu.

### 2.3 Gợi ý công nghệ

| Hạng mục | Gợi ý |
| :--- | :--- |
| **Nền tảng LMS** | Moodle 4.3+ (đã hỗ trợ plugin AI), hoặc tự xây dựng web/app |
| **AI / LLM** | OpenAI API, Gemini API, hoặc model mã nguồn mở (Ollama, LLaMA) |
| **Frontend** | Web (React, Vue) hoặc mobile app (Flutter, React Native) |
| **Backend** | Node.js, Python/FastAPI, hoặc bất kỳ stack nào đội quen |
| **Database** | PostgreSQL, MongoDB, Firebase tuỳ chọn |

## III. KẾT QUẢ ĐẦU RA

Tại thời điểm kết thúc (14:00), mỗi đội cần nộp / trình bày đầy đủ 02 hạng mục sau:

> **Lưu ý:** Thời gian trình bày của mỗi đội sẽ vào khoảng 7 phút, thời gian vấn đáp sẽ khoảng 7 phút. Tổng thời gian cho mỗi đội sẽ rơi vào khoảng 15 - 17 phút.

### 📊 HẠNG MỤC 1: SLIDES THUYẾT TRÌNH
Slides phải bao gồm đủ các nội dung:
* **Xác định vấn đề:** “Brainrot” trong học tập là gì và tại sao cần giải quyết?
* **Giải pháp đề xuất:** Mô tả tổng quan nền tảng, đối tượng người dùng, luồng tương tác chính.
* **Kiến trúc hệ thống (bắt buộc):** Sơ đồ thể hiện rõ các thành phần frontend, backend, AI service, database và cách chúng kết nối.
* **Tính năng nổi bật** và điểm sáng tạo của đội.
* **Kế hoạch phát triển tiếp theo** (roadmap ngắn gọn, nếu có thời gian).

### 💻 HẠNG MỤC 2: DEMO SẢN PHẨM
Demo trực tiếp hoặc video demo (tối đa 5 phút) thể hiện ít nhất:
* Luồng đăng ký / đăng nhập của học sinh và giáo viên.
* AI đề xuất lộ trình học hoặc tương tác “hỏi ngược” khi học sinh nhờ giải bài.
* Ít nhất một bài quiz / kiểm tra kiến thức thích nghi.
* Dashboard / báo cáo cho giáo viên (có thể là mockup nếu chưa hoàn thiện backend).

*\* Sản phẩm có thể là website hoặc ứng dụng điện thoại. Prototype / mockup có thể thay thế demo thực nếu chức năng AI chưa tích hợp đủ.*

## IV. THỜI GIAN BIỂU (DỰ KIẾN)

| Thời điểm | Giai đoạn | Gợi ý hoạt động |
| :--- | :--- | :--- |
| 09:00 - 09:30 | Kickoff & lên ý tưởng | Đọc đề, phân công vai trò, xác định tính năng MVP (Minimum Viable Product) |
| 09:30 - 11:00 | Thiết kế & lập trình (1) | Dựng kiến trúc hệ thống, wireframe UI, bắt đầu code tính năng cốt lõi |
| 11:00 - 12:30 | Thiết kế & lập trình (2) | Hoàn thiện tính năng AI, quiz thích nghi, kết nối các thành phần |
| 12:30 - 13:15 | Làm slides | Soạn nội dung thuyết trình song song với việc hoàn thiện demo |
| 13:15 - 13:45 | Chạy thử & sửa lỗi | Test toàn bộ luồng, quay video backup nếu cần |
| 13:45 - 14:00 | Nộp bài | Upload slides, link demo / repo lên hệ thống của BTC |

## V. CHÍNH SÁCH & QUY ĐỊNH

### 5.1 Được phép
* Sử dụng AI (ChatGPT, Claude, Gemini, Copilot, v.v.) để hỗ trợ lập trình, thiết kế, viết nội dung.
* Sử dụng thư viện, framework, mã nguồn mở có sẵn, miễn là ghi rõ nguồn gốc.
* Dùng các dịch vụ API miễn phí (OpenAI free tier, Firebase free plan, v.v.).
* Tham khảo tài liệu kỹ thuật, hướng dẫn trực tuyến trong suốt thời gian thi.

### 5.2 Không được phép
* Sao chép nguyên xi sản phẩm từ đội khác hoặc từ dự án thương mại đã có sẵn.
* Nhờ người ngoài đội tham gia làm bài (kể cả remote / online).
* Sử dụng dữ liệu cá nhân thật của học sinh/giáo viên mà không có sự đồng ý.

### 5.3 Lưu ý kỹ thuật
* Demo phải chạy được trong môi trường offline hoặc có kết nối mạng ổn định.
* Nếu sử dụng API có phí, đội tự chịu trách nhiệm về chi phí phát sinh.
* BTC khuyến khích đội sử dụng môi trường local / sandbox để tránh lỗi phát sinh khi demo.

## VI. TIÊU CHÍ CHẤM ĐIỂM

| Tiêu chí | Mô tả | Điểm tối đa |
| :--- | :--- | :--- |
| **Giải quyết vấn đề** | Sản phẩm có giải quyết đúng bài toán brainrot / học phụ thuộc AI không? | 25 |
| **Tính năng AI** | AI tích hợp có thực sự hỗ trợ tư duy chủ động, không chỉ đưa đáp án? | 25 |
| **Kiến trúc hệ thống** | Sơ đồ kiến trúc rõ ràng, hợp lý, có thể mở rộng được không? | 20 |
| **Demo / Prototype** | Sản phẩm có chạy được và thể hiện được luồng sử dụng thực tế không? | 20 |
| **Thuyết trình** | Trình bày rõ ràng, mạch lạc, trả lời được câu hỏi của ban giám khảo? | 10 |

## VII. LỜI NHẮN TỪ BAN TỔ CHỨC

Đây không chỉ là một cuộc thi lập trình. Đây là cơ hội để các bạn chứng minh rằng công nghệ có thể được thiết kế để con người trở nên thông minh hơn, chứ không phải thụ động hơn.

Một sản phẩm hoàn chỉnh 100% quan trọng, nhưng một ý tưởng rõ ràng, kiến trúc tốt và demo thuyết phục còn quan trọng hơn. Hãy tập trung vào giá trị cốt lõi bạn muốn tạo ra, đừng để thời gian trôi vào những tính năng phụ không cần thiết.

Chúc các đội thi tư duy sắc bén và lập trình thuận tay! 🚀

**Ban Tổ Chức Hackathon HCMUT 2026**