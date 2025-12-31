"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FeedbackDialog } from "@/components/feedback-dialog"
import { Tarefa, Resposta } from "@/lib/types"
import { ArrowLeft, CheckCircle2, XCircle, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResultadosTarefaProps {
  tarefa: Tarefa
  respostas: Record<string, Resposta>
  tempoTotal: number
  pontuacao: number
  onVoltar: () => void
}

export function ResultadosTarefa({
  tarefa,
  respostas,
  tempoTotal,
  pontuacao,
  onVoltar,
}: ResultadosTarefaProps) {
  const [feedbackQuestao, setFeedbackQuestao] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const totalQuestoes = tarefa.questoes.length
  const questoesCorretas = Object.values(respostas).filter((r) => r.correta).length
  const percentualAcerto = Math.round((questoesCorretas / totalQuestoes) * 100)

  const getComponenteColor = (componente: string) => {
    return componente === "Matemática"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      : "bg-green-500/10 text-green-700 dark:text-green-400"
  }

  const verFeedback = (questaoId: string) => {
    setFeedbackQuestao(questaoId)
    setShowFeedback(true)
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onVoltar} size="sm" className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Button>
        {tarefa.componente && (
          <Badge className={getComponenteColor(tarefa.componente)}>
            {tarefa.componente}
          </Badge>
        )}
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{tarefa.titulo}</CardTitle>
          {tarefa.descricao && (
            <CardDescription className="text-xs mt-0.5">{tarefa.descricao}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded">
              <div className="text-lg font-semibold">{percentualAcerto}%</div>
              <div className="text-xs text-muted-foreground">Acertos</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded">
              <div className="text-lg font-semibold">
                {questoesCorretas}/{totalQuestoes}
              </div>
              <div className="text-xs text-muted-foreground">Questões</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded">
              <div className="text-lg font-semibold">
                {Math.floor(tempoTotal / 60)}min
              </div>
              <div className="text-xs text-muted-foreground">Tempo total</div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Desempenho</span>
              <span className="text-muted-foreground">{percentualAcerto}%</span>
            </div>
            <Progress value={percentualAcerto} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Resultados por Questão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tarefa.questoes.map((questao, index) => {
              const resposta = respostas[questao.id]
              const isCorreta = resposta?.correta ?? false

              return (
                <div
                  key={questao.id}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded border transition-colors",
                    isCorreta
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isCorreta ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium">
                      Questão {index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {questao.enunciado}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => verFeedback(questao.id)}
                    className="gap-1.5 h-7"
                  >
                    <Eye className="h-3 w-3" />
                    Ver
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {showFeedback && feedbackQuestao && (
        <FeedbackDialog
          open={showFeedback}
          onOpenChange={setShowFeedback}
          resposta={respostas[feedbackQuestao]}
          questao={tarefa.questoes.find((q) => q.id === feedbackQuestao)!}
        />
      )}
    </div>
  )
}

