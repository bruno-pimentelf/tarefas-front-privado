import { assessmentsApi, usersApi } from "./client"
import type { School } from "./schools"

// ==========================================
// Types para Classes API
// ==========================================

export interface Class {
  id: number
  name: string
  grade: string
  schoolYear: string
  schoolId: number
  schoolName?: string
  school?: School
  createdAt: string
  updatedAt: string
}

export interface PaginatedClassesResponse {
  data: Class[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateClassInput {
  schoolId: number
  name: string
  grade: string
  schoolYear: string
}

export interface UpdateClassInput {
  schoolId?: number
  name?: string
  grade?: string
  schoolYear?: string
}

export interface ClassStudentsCountResponse {
  classId: number
  studentsCount: number
}

// ==========================================
// API Functions - Classes
// ==========================================

/**
 * Get class by ID
 * GET /users/assessments/class/:classId
 */
export async function getClassById(classId: number): Promise<Class> {
  return usersApi.get<Class>(`/assessments/class/${classId}`)
}

/**
 * List classes (paginated)
 * GET /users/assessments/class
 */
export async function listClasses(params?: {
  page?: number
  limit?: number
  schoolId?: number
  grade?: string
  schoolYear?: string
}): Promise<PaginatedClassesResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())
  if (params?.schoolId) queryParams.append("schoolId", params.schoolId.toString())
  if (params?.grade) queryParams.append("grade", params.grade)
  if (params?.schoolYear) queryParams.append("schoolYear", params.schoolYear)

  const queryString = queryParams.toString()
  const url = `/assessments/class${queryString ? `?${queryString}` : ""}`
  
  return usersApi.get<PaginatedClassesResponse>(url)
}

/**
 * Get teacher's classes
 * GET /assessments/class/by-teacher/:userId
 */
export async function getTeacherClasses(userId: string): Promise<Class[]> {
  return assessmentsApi.get<Class[]>(`/class/by-teacher/${userId}`)
}

/**
 * Get coordinator's classes
 * GET /users/assessments/class/by-coordinator/:userId
 * Returns paginated response, extracts data array
 */
export async function getCoordinatorClasses(userId: string): Promise<Class[]> {
  const response = await usersApi.get<PaginatedClassesResponse>(`/assessments/class/by-coordinator/${userId}`)
  return response.data || []
}

/**
 * Get student's class IDs
 * GET /assessments/class/by-student/:userId
 */
export async function getStudentClassIds(userId: string): Promise<number[]> {
  return assessmentsApi.get<number[]>(`/class/by-student/${userId}`)
}

/**
 * Count students in class
 * GET /users/assessments/class/:classId/students-count
 */
export async function getClassStudentsCount(classId: number): Promise<ClassStudentsCountResponse> {
  return usersApi.get<ClassStudentsCountResponse>(`/assessments/class/${classId}/students-count`)
}

/**
 * Create class
 * POST /users/assessments/class
 */
export async function createClass(data: CreateClassInput): Promise<Class> {
  return usersApi.post<Class>("/assessments/class", data)
}

/**
 * Update class
 * PATCH /users/assessments/class/:id
 */
export async function updateClass(id: number, data: UpdateClassInput): Promise<Class> {
  return usersApi.patch<Class>(`/assessments/class/${id}`, data)
}

/**
 * Delete class
 * DELETE /users/assessments/class/:id
 */
export async function deleteClass(id: number): Promise<{ message: string; id: number }> {
  return usersApi.delete<{ message: string; id: number }>(`/assessments/class/${id}`)
}
