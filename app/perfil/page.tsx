"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PerfilDialog } from "@/components/perfil-dialog"
import { getRedirectRouteByUserRole, DEFAULT_SCHOOL_ID } from "@/lib/utils/role-redirect"
import { FaSpinner } from "react-icons/fa"

export default function PerfilPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    // Sempre mostra o diálogo para permitir trocar de role
    // Não redireciona automaticamente, permitindo que o usuário escolha
    setShowDialog(true)
    setLoading(false)
  }, [currentUser, router])

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <PerfilDialog
      open={showDialog}
      onOpenChange={(open) => {
        setShowDialog(open)
        // Se fechar sem selecionar role, volta para auth
        if (!open) {
          router.push("/auth")
        }
      }}
    />
  )
}

