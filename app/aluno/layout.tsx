"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { LogOut, AlertCircle, Trophy, User } from "lucide-react"
import { GamificationDialog } from "@/components/gamification-dialog"
import { DiagnosticoDialog } from "@/components/diagnostico-dialog"
import { mockGamificacao, mockDiagnosticoAluno } from "@/lib/mock-data"

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [showGamificacao, setShowGamificacao] = useState(false)
  const [showDiagnostico, setShowDiagnostico] = useState(false)

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

  const sidebarItems = [
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
      label: "Trocar Perfil",
      onClick: handleVoltar,
    },
  ]

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={sidebarItems} />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ml-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3"></div>
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
    </div>
  )
}

