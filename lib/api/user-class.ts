import { assessmentsApi } from "./client"

// ==========================================
// Types para User-Class API
// ==========================================

export interface UserRole {
  roleId: number
  roleName: string
  schoolId: number
  schoolName: string
  grade?: string
}

export interface User {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  profilePictureUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  roles: UserRole[]
}

export interface PaginatedUsersResponse {
  data: User[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface Class {
  id: number
  name: string
  grade: string
  schoolYear: string
  schoolId: number
  school: {
    id: number
    name: string
    timezone: string
    logoUrl?: string
    isActive: boolean
  }
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

export interface AddUserToClassInput {
  userId: string
  classId: number
}

export interface AddUserToClassResponse {
  id: number
  userId: string
  classId: number
  createdAt: string
  message: string
}

export interface BulkAddUsersToClassInput {
  userIds: string[]
  classId: number
}

export interface BulkAddUsersToClassResponse {
  message: string
  added: number
  skipped: number
  total: number
}

export interface RemoveUserFromClassResponse {
  message: string
  userId: string
  classId: number
}

// ==========================================
// API Functions - User-Class
// ==========================================

/**
 * List users by class (paginated)
 * GET /assessments/user-class/by-class/:classId
 */
export async function listUsersByClass(
  classId: number,
  params?: {
    page?: number
    limit?: number
  }
): Promise<PaginatedUsersResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())

  const queryString = queryParams.toString()
  const url = `/user-class/by-class/${classId}${queryString ? `?${queryString}` : ""}`
  
  return assessmentsApi.get<PaginatedUsersResponse>(url)
}

/**
 * List classes by user (paginated)
 * GET /assessments/user-class/by-user/:userId
 */
export async function listClassesByUser(
  userId: string,
  params?: {
    page?: number
    limit?: number
  }
): Promise<PaginatedClassesResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())

  const queryString = queryParams.toString()
  const url = `/user-class/by-user/${userId}${queryString ? `?${queryString}` : ""}`
  
  return assessmentsApi.get<PaginatedClassesResponse>(url)
}

/**
 * Add user to class
 * POST /assessments/user-class
 */
export async function addUserToClass(data: AddUserToClassInput): Promise<AddUserToClassResponse> {
  return assessmentsApi.post<AddUserToClassResponse>("/user-class", data)
}

/**
 * Add multiple users to class (bulk)
 * POST /assessments/user-class/bulk
 */
export async function bulkAddUsersToClass(
  data: BulkAddUsersToClassInput
): Promise<BulkAddUsersToClassResponse> {
  return assessmentsApi.post<BulkAddUsersToClassResponse>("/user-class/bulk", data)
}

/**
 * Remove user from class
 * DELETE /assessments/user-class?userId=:userId&classId=:classId
 */
export async function removeUserFromClass(
  userId: string,
  classId: number
): Promise<RemoveUserFromClassResponse> {
  return assessmentsApi.delete<RemoveUserFromClassResponse>(
    `/user-class?userId=${userId}&classId=${classId}`
  )
}
