"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TarefaCard } from "@/components/tarefa-card"
import { RealizarTarefa } from "@/components/realizar-tarefa"
import { mockTarefas } from "@/lib/mock-data"
import { Tarefa } from "@/lib/types"

export function AlunoDashboard() {
  const [tarefas] = useState<Tarefa[]>(mockTarefas)
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null)

  const tarefasAtivas = tarefas.filter((t) => t.status === "ativa")
  const tarefasConcluidas: Tarefa[] = [] // Mock - normalmente viria do backend
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
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      <Tabs defaultValue="ativas" className="space-y-3">
        <TabsList>
          <TabsTrigger value="ativas">Ativas</TabsTrigger>
          <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
          <TabsTrigger value="concluidas">Concluídas</TabsTrigger>
        </TabsList>

        <TabsContent value="ativas" className="space-y-3 mt-3">
          {tarefasAtivas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma tarefa ativa no momento
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

        <TabsContent value="agendadas" className="space-y-3 mt-3">
          {tarefasAgendadas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma tarefa agendada
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

        <TabsContent value="concluidas" className="space-y-3 mt-3">
          {tarefasConcluidas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma tarefa concluída ainda
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
  )
}

