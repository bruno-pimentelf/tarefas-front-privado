import { assessmentsApi } from "./client"
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
 * GET /assessments/class/:classId
 */
export async function getClassById(classId: number): Promise<Class> {
  return assessmentsApi.get<Class>(`/class/${classId}`)
}

/**
 * List classes (paginated)
 * GET /assessments/class
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
  const url = `/class${queryString ? `?${queryString}` : ""}`
  
  return assessmentsApi.get<PaginatedClassesResponse>(url)
}

/**
 * Get teacher's classes
 * GET /assessments/class/by-teacher/:userId
 */
export async function getTeacherClasses(userId: string): Promise<Class[]> {
  return assessmentsApi.get<Class[]>(`/class/by-teacher/${userId}`)
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
 * GET /assessments/class/:classId/students-count
 */
export async function getClassStudentsCount(classId: number): Promise<ClassStudentsCountResponse> {
  return assessmentsApi.get<ClassStudentsCountResponse>(`/class/${classId}/students-count`)
}

/**
 * Create class
 * POST /assessments/class
 */
export async function createClass(data: CreateClassInput): Promise<Class> {
  return assessmentsApi.post<Class>("/class", data)
}

/**
 * Update class
 * PATCH /assessments/class/:id
 */
export async function updateClass(id: number, data: UpdateClassInput): Promise<Class> {
  return assessmentsApi.patch<Class>(`/class/${id}`, data)
}

/**
 * Delete class
 * DELETE /assessments/class/:id
 */
export async function deleteClass(id: number): Promise<{ message: string; id: number }> {
  return assessmentsApi.delete<{ message: string; id: number }>(`/class/${id}`)
}
