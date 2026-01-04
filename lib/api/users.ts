import { usersApi } from "./client"
import { User as FirebaseUser } from "firebase/auth"

export interface Address {
  country: string
  state: string
  city: string
  neighborhood: string
  street: string
  number: string
  zipCode: string
  referencePoint?: string
}

export interface SyncUserInput {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  profilePictureUrl?: string
  address?: Address
}

export interface SyncedUser {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  dateOfBirth?: string
  profilePictureUrl?: string
  address?: Address
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  roleId: number
  schoolId: number
  phone?: string
  dateOfBirth?: string
}

export interface CreateUserResponse {
  userId: string
  email: string
  firstName: string
  lastName: string
  message: string
}

export async function syncUser(firebaseUser: FirebaseUser): Promise<SyncedUser> {
  if (!firebaseUser.email) {
    throw new Error("Email do usuário não está disponível")
  }

  const displayName = firebaseUser.displayName?.trim() || ""
  const nameParts = displayName ? displayName.split(/\s+/).filter(part => part.length > 0) : []

  const syncData: SyncUserInput = {
    userId: firebaseUser.uid,
    email: firebaseUser.email,
    firstName: nameParts.length > 0 && nameParts[0] ? nameParts[0] : "Usuário",
    lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ").trim() : "Sem Sobrenome",
  }

  if (firebaseUser.phoneNumber?.trim()) {
    syncData.phone = firebaseUser.phoneNumber.trim()
  }

  if (firebaseUser.photoURL?.trim()) {
    syncData.profilePictureUrl = firebaseUser.photoURL.trim()
  }

  try {
    console.log("Sincronizando novo usuário:", {
      userId: syncData.userId,
      email: syncData.email,
      firstName: syncData.firstName,
      lastName: syncData.lastName,
    })

    const result = await usersApi.post<SyncedUser>("/sync", syncData)
    console.log("Usuário sincronizado com sucesso:", result)
    return result
  } catch (error: any) {
    console.error("Erro ao sincronizar usuário:", {
      message: error?.message,
      status: error?.status,
      data: error?.data,
      responseData: error?.response?.data,
      syncData,
    })
    throw error
  }
}

/**
 * Create user with email, password and role
 * POST /users/create
 * 
 * Note: This endpoint may not be implemented yet. If it returns 404, 
 * the function will throw an error indicating it needs to be implemented.
 */
export async function createUser(data: CreateUserInput): Promise<CreateUserResponse> {
  try {
    const result = await usersApi.post<CreateUserResponse>("/create", data)
    return result
  } catch (error: any) {
    // If endpoint doesn't exist, provide helpful error
    if (error?.status === 404) {
      throw new Error("Endpoint de criação de usuário não implementado. Esta funcionalidade requer integração com Firebase Admin SDK no backend.")
    }
    throw error
  }
}
