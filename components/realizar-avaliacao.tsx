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
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaExclamationCircle,
  FaBook,
  FaFileAlt,
  FaSave,
  FaRocket,
  FaTrophy,
} from "react-icons/fa"
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
  onFinalizar?: () => void // Opcional: se fornecido, será chamado em vez de mudar estado interno
}

export function RealizarAvaliacao({
  admission,
  userId,
  onVoltar,
  onConcluir,
  onFinalizar,
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

      // Se o record já está finalizado, não deve continuar respondendo
      if (currentRecord?.finishedAt) {
        throw new Error('Esta avaliação já foi finalizada')
      }

      if (!currentRecord) {
        // 3. Criar novo record apenas se realmente não existir
        try {
          currentRecord = await createRecord({
            userId,
            admissionId: admissionAtualizada.id,
          })
        } catch (err: any) {
          // Se der erro 409 (Conflict), significa que o record já existe
          // Buscar novamente as admissions para pegar o record criado
          if (err?.status === 409) {
            const admissionsRetry = await getAdmissionsByBookingAndUser(
              admission.bookingId,
              userId
            )
            const admissionRetry = admissionsRetry.find(a => a.id === admission.id)
            if (admissionRetry?.record) {
              currentRecord = admissionRetry.record
              // Se o record retornado já está finalizado, não deve continuar
              if (currentRecord.finishedAt) {
                throw new Error('Esta avaliação já foi finalizada')
              }
            } else {
              throw new Error('Erro ao criar ou buscar record da avaliação')
            }
          } else {
            throw err
          }
        }
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
      
      // Tratamento específico para erro de exam não encontrado
      const errorMessage = err?.message || err?.data?.message || ""
      if (errorMessage.includes("Nenhum exam foi encontrado") || errorMessage.includes("Nenhuma prova foi associada")) {
        setError("Nenhuma prova foi associada a esta avaliação. Entre em contato com o professor.")
      } else {
        setError(err?.message || "Erro ao iniciar avaliação")
      }
      
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

    // Se onFinalizar foi fornecido, usar navegação externa
    if (onFinalizar) {
      try {
        await atualizarTempoAoFinalizar()
        onFinalizar()
      } catch (err: any) {
        console.error("Erro ao atualizar tempo:", err)
        setError(err?.message || "Erro ao finalizar avaliação")
      }
      return
    }

    // Comportamento original: gerenciar estados internamente
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

  // Navegar para questão específica
  const handleIrParaQuestao = (index: number) => {
    setQuestaoAtual(index)
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
      <div className="flex items-center justify-center h-full relative">
        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <FaSpinner className="h-8 w-8 animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-foreground/70 font-medium">Carregando avaliação...</p>
        </div>
      </div>
    )
  }

  // Estado de erro
  if (estado === "erro") {
    return (
      <div className="flex items-center justify-center h-full px-2 relative">
        <Card className="max-w-md relative overflow-hidden border-2 group">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="py-8 px-4 relative">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-3 rounded-full bg-destructive/10">
                <FaExclamationCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Erro ao carregar avaliação</p>
                <p className="text-xs text-foreground/60 mt-1">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={onVoltar} variant="outline" size="sm" className="h-8">
                  Voltar
                </Button>
                <Button onClick={iniciarAvaliacao} size="sm" className="h-8 gap-1.5">
                  <FaRocket className="h-3.5 w-3.5" />
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
      <div className="flex items-center justify-center h-full px-2 relative">
        <Card className="max-w-md relative overflow-hidden border-2 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="py-10 px-4 relative">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <FaSpinner className="h-12 w-12 animate-spin text-primary relative" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Finalizando avaliação...</h3>
                <p className="text-xs text-foreground/60 mt-1">
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
      <div className="flex items-center justify-center h-full px-2 relative">
        <Card className="max-w-md relative overflow-hidden border-2 group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="px-4 pt-4 pb-3 relative">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FaTrophy className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                Avaliação Concluída!
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-foreground/60 mt-1">{admission.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4 relative">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 text-center group/item hover:scale-105 transition-transform duration-300">
                <p className="text-xs text-foreground/60 mb-1 font-medium">Pontuação</p>
                <p className="text-2xl font-bold text-primary">
                  {record.score !== null ? `${(record.score * 100).toFixed(0)}%` : "Processando..."}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 text-center group/item hover:scale-105 transition-transform duration-300">
                <p className="text-xs text-foreground/60 mb-1 font-medium">Tempo Utilizado</p>
                <p className="text-2xl font-bold text-foreground">
                  {(() => {
                    const tempo = record.elapsedTimeInSeconds ?? record.elapsedTime
                    return tempo !== null && tempo !== undefined 
                      ? formatarTempoEmMinutos(tempo) 
                      : "Processando..."
                  })()}
                </p>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 border-2 border-green-500/20 rounded-lg">
              <p className="text-xs text-foreground/80 leading-relaxed">
                Suas respostas foram registradas com sucesso. O professor poderá visualizar
                seu desempenho no relatório da turma.
              </p>
            </div>

            <Button onClick={onConcluir} className="w-full h-9 gap-1.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg shadow-primary/20">
              <FaRocket className="h-3.5 w-3.5" />
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
      <div className="flex items-center justify-center h-full px-2 relative">
        <Card className="max-w-md relative overflow-hidden border-2 group">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-transparent to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="py-8 px-4 relative">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-3 rounded-full bg-muted/50">
                <FaBook className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Nenhuma questão encontrada</p>
                <p className="text-xs text-foreground/60 mt-1">
                  Esta avaliação não possui questões cadastradas.
                </p>
              </div>
              <Button onClick={onVoltar} variant="outline" size="sm" className="h-8">
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
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {/* Background animado */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      
      {/* Header fixo no topo */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 relative">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={handleSair} size="sm" className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200">
            <FaArrowLeft className="h-3.5 w-3.5" />
            Sair
          </Button>
          
          {/* Barra de progresso */}
          <div className="flex-1 max-w-md space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70 font-medium">Progresso</span>
              <span className="text-foreground font-semibold">{Math.round(progresso)}%</span>
            </div>
            <div className="relative">
              <Progress value={progresso} className="h-2 bg-muted/50" />
              <div 
                className="absolute top-0 left-0 h-2 bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {questoesRespondidas > 0 && (
              <Badge variant="outline" className="gap-1 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 text-xs h-7 bg-green-50 dark:bg-green-950/30">
                <FaSave className="h-3 w-3" />
                Salvo
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className={`gap-1 text-xs h-7 transition-all duration-300 ${
                tempoRestante <= 300 && tempoRestante > 60 
                  ? "border-orange-500/50 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20" 
                  : tempoRestante <= 60 
                  ? "border-red-500/50 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 animate-pulse" 
                  : "border-border bg-muted/30"
              }`}
            >
              <FaClock className="h-3 w-3" />
              {formatarTempo(tempoRestante)}
            </Badge>
            <Badge variant="secondary" className="text-xs h-7 bg-primary/10 text-primary border-primary/20">
              {questoesRespondidas}/{totalQuestoes}
            </Badge>
          </div>
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

      {/* Layout principal: Questão atual + Grid de questões */}
      <div className="flex-1 flex gap-4 overflow-hidden px-4 py-3 relative">
        {/* Questão atual - Área principal */}
        <div className="flex-1 overflow-y-auto">
          <Card className="h-full group relative overflow-hidden border-2 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="pb-2 px-4 pt-4 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300">{admission.title}</CardTitle>
                  {admission.description && (
                    <CardDescription className="text-sm mt-1 text-foreground/60 group-hover:text-foreground/75 transition-colors duration-300">
                      {admission.description}
                    </CardDescription>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-foreground/60 font-medium">
                    {naRedacao ? "Redação" : "Questão"}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {naRedacao ? "Final" : `${questaoAtual + 1}/${questoes.length}`}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-4 pb-4 relative">
          {/* Conteúdo da questão ou redação */}
          {naRedacao ? (
            // Redação
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <FaFileAlt className="h-4 w-4 text-primary" />
                </div>
                <Label className="text-sm font-semibold text-foreground">Redação</Label>
              </div>
              <Textarea
                value={redacaoConteudo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRedacaoConteudo(e.target.value)}
                placeholder="Escreva sua redação aqui..."
                rows={12}
                disabled={salvando || redacaoSalva}
                className="resize-none text-sm border-2 focus:border-primary/50 transition-colors duration-300"
              />
              {redacaoSalva ? (
                <Badge variant="default" className="gap-1.5 text-sm h-8 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                  <FaCheckCircle className="h-3.5 w-3.5" />
                  Redação salva
                </Badge>
              ) : (
                <Button
                  onClick={handleSalvarRedacao}
                  disabled={salvando || !redacaoConteudo.trim()}
                  size="sm"
                  className="h-9 gap-1.5 border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300"
                  variant="outline"
                >
                  {salvando ? (
                    <>
                      <FaSpinner className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FaSave className="h-3.5 w-3.5 text-primary" />
                      Salvar Redação
                    </>
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
                <div className="space-y-2.5">
                  {alternativasQuestaoAtual.map((alt, index) => {
                    const isSelected = respostaAtual?.alternativeId === alt.id
                    return (
                      <button
                        key={alt.id}
                        onClick={() => handleResponderObjetiva(alt.id)}
                        disabled={salvando}
                        className={`group/alt w-full p-3.5 text-left rounded-lg border-2 transition-all duration-300 text-sm relative overflow-hidden ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/5 scale-[1.02]"
                            : "border-border/50 hover:border-primary/40 hover:bg-muted/40 hover:scale-[1.01]"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {/* Background gradient quando selecionado */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50" />
                        )}
                        <div className="relative flex items-center gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                            isSelected 
                              ? "border-primary bg-primary/20" 
                              : "border-border group-hover/alt:border-primary/40"
                          }`}>
                            {isSelected && <FaCheckCircle className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <HtmlRenderer html={alt.content} className="text-sm flex-1" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                    <div className="space-y-3">
                      <Label className="text-sm">Sua resposta:</Label>
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
                        className="text-sm"
                  />
                  <Button
                    onClick={() => handleResponderDissertativa(respostaAtual?.answer || "")}
                    disabled={salvando || !respostaAtual?.answer?.trim()}
                    size="sm"
                    className="h-9 gap-1.5 border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300"
                    variant="outline"
                  >
                    {salvando ? (
                      <>
                        <FaSpinner className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : respostaAtual?.respondida ? (
                      <>
                        <FaCheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Salvo
                      </>
                    ) : (
                      <>
                        <FaSave className="h-3.5 w-3.5 text-primary" />
                        Salvar Resposta
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          {/* Mensagem de erro */}
          {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive text-sm">
              <FaExclamationCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
            </div>
          )}

          {/* Navegação */}
              <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleQuestaoAnterior}
              disabled={questaoAtual === 0}
              size="sm"
                  className="h-9"
            >
              Anterior
            </Button>

            <div className="flex gap-2">
              {questaoAtual < questoes.length - 1 || (temRedacao && !naRedacao) ? (
                    <Button onClick={handleProximaQuestao} size="sm" className="h-9">
                  Próxima
                </Button>
                  ) : (
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 via-green-400 to-green-500 rounded-lg opacity-0 group-hover:opacity-30 blur transition-opacity duration-500" />
          <Button
            onClick={() => setShowConfirmFinalizar(true)}
            disabled={finalizando}
            className="relative bg-green-600 hover:bg-green-700 gap-1.5 h-9 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
            size="sm"
          >
            {finalizando ? (
              <>
                <FaSpinner className="h-4 w-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                <FaTrophy className="h-4 w-4" />
                Finalizar
              </>
            )}
          </Button>
        </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Grid de questões - Coluna direita */}
            <div className="w-56 shrink-0 border-l border-border/50 pl-4 overflow-y-auto relative">
              <div className="sticky top-0 bg-background/80 backdrop-blur pb-3 mb-3 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground/70">Questões</h3>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {questoes.map((questao, index) => {
                  const resposta = respostas.get(questao.id)
                  const respondida = resposta?.respondida || false
                  const isAtual = index === questaoAtual
                  
                  return (
                    <button
                      key={questao.id}
                      onClick={() => handleIrParaQuestao(index)}
                      className={`
                        aspect-square rounded-lg text-xs font-semibold transition-all duration-300 relative overflow-hidden group/q
                        ${isAtual 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110 ring-2 ring-primary ring-offset-2" 
                          : respondida
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-2 border-blue-500/30 hover:border-blue-500/50 hover:scale-105"
                          : "bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 hover:scale-105"
                        }
                      `}
                      title={`Questão ${index + 1}${respondida ? " - Respondida" : ""}`}
                    >
                      {/* Glow effect quando atual */}
                      {isAtual && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                      )}
                      {/* Indicador de respondida - círculo preenchido */}
                      {respondida && !isAtual && (
                        <div className="absolute top-0.5 right-0.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400 border border-blue-700 dark:border-blue-300" />
                        </div>
                      )}
                      <span className="relative z-10">{index + 1}</span>
                    </button>
                  )
                })}
                {temRedacao && (
                  <button
                    onClick={() => handleIrParaQuestao(questoes.length)}
                    className={`
                      aspect-square rounded-lg text-xs font-semibold transition-all duration-300 relative overflow-hidden
                      ${naRedacao 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110 ring-2 ring-primary ring-offset-2" 
                        : redacaoSalva
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-2 border-blue-500/30 hover:border-blue-500/50 hover:scale-105"
                        : "bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 hover:scale-105"
                      }
                    `}
                    title="Redação"
                  >
                    {naRedacao && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                    )}
                    {redacaoSalva && !naRedacao && (
                      <div className="absolute top-0.5 right-0.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400 border border-blue-700 dark:border-blue-300" />
                      </div>
                    )}
                    <span className="relative z-10">R</span>
                  </button>
                )}
              </div>
            </div>
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

