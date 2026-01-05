import { assessmentsApi, usersApi } from "./client"

// Nota: A rota students-without-class está em /assessments, não em /users
// Por isso usamos assessmentsApi em vez de usersApi

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
 * Public endpoint (Admin Only restrictions ignored)
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
 * Public endpoint (Admin Only restrictions ignored)
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
 * Public endpoint (Admin Only restrictions ignored)
 * 
 * Request Body: { userId: string, classId: number }
 * Response: { id: number, userId: string, classId: number, createdAt: string, message: string }
 */
export async function addUserToClass(data: AddUserToClassInput): Promise<AddUserToClassResponse> {
  return usersApi.post<AddUserToClassResponse>("/assessments/user-class", data)
}

/**
 * Add multiple users to class (bulk)
 * POST /users/assessments/user-class/bulk
 * Public endpoint (Admin Only restrictions ignored)
 * 
 * Request Body: { userIds: string[], classId: number }
 * Response: { message: string, added: number, skipped: number, total: number }
 * Note: Skipped count indicates users already enrolled
 */
export async function bulkAddUsersToClass(
  data: BulkAddUsersToClassInput
): Promise<BulkAddUsersToClassResponse> {
  return usersApi.post<BulkAddUsersToClassResponse>("/assessments/user-class/bulk", data)
}

/**
 * Remove user from class
 * DELETE /users/assessments/user-class?userId=:userId&classId=:classId
 * Public endpoint (Admin Only restrictions ignored)
 * 
 * Query Parameters:
 * - userId (required): Firebase UID of the user
 * - classId (required): ID of the class
 * 
 * Response: { message: string, userId: string, classId: number }
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
 * List students without class (paginated)
 * GET /assessments/user-class/students-without-class?schoolId={schoolId}&page={page}&limit={limit}
 * 
 * Query Parameters:
 * - schoolId (required): ID da escola
 * - page (optional, default: 1): Page number
 * - limit (optional, default: 10, max: 100): Items per page
 * 
 * Returns paginated list of students (roleId = 1) from a specific school
 * that are NOT enrolled in any class.
 * 
 * Public endpoint (Admin Only restrictions ignored)
 */
export async function listStudentsWithoutClass(
  schoolId: number,
  params?: {
    page?: number
    limit?: number
  }
): Promise<PaginatedUsersResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append("schoolId", schoolId.toString())
  
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())

  const queryString = queryParams.toString()
  // A rota deve ser /users/assessments/user-class/students-without-class
  // A baseURL do usersApi é https://api.trieduconline.com.br/users
  // URL relativa: /assessments/user-class/students-without-class
  // URL completa: https://api.trieduconline.com.br/users/assessments/user-class/students-without-class
  const url = `/assessments/user-class/students-without-class?${queryString}`
  
  return usersApi.get<PaginatedUsersResponse>(url)
}

/**
 * List users without schools (not associated with any school)
 * 
 * NOTA: Não há endpoint disponível para buscar usuários sem escola diretamente.
 * Esta função filtra usuários que foram retornados por listAllUsersFromSchools
 * mas que não têm roles associadas (indicando que foram removidos de todas as escolas
 * ou nunca foram vinculados).
 * 
 * LIMITAÇÃO: Esta função só retorna usuários que já foram vinculados a escolas
 * e depois removidos. Usuários que nunca foram vinculados não aparecerão aqui.
 */
export async function listUsersWithoutSchools(params?: {
  page?: number
  limit?: number
}): Promise<User[]> {
  // Como não há endpoint para buscar usuários sem escola, retornamos vazio
  // A identificação será feita na camada de apresentação
  console.warn("⚠️ Não há endpoint disponível para buscar usuários sem escola diretamente")
  return []
}

/**
 * List all users (paginated) - FALLBACK METHOD
 * Busca todos os usuários do banco buscando de todas as escolas
 * Nota: Esta função retorna apenas usuários que estão associados a pelo menos uma escola.
 * Para buscar usuários sem escola, use listUsersWithoutSchools.
 */
export async function listAllUsersFromSchools(params?: {
  page?: number
  limit?: number
  roleName?: string
}): Promise<User[]> {
  const { listSchools } = await import("./schools")
  const { listUsersBySchoolFromAPI } = await import("./user-school")
  
  try {
    // Buscar todas as escolas com paginação
    const allSchools: Array<{ id: number }> = []
    let schoolPage = 1
    const schoolLimit = 100
    let hasMoreSchoolPages = true

    while (hasMoreSchoolPages) {
      try {
        const schoolsResponse = await listSchools({ 
          page: schoolPage, 
          limit: schoolLimit 
        })
        
        if (schoolsResponse.data && schoolsResponse.data.length > 0) {
          allSchools.push(...schoolsResponse.data)
        }

        hasMoreSchoolPages = schoolPage < (schoolsResponse.meta?.totalPages || 0)
        schoolPage++
      } catch (schoolErr) {
        console.error("Erro ao buscar escolas:", schoolErr)
        hasMoreSchoolPages = false
      }
    }

    if (allSchools.length === 0) {
      console.warn("Nenhuma escola encontrada. Retornando array vazio.")
      return []
    }

    // Buscar usuários de todas as escolas usando listUsersBySchoolFromAPI
    const userPromises = allSchools.map(async (school) => {
      try {
        const allUsersFromSchool: User[] = []
        let currentPage = 1
        const limit = 100
        let hasMorePages = true

        while (hasMorePages) {
          try {
            const response = await listUsersBySchoolFromAPI(school.id, {
              page: currentPage,
              limit,
            })

            if (response.data && response.data.length > 0) {
              // Converter UserSchool para User
              const users = response.data.map((userSchool) => ({
                userId: userSchool.userId,
                firstName: userSchool.user.firstName,
                lastName: userSchool.user.lastName,
                email: userSchool.user.email,
                phone: userSchool.user.phone,
                dateOfBirth: userSchool.user.dateOfBirth,
                profilePictureUrl: userSchool.user.profilePictureUrl,
                isActive: userSchool.user.isActive || true,
                createdAt: userSchool.createdAt || new Date().toISOString(),
                updatedAt: userSchool.updatedAt || new Date().toISOString(),
                roles: userSchool.role ? [{
                  roleId: userSchool.roleId,
                  roleName: userSchool.role.name,
                  schoolId: userSchool.schoolId,
                  schoolName: userSchool.school?.name || "",
                  grade: userSchool.grade,
                }] : [],
              }))
              allUsersFromSchool.push(...users)
            }

            hasMorePages = currentPage < (response.meta?.totalPages || 0)
            currentPage++
          } catch (err) {
            console.debug(`Erro ao buscar usuários da escola ${school.id}, página ${currentPage}:`, err)
            hasMorePages = false
          }
        }

        return allUsersFromSchool
      } catch (err) {
        console.debug(`Erro ao buscar usuários da escola ${school.id}:`, err)
        return []
      }
    })

    // Aguardar todas as buscas
    const userArrays = await Promise.all(userPromises)

    // Consolidar usuários, removendo duplicatas por userId
    const usersMap = new Map<string, User>()
    
    // Adicionar usuários das escolas
    userArrays.forEach((users) => {
      users.forEach((user) => {
        if (!usersMap.has(user.userId)) {
          usersMap.set(user.userId, user)
        } else {
          // Se o usuário já existe, mesclar roles
          const existingUser = usersMap.get(user.userId)!
          const existingRoleIds = new Set(existingUser.roles.map(r => `${r.roleId}-${r.schoolId}`))
          user.roles.forEach(role => {
            const roleKey = `${role.roleId}-${role.schoolId}`
            if (!existingRoleIds.has(roleKey)) {
              existingUser.roles.push(role)
              existingRoleIds.add(roleKey)
            }
          })
        }
      })
    })

    let allUsers = Array.from(usersMap.values())

    // Filtrar por roleName se especificado
    if (params?.roleName) {
      allUsers = allUsers.filter(user => 
        user.roles.some(role => role.roleName.toLowerCase() === params?.roleName?.toLowerCase())
      )
    }

    console.log(`Encontrados ${allUsers.length} usuários únicos de ${allSchools.length} escolas`)
    return allUsers
  } catch (err: any) {
    console.error("Erro ao buscar todos os usuários das escolas:", err)
    throw err
  }
}

/**
 * List all users (paginated) - MAIN FUNCTION
 * Busca todos os usuários do sistema que estão ou estiveram associados a escolas
 * 
 * IMPORTANTE: Esta função retorna apenas usuários que estão ou estiveram vinculados
 * a pelo menos uma escola. Usuários que nunca foram vinculados a escolas não aparecerão
 * aqui porque não há endpoint disponível para buscá-los diretamente.
 * 
 * LIMITAÇÃO: Usuários que nunca foram vinculados a nenhuma escola não aparecerão
 * nesta lista. Para buscar esses usuários, seria necessário um endpoint específico
 * que retorne todos os usuários do Firebase/sistema.
 * 
 * Para identificar usuários sem escola na camada de apresentação:
 * - Verificar se user.roles é undefined, null ou array vazio
 * - Usuários sem escola terão roles.length === 0
 */
export async function listAllUsers(params?: {
  page?: number
  limit?: number
  roleName?: string
}): Promise<User[]> {
  // Como não há endpoint para buscar usuários sem escola, retornamos apenas
  // os usuários que estão ou estiveram vinculados a escolas
  // Usuários que foram removidos de todas as escolas aparecerão com roles vazias
  return listAllUsersFromSchools(params)
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
