import { assessmentsApi } from "./client"

// ==========================================
// Types para Admissions API
// ==========================================

export interface Theme {
  id: number
  name: string
}

export interface QuestionAlternative {
  id: number
  content: string
  isCorrect: boolean
  order?: number // Campo opcional para ordenação
}

export interface ExamQuestion {
  id: number
  name: string
  content: string
  status: string
  language: string
  order?: number // Ordem da questão na collection (da tabela collection_question)
  // Campo pode vir como 'alternatives' ou 'alternativesRelation' dependendo da origem
  alternatives?: QuestionAlternative[]
  alternativesRelation?: QuestionAlternative[]
}

export interface Exam {
  id: number
  title: string
  admissionId: number
  collectionId: number
  themeId?: number
  theme?: Theme
  questions?: ExamQuestion[]
  createdAt: string
  updatedAt: string
}

export interface RecordQuestion {
  id: number
  questionId: number
  alternativeId: number | null
  answer: string | null
  score: number | null
  correction: string | null
  createdAt: string
  updatedAt: string
}

export interface ExamRecord {
  id: number
  examId: number
  essayId: number | null
  essay: any | null
  score: number | null
  createdAt: string
  updatedAt: string
  recordQuestions: RecordQuestion[]
}

export interface Record {
  id: number
  userId: string
  admissionId: number
  score: number | null
  totalTime: number | null
  elapsedTime: number | null
  elapsedTimeInSeconds?: number | null // Campo retornado pela API /records/finish
  finishedAt: string | null
  createdAt: string
  updatedAt: string
  examRecords: ExamRecord[]
}

export interface Admission {
  id: number
  bookingId: number
  title: string
  description?: string
  instructions?: string
  bannerImage?: string
  available: boolean
  duration: number
  exams: Exam[]
  record?: Record | null
  createdAt: string
  updatedAt: string
}

export interface CreateAdmissionInput {
  bookingId: number
  title: string
  description?: string
  instructions?: string
  bannerImage?: string
  available?: boolean
  duration: number
}

// ==========================================
// API Functions - Admissions
// ==========================================

/**
 * Lista admissions por booking e usuário
 * GET /admissions/by-booking/:bookingId/user/:userId
 */
export async function getAdmissionsByBookingAndUser(
  bookingId: number,
  userId: string
): Promise<Admission[]> {
  try {
    const response = await assessmentsApi.get<Admission[]>(
      `/admissions/by-booking/${bookingId}/user/${userId}`
    )
    return response || []
  } catch (error: any) {
    // Retorna array vazio para erros 404 e 500 (usuário não encontrado ou erro interno)
    if (error?.status === 404 || error?.status === 500) {
      return []
    }
    throw error
  }
}

/**
 * Cria uma nova admission
 * POST /admissions
 */
export async function createAdmission(data: CreateAdmissionInput): Promise<Admission> {
  const response = await assessmentsApi.post<Admission>("/admissions", data)
  return response
}

/**
 * Deleta uma admission
 * DELETE /admissions/:id
 */
export async function deleteAdmission(id: number): Promise<{ message: string }> {
  const response = await assessmentsApi.delete<{ message: string }>(`/admissions/${id}`)
  return response
}

