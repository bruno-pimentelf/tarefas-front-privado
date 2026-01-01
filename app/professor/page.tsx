"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfessorDashboard } from "@/components/professor-dashboard"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Trophy, BarChart3 } from "lucide-react"
import { GamificationDialog } from "@/components/gamification-dialog"
import { EstatisticasDialog } from "@/components/estatisticas-dialog"
import { mockGamificacao } from "@/lib/mock-data"

// Mock de estatísticas - TODO: Buscar da API
const mockEstatisticas = {
  tarefasAtivas: 0,
  totalAlunos: 0,
  taxaConclusao: 0,
}

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
    router.push("/perfil")
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">Área do Professor</h2>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => setShowEstatisticas(true)}
                size="sm"
                className="gap-1.5 h-8"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Estatísticas</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowGamificacao(true)}
                size="sm"
                className="gap-1.5 h-8"
              >
                <Trophy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Níveis</span>
              </Button>
              <Button variant="ghost" onClick={handleVoltar} size="sm" className="gap-1.5 h-8">
                <span className="hidden sm:inline text-xs">Trocar Perfil</span>
              </Button>
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
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
        tarefasAtivas={mockEstatisticas.tarefasAtivas}
        totalAlunos={mockEstatisticas.totalAlunos}
        taxaConclusao={mockEstatisticas.taxaConclusao}
      />
    </div>
  )
}

