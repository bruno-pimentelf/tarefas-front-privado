"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { syncUser } from "@/lib/api/users"
import { getUserRole, UserRole as AssessmentUserRole } from "@/lib/api/roles"

interface AuthContextType {
  currentUser: User | null
  userRole: AssessmentUserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  fetchUserRole: (schoolId: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<AssessmentUserRole | null>(null)
  const [loading, setLoading] = useState(true)

  // Função para buscar a role do usuário em uma escola específica
  const fetchUserRole = async (schoolId: number) => {
    if (!currentUser) return
    
    try {
      const role = await getUserRole(currentUser.uid, schoolId)
      setUserRole(role)
    } catch (error) {
      console.error("Erro ao buscar role do usuário:", error)
      // Não lança erro para não bloquear a aplicação
      setUserRole(null)
    }
  }

  const signUp = async (email: string, password: string) => {
    // Cria o usuário no Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Sincroniza o usuário com o backend após a criação
    // Isso deve acontecer apenas quando um usuário é criado, não no login
    try {
      await syncUser(userCredential.user)
      console.log("Usuário criado e sincronizado com sucesso")
    } catch (error: any) {
      // Log do erro mas não bloqueia a criação do usuário no Firebase
      // O usuário foi criado, mas a sincronização falhou
      console.error("Erro ao sincronizar usuário após cadastro:", {
        message: error?.message,
        status: error?.status,
        data: error?.data,
      })
      // Nota: O usuário já foi criado no Firebase, mas a sincronização falhou
      // Isso pode causar problemas futuros - considere tratar de forma mais robusta
    }
  }

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    // Não sincroniza no login - sincronização ocorre apenas na criação do usuário
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    // Não sincroniza no login - sincronização ocorre apenas na criação do usuário
  }

  const logout = async () => {
    await signOut(auth)
    setUserRole(null) // Limpa a role ao fazer logout
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
      // Não sincroniza automaticamente - sincronização ocorre apenas na criação do usuário (signUp)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    currentUser,
    userRole,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    fetchUserRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

