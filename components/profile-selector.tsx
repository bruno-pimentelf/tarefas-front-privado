"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/lib/types"
import { GraduationCap, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ProfileSelectorProps {
  onSelectProfile: (role: UserRole) => void
}

export function ProfileSelector({ onSelectProfile }: ProfileSelectorProps) {
  const { currentUser } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">
            Tarefas
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecione seu perfil para acessar o sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="transition-all hover:shadow-md border cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2.5 rounded-lg bg-primary/5">
                  <GraduationCap className="h-7 w-7 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center text-base">Aluno</CardTitle>
              <CardDescription className="text-center text-xs mt-1">
                Realize tarefas, receba feedback imediato e acompanhe seu progresso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onSelectProfile("aluno")}
                variant="ghost"
                className="w-full border border-primary/15 shadow-[0_0_4px_rgba(59,130,246,0.08)] hover:shadow-[0_0_6px_rgba(59,130,246,0.12)] transition-shadow"
                size="default"
              >
                Entrar como Aluno
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md border cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2.5 rounded-lg bg-primary/5">
                  <User className="h-7 w-7 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center text-base">Professor</CardTitle>
              <CardDescription className="text-center text-xs mt-1">
                Crie tarefas, acompanhe desempenho e gere relatórios pedagógicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onSelectProfile("professor")}
                variant="ghost"
                className="w-full border border-primary/15 shadow-[0_0_4px_rgba(59,130,246,0.08)] hover:shadow-[0_0_6px_rgba(59,130,246,0.12)] transition-shadow"
                size="default"
              >
                Entrar como Professor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

