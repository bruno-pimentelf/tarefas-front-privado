// Re-export all API types
export * from "./types"

// Re-export API clients
export { assessmentsApi, ApiClient, type ApiError } from "./client"
export { itemsApi } from "./questions"

// Re-export Collections API functions
export {
  listCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addQuestionsToCollection,
  removeQuestionsFromCollection,
} from "./collections"

// Re-export Questions API functions
export {
  searchQuestions,
  getQuestionById,
  getQuestionsByIds,
} from "./questions"

// Re-export Matrices API functions
export {
  getMatrices,
} from "./matrices"

// Re-export Bookings API functions and types
export {
  getTeacherClasses,
  createBooking,
  getStudentBookings,
  bookingsApi,
  type TeacherClass,
  type School,
  type Booking,
  type BookingsResponse,
  type CreateBookingInput,
} from "./bookings"

// Re-export Admissions API functions and types
export {
  getAdmissionsByBookingAndUser,
  createAdmission,
  deleteAdmission,
  type Admission,
  type CreateAdmissionInput,
  type Record,
  type ExamRecord,
  type RecordQuestion,
  type Theme,
  type QuestionAlternative,
  type ExamQuestion,
} from "./admissions"

// Re-export Exams API functions and types
export {
  createExams,
  updateExam,
  deleteExam,
  getExamsByAdmission,
  getExamWithQuestions,
  type Exam,
  type CreateExamInput,
  type CreateExamsBatchInput,
  type UpdateExamInput,
  type ExamWithQuestions,
  type PaginatedExamsResponse,
} from "./exams"

// Re-export Records API functions and types
export {
  createRecord,
  answerQuestion,
  answerEssay,
  finishRecord,
  updateElapsedTime,
  type Record as RecordType,
  type RecordQuestion as RecordQuestionType,
  type Essay,
  type CreateRecordInput,
  type AnswerQuestionInput,
  type AnswerEssayInput,
  type FinishRecordInput,
  type UpdateElapsedTimeInput,
} from "./records"

