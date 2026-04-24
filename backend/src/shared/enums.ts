/**
 * Enums dùng chung cho toàn bộ hệ thống BrainLift.
 * Tuân thủ nghiêm ngặt testing-boundaries.md Section 1.1
 */

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
  STUDENT = 'student',
  AI_LEARNER = 'ai_learner',
}

/** Loại câu hỏi quiz */
export enum QuizType {
  MULTIPLE_CHOICE = 'multiple_choice',
  EXPLAIN = 'explain',
  TRUE_FALSE = 'true_false',
}
