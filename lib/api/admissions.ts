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

// Cache para armazenar admissions e evitar chamadas redundantes
// Chave: `${bookingId}-${userId}`, Valor: { data: Admission[], timestamp: number }
const admissionsCache = new Map<string, { data: Admission[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos em milissegundos

/**
 * Limpa o cache de admissions (útil quando uma admission é criada/atualizada)
 * @param bookingId - ID do booking (opcional)
 * @param userId - ID do usuário (opcional)
 * Se ambos forem fornecidos, limpa apenas o cache específico
 * Se nenhum for fornecido, limpa todo o cache
 */
export function clearAdmissionsCache(bookingId?: number, userId?: string) {
  if (bookingId !== undefined && userId !== undefined) {
    // Limpa cache específico
    const key = `${bookingId}-${userId}`
    admissionsCache.delete(key)
  } else if (bookingId !== undefined) {
    // Limpa todos os caches deste booking (para todos os usuários)
    const keysToDelete: string[] = []
    admissionsCache.forEach((_, key) => {
      if (key.startsWith(`${bookingId}-`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => admissionsCache.delete(key))
  } else {
    // Limpa todo o cache
    admissionsCache.clear()
  }
}

/**
 * Lista admissions por booking e usuário
 * GET /admissions/by-booking/:bookingId/user/:userId
 * Implementa cache para evitar chamadas redundantes
 */
export async function getAdmissionsByBookingAndUser(
  bookingId: number,
  userId: string,
  options?: { useCache?: boolean; forceRefresh?: boolean }
): Promise<Admission[]> {
  const useCache = options?.useCache !== false // Cache habilitado por padrão
  const forceRefresh = options?.forceRefresh === true
  
  const cacheKey = `${bookingId}-${userId}`
  
  // Verificar cache se não for refresh forçado
  if (useCache && !forceRefresh) {
    const cached = admissionsCache.get(cacheKey)
    if (cached) {
      const now = Date.now()
      // Se o cache ainda é válido (menos de 5 minutos), retorna os dados em cache
      if (now - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }
      // Cache expirado, remove
      admissionsCache.delete(cacheKey)
    }
  }

  try {
    const response = await assessmentsApi.get<Admission[]>(
      `/admissions/by-booking/${bookingId}/user/${userId}`
    )
    const admissions = response || []
    
    // Armazenar no cache
    if (useCache) {
      admissionsCache.set(cacheKey, {
        data: admissions,
        timestamp: Date.now(),
      })
    }
    
    return admissions
  } catch (error: any) {
    // Retorna array vazio para erros 404 e 500 (usuário não encontrado ou erro interno)
    if (error?.status === 404 || error?.status === 500) {
      // Armazenar array vazio no cache para evitar tentativas repetidas
      if (useCache) {
        admissionsCache.set(cacheKey, {
          data: [],
          timestamp: Date.now(),
        })
      }
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
  // Limpar cache do booking relacionado para forçar refresh
  clearAdmissionsCache(data.bookingId, undefined)
  return response
}

/**
 * Deleta uma admission
 * DELETE /admissions/:id
 * Nota: Para limpar o cache corretamente, é necessário passar bookingId e userId
 */
export async function deleteAdmission(
  id: number,
  bookingId?: number,
  userId?: string
): Promise<{ message: string }> {
  const response = await assessmentsApi.delete<{ message: string }>(`/admissions/${id}`)
  // Limpar cache se bookingId e userId foram fornecidos
  if (bookingId !== undefined && userId !== undefined) {
    clearAdmissionsCache(bookingId, userId)
  }
  return response
}

