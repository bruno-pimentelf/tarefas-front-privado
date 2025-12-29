"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuestaoObjetiva } from "@/components/questao-objetiva"
import { QuestaoDissertativa } from "@/components/questao-dissertativa"
import { FeedbackDialog } from "@/components/feedback-dialog"
import { Tarefa, Resposta } from "@/lib/types"
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react"

interface RealizarTarefaProps {
  tarefa: Tarefa
  onVoltar: () => void
  onConcluir: () => void
}

export function RealizarTarefa({ tarefa, onVoltar, onConcluir }: RealizarTarefaProps) {
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({})
  const [tempoInicio] = useState(Date.now())
  const [tempoQuestao, setTempoQuestao] = useState(Date.now())
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackQuestao, setFeedbackQuestao] = useState<string | null>(null)

  const questao = tarefa.questoes[questaoAtual]
  const progresso = ((questaoAtual + 1) / tarefa.questoes.length) * 100
  const todasRespondidas = Object.keys(respostas).length === tarefa.questoes.length

  useEffect(() => {
    setTempoQuestao(Date.now())
  }, [questaoAtual])

  const handleResponder = (resposta: string) => {
    const novaResposta: Resposta = {
      questaoId: questao.id,
      resposta,
      correta: questao.tipo === "objetiva" 
        ? resposta === questao.respostaCorreta
        : false, // Dissertativas serão corrigidas por IA
      tempoGasto: Math.floor((Date.now() - tempoQuestao) / 1000),
    }

    setRespostas((prev) => ({
      ...prev,
      [questao.id]: novaResposta,
    }))

    // Para questões objetivas, mostrar feedback imediato
    if (questao.tipo === "objetiva") {
      setFeedbackQuestao(questao.id)
      setShowFeedback(true)
    }
  }

  const handleProximaQuestao = () => {
    if (questaoAtual < tarefa.questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1)
      setShowFeedback(false)
      setFeedbackQuestao(null)
    }
  }

  const handleFinalizar = () => {
    // Processar respostas dissertativas com IA
    // Calcular pontuação
    // Atualizar gamificação
    onConcluir()
  }

  const getComponenteColor = (componente: string) => {
    return componente === "Matemática" 
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" 
      : "bg-green-500/10 text-green-700 dark:text-green-400"
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onVoltar} size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Badge className={getComponenteColor(tarefa.componente)}>
          {tarefa.componente}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold mb-1">{tarefa.titulo}</CardTitle>
              {tarefa.descricao && (
                <CardDescription className="text-sm mt-1">{tarefa.descricao}</CardDescription>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground mb-1">Questão</div>
              <div className="text-xl font-semibold">
                {questaoAtual + 1} / {tarefa.questoes.length}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-muted-foreground">{Math.round(progresso)}%</span>
            </div>
            <Progress value={progresso} className="h-2" />
          </div>

          <div className="pt-4">
            {questao.tipo === "objetiva" ? (
              <QuestaoObjetiva
                questao={questao}
                respostaAtual={respostas[questao.id]?.resposta}
                onResponder={handleResponder}
              />
            ) : (
              <QuestaoDissertativa
                questao={questao}
                respostaAtual={respostas[questao.id]?.resposta}
                onResponder={handleResponder}
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Tempo nesta questão: {Math.floor((Date.now() - tempoQuestao) / 1000)}s</span>
            </div>
            <div className="flex gap-2">
              {questaoAtual > 0 && (
                <Button variant="outline" onClick={() => setQuestaoAtual(questaoAtual - 1)} size="default">
                  Anterior
                </Button>
              )}
              {questaoAtual < tarefa.questoes.length - 1 ? (
                <Button
                  onClick={handleProximaQuestao}
                  disabled={!respostas[questao.id]}
                  size="default"
                >
                  Próxima
                </Button>
              ) : (
                <Button
                  onClick={handleFinalizar}
                  disabled={!todasRespondidas}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                  size="default"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finalizar Tarefa
                </Button>
              )}
            </div>
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

