import { assessmentsApi } from "./client"

// ==========================================
// Types para Analytics API
// ==========================================

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
}

export interface ClassComponentReportResponse {
  data: ClassComponentReportItem[]
}

export interface ComponentStatsItem {
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
  components: ComponentStatsItem[]
}

export interface StudentScoresComponentScores {
  LC?: number
  MT?: number
  CN?: number
  CH?: number
}

export interface StudentScore {
  rankingTrieduc: number
  rankingSchool: number
  studentName: string
  email: string
  className: string
  componentScores: StudentScoresComponentScores
  essayScore: number | null
  averageScore: number
}

export interface StudentScoresResponse {
  students: StudentScore[]
}

export interface ScoreDistributionItem {
  score: number
  studentCount: number
}

export interface ScoreDistributionResponse {
  distribution: ScoreDistributionItem[]
}

export interface ComponentRangeDistributionItem {
  componentId: string
  componentName: string
  range_0_2_5: number
  range_2_5_5_0: number
  range_5_0_7_5: number
  range_7_5_10: number
}

export interface ComponentRangeDistributionResponse {
  components: ComponentRangeDistributionItem[]
}

export interface AnalyticsFilters {
  admissionId: number
  schoolYear?: string
  grade?: string
  classIds?: number[]
  matrixIds?: string[]
}

// ==========================================
// API Functions
// ==========================================

/**
 * Análise de Itens
 * GET /analytics/item-analysis
 * 
 * Retorna análise detalhada de itens (questões) por estudante
 */
export async function getItemAnalysis(
  admissionId: number,
  filters?: {
    classIds?: number[]
    grade?: string
    matrixIds?: string[]
  }
): Promise<ItemAnalysisResponse> {
  const params = new URLSearchParams()
  params.append("admissionId", String(admissionId))
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }
  
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  
  if (filters?.matrixIds && filters.matrixIds.length > 0) {
    params.append("matrixIds", filters.matrixIds.join(","))
  }

  return assessmentsApi.get<ItemAnalysisResponse>(`/analytics/item-analysis?${params.toString()}`)
}

/**
 * Relatório Consolidado por Turma e Componente
 * GET /analytics/class-component-report
 */
export async function getClassComponentReport(
  admissionId: number,
  filters?: {
    schoolYear?: string
    grade?: string
    classIds?: number[]
  }
): Promise<ClassComponentReportResponse> {
  const params = new URLSearchParams()
  params.append("admissionId", String(admissionId))
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  return assessmentsApi.get<ClassComponentReportResponse>(
    `/analytics/class-component-report?${params.toString()}`
  )
}

/**
 * Estatísticas por Componente
 * GET /analytics/component-stats
 */
export async function getComponentStats(
  admissionId: number,
  filters?: {
    schoolYear?: string
    grade?: string
    classIds?: number[]
  }
): Promise<ComponentStatsResponse> {
  const params = new URLSearchParams()
  params.append("admissionId", String(admissionId))
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  return assessmentsApi.get<ComponentStatsResponse>(
    `/analytics/component-stats?${params.toString()}`
  )
}

/**
 * Notas por Estudante
 * GET /analytics/student-scores
 */
export async function getStudentScores(
  admissionId: number,
  filters?: {
    schoolYear?: string
    grade?: string
    classIds?: number[]
  }
): Promise<StudentScoresResponse> {
  const params = new URLSearchParams()
  params.append("admissionId", String(admissionId))
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  return assessmentsApi.get<StudentScoresResponse>(
    `/analytics/student-scores?${params.toString()}`
  )
}

/**
 * Distribuição de Notas
 * GET /analytics/score-distribution
 */
export async function getScoreDistribution(
  admissionId: number,
  filters?: {
    schoolYear?: string
    grade?: string
    classIds?: number[]
  }
): Promise<ScoreDistributionResponse> {
  const params = new URLSearchParams()
  params.append("admissionId", String(admissionId))
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  return assessmentsApi.get<ScoreDistributionResponse>(
    `/analytics/score-distribution?${params.toString()}`
  )
}

/**
 * Distribuição por Faixa de Média
 * GET /analytics/component-range-distribution
 */
export async function getComponentRangeDistribution(
  admissionId: number,
  filters?: {
    schoolYear?: string
    grade?: string
    classIds?: number[]
  }
): Promise<ComponentRangeDistributionResponse> {
  const params = new URLSearchParams()
  params.append("admissionId", String(admissionId))
  
  if (filters?.schoolYear) {
    params.append("schoolYear", filters.schoolYear)
  }
  
  if (filters?.grade) {
    params.append("grade", filters.grade)
  }
  
  if (filters?.classIds && filters.classIds.length > 0) {
    params.append("classIds", filters.classIds.join(","))
  }

  return assessmentsApi.get<ComponentRangeDistributionResponse>(
    `/analytics/component-range-distribution?${params.toString()}`
  )
}
