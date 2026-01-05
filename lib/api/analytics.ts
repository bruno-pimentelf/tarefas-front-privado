import { assessmentsApi } from "./client"

// Types for analytics filters
export interface AnalyticsFilters {
  classIds?: number[]
  grade?: string
  schoolYear?: string
}

// Item Analysis Types
export interface ItemAnalysisItem {
  itemId: number
  itemNumber: number
  componentName: string
  correctAnswers: number
  totalAnswers: number
  accuracyRate: number
  difficulty?: string
}

export interface ItemAnalysisResponse {
  items: ItemAnalysisItem[]
  totalItems: number
  averageAccuracy: number
}

// Component Stats Types
export interface ComponentStat {
  componentId: number
  componentName: string
  averageScore: number
  correctAnswers: number
  totalQuestions: number
}

export interface ComponentStatsResponse {
  components: ComponentStat[]
  totalComponents: number
  overallAverage: number
  // Campos opcionais que podem estar presentes na resposta
  overallCorrectAnswers?: number
  overallTotalQuestions?: number
}

// Class Component Report Types
export interface ClassComponentReportItem {
  classId: number
  className: string
  componentId: number
  componentName: string
  year: string
  grade: string
  averageScore: number
  percentile: number
  totalStudents: number
  // Percentis por faixa de score (opcionais - podem não estar presentes na API)
  percentile_0_2_5?: number
  percentile_2_5_5_0?: number
  percentile_5_0_7_5?: number
  percentile_7_5_10?: number
}

export interface ClassComponentReportResponse {
  data: ClassComponentReportItem[]
}

// Student Scores Types
export interface StudentScore {
  studentId: number
  studentName: string
  email: string
  className: string
  averageScore?: number
  totalCorrect: number
  totalQuestions: number
  rankingSchool: number
  rankingClass: number
  // Campos opcionais que podem estar presentes na resposta
  componentScores?: {
    LC?: number
    MT?: number
    CN?: number
    CH?: number
  }
  essayScore?: number | null
}

export interface StudentScoresResponse {
  students: StudentScore[]
  totalStudents: number
}

// Score Distribution Types
export interface ScoreDistributionBucket {
  range: string
  count: number
  percentage: number
}

export interface ScoreDistributionResponse {
  buckets: ScoreDistributionBucket[]
  totalStudents: number
  averageScore: number
  medianScore: number
}

// Component Range Distribution Types
export interface ComponentRangeDistribution {
  componentId: number
  componentName: string
  ranges: {
    range: string
    count: number
    percentage: number
  }[]
  // Campos diretos de range (opcionais - podem não estar presentes na API)
  range_0_2_5?: number
  range_2_5_5_0?: number
  range_5_0_7_5?: number
  range_7_5_10?: number
}

export interface ComponentRangeDistributionResponse {
  components: ComponentRangeDistribution[]
}

// Student Stats Types
export interface StudentStats {
  userId: string
  totalQuestionsAnswered: number
  totalScore: number
  accuracyRate: number
  finishedRecordsCount: number
}

/**
 * Get item analysis for a specific admission
 * GET /analytics/item-analysis/:admissionId
 */
export async function getItemAnalysis(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ItemAnalysisResponse> {
  const params = new URLSearchParams()
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }

  const queryString = params.toString()
  const url = queryString
    ? `/analytics/item-analysis/${admissionId}?${queryString}`
    : `/analytics/item-analysis/${admissionId}`

  return assessmentsApi.get<ItemAnalysisResponse>(url)
}

/**
 * Get component statistics for a specific admission
 * GET /analytics/component-stats/:admissionId
 */
export async function getComponentStats(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ComponentStatsResponse> {
  const params = new URLSearchParams()
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }

  const queryString = params.toString()
  const url = queryString
    ? `/analytics/component-stats/${admissionId}?${queryString}`
    : `/analytics/component-stats/${admissionId}`

  return assessmentsApi.get<ComponentStatsResponse>(url)
}

/**
 * Get class component report for a specific admission
 * GET /analytics/class-component-report/:admissionId
 */
export async function getClassComponentReport(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ClassComponentReportResponse> {
  const params = new URLSearchParams()
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }

  const queryString = params.toString()
  const url = queryString
    ? `/analytics/class-component-report/${admissionId}?${queryString}`
    : `/analytics/class-component-report/${admissionId}`

  return assessmentsApi.get<ClassComponentReportResponse>(url)
}

/**
 * Get student scores for a specific admission
 * GET /analytics/student-scores/:admissionId
 */
export async function getStudentScores(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<StudentScoresResponse> {
  const params = new URLSearchParams()
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }

  const queryString = params.toString()
  const url = queryString
    ? `/analytics/student-scores/${admissionId}?${queryString}`
    : `/analytics/student-scores/${admissionId}`

  return assessmentsApi.get<StudentScoresResponse>(url)
}

/**
 * Get score distribution for a specific admission
 * GET /analytics/score-distribution/:admissionId
 */
export async function getScoreDistribution(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ScoreDistributionResponse> {
  const params = new URLSearchParams()
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }

  const queryString = params.toString()
  const url = queryString
    ? `/analytics/score-distribution/${admissionId}?${queryString}`
    : `/analytics/score-distribution/${admissionId}`

  return assessmentsApi.get<ScoreDistributionResponse>(url)
}

/**
 * Get component range distribution for a specific admission
 * GET /analytics/component-range-distribution/:admissionId
 */
export async function getComponentRangeDistribution(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ComponentRangeDistributionResponse> {
  const params = new URLSearchParams()
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }

  const queryString = params.toString()
  const url = queryString
    ? `/analytics/component-range-distribution/${admissionId}?${queryString}`
    : `/analytics/component-range-distribution/${admissionId}`

  return assessmentsApi.get<ComponentRangeDistributionResponse>(url)
}

/**
 * Get student statistics
 * GET /analytics/student-stats?userId={userId}
 */
export async function getStudentStats(userId: string): Promise<StudentStats> {
  const url = `/analytics/student-stats?userId=${userId}`
  return assessmentsApi.get<StudentStats>(url)
}
