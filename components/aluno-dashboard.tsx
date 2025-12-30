"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { TarefaCard } from "@/components/tarefa-card"
import { RealizarTarefa } from "@/components/realizar-tarefa"
import { RealizarAvaliacao } from "@/components/realizar-avaliacao"
import { BookingDetalhes } from "@/components/booking-detalhes"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchStudentBookings, setPage } from "@/store/slices/bookingsSlice"
import { bookingToTarefa } from "@/lib/api/utils"
import { Tarefa } from "@/lib/types"
import { Booking } from "@/lib/api/bookings"
import { Admission } from "@/lib/api/admissions"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"

export function AlunoDashboard() {
  const { currentUser } = useAuth()
  const dispatch = useAppDispatch()
  const { items: bookings, meta, loading, error, currentPage, limit } = useAppSelector(
    (state) => state.bookings
  )
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null)
  const [bookingSelecionado, setBookingSelecionado] = useState<Booking | null>(null)
  const [admissionEmAndamento, setAdmissionEmAndamento] = useState<Admission | null>(null)

  // Converter bookings para tarefas
  const tarefas = bookings.map(bookingToTarefa)
  const tarefasAtivas = tarefas.filter((t) => t.status === "ativa")
  const tarefasConcluidas = tarefas.filter((t) => t.status === "finalizada")
  const tarefasAgendadas = tarefas.filter((t) => t.status === "agendada")

  // ID do aluno (mock para testes)
  const studentId = "student-001"

  // Carregar bookings ao montar o componente
  useEffect(() => {
    if (currentUser) {
      dispatch(fetchStudentBookings({ userId: studentId, page: currentPage, limit }))
    }
  }, [dispatch, currentUser, currentPage, limit])

  const handlePageChange = (newPage: number) => {
    if (currentUser) {
      dispatch(setPage(newPage))
      dispatch(fetchStudentBookings({ userId: studentId, page: newPage, limit }))
    }
  }

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
          dispatch(fetchStudentBookings({ userId: studentId, page: currentPage, limit }))
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
                onClick={() => currentUser && dispatch(fetchStudentBookings({ userId: studentId, page: currentPage, limit }))}
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

      {/* Paginação */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Página {meta.page} de {meta.totalPages} • Total: {meta.total} tarefas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="h-8"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= meta.totalPages || loading}
              className="h-8"
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
