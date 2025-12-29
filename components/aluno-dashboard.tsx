"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TarefaCard } from "@/components/tarefa-card"
import { Gamification } from "@/components/gamification"
import { RealizarTarefa } from "@/components/realizar-tarefa"
import { mockTarefas, mockGamificacao } from "@/lib/mock-data"
import { Tarefa } from "@/lib/types"
import { BookOpen, CheckCircle2, Clock } from "lucide-react"

export function AlunoDashboard() {
  const [tarefas] = useState<Tarefa[]>(mockTarefas)
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null)

  const tarefasAtivas = tarefas.filter((t) => t.status === "ativa")
  const tarefasConcluidas = [] // Mock - normalmente viria do backend
  const tarefasAgendadas = tarefas.filter((t) => t.status === "agendada")

  if (tarefaSelecionada) {
    return (
      <RealizarTarefa
        tarefa={tarefaSelecionada}
        onVoltar={() => setTarefaSelecionada(null)}
        onConcluir={() => {
          setTarefaSelecionada(null)
          // Atualizar lista de tarefas concluídas
        }}
      />
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Minhas Tarefas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete suas atividades e acompanhe seu progresso
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Ativas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tarefasAtivas.length}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para fazer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tarefasConcluidas.length}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tarefasAgendadas.length}</div>
            <p className="text-xs text-muted-foreground">
              Em breve
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="ativas" className="space-y-4 mt-0">
            <TabsList>
              <TabsTrigger value="ativas">Ativas</TabsTrigger>
              <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
              <TabsTrigger value="concluidas">Concluídas</TabsTrigger>
            </TabsList>

            <TabsContent value="ativas" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tarefasAtivas.map((tarefa) => (
                  <TarefaCard
                    key={tarefa.id}
                    tarefa={tarefa}
                    role="aluno"
                    onIniciar={() => setTarefaSelecionada(tarefa)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="agendadas" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tarefasAgendadas.map((tarefa) => (
                  <TarefaCard
                    key={tarefa.id}
                    tarefa={tarefa}
                    role="aluno"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="concluidas" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tarefasConcluidas.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhuma tarefa concluída ainda
                    </CardContent>
                  </Card>
                ) : (
                  tarefasConcluidas.map((tarefa) => (
                    <TarefaCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      role="aluno"
                      concluida={true}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Gamification gamificacao={mockGamificacao} />
        </div>
      </div>
    </div>
  )
}

