"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/sidebar"
import { AlertCircle, Trophy, User, ClipboardList } from "lucide-react"
import { GamificationDialog } from "@/components/gamification-dialog"
import { DiagnosticoDialog } from "@/components/diagnostico-dialog"
import { PerfilDialog } from "@/components/perfil-dialog"
import { mockGamificacao, mockDiagnosticoAluno } from "@/lib/mock-data"
import { getUserRoleName, canAccessRoute, DEFAULT_SCHOOL_ID } from "@/lib/utils/role-redirect"
import { FaSpinner } from "react-icons/fa"

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [showGamificacao, setShowGamificacao] = useState(false)
  const [showDiagnostico, setShowDiagnostico] = useState(false)
  const [showPerfil, setShowPerfil] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    // Verificar se o usuário tem permissão para acessar /aluno
    const checkRole = async () => {
      try {
        const roleName = await getUserRoleName(currentUser.uid, DEFAULT_SCHOOL_ID)
        
        if (!roleName || !canAccessRoute(roleName, "/aluno")) {
          // Se não tem role ou não tem permissão, redireciona para /perfil
          router.push("/perfil")
          return
        }
      } catch (error) {
        // Em caso de erro, redireciona para /perfil
        router.push("/perfil")
      } finally {
        setCheckingRole(false)
      }
    }

    checkRole()
  }, [currentUser, router])

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const sidebarItems = [
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Tarefas",
      onClick: () => router.push("/aluno/tarefas"),
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      label: "Diagnóstico",
      onClick: () => setShowDiagnostico(true),
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: "Gamificação",
      onClick: () => setShowGamificacao(true),
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Meu Perfil",
      onClick: () => setShowPerfil(true),
    },
  ]

  if (!currentUser || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={sidebarItems} />
      <main className="ml-16">
        {children}
      </main>
      <GamificationDialog
        open={showGamificacao}
        onOpenChange={setShowGamificacao}
        gamificacao={mockGamificacao}
      />
      <DiagnosticoDialog
        open={showDiagnostico}
        onOpenChange={setShowDiagnostico}
        diagnostico={mockDiagnosticoAluno}
      />
      <PerfilDialog
        open={showPerfil}
        onOpenChange={setShowPerfil}
      />
    </div>
  )
}

