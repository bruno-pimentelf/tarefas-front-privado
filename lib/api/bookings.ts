import { assessmentsApi, usersApi } from "./client"

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
 * GET /users/assessments/class/by-teacher/:userId
 */
export async function getTeacherClasses(userId: string): Promise<TeacherClass[]> {
  try {
    // GET /users/assessments/class/by-teacher/:userId
    const classes = await usersApi.get<Array<{
      id: number
      name: string
      grade: string
      schoolYear: string
      schoolId: number
      schoolName?: string
      school?: { id: number; name: string }
    }>>(`/assessments/class/by-teacher/${userId}`)
    
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
 * GET /bookings/student/:userId?page=1&limit=10
 * 
 * @param userId - ID do usuário (Firebase UID)
 * @param page - Número da página (padrão: 1)
 * @param limit - Limite de itens por página (padrão: 10)
 */
export async function getStudentBookings(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<BookingsResponse> {
  try {
    const url = `/bookings/student/${userId}?page=${page}&limit=${limit}`
    
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
 * Busca admissions em paralelo para todos os bookings (otimização)
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
    // Busca bookings primeiro
    const response = await getStudentBookings(userId, page, limit)
    
    // Busca admissions em paralelo para todos os bookings (otimização)
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
