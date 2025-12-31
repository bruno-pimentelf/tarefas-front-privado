"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfileSelector } from "@/components/profile-selector"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/lib/types"

export default function PerfilPage() {
  const { currentUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
    }
  }, [currentUser, router])

  const handleSelectProfile = (role: UserRole) => {
    if (role === "aluno") {
      router.push("/aluno")
    } else if (role === "professor") {
      router.push("/professor")
    }
  }

  if (!currentUser) {
    return null
  }

  return <ProfileSelector onSelectProfile={handleSelectProfile} />
}

