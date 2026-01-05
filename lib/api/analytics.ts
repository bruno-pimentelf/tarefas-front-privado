import { assessmentsApi, usersApi } from "./client"

// Types for analytics filters
export interface AnalyticsFilters {
  classIds?: number[]
  grade?: string
  schoolYear?: string
  matrixIds?: string[]
}

// Item Analysis Types (conforme documentação)
export interface ItemAnalysisQuestion {
  id: number
  order: number
  name: string
  correctRate: number
}

export interface ItemAnalysisAnswer {
  questionId: number
  isCorrect: boolean
}

export interface ItemAnalysisStudent {
  userId: string
  name: string
  correctRate: number
  correctCount: number
  totalQuestions: number
  answers: ItemAnalysisAnswer[]
}

export interface ItemAnalysisSummary {
  totalStudents: number
  totalQuestions: number
  averageCorrectRate: number
}

export interface ItemAnalysisResponse {
  questions: ItemAnalysisQuestion[]
  students: ItemAnalysisStudent[]
  summary: ItemAnalysisSummary
}

// Tipos legados para compatibilidade com UI existente
export interface ItemAnalysisItem {
  itemId: number
  itemNumber: number
  componentName: string
  correctAnswers: number
  totalAnswers: number
  accuracyRate: number
  difficulty?: string
}

// Component Stats Types (conforme documentação)
export interface ComponentStat {
  componentId: string
  componentName: string
  averageScore: number
  correctAnswers: number
  totalQuestions: number
}

export interface ComponentStatsResponse {
  overallAverage: number
  overallCorrectAnswers: number
  overallTotalQuestions: number
  components: ComponentStat[]
  // Campo legado para compatibilidade
  totalComponents?: number
}

// Class Component Report Types (conforme documentação)
export interface ClassComponentReportItem {
  year: string
  grade: string
  classId: string
  className: string
  componentId: string
  componentName: string
  averageScore: number
  percentile_0_2_5: number
  percentile_2_5_5_0: number
  percentile_5_0_7_5: number
  percentile_7_5_10: number
  // Campos legados para compatibilidade
  percentile?: number
  totalStudents?: number
}

export interface ClassComponentReportResponse {
  data: ClassComponentReportItem[]
}

// Student Scores Types (conforme documentação)
export interface StudentScore {
  rankingTrieduc: number
  rankingSchool: number
  studentName: string
  email: string
  className: string
  componentScores: {
    LC?: number
    MT?: number
    CN?: number
    CH?: number
  }
  essayScore: number | null
  averageScore: number
  // Campos legados para compatibilidade
  studentId?: number
  rankingClass?: number
  totalCorrect?: number
  totalQuestions?: number
}

export interface StudentScoresResponse {
  students: StudentScore[]
  // totalStudents removido conforme documentação (não está na resposta)
}

// Score Distribution Types (conforme documentação)
export interface ScoreDistributionItem {
  score: number
  studentCount: number
}

export interface ScoreDistributionResponse {
  distribution: ScoreDistributionItem[]
  // Campos legados para compatibilidade com UI existente
  buckets?: Array<{ range: string; count: number; percentage: number }>
  totalStudents?: number
  averageScore?: number
  medianScore?: number
}

// Component Range Distribution Types (conforme documentação)
export interface ComponentRangeDistribution {
  componentId: string
  componentName: string
  range_0_2_5: number
  range_2_5_5_0: number
  range_5_0_7_5: number
  range_7_5_10: number
  // Campos legados para compatibilidade
  ranges?: Array<{ range: string; count: number; percentage: number }>
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
 * GET /analytics/item-analysis?admissionId={admissionId}&classIds={classIds}&grade={grade}&matrixIds={matrixIds}
 * Conforme documentação: admissionId é query parameter, não path parameter
 */
export async function getItemAnalysis(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ItemAnalysisResponse> {
  const params = new URLSearchParams()
  
  params.append("admissionId", admissionId.toString())
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  if (filters?.matrixIds && filters.matrixIds.length > 0) {
    params.append("matrixIds", filters.matrixIds.join(","))
  }

  const url = `/analytics/item-analysis?${params.toString()}`
  return assessmentsApi.get<ItemAnalysisResponse>(url)
}

/**
 * Get component statistics for a specific admission
 * GET /analytics/component-stats?admissionId={admissionId}&schoolYear={schoolYear}&grade={grade}&classIds={classIds}
 */
export async function getComponentStats(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ComponentStatsResponse> {
  const params = new URLSearchParams()
  
  params.append("admissionId", admissionId.toString())
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  const url = `/analytics/component-stats?${params.toString()}`
  return assessmentsApi.get<ComponentStatsResponse>(url)
}

/**
 * Get class component report for a specific admission
 * GET /analytics/class-component-report?admissionId={admissionId}&schoolYear={schoolYear}&grade={grade}&classIds={classIds}
 */
export async function getClassComponentReport(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ClassComponentReportResponse> {
  const params = new URLSearchParams()
  
  params.append("admissionId", admissionId.toString())
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  const url = `/analytics/class-component-report?${params.toString()}`
  return assessmentsApi.get<ClassComponentReportResponse>(url)
}

/**
 * Get student scores for a specific admission
 * GET /analytics/student-scores?admissionId={admissionId}&schoolYear={schoolYear}&grade={grade}&classIds={classIds}
 */
export async function getStudentScores(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<StudentScoresResponse> {
  const params = new URLSearchParams()
  
  params.append("admissionId", admissionId.toString())
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  const url = `/analytics/student-scores?${params.toString()}`
  return assessmentsApi.get<StudentScoresResponse>(url)
}

/**
 * Get score distribution for a specific admission
 * GET /analytics/score-distribution?admissionId={admissionId}&schoolYear={schoolYear}&grade={grade}&classIds={classIds}
 */
export async function getScoreDistribution(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ScoreDistributionResponse> {
  const params = new URLSearchParams()
  
  params.append("admissionId", admissionId.toString())
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  const url = `/analytics/score-distribution?${params.toString()}`
  return assessmentsApi.get<ScoreDistributionResponse>(url)
}

/**
 * Get component range distribution for a specific admission
 * GET /analytics/component-range-distribution?admissionId={admissionId}&schoolYear={schoolYear}&grade={grade}&classIds={classIds}
 */
export async function getComponentRangeDistribution(
  admissionId: number,
  filters?: AnalyticsFilters
): Promise<ComponentRangeDistributionResponse> {
  const params = new URLSearchParams()
  
  params.append("admissionId", admissionId.toString())
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  const url = `/analytics/component-range-distribution?${params.toString()}`
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
