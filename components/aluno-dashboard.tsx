"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { TarefaCard } from "@/components/tarefa-card"
import { RealizarTarefa } from "@/components/realizar-tarefa"
import { RealizarAvaliacao } from "@/components/realizar-avaliacao"
import { BookingDetalhes } from "@/components/booking-detalhes"
import { getStudentBookings } from "@/lib/api/bookings"
import { bookingToTarefa, getBookingQuestionsCount, isBookingCompleted } from "@/lib/api/utils"
import { Tarefa } from "@/lib/types"
import { Booking } from "@/lib/api/bookings"
import { Admission } from "@/lib/api/admissions"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertCircle } from "lucide-react"

export function AlunoDashboard() {
  const { currentUser } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null)
  const [bookingSelecionado, setBookingSelecionado] = useState<Booking | null>(null)
  const [admissionEmAndamento, setAdmissionEmAndamento] = useState<Admission | null>(null)

  // Estado para armazenar contagens de questões por booking
  const [questionsCountMap, setQuestionsCountMap] = useState<Map<number, number>>(new Map())
  // Estado para armazenar status de conclusão por booking
  const [completedMap, setCompletedMap] = useState<Map<number, boolean>>(new Map())

  // Converter bookings para tarefas usando as contagens de questões e status de conclusão
  // Usando useMemo para garantir recálculo correto quando estados mudam
  const { tarefas, tarefasAtivas, tarefasConcluidas, tarefasAgendadas } = useMemo(() => {
    const allTarefas = bookings.map(booking => {
      const questionsCount = questionsCountMap.get(booking.id) || 0
      const isCompleted = completedMap.get(booking.id) || false
      return bookingToTarefa(booking, questionsCount, isCompleted, false)
    })
    
    const ativas = allTarefas.filter((t) => t.status === "ativa")
    const concluidas = allTarefas.filter((t) => t.status === "finalizada")
    const agendadas = allTarefas.filter((t) => t.status === "agendada")
    
    return { tarefas: allTarefas, tarefasAtivas: ativas, tarefasConcluidas: concluidas, tarefasAgendadas: agendadas }
  }, [bookings, questionsCountMap, completedMap])

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
      
      // Calcular totais de questões e status de conclusão para cada booking em paralelo ANTES de atualizar o estado
      const bookingDataPromises = allBookings.map(async (booking) => {
        try {
          const [count, completed] = await Promise.all([
            getBookingQuestionsCount(booking.id, studentId),
            isBookingCompleted(booking.id, studentId),
          ])
          return { bookingId: booking.id, count, completed }
        } catch (error) {
          console.error(`Erro ao calcular dados para booking ${booking.id}:`, error)
          return { bookingId: booking.id, count: 0, completed: false }
        }
      })

      const bookingDataResults = await Promise.all(bookingDataPromises)
      const newQuestionsCountMap = new Map<number, number>()
      const newCompletedMap = new Map<number, boolean>()
      
      bookingDataResults.forEach(({ bookingId, count, completed }) => {
        newQuestionsCountMap.set(bookingId, count)
        newCompletedMap.set(bookingId, completed)
      })

      // Atualizar todos os estados juntos para evitar renderização intermediária
      setBookings(allBookings)
      setQuestionsCountMap(newQuestionsCountMap)
      setCompletedMap(newCompletedMap)
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

  // Handler para iniciar avaliação
  const handleIniciarAvaliacao = (admission: Admission) => {
    setAdmissionEmAndamento(admission)
    // TODO: Implementar componente de realizar avaliação
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
                  onIniciar={() => handleAbrirBooking(tarefa.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
