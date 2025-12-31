"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuestaoObjetiva } from "@/components/questao-objetiva"
import { QuestaoDissertativa } from "@/components/questao-dissertativa"
import { ProcessandoTarefa } from "@/components/processando-tarefa"
import { ResultadosTarefa } from "@/components/resultados-tarefa"
import { Tarefa, Resposta } from "@/lib/types"
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react"

type EstadoTarefa = "respondendo" | "processando" | "resultados"

interface RealizarTarefaProps {
  tarefa: Tarefa
  onVoltar: () => void
  onConcluir: () => void
}

export function RealizarTarefa({ tarefa, onVoltar, onConcluir }: RealizarTarefaProps) {
  const [estado, setEstado] = useState<EstadoTarefa>("respondendo")
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({})
  const [tempoInicio] = useState(Date.now())
  const [tempoQuestao, setTempoQuestao] = useState(Date.now())
  const [tempoProcessamento, setTempoProcessamento] = useState(0)
  const [respostasProcessadas, setRespostasProcessadas] = useState<Record<string, Resposta>>({})
  const [pontuacao, setPontuacao] = useState(0)

  const questao = tarefa.questoes[questaoAtual]
  const progresso = ((questaoAtual + 1) / tarefa.questoes.length) * 100
  const todasRespondidas = Object.keys(respostas).length === tarefa.questoes.length

  useEffect(() => {
    setTempoQuestao(Date.now())
  }, [questaoAtual])

  useEffect(() => {
    if (estado === "processando") {
      const interval = setInterval(() => {
        setTempoProcessamento((prev) => prev + 1)
      }, 1000)

      // Simular processamento assíncrono (3-5 segundos)
      const tempoProcessamento = 3000 + Math.random() * 2000
      setTimeout(() => {
        processarRespostas()
        clearInterval(interval)
      }, tempoProcessamento)

      return () => clearInterval(interval)
    }
  }, [estado])

  const handleResponder = (resposta: string) => {
    const novaResposta: Resposta = {
      questaoId: questao.id,
      resposta,
      correta: false, // Será determinado após processamento
      tempoGasto: Math.floor((Date.now() - tempoQuestao) / 1000),
    }

    setRespostas((prev) => ({
      ...prev,
      [questao.id]: novaResposta,
    }))
  }

  const handleProximaQuestao = () => {
    if (questaoAtual < tarefa.questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1)
    }
  }

  const handleFinalizar = () => {
    if (todasRespondidas) {
      setEstado("processando")
      setTempoProcessamento(0)
    }
  }

  const processarRespostas = () => {
    // Processar todas as respostas
    const processadas: Record<string, Resposta> = {}
    let acertos = 0

    tarefa.questoes.forEach((questao) => {
      const resposta = respostas[questao.id]
      if (resposta) {
        const correta =
          questao.tipo === "objetiva"
            ? resposta.resposta === questao.respostaCorreta
            : Math.random() > 0.3 // Mock: 70% de acerto em dissertativas

        processadas[questao.id] = {
          ...resposta,
          correta,
          feedback: correta
            ? "Parabéns! Você acertou esta questão."
            : questao.tipo === "objetiva"
            ? `A resposta correta é: ${questao.respostaCorreta}`
            : "Sua resposta foi analisada. Continue praticando para melhorar.",
        }

        if (correta) acertos++
      }
    })

    setRespostasProcessadas(processadas)
    setPontuacao(Math.round((acertos / tarefa.questoes.length) * 100))
    setEstado("resultados")
  }

  const getComponenteColor = (componente: string) => {
    return componente === "Matemática"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      : "bg-green-500/10 text-green-700 dark:text-green-400"
  }

  if (estado === "processando") {
    return (
      <ProcessandoTarefa
        tarefa={tarefa}
        tempoDecorrido={tempoProcessamento}
      />
    )
  }

  if (estado === "resultados") {
    return (
      <ResultadosTarefa
        tarefa={tarefa}
        respostas={respostasProcessadas}
        tempoTotal={Math.floor((Date.now() - tempoInicio) / 1000)}
        pontuacao={pontuacao}
        onVoltar={onConcluir}
      />
    )
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold">{tarefa.titulo}</CardTitle>
              {tarefa.descricao && (
                <CardDescription className="text-xs mt-0.5">{tarefa.descricao}</CardDescription>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">Questão</div>
              <div className="text-lg font-semibold">
                {questaoAtual + 1} / {tarefa.questoes.length}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-muted-foreground">{Math.round(progresso)}%</span>
            </div>
            <Progress value={progresso} className="h-1.5" />
          </div>

          <div className="pt-3">
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

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{Math.floor((Date.now() - tempoQuestao) / 1000)}s</span>
            </div>
            <div className="flex gap-1.5">
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
                  className="bg-green-600 hover:bg-green-700 gap-1.5"
                  size="default"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Finalizar Tarefa
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

