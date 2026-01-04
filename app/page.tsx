"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getRedirectRouteByUserRole, DEFAULT_SCHOOL_ID } from "@/lib/utils/role-redirect"
import { FaSpinner } from "react-icons/fa"

export default function Home() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    // Tentar buscar a role do usuário e redirecionar
    const checkUserRole = async () => {
      try {
        const redirectRoute = await getRedirectRouteByUserRole(
          currentUser.uid,
          DEFAULT_SCHOOL_ID
        )
        
        if (redirectRoute) {
          // Se encontrou role, redireciona
          router.push(redirectRoute)
          return
        }
        
        // Se não encontrou role, vai para /perfil para selecionar
        router.push("/perfil")
      } catch (error) {
        // Em caso de erro, vai para /perfil
        router.push("/perfil")
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [currentUser, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return null
}
