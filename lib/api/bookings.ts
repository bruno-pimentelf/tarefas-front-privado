import { assessmentsApi } from "./client"

export interface Booking {
  id: number
  title: string
  description?: string
  bannerImage?: string
  available: boolean
  startTime: string
  endTime: string
  timezone: string
  createdAt: string
  updatedAt: string
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

export interface CreateBookingRequest {
  title: string
  description?: string
  bannerImage?: string
  available?: boolean
  startTime: string // ISO 8601 UTC
  endTime: string // ISO 8601 UTC
  classIds: number[]
}

export const bookingsApi = {
  // Listar bookings do aluno (paginado)
  getStudentBookings: async (
    page: number = 1,
    limit: number = 10
  ): Promise<BookingsResponse> => {
    return assessmentsApi.get<BookingsResponse>(
      `/bookings/student?page=${page}&limit=${limit}`
    )
  },

  // Listar classes do professor
  getTeacherClasses: async (): Promise<Array<{
    id: number
    schoolId: number
    name: string
    grade: string
    school: {
      id: number
      name: string
    }
  }>> => {
    return assessmentsApi.get("/bookings/teacher-classes")
  },

  // Criar booking
  createBooking: async (data: CreateBookingRequest): Promise<Booking> => {
    return assessmentsApi.post<Booking>("/bookings", data)
  },
}

