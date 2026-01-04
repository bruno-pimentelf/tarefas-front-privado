// Re-export all API types
export * from "./types"

// Re-export API clients
export { assessmentsApi, ApiClient, type ApiError, usersApi } from "./client"
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
  updateBooking,
  getStudentBookings,
  bookingsApi,
  type TeacherClass,
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
  createUser,
  type SyncedUser,
  type SyncUserInput,
  type CreateUserInput,
  type CreateUserResponse,
  type Address,
} from "./users"

// Re-export Roles API functions and types
export {
  getRoles,
  getUserRole,
  setUserRole,
  type Role,
  type UserSchool,
  type SetRoleRequest,
} from "./roles"

// Re-export Analytics API functions and types
export {
  getItemAnalysis,
  getComponentStats,
  getClassComponentReport,
  getStudentScores,
  getScoreDistribution,
  getComponentRangeDistribution,
  type ItemAnalysisResponse,
  type ItemAnalysisItem,
  type ComponentStatsResponse,
  type ComponentStat,
  type ClassComponentReportResponse,
  type ClassComponentReportItem,
  type StudentScoresResponse,
  type StudentScore,
  type ScoreDistributionResponse,
  type ScoreDistributionBucket,
  type ComponentRangeDistributionResponse,
  type ComponentRangeDistribution,
  type AnalyticsFilters,
} from "./analytics"

// Re-export Classes API functions and types
export {
  getClassById,
  listClasses,
  getCoordinatorClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassStudentsCount,
  type Class,
  type PaginatedClassesResponse,
  type CreateClassInput,
  type UpdateClassInput,
  type ClassStudentsCountResponse,
} from "./classes"

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
  listUsersBySchool,
  listAllUsers,
  listClassesByUser,
  addUserToClass,
  bulkAddUsersToClass,
  removeUserFromClass,
  type User as UserClassUser,
  type PaginatedUsersResponse,
  type PaginatedClassesResponse as UserClassPaginatedClassesResponse,
  type AddUserToClassInput,
  type AddUserToClassResponse,
  type BulkAddUsersToClassInput,
  type BulkAddUsersToClassResponse,
  type RemoveUserFromClassResponse,
} from "./user-class"