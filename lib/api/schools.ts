import { assessmentsApi } from "./client"

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
 * GET /assessments/school
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
  const url = `/school${queryString ? `?${queryString}` : ""}`
  
  return assessmentsApi.get<PaginatedSchoolsResponse>(url)
}

/**
 * Get school by ID
 * GET /assessments/school/:id
 */
export async function getSchoolById(id: number): Promise<School> {
  return assessmentsApi.get<School>(`/school/${id}`)
}

/**
 * Create school
 * POST /assessments/school
 */
export async function createSchool(data: CreateSchoolInput): Promise<School> {
  return assessmentsApi.post<School>("/school", data)
}

/**
 * Update school
 * PATCH /assessments/school/:id
 */
export async function updateSchool(id: number, data: UpdateSchoolInput): Promise<School> {
  return assessmentsApi.patch<School>(`/school/${id}`, data)
}

/**
 * Delete school (soft delete)
 * DELETE /assessments/school/:id
 */
export async function deleteSchool(id: number): Promise<{ message: string; id: number }> {
  return assessmentsApi.delete<{ message: string; id: number }>(`/school/${id}`)
}
