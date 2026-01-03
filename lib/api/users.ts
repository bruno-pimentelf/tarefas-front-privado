import { usersApi } from "./client"
import { User as FirebaseUser } from "firebase/auth"

// ==========================================
// Types para Users API
// ==========================================

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
  firstName: string  // Obrigatório
  lastName: string   // Obrigatório
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

// ==========================================
// API Functions
// ==========================================

/**
 * Sincroniza o usuário com o backend
 * POST /sync
 * 
 * Extrai os dados disponíveis do Firebase User e sincroniza com o backend.
 * Se o usuário já existe, será atualizado; caso contrário, será criado.
 */
export async function syncUser(firebaseUser: FirebaseUser): Promise<SyncedUser> {
  // Validação: email é obrigatório
  if (!firebaseUser.email) {
    throw new Error("Email do usuário não está disponível")
  }

  // Extrai nome completo do displayName se disponível
  const displayName = firebaseUser.displayName?.trim() || ""
  const nameParts = displayName ? displayName.split(/\s+/).filter(part => part.length > 0) : []
  
  // Prepara os dados para sincronização
  // firstName e lastName são OBRIGATÓRIOS segundo a API
  const syncData: SyncUserInput = {
    userId: firebaseUser.uid,
    email: firebaseUser.email,
    firstName: nameParts.length > 0 && nameParts[0] ? nameParts[0] : "Usuário",
    lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ").trim() : "Sem Sobrenome",
  }

  // Adiciona phone apenas se existir e não for vazio
  if (firebaseUser.phoneNumber?.trim()) {
    syncData.phone = firebaseUser.phoneNumber.trim()
  }

  // Adiciona profilePictureUrl apenas se existir e não for vazio
  if (firebaseUser.photoURL?.trim()) {
    syncData.profilePictureUrl = firebaseUser.photoURL.trim()
  }

  // dateOfBirth e address não estão disponíveis no Firebase User
  // Eles devem ser preenchidos pelo backend ou em uma atualização posterior

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
    // Log detalhado do erro para debug
    console.error("Erro ao sincronizar usuário:", {
      message: error?.message,
      status: error?.status,
      data: error?.data,
      responseData: error?.response?.data,
      syncData,
    })
    
    // Lança o erro para que o signUp possa tratá-lo adequadamente
    throw error
  }
}
