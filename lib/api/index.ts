// Re-export all API types
export * from "./types"

// Re-export API clients
export { assessmentsApi, usersApi, ApiClient, type ApiError } from "./client"
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
  createBooking,
  updateBooking,
  getStudentBookings,
  bookingsApi,
  type TeacherClass,
  type School as BookingSchool,
  type Booking,
  type BookingsResponse,
  type CreateBookingInput,
  type UpdateBookingInput,
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

// Re-export Users API functions and types
export {
  syncUser,
  type SyncedUser,
  type SyncUserInput,
  type Address,
} from "./users"

// Re-export Roles API functions and types
export {
  listRoles,
  getUserRole,
  setAssessmentsRole,
  type Role,
  type UserRole as AssessmentUserRole,
  type School as RoleSchool,
  type SetAssessmentsRoleInput,
  type SetAssessmentsRoleResponse,
} from "./roles"

// Re-export Analytics API functions and types
export {
  getItemAnalysis,
  getClassComponentReport,
  getComponentStats,
  getStudentScores,
  getScoreDistribution,
  getComponentRangeDistribution,
  type ItemAnalysisResponse,
  type ItemAnalysisQuestion,
  type ItemAnalysisStudent,
  type ItemAnalysisSummary,
  type ClassComponentReportResponse,
  type ClassComponentReportItem,
  type ComponentStatsResponse,
  type ComponentStatsItem,
  type StudentScoresResponse,
  type StudentScore,
  type ScoreDistributionResponse,
  type ScoreDistributionItem,
  type ComponentRangeDistributionResponse,
  type ComponentRangeDistributionItem,
} from "./analytics"

// Re-export Classes API functions and types
export {
  getClassById,
  listClasses,
  getTeacherClasses,
  getStudentClassIds,
  getClassStudentsCount,
  createClass,
  updateClass,
  deleteClass,
  type Class,
  type PaginatedClassesResponse,
  type CreateClassInput,
  type UpdateClassInput,
  type ClassStudentsCountResponse,
  type School as ClassSchool,
} from "./classes"

// Note: getTeacherClasses is now exported from classes.ts (migrated from bookings.ts)
// The function in bookings.ts is kept for backward compatibility but uses the new route

// Re-export Schools API functions and types
export {
  listSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  type School,
  type PaginatedSchoolsResponse,
  type CreateSchoolInput,
  type UpdateSchoolInput,
  type Address as SchoolAddress,
} from "./schools"

// Re-export User-Class API functions and types
export {
  listUsersByClass,
  listClassesByUser,
  addUserToClass,
  bulkAddUsersToClass,
  removeUserFromClass,
  type User,
  type PaginatedUsersResponse,
  type PaginatedClassesResponse as UserClassPaginatedClassesResponse,
  type AddUserToClassInput,
  type AddUserToClassResponse,
  type BulkAddUsersToClassInput,
  type BulkAddUsersToClassResponse,
  type RemoveUserFromClassResponse,
  type UserRole,
} from "./user-class"