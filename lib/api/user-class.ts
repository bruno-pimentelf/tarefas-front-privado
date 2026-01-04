import { assessmentsApi, usersApi } from "./client"

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
 * GET /users/assessments/user-class/by-class/:classId
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
  const url = `/assessments/user-class/by-class/${classId}${queryString ? `?${queryString}` : ""}`
  
  return usersApi.get<PaginatedUsersResponse>(url)
}

/**
 * List classes by user (paginated)
 * GET /users/assessments/user-class/by-user/:userId
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
  const url = `/assessments/user-class/by-user/${userId}${queryString ? `?${queryString}` : ""}`
  
  return usersApi.get<PaginatedClassesResponse>(url)
}

/**
 * Add user to class
 * POST /users/assessments/user-class
 */
export async function addUserToClass(data: AddUserToClassInput): Promise<AddUserToClassResponse> {
  return usersApi.post<AddUserToClassResponse>("/assessments/user-class", data)
}

/**
 * Add multiple users to class (bulk)
 * POST /users/assessments/user-class/bulk
 */
export async function bulkAddUsersToClass(
  data: BulkAddUsersToClassInput
): Promise<BulkAddUsersToClassResponse> {
  return usersApi.post<BulkAddUsersToClassResponse>("/assessments/user-class/bulk", data)
}

/**
 * Remove user from class
 * DELETE /users/assessments/user-class?userId=:userId&classId=:classId
 */
export async function removeUserFromClass(
  userId: string,
  classId: number
): Promise<RemoveUserFromClassResponse> {
  return usersApi.delete<RemoveUserFromClassResponse>(
    `/assessments/user-class?userId=${userId}&classId=${classId}`
  )
}

/**
 * List all users (paginated)
 * Busca todos os usuários do banco, começando por tentar uma rota direta,
 * e fazendo fallback para buscar de todas as escolas se necessário
 */
export async function listAllUsers(params?: {
  page?: number
  limit?: number
  roleName?: string
}): Promise<User[]> {
  try {
    // Primeiro, tentar buscar de todas as escolas (abordagem mais confiável)
    const { listSchools } = await import("./schools")
    
    // Buscar todas as escolas com paginação
    const allSchools: Array<{ id: number }> = []
    let schoolPage = 1
    const schoolLimit = 100
    let hasMoreSchoolPages = true

    while (hasMoreSchoolPages) {
      const schoolsResponse = await listSchools({ 
        page: schoolPage, 
        limit: schoolLimit 
      })
      
      if (schoolsResponse.data && schoolsResponse.data.length > 0) {
        allSchools.push(...schoolsResponse.data)
      }

      hasMoreSchoolPages = schoolPage < (schoolsResponse.meta?.totalPages || 0)
      schoolPage++
    }

    if (allSchools.length === 0) {
      return []
    }

    // Buscar usuários de todas as escolas em paralelo
    const userPromises = allSchools.map(school => 
      listUsersBySchool(school.id).catch(() => [])
    )

    const userArrays = await Promise.all(userPromises)

    // Consolidar usuários, removendo duplicatas por userId
    const usersMap = new Map<string, User>()
    userArrays.forEach((users) => {
      users.forEach((user) => {
        if (!usersMap.has(user.userId)) {
          usersMap.set(user.userId, user)
        }
      })
    })

    let allUsers = Array.from(usersMap.values())

    // Filtrar por roleName se especificado
    if (params?.roleName) {
      allUsers = allUsers.filter(user => 
        user.roles.some(role => role.roleName === params.roleName)
      )
    }

    return allUsers
  } catch (err: any) {
    console.error("Erro ao buscar todos os usuários:", err)
    throw err
  }
}

/**
 * List users by school (fetches from all classes in the school)
 * This function aggregates users from all classes in a school
 * Uses pagination to fetch all classes and users (max limit: 100)
 */
export async function listUsersBySchool(
  schoolId: number,
  params?: {
    page?: number
    limit?: number
  }
): Promise<User[]> {
  // First, get all classes from the school using pagination
  const { listClasses } = await import("./classes")
  
  // Fetch all classes with pagination (max limit: 100)
  const allClasses: Array<{ id: number; name: string; schoolId: number }> = []
  let currentPage = 1
  const limit = 100 // Maximum allowed by API
  let hasMorePages = true

  while (hasMorePages) {
    const classesResponse = await listClasses({
      schoolId,
      page: currentPage,
      limit,
    })

    if (classesResponse.data && classesResponse.data.length > 0) {
      allClasses.push(...classesResponse.data)
    }

    // Check if there are more pages
    hasMorePages = currentPage < (classesResponse.meta?.totalPages || 0)
    currentPage++
  }

  if (allClasses.length === 0) {
    return []
  }

  // Fetch users from all classes in parallel, with pagination
  const userPromises = allClasses.map(async (cls) => {
    const allUsers: User[] = []
    let userPage = 1
    let hasMoreUserPages = true

    while (hasMoreUserPages) {
      try {
        const userResponse = await listUsersByClass(cls.id, {
          page: userPage,
          limit: 100, // Maximum allowed by API
        })
        
        if (userResponse.data && userResponse.data.length > 0) {
          allUsers.push(...userResponse.data)
        }

        hasMoreUserPages = userPage < (userResponse.meta?.totalPages || 0)
        userPage++
      } catch (err) {
        // If error, stop pagination for this class
        hasMoreUserPages = false
      }
    }

    return allUsers
  })

  const userArrays = await Promise.all(userPromises)

  // Consolidate users, removing duplicates by userId
  const usersMap = new Map<string, User>()
  userArrays.forEach((users) => {
    users.forEach((user) => {
      // Only include users that have a role in this school
      const hasSchoolRole = user.roles.some((role) => role.schoolId === schoolId)
      if (hasSchoolRole && !usersMap.has(user.userId)) {
        usersMap.set(user.userId, user)
      }
    })
  })

  return Array.from(usersMap.values())
}
