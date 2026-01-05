import { usersApi } from "./client"
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
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function getClassById(classId: number): Promise<Class> {
  return usersApi.get<Class>(`/assessments/class/${classId}`)
}

/**
 * List classes (paginated)
 * GET /users/assessments/class
 * 
 * Query Parameters:
 * - page (optional, default: 1): Page number
 * - limit (optional, default: 10, max: 100): Items per page
 * - schoolId (optional): Filter by school ID
 * - grade (optional): Filter by grade
 * - schoolYear (optional): Filter by school year
 * 
 * Permissions: Public (Admin Only restrictions ignored)
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
 * GET /users/assessments/class/by-teacher/:userId
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function getTeacherClasses(userId: string): Promise<Class[]> {
  return usersApi.get<Class[]>(`/assessments/class/by-teacher/${userId}`)
}

/**
 * Get coordinator's classes
 * GET /users/assessments/class/by-coordinator/:userId
 * Returns paginated response, extracts data array
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function getCoordinatorClasses(userId: string): Promise<Class[]> {
  const response = await usersApi.get<PaginatedClassesResponse>(`/assessments/class/by-coordinator/${userId}`)
  return response.data || []
}

/**
 * Get student's class IDs
 * GET /users/assessments/class/by-student/:userId
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function getStudentClassIds(userId: string): Promise<number[]> {
  return usersApi.get<number[]>(`/assessments/class/by-student/${userId}`)
}

/**
 * Count students in class
 * GET /users/assessments/class/:classId/students-count
 * Returns: { classId: number, studentsCount: number }
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function getClassStudentsCount(classId: number): Promise<ClassStudentsCountResponse> {
  return usersApi.get<ClassStudentsCountResponse>(`/assessments/class/${classId}/students-count`)
}

/**
 * Create class
 * POST /users/assessments/class
 * 
 * Request Body:
 * {
 *   "schoolId": number,
 *   "name": string,
 *   "grade": string,
 *   "schoolYear": string
 * }
 * 
 * Permissions: Public (Admin Only restrictions ignored)
 */
export async function createClass(data: CreateClassInput): Promise<Class> {
  return usersApi.post<Class>("/assessments/class", data)
}

/**
 * Update class
 * PATCH /users/assessments/class/:id
 * 
 * Request Body: (all fields optional)
 * {
 *   "schoolId": number,
 *   "name": string,
 *   "grade": string,
 *   "schoolYear": string
 * }
 * 
 * Permissions: Public (Admin Only restrictions ignored)
 */
export async function updateClass(id: number, data: UpdateClassInput): Promise<Class> {
  return usersApi.patch<Class>(`/assessments/class/${id}`, data)
}

/**
 * Delete class
 * DELETE /users/assessments/class/:id
 * 
 * Response:
 * {
 *   "message": "Class deleted successfully",
 *   "id": number
 * }
 * 
 * Permissions: Public (Admin Only restrictions ignored)
 */
export async function deleteClass(id: number): Promise<{ message: string; id: number }> {
  return usersApi.delete<{ message: string; id: number }>(`/assessments/class/${id}`)
}
