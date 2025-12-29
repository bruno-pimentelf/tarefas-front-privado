"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tarefa } from "@/lib/types"
import { Loader2, FileText } from "lucide-react"

interface ProcessandoTarefaProps {
  tarefa: Tarefa
  tempoDecorrido: number
}

export function ProcessandoTarefa({ tarefa, tempoDecorrido }: ProcessandoTarefaProps) {
  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Processando Tarefa
          </CardTitle>
          <CardDescription className="text-xs">
            {tarefa.titulo}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">
                Processando suas respostas...
              </p>
              <p className="text-xs text-muted-foreground">
                As questões dissertativas estão sendo corrigidas por IA
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tempo decorrido</span>
              <span className="text-muted-foreground">
                {Math.floor(tempoDecorrido / 60)}min {tempoDecorrido % 60}s
              </span>
            </div>
            <Progress value={50} className="h-1.5 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

