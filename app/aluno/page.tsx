"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Gamification } from "@/components/gamification"
import { mockGamificacao, mockDiagnosticoAluno } from "@/lib/mock-data"
import { getStudentBookings, type Booking } from "@/lib/api/bookings"
import { bookingToTarefa } from "@/lib/api/utils"
import { Trophy, TrendingUp, BookOpen, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"
import { FaSignOutAlt } from "react-icons/fa"
import { Fredoka } from "next/font/google"

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fredoka",
})

export default function AlunoPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])

  // Carregar dados do aluno
  useEffect(() => {
    const carregarDados = async () => {
      if (!currentUser) return

      try {
        setLoading(true)
        
        // Buscar apenas bookings (sem admissions)
        const bookingsResponse = await getStudentBookings(currentUser.uid, 1, 100)
        setBookings(bookingsResponse.items || [])
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [currentUser])

  // Calcular estatísticas usando bookingToTarefa para consistência
  const estatisticas = useMemo(() => {
    // Converter bookings para tarefas usando a mesma lógica do dashboard
    const tarefas = bookings.map(booking => bookingToTarefa(booking, false))
    
    const tarefasCompletas = tarefas.filter((t) => t.status === "finalizada").length
    const tarefasAtivas = tarefas.filter((t) => t.status === "ativa").length
    const tarefasAgendadas = tarefas.filter((t) => t.status === "agendada").length

    // Calcular questões respondidas baseado no totalQuestions dos bookings finalizados
    const questoesRespondidas = tarefas
      .filter((t) => t.status === "finalizada")
      .reduce((acc, t) => acc + (t.totalQuestoes || 0), 0)

    return {
      tarefasCompletas,
      tarefasAtivas,
      tarefasAgendadas,
      questoesRespondidas,
      questoesAcertadas: 0, // Não disponível sem admissions
      taxaAcerto: 0, // Não disponível sem admissions
    }
  }, [bookings])

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />

      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-12 items-center justify-between gap-4">
            <h1 
              className={`text-xl font-semibold ${fredoka.variable}`}
              style={{ 
                fontFamily: 'var(--font-fredoka), "Fredoka One", cursive, sans-serif',
                letterSpacing: '0.05em',
                textShadow: '2px 2px 4px rgba(37, 99, 235, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 30%, #1d4ed8 60%, #1e40af 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: '1.4',
                display: 'inline-block',
                fontWeight: 600
              }}
            >
              Aluno
            </h1>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                onClick={handleLogout}
                size="sm"
                className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200"
              >
                <FaSignOutAlt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-16 relative pt-16">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Tarefas Completas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.tarefasCompletas}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {estatisticas.tarefasCompletas === 1
                    ? "tarefa concluída"
                    : "tarefas concluídas"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Tarefas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.tarefasAtivas}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {estatisticas.tarefasAtivas === 1
                    ? "tarefa disponível"
                    : "tarefas disponíveis"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Questões Respondidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estatisticas.questoesRespondidas}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {estatisticas.questoesRespondidas === 1
                    ? "questão resolvida"
                    : "questões resolvidas"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Taxa de Acerto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.taxaAcerto}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {estatisticas.questoesRespondidas > 0
                    ? "desempenho geral"
                    : "nenhuma questão respondida"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gamificação e Diagnóstico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gamificação */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Gamificação
              </h2>
              <Gamification gamificacao={mockGamificacao} />
            </div>

            {/* Diagnóstico */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Diagnóstico
              </h2>
              <div className="space-y-3">
                {/* Pontos Fortes */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Pontos Fortes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {mockDiagnosticoAluno.pontosFortes.map((ponto, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {ponto.habilidade}
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {ponto.percentual}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 dark:bg-green-400 transition-all"
                            style={{ width: `${ponto.percentual}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Áreas de Melhoria */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      Áreas de Melhoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {mockDiagnosticoAluno.areasMelhoria.map((area, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {area.habilidade}
                          </span>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            {area.percentual}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-600 dark:bg-orange-400 transition-all"
                            style={{ width: `${area.percentual}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
