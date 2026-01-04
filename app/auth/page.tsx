"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthScreen } from "@/components/auth/auth-screen"
import { useAuth } from "@/contexts/auth-context"
import { getRedirectRouteByUserRole, DEFAULT_SCHOOL_ID } from "@/lib/utils/role-redirect"

export default function AuthPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setChecking(true)
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
          setChecking(false)
        }
      }

      checkUserRole()
    }
  }, [currentUser, router])

  if (currentUser || checking) {
    return null
  }

  return <AuthScreen />
}

