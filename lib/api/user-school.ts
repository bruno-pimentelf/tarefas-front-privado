import { usersApi } from "./client"

// ==========================================
// Types para User-School API
// ==========================================

export interface User {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  profilePictureUrl?: string
  isActive: boolean
}

export interface Role {
  id: number
  name: string
}

export interface School {
  id: number
  name: string
}

export interface UserSchool {
  id: number
  userId: string
  schoolId: number
  roleId: number
  grade?: string
  createdAt: string
  updatedAt: string
  user: User
  role: Role
  school: School
}

export interface PaginatedUserSchoolResponse {
  data: UserSchool[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AddUserToSchoolInput {
  userId: string
  schoolId: number
  roleId: number
  grade?: string
}

export interface AddUserToSchoolResponse {
  id: number
  userId: string
  schoolId: number
  roleId: number
  grade?: string
  createdAt: string
  message: string
}

export interface RemoveUserFromSchoolResponse {
  message: string
}

export interface TransferStudentInput {
  userId: string
  fromSchoolId: number
  toSchoolId: number
  grade?: string
}

export interface TransferStudentResponse {
  id: number
  userId: string
  fromSchoolId: number
  fromSchoolName: string
  toSchoolId: number
  toSchoolName: string
  roleId: number
  grade?: string
  createdAt: string
  message: string
}

// ==========================================
// API Functions - User-School
// ==========================================

/**
 * List users by school (paginated)
 * GET /users/assessments/user-school?schoolId={schoolId}&roleId={roleId}&search={search}&page={page}&limit={limit}
 * 
 * Query Parameters:
 * - schoolId (required): ID da escola
 * - roleId (optional): Filtrar por role
 * - search (optional): Buscar por nome ou email
 * - page (optional, default: 1): Page number
 * - limit (optional, default: 10, max: 100): Items per page
 * 
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function listUsersBySchool(
  schoolId: number,
  params?: {
    roleId?: number
    search?: string
    page?: number
    limit?: number
  }
): Promise<PaginatedUserSchoolResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append("schoolId", schoolId.toString())
  
  if (params?.roleId) queryParams.append("roleId", params.roleId.toString())
  if (params?.search) queryParams.append("search", params.search)
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())

  const queryString = queryParams.toString()
  const url = `/assessments/user-school?${queryString}`
  
  return usersApi.get<PaginatedUserSchoolResponse>(url)
}

/**
 * Add user to school
 * POST /users/assessments/user-school
 * 
 * Request Body:
 * {
 *   "userId": string,
 *   "schoolId": number,
 *   "roleId": number,
 *   "grade": string (optional)
 * }
 * 
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function addUserToSchool(data: AddUserToSchoolInput): Promise<AddUserToSchoolResponse> {
  return usersApi.post<AddUserToSchoolResponse>("/assessments/user-school", data)
}

/**
 * Remove user from school
 * DELETE /users/assessments/user-school?userId={userId}&schoolId={schoolId}
 * 
 * Query Parameters:
 * - userId (required): ID do usuário
 * - schoolId (required): ID da escola
 * 
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function removeUserFromSchool(
  userId: string,
  schoolId: number
): Promise<RemoveUserFromSchoolResponse> {
  return usersApi.delete<RemoveUserFromSchoolResponse>(
    `/assessments/user-school?userId=${userId}&schoolId=${schoolId}`
  )
}

/**
 * Transfer student from one school to another
 * PATCH /users/assessments/user-school/transfer-student
 * 
 * Request Body:
 * {
 *   "userId": string,
 *   "fromSchoolId": number,
 *   "toSchoolId": number,
 *   "grade": string (optional)
 * }
 * 
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function transferStudent(data: TransferStudentInput): Promise<TransferStudentResponse> {
  return usersApi.patch<TransferStudentResponse>("/assessments/user-school/transfer-student", data)
}
