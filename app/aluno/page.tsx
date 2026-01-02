"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlunoDashboard } from "@/components/aluno-dashboard"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Trophy, AlertCircle } from "lucide-react"
import { GamificationDialog } from "@/components/gamification-dialog"
import { DiagnosticoDialog } from "@/components/diagnostico-dialog"
import { mockGamificacao, mockDiagnosticoAluno } from "@/lib/mock-data"
import { useAppSelector } from "@/store/hooks"
import { bookingToTarefa } from "@/lib/api/utils"

export default function AlunoPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const { items: bookings } = useAppSelector((state) => state.bookings)
  const [showGamificacao, setShowGamificacao] = useState(false)
  const [showDiagnostico, setShowDiagnostico] = useState(false)

  // Calcular tarefas ativas a partir dos bookings da API
  const tarefas = bookings.map((booking) => bookingToTarefa(booking, false))
  const tarefasAtivas = tarefas.filter((t) => t.status === "ativa").length

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
              <h2 className="text-base font-semibold">Área do Aluno</h2>
              {tarefasAtivas > 0 && (
                <span className="text-xs text-muted-foreground">
                  {tarefasAtivas} {tarefasAtivas === 1 ? "tarefa ativa" : "tarefas ativas"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => setShowDiagnostico(true)}
                size="sm"
                className="gap-1.5 h-8"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Diagnóstico</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowGamificacao(true)}
                size="sm"
                className="gap-1.5 h-8"
              >
                <Trophy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Gamificação</span>
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
        <AlunoDashboard />
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
    </div>
  )
}

