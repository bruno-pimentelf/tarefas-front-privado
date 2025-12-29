"use client"

import { useState } from "react"
import { ProfileSelector } from "@/components/profile-selector"
import { AlunoDashboard } from "@/components/aluno-dashboard"
import { ProfessorDashboard } from "@/components/professor-dashboard"
import { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Home() {
  const [perfilSelecionado, setPerfilSelecionado] = useState<UserRole | null>(null)

  const handleSelectProfile = (role: UserRole) => {
    setPerfilSelecionado(role)
  }

  const handleLogout = () => {
    setPerfilSelecionado(null)
  }

  if (!perfilSelecionado) {
    return <ProfileSelector onSelectProfile={handleSelectProfile} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="text-base font-semibold leading-tight">
                  {perfilSelecionado === "aluno" ? "Dashboard do Aluno" : "Dashboard do Professor"}
                </h1>
                <p className="text-xs text-muted-foreground leading-tight">
                  Tarefas
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Trocar Perfil</span>
            </Button>
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
    </div>
  )
}
