"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ColecoesPage } from "@/components/colecoes-page"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"
import { FaSignOutAlt, FaArrowLeft } from "react-icons/fa"
import { Trophy, BarChart3, ClipboardList, User, UserCircle } from "lucide-react"
import { PerfilDialog } from "@/components/perfil-dialog"

export default function ColecoesPageRoute() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [showPerfil, setShowPerfil] = useState(false)

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
    router.push("/professor/banco-itens")
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
          <div className="flex items-center justify-between gap-4 w-full">
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
              <h2 className="text-base font-semibold">Coleções</h2>
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
        <ColecoesPage />
      </main>
      <PerfilDialog
        open={showPerfil}
        onOpenChange={setShowPerfil}
      />
    </div>
  )
}

