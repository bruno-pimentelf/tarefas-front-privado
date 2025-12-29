"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TarefaCard } from "@/components/tarefa-card"
import { DiagnosticoAluno } from "@/components/diagnostico-aluno"
import { Gamification } from "@/components/gamification"
import { RealizarTarefa } from "@/components/realizar-tarefa"
import { mockTarefas, mockGamificacao, mockDiagnosticoAluno } from "@/lib/mock-data"
import { Tarefa } from "@/lib/types"

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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Minhas Tarefas</h1>
            <p className="text-sm text-muted-foreground">
              Complete suas atividades e acompanhe seu progresso
            </p>
          </div>

          <Tabs defaultValue="ativas" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ativas">Ativas</TabsTrigger>
              <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
              <TabsTrigger value="concluidas">Concluídas</TabsTrigger>
            </TabsList>

            <TabsContent value="ativas" className="space-y-4 mt-4">
              {tarefasAtivas.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhuma tarefa ativa no momento
                  </CardContent>
                </Card>
              ) : (
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
              )}
            </TabsContent>

            <TabsContent value="agendadas" className="space-y-4 mt-4">
              {tarefasAgendadas.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhuma tarefa agendada
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tarefasAgendadas.map((tarefa) => (
                    <TarefaCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      role="aluno"
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="concluidas" className="space-y-4 mt-4">
              {tarefasConcluidas.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhuma tarefa concluída ainda
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tarefasConcluidas.map((tarefa) => (
                    <TarefaCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      role="aluno"
                      concluida={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <DiagnosticoAluno diagnostico={mockDiagnosticoAluno} />
          <Gamification gamificacao={mockGamificacao} />
        </div>
      </div>
    </div>
  )
}

