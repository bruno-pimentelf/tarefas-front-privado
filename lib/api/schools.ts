import { assessmentsApi, usersApi } from "./client"

// ==========================================
// Types para Schools API
// ==========================================

export interface Address {
  id?: number
  country: string
  state: string
  city: string
  neighborhood?: string
  street: string
  number: string
  referencePoint?: string
  zipCode: string
  createdAt?: string
  updatedAt?: string
}

export interface School {
  id: number
  name: string
  timezone?: string
  logoUrl?: string
  isActive: boolean
  addressId?: number
  address?: Address
  createdAt: string
  updatedAt: string
}

export interface PaginatedSchoolsResponse {
  data: School[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateSchoolInput {
  name: string
  timezone?: string
  logoUrl?: string
  address: {
    country: string
    state: string
    city: string
    neighborhood?: string
    street: string
    number: string
    referencePoint?: string
    zipCode: string
  }
}

export interface UpdateSchoolInput {
  name?: string
  timezone?: string
  logoUrl?: string
  isActive?: boolean
  address?: {
    country?: string
    state?: string
    city?: string
    neighborhood?: string
    street?: string
    number?: string
    referencePoint?: string
    zipCode?: string
  }
}

// ==========================================
// API Functions - Schools
// ==========================================

/**
 * List schools (paginated)
 * GET /users/assessments/school
 */
export async function listSchools(params?: {
  page?: number
  limit?: number
  isActive?: boolean
}): Promise<PaginatedSchoolsResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())
  if (params?.isActive !== undefined) queryParams.append("isActive", params.isActive.toString())

  const queryString = queryParams.toString()
  const url = `/assessments/school${queryString ? `?${queryString}` : ""}`
  
  return usersApi.get<PaginatedSchoolsResponse>(url)
}

/**
 * Get school by ID
 * GET /users/assessments/school/:id
 */
export async function getSchoolById(id: number): Promise<School> {
  return usersApi.get<School>(`/assessments/school/${id}`)
}

/**
 * Create school
 * POST /users/assessments/school
 */
export async function createSchool(data: CreateSchoolInput): Promise<School> {
  return usersApi.post<School>("/assessments/school", data)
}

/**
 * Update school
 * PATCH /users/assessments/school/:id
 */
export async function updateSchool(id: number, data: UpdateSchoolInput): Promise<School> {
  return usersApi.patch<School>(`/assessments/school/${id}`, data)
}

/**
 * Delete school (soft delete)
 * DELETE /users/assessments/school/:id
 */
export async function deleteSchool(id: number): Promise<{ message: string; id: number }> {
  return usersApi.delete<{ message: string; id: number }>(`/assessments/school/${id}`)
}
