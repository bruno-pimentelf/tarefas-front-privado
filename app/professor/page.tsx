"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfessorDashboard } from "@/components/professor-dashboard"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Trophy, BarChart3, User, TestTube } from "lucide-react"
import Link from "next/link"
import { GamificationDialog } from "@/components/gamification-dialog"
import { EstatisticasDialog } from "@/components/estatisticas-dialog"
import { mockGamificacao } from "@/lib/mock-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"

export default function ProfessorPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [showGamificacao, setShowGamificacao] = useState(false)
  const [showEstatisticas, setShowEstatisticas] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
    }
  }, [currentUser, router])

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const handleVoltar = () => {
    // Volta para seleção de perfil, permitindo trocar de role se necessário
    router.push("/perfil")
  }

  if (!currentUser) {
    return null
  }

  const sidebarItems = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Estatísticas",
      onClick: () => setShowEstatisticas(true),
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: "Níveis",
      onClick: () => setShowGamificacao(true),
    },
    {
      icon: <TestTube className="h-5 w-5" />,
      label: "Teste Analytics",
      onClick: () => router.push("/teste-analytics"),
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Trocar Perfil",
      onClick: handleVoltar,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={sidebarItems} />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ml-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-16">
        <ProfessorDashboard />
      </main>

      <GamificationDialog
        open={showGamificacao}
        onOpenChange={setShowGamificacao}
        gamificacao={mockGamificacao}
      />
      <EstatisticasDialog
        open={showEstatisticas}
        onOpenChange={setShowEstatisticas}
        tarefasAtivas={0}
        totalAlunos={0}
        taxaConclusao={0}
      />
    </div>
  )
}

