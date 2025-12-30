"use client"

import { useState } from "react"
import { ProfileSelector } from "@/components/profile-selector"
import { AuthScreen } from "@/components/auth/auth-screen"
import { AlunoDashboard } from "@/components/aluno-dashboard"
import { ProfessorDashboard } from "@/components/professor-dashboard"
import { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { LogOut, Trophy, AlertCircle, BarChart3 } from "lucide-react"
import { GamificationDialog } from "@/components/gamification-dialog"
import { DiagnosticoDialog } from "@/components/diagnostico-dialog"
import { EstatisticasDialog } from "@/components/estatisticas-dialog"
import { mockGamificacao, mockDiagnosticoAluno } from "@/lib/mock-data"
import { useAuth } from "@/contexts/auth-context"
import { useAppSelector } from "@/store/hooks"
import { bookingToTarefa } from "@/lib/api/utils"

export default function Home() {
  const { currentUser, logout } = useAuth()
  const { items: bookings } = useAppSelector((state) => state.bookings)
  const [perfilSelecionado, setPerfilSelecionado] = useState<UserRole | null>(null)
  const [showGamificacao, setShowGamificacao] = useState(false)
  const [showDiagnostico, setShowDiagnostico] = useState(false)
  const [showEstatisticas, setShowEstatisticas] = useState(false)
  
  // Calcular tarefas ativas a partir dos bookings da API
  const tarefas = bookings.map(bookingToTarefa)
  const tarefasAtivas = tarefas.filter((t) => t.status === "ativa").length

  const handleSelectProfile = (role: UserRole) => {
    setPerfilSelecionado(role)
  }

  const handleLogout = async () => {
    await logout()
    setPerfilSelecionado(null)
  }

  // Se não estiver autenticado, mostrar tela de autenticação
  if (!currentUser) {
    return <AuthScreen />
  }

  // Se estiver autenticado mas não selecionou perfil, mostrar seletor
  if (!perfilSelecionado) {
    return <ProfileSelector onSelectProfile={handleSelectProfile} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-12 items-center justify-between">
            <h1 className="text-sm font-semibold">
              {perfilSelecionado === "aluno" ? "Minhas Tarefas" : "Dashboard do Professor"}
            </h1>
            <div className="flex items-center gap-2">
              {perfilSelecionado === "aluno" && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setShowGamificacao(true)}
                    size="sm"
                    className="gap-1.5 h-8"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Nível {mockGamificacao.nivel}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDiagnostico(true)}
                    size="sm"
                    className="gap-1.5 h-8"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Diagnóstico</span>
                  </Button>
                </>
              )}
              {perfilSelecionado === "professor" && (
                <>
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
                </>
              )}
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {perfilSelecionado === "aluno" ? (
          <AlunoDashboard />
        ) : (
          <ProfessorDashboard />
        )}
      </main>

      {perfilSelecionado === "aluno" && (
        <>
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
        </>
      )}
      {perfilSelecionado === "professor" && (
        <>
          <EstatisticasDialog
            open={showEstatisticas}
            onOpenChange={setShowEstatisticas}
            tarefasAtivas={tarefasAtivas}
            totalAlunos={30}
            taxaConclusao={83}
            turma="7º A"
          />
          <GamificationDialog
            open={showGamificacao}
            onOpenChange={setShowGamificacao}
            gamificacao={mockGamificacao}
          />
        </>
      )}
    </div>
  )
}
