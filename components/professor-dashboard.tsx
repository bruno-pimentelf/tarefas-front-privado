"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TarefaCard } from "@/components/tarefa-card"
import { RelatorioPedagogico } from "@/components/relatorio-pedagogico"
import { CriarTarefaDialog } from "@/components/criar-tarefa-dialog"
import { mockTarefas, mockRelatorios } from "@/lib/mock-data"
import { Tarefa, RelatorioPedagogico as RelatorioType } from "@/lib/types"
import { Plus } from "lucide-react"

export function ProfessorDashboard() {
  const [tarefas] = useState<Tarefa[]>(mockTarefas)
  const [relatorios] = useState<RelatorioType[]>(mockRelatorios)
  const [showCriarTarefa, setShowCriarTarefa] = useState(false)

  const tarefasAtivas = tarefas.filter((t) => t.status === "ativa")
  const tarefasAgendadas = tarefas.filter((t) => t.status === "agendada")
  const tarefasFinalizadas = tarefas.filter((t) => t.status === "finalizada")

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      <Tabs defaultValue="ativas" className="space-y-3">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="ativas">Ativas</TabsTrigger>
            <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
            <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowCriarTarefa(true)} size="default" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        <TabsContent value="ativas" className="space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tarefasAtivas.map((tarefa) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                role="professor"
                onVerDetalhes={() => {
                  // Navegar para detalhes
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agendadas" className="space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tarefasAgendadas.map((tarefa) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                role="professor"
                onVerDetalhes={() => {
                  // Navegar para detalhes
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="finalizadas" className="space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tarefasFinalizadas.map((tarefa) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                role="professor"
                onVerDetalhes={() => {
                  // Navegar para detalhes
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-3 mt-3">
          <div className="space-y-3">
            {relatorios.map((relatorio) => (
              <RelatorioPedagogico key={relatorio.tarefaId} relatorio={relatorio} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CriarTarefaDialog
        open={showCriarTarefa}
        onOpenChange={setShowCriarTarefa}
      />
    </div>
  )
}

