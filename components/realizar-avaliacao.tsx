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
import { HtmlRenderer } from "@/components/html-renderer"
import {
  Admission,
  ExamQuestion,
  createRecord,
  answerQuestion,
  answerEssay,
  finishRecord,
  getExamWithQuestions,
  updateElapsedTime,
  getAdmissionsByBookingAndUser,
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
  const [tempoInicioLocal, setTempoInicioLocal] = useState<Date | null>(null)
  const [tempoDecorridoInicialRecord, setTempoDecorridoInicialRecord] = useState(0)
  const [duracaoTotal, setDuracaoTotal] = useState(0) // em segundos, vem da admission
  const [salvando, setSalvando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  // Redação
  const [temRedacao, setTemRedacao] = useState(false)
  const [redacaoConteudo, setRedacaoConteudo] = useState("")
  const [redacaoSalva, setRedacaoSalva] = useState(false)
  const [examIdRedacao, setExamIdRedacao] = useState<number | null>(null)

  // Confirmação de saída
  const [showConfirmSair, setShowConfirmSair] = useState(false)
  
  // Confirmação de finalização
  const [showConfirmFinalizar, setShowConfirmFinalizar] = useState(false)

  // Auto-save debounce para dissertativas
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Referência para intervalo de atualização de tempo
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastElapsedTimeUpdateRef = useRef(0)

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
      // 1. SEMPRE buscar a admission atualizada diretamente do backend
      // para garantir que temos o record com elapsedTime correto
      const admissionsAtualizadas = await getAdmissionsByBookingAndUser(
        admission.bookingId,
        userId
      )
      
      const admissionAtualizada = admissionsAtualizadas.find(a => a.id === admission.id)
      
      if (!admissionAtualizada) {
        throw new Error('Admission não encontrada')
      }

      // 2. Verificar se já existe um record
      // Agora que o GET admissions retorna elapsedTime, sempre usar a admission atualizada
      let currentRecord = admissionAtualizada.record as Record | null

      if (!currentRecord) {
        // 3. Criar novo record apenas se realmente não existir
        currentRecord = await createRecord({
          userId,
          admissionId: admissionAtualizada.id,
        })
      }

      setRecord(currentRecord)

      // 4. Configurar duração total (vem da admission em minutos, converter para segundos)
      const duracaoEmSegundos = admissionAtualizada.duration * 60
      setDuracaoTotal(duracaoEmSegundos)

      // 5. Configurar tempo inicial local para cálculos
      setTempoInicioLocal(new Date())
      
      // 6. Usar o elapsedTime que vem do GET admissions (já atualizado pelo backend)
      // Este valor representa o tempo total já decorrido em todas as sessões anteriores
      const tempoJaDecorridoRecord = currentRecord.elapsedTime || 0
      setTempoDecorridoInicialRecord(tempoJaDecorridoRecord)
      
      // 6.1. Inicializar a referência de última atualização com o tempo já decorrido
      // Isso garante que os próximos updates sejam incrementais, nunca resetando o valor
      lastElapsedTimeUpdateRef.current = tempoJaDecorridoRecord

      // 7. Carregar questões de todos os exams
      const todasQuestoes: ExamQuestion[] = []
      let primeiroExamId: number | null = null

      for (const exam of admissionAtualizada.exams) {
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

      // 8. Extrair respostas já salvas do record existente
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

      // 9. Inicializar respostas locais (restaurando as já salvas)
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

      // 10. Restaurar redação se existir
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

  // Atualizar tempo decorrido no backend periodicamente (a cada 10 segundos)
  // O backend recebe tempo DECORRIDO (crescente), mas o front mostra tempo RESTANTE (regressivo)
  useEffect(() => {
    if (!record || estado !== "respondendo" || !tempoInicioLocal) return

    const atualizarTempoDecorrido = async () => {
      // Calcular tempo decorrido desde que o componente foi montado NESTA sessão
      const tempoDesdeInicioLocal = Math.floor((Date.now() - tempoInicioLocal.getTime()) / 1000)
      
      // Somar com o elapsedTime que veio do GET admissions (tempo de todas as sessões anteriores)
      // Isso garante que o valor seja sempre incremental, NUNCA resetando
      const tempoDecorridoTotal = tempoDecorridoInicialRecord + tempoDesdeInicioLocal
      
      // Só atualiza se o tempo mudou em pelo menos 5 segundos desde a última atualização
      // Isso evita spam de requests e garante eficiência
      if (tempoDecorridoTotal - lastElapsedTimeUpdateRef.current >= 5) {
        try {
          await updateElapsedTime({
            recordId: record.id,
            elapsedTime: tempoDecorridoTotal,
          })
          
          // Atualizar referência para próxima comparação
          lastElapsedTimeUpdateRef.current = tempoDecorridoTotal
        } catch (err) {
          console.error("Erro ao atualizar tempo decorrido:", err)
          // Não mostramos erro ao usuário para não interromper a experiência
        }
      }
    }

    // Atualizar a cada 10 segundos
    intervalRef.current = setInterval(atualizarTempoDecorrido, 10000)

    // Atualizar imediatamente na primeira vez
    atualizarTempoDecorrido()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [record, estado, tempoInicioLocal, tempoDecorridoInicialRecord])

  // Atualizar tempo ao finalizar
  const atualizarTempoAoFinalizar = async () => {
    if (!record || !tempoInicioLocal) return
    
    // Calcular tempo total decorrido: tempo inicial do record + tempo desde que montou o componente
    const tempoDesdeInicioLocal = Math.floor((Date.now() - tempoInicioLocal.getTime()) / 1000)
    const tempoFinal = tempoDecorridoInicialRecord + tempoDesdeInicioLocal
    
    try {
      await updateElapsedTime({
        recordId: record.id,
        elapsedTime: tempoFinal,
      })
    } catch (err) {
      console.error("Erro ao atualizar tempo final:", err)
    }
  }

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
      // Atualizar tempo final antes de finalizar
      await atualizarTempoAoFinalizar()
      
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

  // Calcular tempo RESTANTE para exibição (contagem regressiva)
  // Fórmula: duration (referência) - elapsedTime (do backend + sessão atual)
  const calcularTempoRestante = () => {
    if (duracaoTotal === 0) return 0
    
    if (!tempoInicioLocal) {
      // Se ainda não iniciou localmente, mostrar tempo restante baseado no elapsedTime do backend
      return Math.max(0, duracaoTotal - tempoDecorridoInicialRecord)
    }
    
    // Tempo decorrido desde que o componente foi montado NESTA sessão
    const tempoDesdeInicioLocal = Math.floor((Date.now() - tempoInicioLocal.getTime()) / 1000)
    
    // Tempo total decorrido = elapsedTime do backend + tempo desta sessão
    const tempoDecorridoTotal = tempoDecorridoInicialRecord + tempoDesdeInicioLocal
    
    // Tempo restante = duration (referência) - tempo decorrido total
    const tempoRestante = duracaoTotal - tempoDecorridoTotal
    
    // Não permitir valores negativos
    return Math.max(0, tempoRestante)
  }
  
  const tempoRestante = calcularTempoRestante()
  
  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const min = Math.floor((segundos % 3600) / 60)
    const seg = segundos % 60
    
    if (horas > 0) {
      return `${horas}:${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`
    }
    return `${min}:${seg.toString().padStart(2, "0")}`
  }

  const formatarTempoEmMinutos = (segundos: number | null) => {
    if (segundos === null || segundos === undefined) return "0 min"
    
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    
    if (minutos === 0) {
      return `${segs}s`
    } else if (segs === 0) {
      return `${minutos} min`
    } else {
      return `${minutos} min ${segs}s`
    }
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

  // Cleanup do auto-save timeout e intervalo de tempo
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Atualizar a exibição do tempo a cada segundo
  const [, forceUpdate] = useState({})
  useEffect(() => {
    if (estado !== "respondendo") return
    
    const timer = setInterval(() => {
      forceUpdate({}) // Força re-render para atualizar o tempo exibido
      
      // Verificar se o tempo acabou
      const tempoRestanteAtual = calcularTempoRestante()
      if (tempoRestanteAtual <= 0 && record) {
        // Tempo esgotado - finalizar automaticamente
        handleFinalizar()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [estado, record])

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
                  {record.score !== null ? `${(record.score * 100).toFixed(0)}%` : "Processando..."}
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Tempo Utilizado</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    const tempo = record.elapsedTimeInSeconds ?? record.elapsedTime
                    return tempo !== null && tempo !== undefined 
                      ? formatarTempoEmMinutos(tempo) 
                      : "Processando..."
                  })()}
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
          <Badge 
            variant="outline" 
            className={`gap-1 ${
              tempoRestante <= 300 && tempoRestante > 60 
                ? "border-orange-500 text-orange-600 dark:text-orange-400" 
                : tempoRestante <= 60 
                ? "border-red-500 text-red-600 dark:text-red-400 animate-pulse" 
                : ""
            }`}
          >
            <Clock className="h-3 w-3" />
            {formatarTempo(tempoRestante)}
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
                {naRedacao ? "Final" : `Questão ${questaoAtual + 1}`}
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
              <HtmlRenderer
                html={questaoAtualObj.content || questaoAtualObj.name}
                className="prose prose-sm dark:prose-invert max-w-none"
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
                      <HtmlRenderer html={alt.content} className="text-sm" />
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
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Finalizar - Fora do escopo de navegação */}
      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => setShowConfirmFinalizar(true)}
          disabled={finalizando}
          className="bg-green-600 hover:bg-green-700 gap-1.5"
          size="default"
        >
          {finalizando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finalizando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Finalizar Avaliação
            </>
          )}
        </Button>
      </div>

      {/* Diálogo de confirmação de finalização */}
      <AlertDialog open={showConfirmFinalizar} onOpenChange={setShowConfirmFinalizar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar avaliação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar a avaliação? Após finalizar, você não poderá mais alterar suas respostas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmFinalizar(false)
                handleFinalizar()
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

