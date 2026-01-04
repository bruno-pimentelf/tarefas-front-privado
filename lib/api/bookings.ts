import { assessmentsApi } from "./client"

// ==========================================
// Types para Bookings API
// ==========================================

// Import School type from schools module to avoid duplication
import type { School } from "./schools"

export interface TeacherClass {
  id: number
  schoolId: number
  name: string
  grade: string
  school: School
}

export interface Booking {
  id: number
  title: string
  description?: string
  bannerImage?: string
  available: boolean
  startTime: string
  endTime: string
  timezone?: string
  createdAt: string
  updatedAt: string
  // Novos campos retornados pela API
  totalQuestions?: number
  status?: "not_started" | "in_progress" | "finished"
  // Admissions podem ser incluídas quando solicitado
  admissions?: import("./admissions").Admission[]
}

export interface BookingsResponse {
  items: Booking[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateBookingInput {
  title: string
  description?: string
  bannerImage?: string
  available?: boolean
  startTime: string // ISO 8601 UTC
  endTime: string // ISO 8601 UTC
  classIds: number[]
}

export interface UpdateBookingInput {
  title?: string
  description?: string
  bannerImage?: string
  available?: boolean
  startTime?: string // ISO 8601
  endTime?: string // ISO 8601
  classIds?: number[]
}

// ==========================================
// API Functions
// ==========================================

/**
 * Lista as classes (turmas) do professor
 * GET /assessments/class/by-teacher/:userId
 * Migrated from /classes/by-teacher/:userId
 * 
 * This function is kept for backward compatibility.
 * The actual implementation is now in classes.ts
 */
export async function getTeacherClasses(userId: string): Promise<TeacherClass[]> {
  try {
    // Try /classes/by-teacher first (plural), fallback to /class/by-teacher
    let classes
    try {
      classes = await assessmentsApi.get<Array<{
        id: number
        name: string
        grade: string
        schoolYear: string
        schoolId: number
        schoolName?: string
        school?: { id: number; name: string }
      }>>(`/classes/by-teacher/${userId}`)
    } catch (error: any) {
      // If 404, try the singular version
      if (error?.status === 404) {
        classes = await assessmentsApi.get<Array<{
          id: number
          name: string
          grade: string
          schoolYear: string
          schoolId: number
          schoolName?: string
          school?: { id: number; name: string }
        }>>(`/class/by-teacher/${userId}`)
      } else {
        throw error
      }
    }
    
    // Convert to TeacherClass[] format for backward compatibility
    return (classes || []).map((cls) => ({
      id: cls.id,
      schoolId: cls.schoolId,
      name: cls.name,
      grade: cls.grade,
      school: cls.school || { id: cls.schoolId, name: cls.schoolName || "" },
    }))
  } catch (error: any) {
    // Se for erro 404 ou similar, retorna array vazio
    if (error?.status === 404 || error?.status === 403) {
      return []
    }
    throw error
  }
}

/**
 * Cria um novo booking
 * POST /bookings
 */
export async function createBooking(data: CreateBookingInput): Promise<Booking> {
  return assessmentsApi.post<Booking>("/bookings", data)
}

/**
 * Atualiza um booking existente
 * PUT /bookings/:id
 */
export async function updateBooking(id: number, data: UpdateBookingInput): Promise<Booking> {
  return assessmentsApi.put<Booking>(`/bookings/${id}`, data)
}

/**
 * Lista os bookings do aluno (paginado)
 * GET /bookings/student/:userId?page=1&limit=10&include=admissions
 * 
 * @param userId - ID do usuário (Firebase UID)
 * @param page - Número da página (padrão: 1)
 * @param limit - Limite de itens por página (padrão: 10)
 * @param includeAdmissions - Se true, tenta incluir admissions na resposta (padrão: false)
 */
export async function getStudentBookings(
  userId: string,
  page: number = 1,
  limit: number = 10,
  includeAdmissions: boolean = false
): Promise<BookingsResponse> {
  try {
    let url = `/bookings/student/${userId}?page=${page}&limit=${limit}`
    
    // Tenta incluir admissions se solicitado
    if (includeAdmissions) {
      url += "&include=admissions"
    }
    
    const response = await assessmentsApi.get<BookingsResponse>(url)
    
    // Garante que a resposta tenha o formato esperado
    if (!response) {
      return {
        items: [],
        meta: {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0,
        },
      }
    }

    // Garante que items seja um array
    if (!Array.isArray(response.items)) {
      return {
        items: [],
        meta: response.meta || {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0,
        },
      }
    }

    return response
  } catch (error: any) {
    // Se for erro 404 ou similar, retorna resposta vazia em vez de lançar erro
    if (error?.status === 404 || error?.status === 403) {
      return {
        items: [],
        meta: {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0,
        },
      }
    }
    throw error
  }
}

/**
 * Lista os bookings do aluno com admissions já incluídas
 * Esta função tenta usar a rota otimizada, mas se não funcionar,
 * busca admissions em paralelo para todos os bookings
 * 
 * @param userId - ID do usuário (Firebase UID)
 * @param page - Número da página (padrão: 1)
 * @param limit - Limite de itens por página (padrão: 10)
 */
export async function getStudentBookingsWithAdmissions(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<BookingsResponse & { admissionsMap: Map<number, import("./admissions").Admission[]> }> {
  try {
    // Primeiro, tenta buscar com include=admissions
    const response = await getStudentBookings(userId, page, limit, true)
    
    // Verifica se as admissions já vêm na resposta
    const hasAdmissionsInResponse = response.items.some(
      (booking) => (booking as any).admissions && Array.isArray((booking as any).admissions)
    )
    
    if (hasAdmissionsInResponse) {
      // Se já vieram, extrai e mapeia
      const admissionsMap = new Map<number, import("./admissions").Admission[]>()
      response.items.forEach((booking) => {
        if ((booking as any).admissions) {
          admissionsMap.set(booking.id, (booking as any).admissions)
        }
      })
      return { ...response, admissionsMap }
    }
    
    // Se não vieram, busca em paralelo (otimização já implementada)
    const { getAdmissionsByBookingAndUser } = await import("./admissions")
    const admissionsPromises = response.items.map((booking) =>
      getAdmissionsByBookingAndUser(booking.id, userId).catch((err) => {
        console.error(`Erro ao buscar admissions do booking ${booking.id}:`, err)
        return []
      })
    )
    
    const allAdmissionsArrays = await Promise.all(admissionsPromises)
    const admissionsMap = new Map<number, import("./admissions").Admission[]>()
    
    response.items.forEach((booking, index) => {
      admissionsMap.set(booking.id, allAdmissionsArrays[index] || [])
    })
    
    return { ...response, admissionsMap }
  } catch (error: any) {
    // Em caso de erro, retorna resposta vazia
    if (error?.status === 404 || error?.status === 403) {
      return {
        items: [],
        meta: {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0,
        },
        admissionsMap: new Map(),
      }
    }
    throw error
  }
}

// ==========================================
// Legacy export para compatibilidade
// ==========================================

export const bookingsApi = {
  getStudentBookings: async (
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<BookingsResponse> => {
    return getStudentBookings(userId, page, limit)
  },

  getTeacherClasses: async (userId: string): Promise<TeacherClass[]> => {
    return getTeacherClasses(userId)
  },

  createBooking: async (data: CreateBookingInput): Promise<Booking> => {
    return createBooking(data)
  },

  updateBooking: async (id: number, data: UpdateBookingInput): Promise<Booking> => {
    return updateBooking(id, data)
  },
}

// Re-export types for backward compatibility
export type { CreateBookingInput as CreateBookingRequest }
