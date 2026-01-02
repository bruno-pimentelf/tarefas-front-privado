"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { TarefaCard } from "@/components/tarefa-card"
import { RealizarTarefa } from "@/components/realizar-tarefa"
import { RealizarAvaliacao } from "@/components/realizar-avaliacao"
import { BookingDetalhes } from "@/components/booking-detalhes"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getStudentBookings } from "@/lib/api/bookings"
import { bookingToTarefa } from "@/lib/api/utils"
import { Tarefa } from "@/lib/types"
import { Booking } from "@/lib/api/bookings"
import { Admission, getAdmissionsByBookingAndUser, Record } from "@/lib/api/admissions"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertCircle, Trophy, Clock, CheckCircle2 } from "lucide-react"

export function AlunoDashboard() {
  const { currentUser } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null)
  const [bookingSelecionado, setBookingSelecionado] = useState<Booking | null>(null)
  const [admissionEmAndamento, setAdmissionEmAndamento] = useState<Admission | null>(null)
  const [showEstatisticas, setShowEstatisticas] = useState(false)
  const [estatisticas, setEstatisticas] = useState<{
    tarefa: Tarefa
    record: Record | null
    loading: boolean
  } | null>(null)

  // Estados removidos - agora usamos totalQuestions e status diretamente do booking

  // Converter bookings para tarefas usando totalQuestions e status da API
  const { tarefas, tarefasAtivas, tarefasConcluidas, tarefasAgendadas, tarefasAtrasadas } = useMemo(() => {
    const allTarefas = bookings.map(booking => {
      return bookingToTarefa(booking, false) // false = não é professor
    })
    
    const ativas = allTarefas.filter((t) => t.status === "ativa")
    const agendadas = allTarefas.filter((t) => t.status === "agendada")
    
    // Separar tarefas finalizadas em concluídas e atrasadas
    const finalizadas = allTarefas.filter((t) => t.status === "finalizada")
    const concluidas = finalizadas.filter((t) => !t.atrasada) // Concluídas no prazo
    const atrasadas = finalizadas.filter((t) => t.atrasada === true) // Não concluídas e prazo expirado
    
    
    return { 
      tarefas: allTarefas, 
      tarefasAtivas: ativas, 
      tarefasConcluidas: concluidas, 
      tarefasAgendadas: agendadas,
      tarefasAtrasadas: atrasadas
    }
  }, [bookings])

  // ID do aluno (mock para testes)
  const studentId = "student-001"

  // Função para carregar todos os bookings
  const carregarBookings = useCallback(async () => {
    if (!currentUser) return

    setLoading(true)
    setError(null)

    try {
      // Carregar primeira página para obter o total
      const firstPage = await getStudentBookings(studentId, 1, 100)
      
      let allBookings = [...(firstPage.items || [])]
      
      // Se houver mais páginas, carregar todas
      if (firstPage.meta && firstPage.meta.totalPages > 1) {
        const promises = []
        for (let page = 2; page <= firstPage.meta.totalPages; page++) {
          promises.push(getStudentBookings(studentId, page, 100))
        }
        
        const remainingPages = await Promise.all(promises)
        remainingPages.forEach((response) => {
          if (response.items) {
            allBookings = [...allBookings, ...response.items]
          }
        })
      }
      
      // Agora os bookings já vêm com totalQuestions e status da API
      // Não precisamos mais fazer chamadas adicionais
      setBookings(allBookings)
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || "Erro ao carregar tarefas"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [currentUser, studentId])

  // Carregar bookings ao montar o componente
  useEffect(() => {
    if (currentUser) {
      carregarBookings()
    }
  }, [carregarBookings, currentUser])

  // Handler para abrir detalhes do booking
  const handleAbrirBooking = (tarefaId: string) => {
    const booking = bookings.find((b) => b.id.toString() === tarefaId)
    if (booking) {
      setBookingSelecionado(booking)
    }
  }

  // Handler para ver estatísticas de tarefa concluída
  const handleVerEstatisticas = async (tarefa: Tarefa) => {
    setEstatisticas({ tarefa, record: null, loading: true })
    setShowEstatisticas(true)

    try {
      const booking = bookings.find((b) => b.id.toString() === tarefa.id)
      if (!booking) {
        setEstatisticas({ tarefa, record: null, loading: false })
        return
      }

      // Buscar admissions do booking
      const admissions = await getAdmissionsByBookingAndUser(booking.id, studentId)
      
      // Encontrar a admission com record finalizado
      const admissionComRecord = admissions.find(a => a.record?.finishedAt != null)
      
      if (admissionComRecord?.record) {
        setEstatisticas({ tarefa, record: admissionComRecord.record, loading: false })
      } else {
        setEstatisticas({ tarefa, record: null, loading: false })
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
      setEstatisticas({ tarefa, record: null, loading: false })
    }
  }

  // Função para formatar tempo em segundos para formato legível
  const formatarTempo = (segundos: number | null): string => {
    if (!segundos || segundos === 0) return "0 min"
    
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60

    if (horas > 0) {
      return `${horas}h ${minutos}min`
    } else if (minutos > 0) {
      return `${minutos}min ${segs > 0 ? `${segs}s` : ""}`
    } else {
      return `${segs}s`
    }
  }

  // Função para formatar tempo em minutos (para estatísticas)
  const formatarTempoEmMinutos = (segundos: number | null): string => {
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

  // Handler para iniciar avaliação
  const handleIniciarAvaliacao = async (admission: Admission) => {
    try {
      // Recarregar a admission antes de abrir para garantir dados atualizados
      const admissionsAtualizadas = await getAdmissionsByBookingAndUser(
        bookingSelecionado!.id,
        studentId
      )
      
      const admissionAtualizada = admissionsAtualizadas.find(a => a.id === admission.id)
      
      if (admissionAtualizada) {
        setAdmissionEmAndamento(admissionAtualizada)
      } else {
        // Fallback: usar a admission original se não encontrar
        setAdmissionEmAndamento(admission)
      }
    } catch (error) {
      console.error('Erro ao recarregar admission:', error)
      // Em caso de erro, usa a admission original
      setAdmissionEmAndamento(admission)
    }
  }

  // Se estiver fazendo uma avaliação
  if (admissionEmAndamento) {
    return (
      <RealizarAvaliacao
        admission={admissionEmAndamento}
        userId={studentId}
        onVoltar={() => {
          setAdmissionEmAndamento(null)
          // Recarrega o booking para ver status atualizado
          if (bookingSelecionado) {
            setBookingSelecionado({ ...bookingSelecionado })
          }
        }}
        onConcluir={() => {
          setAdmissionEmAndamento(null)
          setBookingSelecionado(null)
          // Recarrega bookings para ver status atualizado
          carregarBookings()
        }}
      />
    )
  }

  // Se estiver visualizando detalhes de um booking
  if (bookingSelecionado) {
    return (
      <BookingDetalhes
        booking={bookingSelecionado}
        userId={studentId}
        userRole="aluno"
        onVoltar={() => setBookingSelecionado(null)}
        onIniciarAvaliacao={handleIniciarAvaliacao}
      />
    )
  }

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

  if (loading && tarefas.length === 0) {
    return (
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-medium text-sm">Erro ao carregar tarefas</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
              <Button
                onClick={() => currentUser && carregarBookings()}
                size="sm"
                variant="outline"
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      <Tabs defaultValue="ativas" className="space-y-3">
        <TabsList>
          <TabsTrigger value="ativas">
            Ativas {tarefasAtivas.length > 0 && `(${tarefasAtivas.length})`}
          </TabsTrigger>
          <TabsTrigger value="agendadas">
            Agendadas {tarefasAgendadas.length > 0 && `(${tarefasAgendadas.length})`}
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas {tarefasConcluidas.length > 0 && `(${tarefasConcluidas.length})`}
          </TabsTrigger>
          <TabsTrigger value="atrasadas">
            Atrasadas {tarefasAtrasadas.length > 0 && `(${tarefasAtrasadas.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativas" className="space-y-3 mt-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {!loading && tarefasAtivas.length === 0 ? (
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
                  onIniciar={() => handleAbrirBooking(tarefa.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agendadas" className="space-y-3 mt-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {!loading && tarefasAgendadas.length === 0 ? (
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
                  onIniciar={() => handleAbrirBooking(tarefa.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="space-y-3 mt-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {!loading && tarefasConcluidas.length === 0 ? (
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
                  onIniciar={() => handleVerEstatisticas(tarefa)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="atrasadas" className="space-y-3 mt-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {!loading && tarefasAtrasadas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma tarefa atrasada. Parabéns! 🎉
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tarefasAtrasadas.map((tarefa) => (
                <TarefaCard
                  key={tarefa.id}
                  tarefa={tarefa}
                  role="aluno"
                  concluida={false}
                  atrasada={false}
                  onIniciar={() => handleAbrirBooking(tarefa.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Estatísticas */}
      <Dialog open={showEstatisticas} onOpenChange={setShowEstatisticas}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Estatísticas da Tarefa
            </DialogTitle>
            <DialogDescription>
              {estatisticas?.tarefa.titulo}
            </DialogDescription>
          </DialogHeader>

          {estatisticas?.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : estatisticas?.record ? (
            <div className="space-y-4 py-4">
              {/* Percentual de Acerto */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Percentual de Acerto</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {estatisticas.record.score != null
                      ? `${(estatisticas.record.score * 100).toFixed(0)}%`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Tempo de Resolução */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tempo de Resolução</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    {formatarTempoEmMinutos(
                      estatisticas.record.elapsedTimeInSeconds ?? estatisticas.record.elapsedTime
                    )}
                  </p>
                </div>
              </div>

              {/* Data de Conclusão */}
              {estatisticas.record.finishedAt && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  Concluída em {new Date(estatisticas.record.finishedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar as estatísticas desta tarefa.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
