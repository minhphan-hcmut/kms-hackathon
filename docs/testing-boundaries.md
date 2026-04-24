# 🧪 TESTING BOUNDARIES & GHOST RUNTIMES — Phase 3

## BrainLift — Hackathon Giáo Dục HCMUT 2026

---

## 1. API Contracts — Interfaces & DTOs

### 1.1 Enums dùng chung

```typescript
// === shared/enums.ts ===

/** Vai trò người dùng trong hệ thống */
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
}

/** Trạng thái phiên dạy AI */
export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

/** Vai trò trong cuộc hội thoại dạy-học */
export enum MessageRole {
  STUDENT = 'student',       // Người dạy (học sinh thật)
  AI_LEARNER = 'ai_learner', // AI đóng vai học sinh yếu
}

/** Loại câu hỏi quiz */
export enum QuizType {
  MULTIPLE_CHOICE = 'multiple_choice',
  EXPLAIN = 'explain',
  TRUE_FALSE = 'true_false',
}
```

### 1.2 Auth DTOs

```typescript
// === auth/dto.ts ===

/** DTO đăng ký tài khoản mới */
export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

/** DTO đăng nhập */
export interface LoginDto {
  email: string;
  password: string;
}

/** Response trả về sau khi auth thành công */
export interface AuthResponseDto {
  accessToken: string;
  user: UserProfileDto;
}

/** Thông tin user trả về cho Frontend */
export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string; // ISO 8601
}
```

### 1.3 Teaching Session DTOs

```typescript
// === teaching-session/dto.ts ===

/** DTO tạo phiên dạy mới */
export interface CreateSessionDto {
  courseId: string;
  topic: string;
}

/** DTO gửi tin nhắn trong phiên dạy */
export interface SendMessageDto {
  sessionId: string;
  content: string; // Nội dung học sinh giảng bài cho AI
}

/** Một tin nhắn trong cuộc hội thoại */
export interface MessageDto {
  role: MessageRole;
  content: string;
  timestamp: string;
  cognitiveIntent?: string; // Chỉ có ở tin nhắn AI
}

/** Response chi tiết của một phiên dạy */
export interface SessionResponseDto {
  id: string;
  studentId: string;
  courseId: string;
  topic: string;
  status: SessionStatus;
  conversation: MessageDto[];
  teachingScore: number | null; // null nếu chưa kết thúc
  createdAt: string;
  duration: number | null; // giây
}

/** DTO kết thúc phiên dạy — trả về điểm đánh giá */
export interface EndSessionResponseDto {
  sessionId: string;
  teachingScore: number; // 0-100
  cognitiveInsights: {
    strongPoints: string[];
    weakPoints: string[];
  };
  masteryDelta: number; // Thay đổi mastery sau phiên dạy
}
```

### 1.4 Quiz DTOs

```typescript
// === quiz/dto.ts ===

/** DTO yêu cầu tạo quiz thích nghi */
export interface GenerateQuizDto {
  courseId: string;
  topic: string;
  questionCount: number; // Mặc định 5
}

/** Một câu hỏi quiz */
export interface QuizQuestionDto {
  id: string;
  type: QuizType;
  question: string;
  options?: string[]; // Chỉ cho multiple_choice
  difficulty: number; // 1-5
}

/** DTO nộp bài quiz */
export interface SubmitQuizDto {
  quizId: string;
  answers: { questionId: string; answer: string }[];
}

/** Kết quả quiz */
export interface QuizResultDto {
  quizId: string;
  score: number;
  totalQuestions: number;
  weakTopics: string[];
  recommendedActions: string[];
}
```

### 1.5 Dashboard DTOs

```typescript
// === dashboard/dto.ts ===

/** Tổng quan một học sinh cho GV */
export interface StudentOverviewDto {
  studentId: string;
  fullName: string;
  averageMastery: number;
  totalSessions: number;
  averageTeachingScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastActiveAt: string;
}

/** Tổng quan toàn lớp */
export interface ClassOverviewDto {
  courseId: string;
  courseName: string;
  totalStudents: number;
  averageClassMastery: number;
  atRiskStudents: StudentOverviewDto[];
  topPerformers: StudentOverviewDto[];
  recentActivity: { date: string; sessionCount: number }[];
}
```

### 1.6 API Endpoints Contract

```typescript
// === api-contract.ts — Bản đồ toàn bộ endpoints ===

/**
 * POST   /api/auth/register        → AuthResponseDto
 * POST   /api/auth/login            → AuthResponseDto
 * GET    /api/auth/profile           → UserProfileDto
 *
 * POST   /api/sessions              → SessionResponseDto
 * POST   /api/sessions/:id/message  → MessageDto (AI reply)
 * POST   /api/sessions/:id/end      → EndSessionResponseDto
 * GET    /api/sessions/:id          → SessionResponseDto
 * GET    /api/sessions/my           → SessionResponseDto[]
 *
 * POST   /api/quiz/generate         → { quizId, questions: QuizQuestionDto[] }
 * POST   /api/quiz/:id/submit       → QuizResultDto
 *
 * GET    /api/dashboard/class/:courseId → ClassOverviewDto
 * GET    /api/dashboard/student/:id    → StudentOverviewDto
 */
```

---

## 2. Database Boundaries — Schema Models

### 2.1 PostgreSQL Models (TypeORM / Prisma)

```typescript
// === postgres/entities.ts ===
// Lưu trữ: dữ liệu quan hệ, cần ACID, JOINs, aggregate reporting

/** Bảng users — thông tin tài khoản */
interface PgUser {
  id: string;           // UUID, primary key
  email: string;         // UNIQUE, NOT NULL
  passwordHash: string;  // NOT NULL
  fullName: string;
  role: UserRole;        // ENUM('student', 'teacher')
  createdAt: Date;
  updatedAt: Date;
}

/** Bảng courses — môn học / lớp */
interface PgCourse {
  id: string;
  name: string;
  subject: string;
  description: string;
  teacherId: string;     // FK → users.id
  createdAt: Date;
}

/** Bảng enrollments — quan hệ HS-Lớp (nhiều-nhiều) */
interface PgEnrollment {
  id: string;
  studentId: string;     // FK → users.id
  courseId: string;       // FK → courses.id
  enrolledAt: Date;
  // UNIQUE(studentId, courseId)
}

/** Bảng quiz_results — kết quả kiểm tra (cần aggregate chính xác) */
interface PgQuizResult {
  id: string;
  studentId: string;     // FK → users.id
  courseId: string;       // FK → courses.id
  topic: string;
  score: number;         // 0-100
  difficultyLevel: number;
  completedAt: Date;
}

/** Bảng mastery_scores — mức thành thạo theo chủ đề */
interface PgMasteryScore {
  id: string;
  studentId: string;     // FK → users.id
  topicId: string;
  masteryLevel: number;  // 0.0 - 1.0
  teachingScore: number; // 0-100, trung bình từ các phiên dạy
  lastUpdated: Date;
}
```

### 2.2 MongoDB Models (Mongoose)

```typescript
// === mongo/schemas.ts ===
// Lưu trữ: dữ liệu linh hoạt, phi cấu trúc, AI context

/** Collection: teaching_sessions — log phiên dạy AI */
interface MongoTeachingSession {
  _id: string;           // ObjectId
  studentId: string;     // Tham chiếu đến PgUser.id
  courseId: string;       // Tham chiếu đến PgCourse.id
  topic: string;
  status: SessionStatus;
  aiPersona: {
    confusionLevel: number;  // 0.0-1.0, adaptive
    currentMisconceptions: string[];
    adaptedQuestions: string[];
  };
  conversation: {            // Mảng biến đổi, nested
    role: MessageRole;
    content: string;
    timestamp: Date;
    cognitiveIntent?: string;
  }[];
  teachingScore: number | null;
  cognitiveInsights: {
    strongPoints: string[];
    weakPoints: string[];
    thinkingPatterns: string[];
  } | null;
  createdAt: Date;
  duration: number | null;   // giây
}

/** Collection: learning_profiles — hồ sơ học tập (schema động) */
interface MongoLearningProfile {
  _id: string;
  studentId: string;
  learningStyle: string;
  topicMastery: Record<string, {
    level: number;
    teachCount: number;
    lastTeachDate: Date;
    commonMistakes: string[];
  }>;
  personalGoals: string[];
  recommendedPath: {
    nodes: { id: string; topic: string; status: string }[];
    edges: { from: string; to: string }[];
  };
}

/** Collection: quiz_content — ngân hàng câu hỏi (schema đa dạng) */
interface MongoQuizContent {
  _id: string;
  topic: string;
  difficulty: number;
  type: QuizType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  misconceptionTargeted: string;
}

/** Collection: analytics_events — sự kiện hành vi (write-heavy) */
interface MongoAnalyticsEvent {
  studentId: string;
  event: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}
```

### 2.3 Tóm tắt phân tách

| Dữ liệu | Database | Lý do |
|----------|----------|-------|
| Users, Courses, Enrollments | **PostgreSQL** | FK, UNIQUE, ACID, JOIN |
| Quiz Results, Mastery Scores | **PostgreSQL** | Aggregate reporting chính xác |
| Teaching Sessions (conversations) | **MongoDB** | Nested arrays, variable-length docs |
| Learning Profiles | **MongoDB** | Dynamic keys, schema thay đổi theo HS |
| Quiz Content (question bank) | **MongoDB** | Schema đa dạng theo loại câu hỏi |
| Analytics Events | **MongoDB** | Write-heavy, không cần ACID |

---

## 3. Test Skeletons — Ghost Runtimes

### 3.1 Backend Test #1: Auth Service

```typescript
// === auth.service.spec.ts ===
// Mục đích: Xác minh luồng đăng ký và đăng nhập hoạt động đúng hợp đồng

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // TODO: Mock UserRepository (PostgreSQL)
        // TODO: Mock JwtService
        // TODO: Mock BcryptService
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register()', () => {
    it('phải tạo user mới và trả về accessToken + profile', async () => {
      // Arrange: chuẩn bị RegisterDto hợp lệ
      const dto: RegisterDto = {
        email: 'student@test.com',
        password: 'SecurePass123',
        fullName: 'Nguyễn Văn A',
        role: UserRole.STUDENT,
      };

      // Act: gọi service.register(dto)
      // Assert:
      //   - Kết quả phải có accessToken (string, non-empty)
      //   - Kết quả phải có user.id, user.email, user.role
      //   - user.role phải là 'student'
      //   - passwordHash KHÔNG được trả về
      expect(true).toBe(false); // TODO: thay bằng logic thực
    });

    it('phải ném lỗi khi email đã tồn tại', async () => {
      // Arrange: mock repository trả về user đã tồn tại
      // Act & Assert: expect(...).rejects.toThrow(ConflictException)
      expect(true).toBe(false); // TODO
    });
  });

  describe('login()', () => {
    it('phải trả về token khi credentials hợp lệ', async () => {
      // Arrange: mock user tồn tại + password khớp
      // Act: gọi service.login(loginDto)
      // Assert: kết quả có accessToken + user profile
      expect(true).toBe(false); // TODO
    });

    it('phải ném UnauthorizedException khi password sai', async () => {
      // Arrange: mock user tồn tại + password KHÔNG khớp
      // Act & Assert: expect(...).rejects.toThrow(UnauthorizedException)
      expect(true).toBe(false); // TODO
    });
  });
});
```

### 3.2 Backend Test #2: Teaching Session Service

```typescript
// === teaching-session.service.spec.ts ===
// Mục đích: Xác minh luồng cốt lõi "Dạy cho AI" — tính năng quan trọng nhất

import { Test, TestingModule } from '@nestjs/testing';
import { TeachingSessionService } from './teaching-session.service';

describe('TeachingSessionService', () => {
  let service: TeachingSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachingSessionService,
        // TODO: Mock MongoTeachingSessionRepository
        // TODO: Mock AIOrchestrationService
        // TODO: Mock MasteryScoreRepository (PostgreSQL)
      ],
    }).compile();

    service = module.get<TeachingSessionService>(TeachingSessionService);
  });

  describe('createSession()', () => {
    it('phải tạo phiên dạy mới với AI persona và conversation rỗng', async () => {
      // Arrange
      const studentId = 'user-uuid-123';
      const dto: CreateSessionDto = { courseId: 'course-1', topic: 'Quang hợp' };

      // Act: gọi service.createSession(studentId, dto)
      // Assert:
      //   - Kết quả phải có id, status = 'active'
      //   - conversation phải là mảng rỗng
      //   - aiPersona.confusionLevel phải > 0
      //   - teachingScore phải là null (chưa kết thúc)
      expect(true).toBe(false); // TODO
    });
  });

  describe('sendMessage()', () => {
    it('phải lưu tin nhắn HS và trả về phản hồi AI dạng "hỏi ngược"', async () => {
      // Arrange: mock phiên dạy active với conversation hiện tại
      const dto: SendMessageDto = {
        sessionId: 'session-123',
        content: 'Quang hợp là quá trình cây tạo thức ăn từ ánh sáng',
      };

      // Act: gọi service.sendMessage(studentId, dto)
      // Assert:
      //   - Kết quả (AI reply) phải có role = 'ai_learner'
      //   - content KHÔNG ĐƯỢC chứa đáp án trực tiếp
      //   - content NÊN chứa dấu "?" (câu hỏi ngược)
      //   - conversation trong DB phải tăng thêm 2 message
      expect(true).toBe(false); // TODO
    });

    it('phải ném lỗi khi phiên đã kết thúc', async () => {
      // Arrange: mock session có status = 'completed'
      // Act & Assert: expect(...).rejects.toThrow(BadRequestException)
      expect(true).toBe(false); // TODO
    });
  });

  describe('endSession()', () => {
    it('phải tính teachingScore và cập nhật mastery vào PostgreSQL', async () => {
      // Arrange: mock session active với conversation có ≥ 4 messages
      // Act: gọi service.endSession(studentId, sessionId)
      // Assert:
      //   - Kết quả phải có teachingScore (0-100)
      //   - cognitiveInsights phải có strongPoints và weakPoints
      //   - masteryDelta phải là số (có thể âm hoặc dương)
      //   - MongoDB session.status phải chuyển thành 'completed'
      //   - PostgreSQL mastery_scores phải được cập nhật
      expect(true).toBe(false); // TODO
    });
  });
});
```

### 3.3 Backend Test #3: Quiz Service

```typescript
// === quiz.service.spec.ts ===
// Mục đích: Xác minh quiz thích nghi tự điều chỉnh độ khó

import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';

describe('QuizService', () => {
  let service: QuizService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        // TODO: Mock MongoQuizContentRepository
        // TODO: Mock PgQuizResultRepository
        // TODO: Mock MongoLearningProfileRepository
        // TODO: Mock AIService (cho việc generate câu hỏi)
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  describe('generateQuiz()', () => {
    it('phải tạo quiz với độ khó phù hợp mastery level hiện tại', async () => {
      // Arrange: mock learning profile có mastery "quang_hop" = 0.3 (yếu)
      const dto: GenerateQuizDto = {
        courseId: 'course-1',
        topic: 'Quang hợp',
        questionCount: 5,
      };

      // Act: gọi service.generateQuiz(studentId, dto)
      // Assert:
      //   - questions.length === 5
      //   - Mỗi question phải có id, type, question, difficulty
      //   - difficulty trung bình phải ≤ 3 (vì mastery thấp)
      expect(true).toBe(false); // TODO
    });
  });

  describe('submitQuiz()', () => {
    it('phải tính điểm, lưu PostgreSQL, và trả về weakTopics', async () => {
      // Arrange: mock quiz có 5 câu, HS trả lời đúng 3
      // Act: gọi service.submitQuiz(studentId, submitDto)
      // Assert:
      //   - score === 60
      //   - weakTopics phải là mảng non-empty
      //   - recommendedActions phải có ít nhất 1 đề xuất
      //   - PgQuizResult phải được INSERT
      expect(true).toBe(false); // TODO
    });
  });
});
```

### 3.4 Frontend Integration Test: Luồng Teaching Arena

```typescript
// === TeachingArena.integration.test.tsx ===
// Mục đích: Xác minh luồng "Dạy cho AI" end-to-end trên UI

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('TeachingArena — Luồng dạy AI end-to-end', () => {
  // TODO: Mock API calls (msw hoặc jest.mock)
  // TODO: Mock AuthContext (user đã đăng nhập, role = student)

  it('Bước 1: HS chọn chủ đề → phiên dạy mới được tạo', async () => {
    // Arrange: render TeachingArena component
    // Act: click vào topic "Quang hợp"
    // Assert:
    //   - API POST /api/sessions được gọi
    //   - Chat UI hiển thị với conversation rỗng
    //   - AI gửi tin nhắn chào đầu tiên dạng "hỏi ngược"
    expect(true).toBe(false); // TODO
  });

  it('Bước 2: HS gửi tin nhắn giảng bài → AI phản hồi bằng câu hỏi', async () => {
    // Arrange: phiên dạy đã active
    // Act: gõ "Quang hợp là quá trình..." và nhấn Send
    // Assert:
    //   - Tin nhắn HS xuất hiện trong chat (role: student)
    //   - Loading indicator hiển thị
    //   - AI reply xuất hiện (role: ai_learner)
    //   - AI reply chứa câu hỏi (có dấu "?")
    expect(true).toBe(false); // TODO
  });

  it('Bước 3: HS kết thúc phiên → hiển thị Teaching Score', async () => {
    // Arrange: phiên dạy có ≥ 4 messages
    // Act: click nút "Kết thúc phiên dạy"
    // Assert:
    //   - API POST /api/sessions/:id/end được gọi
    //   - Teaching Score hiển thị (0-100)
    //   - Danh sách strongPoints và weakPoints hiển thị
    //   - Nút "Dạy chủ đề khác" xuất hiện
    expect(true).toBe(false); // TODO
  });
});
```

---

## 4. Validation Checklist — Definition of Done

### 4.1 Mọi API endpoint phải đạt

- [ ] Tuân thủ đúng Interface/DTO đã định nghĩa ở Section 1
- [ ] Trả về HTTP status code đúng (200, 201, 400, 401, 403, 404)
- [ ] Có validation input (class-validator decorators trong Nest.js)
- [ ] Có error handling — không bao giờ trả raw error cho client
- [ ] Có auth guard — endpoints cần đăng nhập phải check JWT
- [ ] Role-based access — student không truy cập dashboard GV và ngược lại

### 4.2 Mọi database operation phải đạt

- [ ] Dữ liệu quan hệ (users, courses, scores) → **chỉ PostgreSQL**
- [ ] Dữ liệu linh hoạt (sessions, profiles, quiz content) → **chỉ MongoDB**
- [ ] Cross-DB reference dùng `studentId` string — không dùng ObjectId cho PostgreSQL FK
- [ ] Mọi write operation có error handling (try/catch)
- [ ] Seed data có sẵn để demo không cần nhập tay

### 4.3 Mọi AI interaction phải đạt

- [ ] AI **KHÔNG BAO GIỜ** trả lời đáp án trực tiếp
- [ ] AI luôn phản hồi bằng câu hỏi gợi mở hoặc yêu cầu giải thích thêm
- [ ] Có fallback response khi API AI không khả dụng (offline mode)
- [ ] Prompt có chứa context chủ đề + conversation history
- [ ] Teaching Score được tính sau khi kết thúc phiên

### 4.4 Mọi Frontend component phải đạt

- [ ] Mọi element tương tác có `data-testid` duy nhất
- [ ] Loading states cho mọi API call
- [ ] Error states hiển thị thông báo thân thiện
- [ ] Responsive trên màn hình ≥ 768px
- [ ] Routing bảo vệ theo role (student vs teacher)

### 4.5 Trước khi demo phải đạt

- [ ] Happy path chạy end-to-end: Register → Login → Dạy AI → Quiz → Dashboard
- [ ] Có ≥ 2 tài khoản seed (1 student, 1 teacher)
- [ ] Có ≥ 1 course với quiz content sẵn
- [ ] Offline fallback hoạt động khi mất kết nối AI API
- [ ] Video backup đã quay xong

---

> *Phase 3 hoàn tất. Tài liệu này là boundary contract — mọi code viết sau đây PHẢI tuân thủ.*
> *Phiên bản: 1.0 — 24/04/2026*
