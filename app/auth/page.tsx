"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthScreen } from "@/components/auth/auth-screen"
import { useAuth } from "@/contexts/auth-context"

export default function AuthPage() {
  const { currentUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (currentUser) {
      router.push("/perfil")
    }
  }, [currentUser, router])

  if (currentUser) {
    return null
  }

  return <AuthScreen />
}

