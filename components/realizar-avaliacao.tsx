"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  BookOpen,
  FileText,
  Save,
} from "lucide-react"
import {
  Admission,
  ExamQuestion,
  createRecord,
  answerQuestion,
  answerEssay,
  finishRecord,
  getExamWithQuestions,
} from "@/lib/api"
import { Record } from "@/lib/api/records"

type EstadoAvaliacao = "carregando" | "respondendo" | "processando" | "resultados" | "erro"

interface RespostaLocal {
  questionId: number
  alternativeId?: number
  answer?: string
  respondida: boolean
}

interface RealizarAvaliacaoProps {
  admission: Admission
  userId: string
  onVoltar: () => void
  onConcluir: () => void
}

export function RealizarAvaliacao({
  admission,
  userId,
  onVoltar,
  onConcluir,
}: RealizarAvaliacaoProps) {
  const [estado, setEstado] = useState<EstadoAvaliacao>("carregando")
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<Record | null>(null)
  const [questoes, setQuestoes] = useState<ExamQuestion[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState<Map<number, RespostaLocal>>(new Map())
  const [tempoInicio] = useState(Date.now())
  const [salvando, setSalvando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  // Redação
  const [temRedacao, setTemRedacao] = useState(false)
  const [redacaoConteudo, setRedacaoConteudo] = useState("")
  const [redacaoSalva, setRedacaoSalva] = useState(false)
  const [examIdRedacao, setExamIdRedacao] = useState<number | null>(null)

  // Confirmação de saída
  const [showConfirmSair, setShowConfirmSair] = useState(false)

  // Auto-save debounce para dissertativas
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Calcular progresso
  const totalQuestoes = questoes.length + (temRedacao ? 1 : 0)
  const questoesRespondidas = Array.from(respostas.values()).filter((r) => r.respondida).length + (redacaoSalva ? 1 : 0)
  const progresso = totalQuestoes > 0 ? (questoesRespondidas / totalQuestoes) * 100 : 0
  const todasRespondidas = questoesRespondidas === totalQuestoes

  // Inicializar avaliação
  const iniciarAvaliacao = useCallback(async () => {
    setEstado("carregando")
    setError(null)

    try {
      // 1. Verificar se já existe um record
      let currentRecord = admission.record as Record | null

      if (!currentRecord) {
        // 2. Criar novo record
        currentRecord = await createRecord({
          userId,
          admissionId: admission.id,
        })
      }

      setRecord(currentRecord)

      // 3. Carregar questões de todos os exams
      const todasQuestoes: ExamQuestion[] = []
      let primeiroExamId: number | null = null

      for (const exam of admission.exams) {
        if (!primeiroExamId) primeiroExamId = exam.id

        try {
          const examComQuestoes = await getExamWithQuestions(exam.id)
          if (examComQuestoes.questions) {
            todasQuestoes.push(...examComQuestoes.questions)
          }
        } catch (err) {
          console.error(`Erro ao carregar questões do exam ${exam.id}:`, err)
        }
      }

      // Ordenar questões pelo campo 'order' (ordem definida na tabela collection_question)
      todasQuestoes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      setQuestoes(todasQuestoes)
      setExamIdRedacao(primeiroExamId)

      // 4. Extrair respostas já salvas do record existente
      const respostasSalvas = new Map<number, { alternativeId?: number; answer?: string }>()
      if (currentRecord && 'examRecords' in currentRecord) {
        const recordComExams = currentRecord as Record & { examRecords?: Array<{ recordQuestions?: Array<{ questionId: number; alternativeId: number | null; answer: string | null }> }> }
        recordComExams.examRecords?.forEach((examRecord) => {
          examRecord.recordQuestions?.forEach((rq) => {
            respostasSalvas.set(rq.questionId, {
              alternativeId: rq.alternativeId ?? undefined,
              answer: rq.answer ?? undefined,
            })
          })
        })
      }

      // 5. Inicializar respostas locais (restaurando as já salvas)
      const respostasIniciais = new Map<number, RespostaLocal>()
      todasQuestoes.forEach((q) => {
        const respostaSalva = respostasSalvas.get(q.id)
        if (respostaSalva && (respostaSalva.alternativeId || respostaSalva.answer)) {
          // Restaurar resposta já salva
          respostasIniciais.set(q.id, {
            questionId: q.id,
            alternativeId: respostaSalva.alternativeId,
            answer: respostaSalva.answer,
            respondida: true, // Já foi salva anteriormente
          })
        } else {
          respostasIniciais.set(q.id, {
            questionId: q.id,
            respondida: false,
          })
        }
      })
      setRespostas(respostasIniciais)

      // 6. Restaurar redação se existir
      if (currentRecord && 'examRecords' in currentRecord) {
        const recordComExams = currentRecord as Record & { examRecords?: Array<{ essay?: { content?: string } | null }> }
        const essaySalva = recordComExams.examRecords?.find(er => er.essay?.content)?.essay
        if (essaySalva?.content) {
          setRedacaoConteudo(essaySalva.content)
          setRedacaoSalva(true)
        }
      }

      setEstado("respondendo")
    } catch (err: any) {
      console.error("Erro ao iniciar avaliação:", err)
      setError(err?.message || "Erro ao iniciar avaliação")
      setEstado("erro")
    }
  }, [admission, userId])

  useEffect(() => {
    iniciarAvaliacao()
  }, [iniciarAvaliacao])

  // Responder questão objetiva
  const handleResponderObjetiva = async (alternativeId: number) => {
    if (!record) return

    const questao = questoes[questaoAtual]
    setSalvando(true)

    try {
      await answerQuestion({
        recordId: record.id,
        questionId: questao.id,
        alternativeId,
      })

      // Atualizar resposta local
      setRespostas((prev) => {
        const novas = new Map(prev)
        novas.set(questao.id, {
          questionId: questao.id,
          alternativeId,
          respondida: true,
        })
        return novas
      })
    } catch (err: any) {
      console.error("Erro ao salvar resposta:", err)
      setError(err?.message || "Erro ao salvar resposta")
    } finally {
      setSalvando(false)
    }
  }

  // Responder questão dissertativa
  const handleResponderDissertativa = async (answer: string) => {
    if (!record) return

    const questao = questoes[questaoAtual]
    setSalvando(true)

    try {
      await answerQuestion({
        recordId: record.id,
        questionId: questao.id,
        answer,
      })

      // Atualizar resposta local
      setRespostas((prev) => {
        const novas = new Map(prev)
        novas.set(questao.id, {
          questionId: questao.id,
          answer,
          respondida: true,
        })
        return novas
      })
    } catch (err: any) {
      console.error("Erro ao salvar resposta:", err)
      setError(err?.message || "Erro ao salvar resposta")
    } finally {
      setSalvando(false)
    }
  }

  // Salvar redação
  const handleSalvarRedacao = async () => {
    if (!record || !examIdRedacao || !redacaoConteudo.trim()) return

    setSalvando(true)

    try {
      await answerEssay({
        recordId: record.id,
        examId: examIdRedacao,
        content: redacaoConteudo,
      })

      setRedacaoSalva(true)
    } catch (err: any) {
      console.error("Erro ao salvar redação:", err)
      setError(err?.message || "Erro ao salvar redação")
    } finally {
      setSalvando(false)
    }
  }

  // Finalizar avaliação
  const handleFinalizar = async () => {
    if (!record) return

    setFinalizando(true)
    setEstado("processando")

    try {
      const recordFinalizado = await finishRecord({ recordId: record.id })
      setRecord(recordFinalizado)
      setEstado("resultados")
    } catch (err: any) {
      console.error("Erro ao finalizar avaliação:", err)
      setError(err?.message || "Erro ao finalizar avaliação")
      setEstado("respondendo")
    } finally {
      setFinalizando(false)
    }
  }

  // Navegar entre questões
  const handleProximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1)
    } else if (temRedacao) {
      setQuestaoAtual(questoes.length) // Ir para redação
    }
  }

  const handleQuestaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1)
    }
  }

  // Calcular tempo decorrido
  const tempoDecorrido = Math.floor((Date.now() - tempoInicio) / 1000)
  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, "0")}`
  }

  // Handler para sair com confirmação
  const handleSair = () => {
    // Verifica se há respostas não salvas (dissertativas com texto mas não salvas)
    const temRespostasNaoSalvas = Array.from(respostas.values()).some(
      (r) => r.answer && !r.respondida
    )
    const temRedacaoNaoSalva = redacaoConteudo.trim() && !redacaoSalva

    if (temRespostasNaoSalvas || temRedacaoNaoSalva) {
      setShowConfirmSair(true)
    } else {
      onVoltar()
    }
  }

  // Confirmar saída
  const confirmarSaida = () => {
    setShowConfirmSair(false)
    onVoltar()
  }

  // Cleanup do auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Estado de carregamento
  if (estado === "carregando") {
    return (
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Carregando avaliação...</p>
        </div>
      </div>
    )
  }

  // Estado de erro
  if (estado === "erro") {
    return (
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-medium text-sm">Erro ao carregar avaliação</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={onVoltar} variant="outline" size="sm">
                  Voltar
                </Button>
                <Button onClick={iniciarAvaliacao} size="sm">
                  Tentar novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado de processamento
  if (estado === "processando") {
    return (
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Finalizando avaliação...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Aguarde enquanto processamos suas respostas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado de resultados
  if (estado === "resultados" && record) {
    return (
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Avaliação Concluída!
            </CardTitle>
            <CardDescription>{admission.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Pontuação</p>
                <p className="text-2xl font-bold text-primary">
                  {record.score !== null ? `${record.score.toFixed(1)}%` : "Processando..."}
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Tempo Total</p>
                <p className="text-2xl font-bold">
                  {record.totalTime ? formatarTempo(record.totalTime) : formatarTempo(tempoDecorrido)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                Suas respostas foram registradas com sucesso. O professor poderá visualizar
                seu desempenho no relatório da turma.
              </p>
            </div>

            <Button onClick={onConcluir} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se não há questões
  if (questoes.length === 0 && !temRedacao) {
    return (
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Nenhuma questão encontrada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta avaliação não possui questões cadastradas.
                </p>
              </div>
              <Button onClick={onVoltar} variant="outline" size="sm">
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verificar se está na página de redação
  const naRedacao = questaoAtual >= questoes.length && temRedacao
  const questaoAtualObj = !naRedacao ? questoes[questaoAtual] : null
  const respostaAtual = questaoAtualObj ? respostas.get(questaoAtualObj.id) : null

  // Pegar alternativas (pode vir como 'alternatives' ou 'alternativesRelation')
  const getAlternatives = (q: ExamQuestion | null) => {
    if (!q) return []
    const alts = q.alternatives ?? q.alternativesRelation ?? []
    return [...alts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  // Verificar se é questão objetiva (tem alternativas)
  const alternativasQuestaoAtual = getAlternatives(questaoAtualObj)
  const isObjetiva = alternativasQuestaoAtual.length > 0

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={handleSair} size="sm" className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Sair
        </Button>
        <div className="flex items-center gap-2">
          {questoesRespondidas > 0 && (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
              <Save className="h-3 w-3" />
              Progresso salvo
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {formatarTempo(tempoDecorrido)}
          </Badge>
          <Badge variant="secondary">
            {questoesRespondidas}/{totalQuestoes} respondidas
          </Badge>
        </div>
      </div>

      {/* Diálogo de confirmação de saída */}
      <AlertDialog open={showConfirmSair} onOpenChange={setShowConfirmSair}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da avaliação?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem respostas não salvas. Seu progresso salvo será mantido, mas as respostas 
              não salvas serão perdidas. Você poderá continuar a avaliação depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar respondendo</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarSaida}>
              Sair mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold">{admission.title}</CardTitle>
              {admission.description && (
                <CardDescription className="text-xs mt-0.5">
                  {admission.description}
                </CardDescription>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">
                {naRedacao ? "Redação" : "Questão"}
              </div>
              <div className="text-lg font-semibold">
                {naRedacao ? "Final" : `${questaoAtual + 1} / ${questoes.length}`}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progresso */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-muted-foreground">{Math.round(progresso)}%</span>
            </div>
            <Progress value={progresso} className="h-1.5" />
          </div>

          {/* Conteúdo da questão ou redação */}
          {naRedacao ? (
            // Redação
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Redação</Label>
              </div>
              <Textarea
                value={redacaoConteudo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRedacaoConteudo(e.target.value)}
                placeholder="Escreva sua redação aqui..."
                rows={12}
                disabled={salvando || redacaoSalva}
                className="resize-none"
              />
              {redacaoSalva ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Redação salva
                </Badge>
              ) : (
                <Button
                  onClick={handleSalvarRedacao}
                  disabled={salvando || !redacaoConteudo.trim()}
                  size="sm"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Redação"
                  )}
                </Button>
              )}
            </div>
          ) : questaoAtualObj ? (
            // Questão
            <div className="space-y-4">
              {/* Enunciado */}
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: questaoAtualObj.content || questaoAtualObj.name }}
              />

              {/* Alternativas ou campo dissertativo */}
              {isObjetiva ? (
                <div className="space-y-2">
                  {alternativasQuestaoAtual.map((alt) => (
                    <button
                      key={alt.id}
                      onClick={() => handleResponderObjetiva(alt.id)}
                      disabled={salvando}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        respostaAtual?.alternativeId === alt.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: alt.content }}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Sua resposta:</Label>
                  <Textarea
                    value={respostaAtual?.answer || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      const value = e.target.value
                      setRespostas((prev) => {
                        const novas = new Map(prev)
                        novas.set(questaoAtualObj.id, {
                          questionId: questaoAtualObj.id,
                          answer: value,
                          respondida: false,
                        })
                        return novas
                      })
                    }}
                    placeholder="Digite sua resposta..."
                    rows={6}
                    disabled={salvando}
                  />
                  <Button
                    onClick={() => handleResponderDissertativa(respostaAtual?.answer || "")}
                    disabled={salvando || !respostaAtual?.answer?.trim()}
                    size="sm"
                  >
                    {salvando ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Salvando...
                      </>
                    ) : respostaAtual?.respondida ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Salvo
                      </>
                    ) : (
                      "Salvar Resposta"
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          {/* Mensagem de erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Navegação */}
          <div className="flex items-center justify-between pt-3 border-t">
            <Button
              variant="outline"
              onClick={handleQuestaoAnterior}
              disabled={questaoAtual === 0}
              size="sm"
            >
              Anterior
            </Button>

            <div className="flex gap-2">
              {questaoAtual < questoes.length - 1 || (temRedacao && !naRedacao) ? (
                <Button onClick={handleProximaQuestao} size="sm">
                  Próxima
                </Button>
              ) : (
                <Button
                  onClick={handleFinalizar}
                  disabled={!todasRespondidas || finalizando}
                  className="bg-green-600 hover:bg-green-700 gap-1.5"
                  size="sm"
                >
                  {finalizando ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Finalizar Avaliação
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

