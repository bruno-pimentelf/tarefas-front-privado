"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfessorDashboard } from "@/components/professor-dashboard"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaSignOutAlt, FaSync, FaDatabase, FaPlus } from "react-icons/fa"
import { Trophy, BarChart3, ClipboardList, User, UserCircle } from "lucide-react"
import { GamificationDialog } from "@/components/gamification-dialog"
import { EstatisticasDialog } from "@/components/estatisticas-dialog"
import { CriarTarefaDialog } from "@/components/criar-tarefa-dialog"
import { PerfilDialog } from "@/components/perfil-dialog"
import { mockGamificacao } from "@/lib/mock-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"
import { getUserRoleName, canAccessRoute, DEFAULT_SCHOOL_ID } from "@/lib/utils/role-redirect"
import { FaSpinner } from "react-icons/fa"

export default function ProfessorTarefasPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [showGamificacao, setShowGamificacao] = useState(false)
  const [showEstatisticas, setShowEstatisticas] = useState(false)
  const [showPerfil, setShowPerfil] = useState(false)
  const [activeTab, setActiveTab] = useState("ativas")
  const [showCriarTarefa, setShowCriarTarefa] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    // Verificar se o usuário tem permissão para acessar /professor
    const checkRole = async () => {
      try {
        const roleName = await getUserRoleName(currentUser.uid, DEFAULT_SCHOOL_ID)
        
        if (!roleName || !canAccessRoute(roleName, "/professor")) {
          router.push("/perfil")
          return
        }
      } catch (error) {
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

  // Sidebar items padronizados
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
      
      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-12 items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList variant="line" className="h-auto bg-transparent p-0">
                <TabsTrigger value="ativas">Ativas</TabsTrigger>
                <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
                <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="h-8 w-8 p-0 hover:bg-accent/10 transition-all duration-200"
                title="Atualizar"
              >
                <FaSync className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/professor/banco-itens")}
                className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200"
              >
                <FaDatabase className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Banco de Itens</span>
              </Button>
              <Button
                onClick={() => setShowCriarTarefa(true)}
                size="sm"
                className="gap-1.5 h-8"
              >
                <FaPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Nova Tarefa</span>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200">
                <FaSignOutAlt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-16 relative pt-16">
        <ProfessorDashboard 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          refreshTrigger={refreshTrigger}
          currentUser={currentUser}
        />
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
      <CriarTarefaDialog
        open={showCriarTarefa}
        onOpenChange={setShowCriarTarefa}
        onSuccess={() => {
          setShowCriarTarefa(false)
          router.refresh()
        }}
      />
      <PerfilDialog
        open={showPerfil}
        onOpenChange={setShowPerfil}
      />
    </div>
  )
}
