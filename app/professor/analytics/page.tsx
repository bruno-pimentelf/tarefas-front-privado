"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, School, GraduationCap } from "lucide-react"
import { getTeacherClasses, type TeacherClass } from "@/lib/api/bookings"
import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { FaSignOutAlt, FaArrowLeft } from "react-icons/fa"
import { Trophy, BarChart3, ClipboardList, User, UserCircle } from "lucide-react"

export default function AnalyticsPage() {
  const router = useRouter()
  const { currentUser, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
    }
  }, [currentUser, router])

  // Carregar turmas do professor
  useEffect(() => {
    const carregarTurmas = async () => {
      if (!currentUser) return

      setLoading(true)
      try {
        const classes = await getTeacherClasses(currentUser.uid).catch(() => [])
        setTeacherClasses(classes)
      } catch (err) {
        console.error("Erro ao carregar turmas:", err)
      } finally {
        setLoading(false)
      }
    }

    carregarTurmas()
  }, [currentUser])

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const handleVoltar = () => {
    router.push("/professor")
  }

  if (!currentUser) {
    return null
  }

  const sidebarItems = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Dados",
      onClick: () => router.push("/professor/dados"),
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Tarefas",
      onClick: () => router.push("/professor/tarefas"),
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Relatórios",
      onClick: () => router.push("/professor/analytics"),
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: "Níveis",
      onClick: () => router.push("/professor"),
    },
    {
      icon: <UserCircle className="h-5 w-5" />,
      label: "Trocar Perfil",
      onClick: () => router.push("/perfil"),
    },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      
      <Sidebar items={sidebarItems} />
      
      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto px-4 max-w-7xl w-full h-12 flex items-center">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleVoltar}
                size="sm"
                className="gap-2 h-9 hover:bg-accent/10 transition-all duration-200"
              >
                <FaArrowLeft className="h-4 w-4" />
                <span className="text-sm">Voltar</span>
              </Button>
              <h2 className="text-base font-semibold">Relatórios</h2>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-2 h-9 hover:bg-accent/10 transition-all duration-200">
                <FaSignOutAlt className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-16 relative pt-16">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teacherClasses.length === 0 ? (
            <Card className="border-2 shadow-lg">
              <CardContent className="p-12 text-center">
                <School className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma turma encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Você não está associado a nenhuma turma no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Selecione uma Turma</h1>
                <p className="text-sm text-muted-foreground">
                  Escolha uma turma para visualizar os relatórios e estatísticas das tarefas
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacherClasses.map((turma) => (
                  <Card
                    key={turma.id}
                    className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                    onClick={() => router.push(`/professor/analytics/turma/${turma.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold">{turma.name}</p>
                          <p className="text-xs text-muted-foreground">{turma.grade}</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <School className="h-4 w-4" />
                        <span>{turma.school?.name || "Escola não informada"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
