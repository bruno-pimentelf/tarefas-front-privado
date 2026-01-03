import { usersApi } from "./client"

// ==========================================
// Types para Roles API
// ==========================================

export interface Role {
  id: number
  name: string
  createdAt?: string
  updatedAt?: string
}

export interface School {
  id: number
  name: string
}

export interface UserRole {
  id: number
  userId: string
  schoolId: number
  roleId: number
  grade?: string | null
  role: Role
  school: School
  createdAt?: string
  updatedAt?: string
}

export interface SetAssessmentsRoleInput {
  userId: string
  schoolId: number
  roleId: number
}

export interface SetAssessmentsRoleResponse {
  id: number
  userId: string
  schoolId: number
  roleId: number
  grade?: string | null
  createdAt: string
  updatedAt: string
}

// ==========================================
// API Functions
// ==========================================

/**
 * Lista todas as roles disponíveis
 * GET /role/roles
 */
export async function listRoles(): Promise<Role[]> {
  return usersApi.get<Role[]>("/role/roles")
}

/**
 * Busca a role de um usuário em uma escola específica
 * GET /role/user-role?userId=...&schoolId=...
 * 
 * @param userId - Firebase UID do usuário
 * @param schoolId - ID da escola
 */
export async function getUserRole(
  userId: string,
  schoolId: number
): Promise<UserRole> {
  return usersApi.get<UserRole>(
    `/role/user-role?userId=${encodeURIComponent(userId)}&schoolId=${schoolId}`
  )
}

/**
 * Define a role de assessments para um usuário em uma escola
 * POST /role/set-assessments-role
 * 
 * Requer permissão de Admin.
 * Se a relação user-school já existir, atualiza a role.
 * 
 * @param data - Dados para definir a role (userId, schoolId, roleId)
 */
export async function setAssessmentsRole(
  data: SetAssessmentsRoleInput
): Promise<SetAssessmentsRoleResponse> {
  return usersApi.post<SetAssessmentsRoleResponse>(
    "/role/set-assessments-role",
    data
  )
}
