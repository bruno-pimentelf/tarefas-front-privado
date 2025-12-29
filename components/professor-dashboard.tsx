"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TarefaCard } from "@/components/tarefa-card"
import { RelatorioPedagogico } from "@/components/relatorio-pedagogico"
import { CriarTarefaDialog } from "@/components/criar-tarefa-dialog"
import { mockTarefas, mockRelatorios } from "@/lib/mock-data"
import { Tarefa, RelatorioPedagogico as RelatorioType } from "@/lib/types"
import { Plus, BookOpen, BarChart3, Users } from "lucide-react"

export function ProfessorDashboard() {
  const [tarefas] = useState<Tarefa[]>(mockTarefas)
  const [relatorios] = useState<RelatorioType[]>(mockRelatorios)
  const [showCriarTarefa, setShowCriarTarefa] = useState(false)

  const tarefasAtivas = tarefas.filter((t) => t.status === "ativa")
  const tarefasAgendadas = tarefas.filter((t) => t.status === "agendada")
  const tarefasFinalizadas = tarefas.filter((t) => t.status === "finalizada")

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard do Professor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie tarefas e acompanhe o desempenho dos alunos
          </p>
        </div>
        <Button onClick={() => setShowCriarTarefa(true)} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
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
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30</div>
            <p className="text-xs text-muted-foreground">
              Turma 7º A
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">83%</div>
            <p className="text-xs text-muted-foreground">
              Média geral
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ativas" className="space-y-4 mt-0">
        <TabsList>
          <TabsTrigger value="ativas">Ativas</TabsTrigger>
          <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
          <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="ativas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <TabsContent value="agendadas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <TabsContent value="finalizadas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <TabsContent value="relatorios" className="space-y-4">
          <div className="space-y-4">
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

