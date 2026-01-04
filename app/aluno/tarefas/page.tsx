"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AlunoDashboard } from "@/components/aluno-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaSignOutAlt } from "react-icons/fa"

interface TabCounts {
  ativas: number
  agendadas: number
  concluidas: number
  atrasadas: number
}

export default function AlunoTarefasPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("ativas")
  const [tabCounts, setTabCounts] = useState<TabCounts>({
    ativas: 0,
    agendadas: 0,
    concluidas: 0,
    atrasadas: 0,
  })

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

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
      
      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-14 items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList variant="line" className="h-auto bg-transparent p-0">
                <TabsTrigger value="ativas">
                  Ativas {tabCounts.ativas > 0 && `(${tabCounts.ativas})`}
                </TabsTrigger>
                <TabsTrigger value="agendadas">
                  Agendadas {tabCounts.agendadas > 0 && `(${tabCounts.agendadas})`}
                </TabsTrigger>
                <TabsTrigger value="concluidas">
                  Concluídas {tabCounts.concluidas > 0 && `(${tabCounts.concluidas})`}
                </TabsTrigger>
                <TabsTrigger value="atrasadas">
                  Atrasadas {tabCounts.atrasadas > 0 && `(${tabCounts.atrasadas})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200">
                <FaSignOutAlt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="ml-16 relative pt-14">
        <AlunoDashboard activeTab={activeTab} onCountsChange={setTabCounts} />
      </main>
    </div>
  )
}
