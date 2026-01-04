import { getUserRole } from "@/lib/api/roles"

// SchoolId fixo como 1
export const DEFAULT_SCHOOL_ID = 1

/**
 * Mapeia o nome da role para a rota correspondente
 */
export function getRouteByRole(roleName: string | null | undefined): string {
  if (!roleName) {
    return "/auth" // Se não tiver role, volta para auth
  }

  const roleLower = roleName.toLowerCase()
  
  // student -> /aluno
  if (roleLower === "student") {
    return "/aluno"
  }
  
  // teacher -> /professor
  if (roleLower === "teacher") {
    return "/professor"
  }
  
  // coordinator -> /coordenador
  if (roleLower === "coordinator") {
    return "/coordenador"
  }
  
  // Fallback: se não reconhecer a role, volta para auth
  return "/auth"
}

/**
 * Verifica se a role permite acesso à rota
 */
export function canAccessRoute(roleName: string | null | undefined, route: string): boolean {
  if (!roleName) return false
  
  const roleLower = roleName.toLowerCase()
  
  if (route.startsWith("/aluno")) {
    return roleLower === "student"
  }
  
  if (route.startsWith("/professor")) {
    return roleLower === "teacher"
  }
  
  if (route.startsWith("/coordenador")) {
    return roleLower === "coordinator"
  }
  
  return false
}

/**
 * Busca a role do usuário e retorna a rota correspondente
 * Retorna null se não conseguir buscar (usuário não tem role ainda)
 */
export async function getRedirectRouteByUserRole(
  userId: string,
  schoolId: number = DEFAULT_SCHOOL_ID
): Promise<string | null> {
  try {
    const userRole = await getUserRole(userId, schoolId)
    const roleName = userRole.role?.name
    return getRouteByRole(roleName)
  } catch (error: any) {
    // Se não encontrar role (404), retorna null para mostrar diálogo de seleção
    if (error.status === 404) {
      return null
    }
    // Outros erros também retornam null
    return null
  }
}

/**
 * Busca a role do usuário
 */
export async function getUserRoleName(
  userId: string,
  schoolId: number = DEFAULT_SCHOOL_ID
): Promise<string | null> {
  try {
    const userRole = await getUserRole(userId, schoolId)
    return userRole.role?.name || null
  } catch (error: any) {
    return null
  }
}

