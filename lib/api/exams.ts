import { assessmentsApi } from "./client"
import { Exam, ExamQuestion, Theme } from "./admissions"

// ==========================================
// Types para Exams API
// ==========================================

export interface CreateExamInput {
  title: string
  admissionId: number
  collectionId: number
  themeId?: number
}

export interface CreateExamsBatchInput {
  exams: CreateExamInput[]
}

export interface UpdateExamInput {
  title?: string
  collectionId?: number
  themeId?: number
}

export interface ExamWithQuestions {
  id: number
  title: string
  admissionId: number
  collectionId: number
  theme?: Theme
  questions: ExamQuestion[]
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedExamsResponse {
  items: Exam[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ==========================================
// API Functions - Exams
// ==========================================

/**
 * Cria exams em batch
 * POST /exams
 */
export async function createExams(data: CreateExamsBatchInput): Promise<Exam[]> {
  const response = await assessmentsApi.post<Exam[]>("/exams", data)
  return response
}

/**
 * Atualiza um exam
 * PATCH /exams/:id
 */
export async function updateExam(id: number, data: UpdateExamInput): Promise<Exam> {
  const response = await assessmentsApi.patch<Exam>(`/exams/${id}`, data)
  return response
}

/**
 * Deleta um exam
 * DELETE /exams/:id
 */
export async function deleteExam(id: number): Promise<{ message: string }> {
  const response = await assessmentsApi.delete<{ message: string }>(`/exams/${id}`)
  return response
}

/**
 * Lista exams paginados por admission
 * GET /exams/paginated/:admissionId?page=1&limit=10
 */
export async function getExamsByAdmission(
  admissionId: number,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedExamsResponse> {
  try {
    const response = await assessmentsApi.get<PaginatedExamsResponse>(
      `/exams/paginated/${admissionId}?page=${page}&limit=${limit}`
    )
    return response || { items: [], meta: { page, limit, total: 0, totalPages: 0 } }
  } catch (error: any) {
    if (error?.status === 404) {
      return { items: [], meta: { page, limit, total: 0, totalPages: 0 } }
    }
    throw error
  }
}

/**
 * Busca exam com questões
 * GET /exams/:id/with-questions
 */
export async function getExamWithQuestions(id: number): Promise<ExamWithQuestions> {
  const response = await assessmentsApi.get<ExamWithQuestions>(`/exams/${id}/with-questions`)
  return response
}

// Re-export types from admissions for convenience
export type { Exam, ExamQuestion, Theme }

