"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/lib/types"
import { GraduationCap, User, BookOpen } from "lucide-react"

interface ProfileSelectorProps {
  onSelectProfile: (role: UserRole) => void
}

export function ProfileSelector({ onSelectProfile }: ProfileSelectorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Plataforma de Tarefas Escolares
          </h1>
          <p className="text-muted-foreground">
            Selecione seu perfil para acessar o sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="transition-all hover:shadow-md border cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-lg bg-primary/5">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center text-lg">Aluno</CardTitle>
              <CardDescription className="text-center text-sm mt-2">
                Realize tarefas, receba feedback imediato e acompanhe seu progresso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onSelectProfile("aluno")}
                className="w-full"
                size="default"
              >
                Entrar como Aluno
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md border cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-lg bg-primary/5">
                  <User className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center text-lg">Professor</CardTitle>
              <CardDescription className="text-center text-sm mt-2">
                Crie tarefas, acompanhe desempenho e gere relatórios pedagógicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onSelectProfile("professor")}
                className="w-full"
                size="default"
                variant="outline"
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

