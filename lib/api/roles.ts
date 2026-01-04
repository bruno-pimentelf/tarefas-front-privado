import { usersApi } from "./client"

export interface Role {
  id: number
  name: string
  description?: string
}

export interface UserSchool {
  id: number
  userId: string
  schoolId: number
  roleId: number
  role?: Role
  createdAt?: string
  updatedAt?: string
}

export interface SetRoleRequest {
  userId: string
  schoolId: number
  roleId: number
}

/**
 * Lista todas as roles disponíveis
 */
export async function getRoles(): Promise<Role[]> {
  return usersApi.get<Role[]>("/assessments/role/roles")
}

/**
 * Busca a role de um usuário em uma escola específica
 */
export async function getUserRole(
  userId: string,
  schoolId: number
): Promise<UserSchool> {
  return usersApi.get<UserSchool>("/assessments/role/user-role", {
    params: {
      userId,
      schoolId,
    },
  })
}

/**
 * Define ou atualiza a role de um usuário em uma escola
 */
export async function setUserRole(
  data: SetRoleRequest
): Promise<UserSchool> {
  return usersApi.post<UserSchool>("/assessments/role/set-assessments-role", data)
}

