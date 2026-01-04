"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Trophy, BarChart3, User, BookOpen, Users, CheckCircle2, TrendingUp, Loader2, FileText } from "lucide-react"
import { GamificationDialog } from "@/components/gamification-dialog"
import { EstatisticasDialog } from "@/components/estatisticas-dialog"
import { Gamification } from "@/components/gamification"
import { mockGamificacao } from "@/lib/mock-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"
import { getStudentBookings, Booking, getTeacherClasses, TeacherClass } from "@/lib/api/bookings"
import { Fredoka } from "next/font/google"

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fredoka",
})

export default function ProfessorPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [showGamificacao, setShowGamificacao] = useState(false)
  const [showEstatisticas, setShowEstatisticas] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [classes, setClasses] = useState<TeacherClass[]>([])

  // Carregar dados do professor
  useEffect(() => {
    const carregarDados = async () => {
      if (!currentUser) return

      try {
        setLoading(true)
        
        // Carregar bookings e classes em paralelo
        const [bookingsResponse, classesData] = await Promise.all([
          getStudentBookings(currentUser.uid, 1, 100).catch(() => ({ items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } })),
          getTeacherClasses(currentUser.uid).catch(() => [])
        ])
        
        setBookings(bookingsResponse.items || [])
        setClasses(classesData)
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [currentUser])

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const tarefasAtivas = bookings.filter(
      (b) => b.status === "in_progress" || (b.status === "not_started" && new Date(b.endTime || 0) > new Date())
    ).length
    
    const tarefasFinalizadas = bookings.filter(
      (b) => b.status === "finished" || (b.endTime && new Date(b.endTime) < new Date())
    ).length

    const tarefasAgendadas = bookings.filter(
      (b) => b.status === "not_started" && new Date(b.startTime || 0) > new Date()
    ).length

    const totalAlunos = classes.reduce((acc, cls) => acc + (cls as any).studentsCount || 0, 0)

    // Taxa de conclusão não disponível sem admissions
    const taxaConclusao = 0

    return {
      tarefasAtivas,
      tarefasFinalizadas,
      tarefasAgendadas,
      totalAlunos,
      taxaConclusao,
      totalTurmas: classes.length,
    }
  }, [bookings, classes])

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
      icon: <BookOpen className="h-5 w-5" />,
      label: "Tarefas",
      onClick: () => router.push("/professor/tarefas"),
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Relatórios",
      onClick: () => router.push("/professor/analytics"),
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Trocar Perfil",
      onClick: handleVoltar,
    },
  ]

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

      <Sidebar items={sidebarItems} />
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
              Professor
            </h1>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-16 relative pt-16">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Tarefas Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.tarefasAtivas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {estatisticas.tarefasAtivas === 1 ? "tarefa em andamento" : "tarefas em andamento"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Tarefas Finalizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.tarefasFinalizadas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {estatisticas.tarefasFinalizadas === 1 ? "tarefa concluída" : "tarefas concluídas"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Total de Alunos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.totalAlunos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {estatisticas.totalTurmas} {estatisticas.totalTurmas === 1 ? "turma" : "turmas"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    Taxa de Conclusão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.taxaConclusao}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    média geral
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gamificação */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Gamificação
              </h2>
              <Gamification gamificacao={mockGamificacao} />
            </div>
          </div>
      </main>

      <GamificationDialog
        open={showGamificacao}
        onOpenChange={setShowGamificacao}
        gamificacao={mockGamificacao}
      />
      <EstatisticasDialog
        open={showEstatisticas}
        onOpenChange={setShowEstatisticas}
        tarefasAtivas={estatisticas.tarefasAtivas}
        totalAlunos={estatisticas.totalAlunos}
        taxaConclusao={estatisticas.taxaConclusao}
      />
    </div>
  )
}

