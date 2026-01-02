import { assessmentsApi } from "./client"

// ==========================================
// Types para Bookings API
// ==========================================

export interface School {
  id: number
  name: string
}

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
 * GET /bookings/teacher-classes/:userId
 * MOCK: Retorna turmas mockadas por enquanto
 */
export async function getTeacherClasses(userId: string): Promise<TeacherClass[]> {
  // Importa os dados mockados
  const { mockTeacherClasses } = await import("../mock-data")
  
  // Simula delay da API
  await new Promise(resolve => setTimeout(resolve, 500))
  
  console.log("Retornando turmas mockadas:", mockTeacherClasses)
  return mockTeacherClasses
  
  // Código original comentado para quando a API estiver funcionando:
  // return assessmentsApi.get<TeacherClass[]>(`/bookings/teacher-classes/${userId}`)
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
 */
export async function getStudentBookings(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<BookingsResponse> {
  try {
    const response = await assessmentsApi.get<BookingsResponse>(
      `/bookings/student/${userId}?page=${page}&limit=${limit}`
    )
    
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
