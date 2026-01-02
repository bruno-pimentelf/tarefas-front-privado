"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TarefaCard } from "@/components/tarefa-card"
import { RelatorioPedagogico } from "@/components/relatorio-pedagogico"
import { CriarTarefaDialog } from "@/components/criar-tarefa-dialog"
import { BancoItens } from "@/components/banco-itens"
import { ColecoesPage } from "@/components/colecoes-page"
import { BookingDetalhes } from "@/components/booking-detalhes"
import { mockRelatorios } from "@/lib/mock-data"
import { Tarefa, RelatorioPedagogico as RelatorioType } from "@/lib/types"
import { Plus, Database, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getStudentBookings, Booking, getTeacherClasses, TeacherClass } from "@/lib/api/bookings"
import { bookingToTarefa } from "@/lib/api/utils"

export function ProfessorDashboard() {
  const { currentUser } = useAuth()
  
  // Estado dos bookings/tarefas da API
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Estado removido - agora usamos totalQuestions diretamente do booking
  // Estado para armazenar turmas de cada booking (bookingId -> TeacherClass[])
  const [bookingTurmasMap, setBookingTurmasMap] = useState<Map<number, TeacherClass[]>>(new Map())
  
  // Estados de UI
  const [relatorios] = useState<RelatorioType[]>(mockRelatorios)
  const [showCriarTarefa, setShowCriarTarefa] = useState(false)
  const [showBancoItens, setShowBancoItens] = useState(false)
  const [showColecoes, setShowColecoes] = useState(false)
  const [bookingSelecionado, setBookingSelecionado] = useState<Booking | null>(null)
  const [tabAtiva, setTabAtiva] = useState<string>("ativas")

  // ID do professor (mock para testes)
  const teacherId = "teacher-001"

  // Converter bookings para tarefas
  // Para professor: verifica endTime para determinar status finalizada
  // Usando useMemo para garantir recálculo correto quando estados mudam
  const { tarefas, tarefasAtivas, tarefasAgendadas, tarefasFinalizadas } = useMemo(() => {
    const allTarefas: Tarefa[] = bookings.map((booking) => {
      // Buscar turmas específicas deste booking
      const turmasDoBooking = bookingTurmasMap.get(booking.id) || []
      const turmasNomes = turmasDoBooking.length > 0 
        ? turmasDoBooking.map(t => t.name).join(", ")
        : ""
      
      const tarefa = bookingToTarefa(booking, true) // true = é professor
      // Atualizar turmaNome se tivermos informações de turmas
      if (turmasNomes) {
        tarefa.turmaNome = turmasNomes
      }
      return tarefa
    })
    
    const ativas = allTarefas.filter((t) => t.status === "ativa")
    const agendadas = allTarefas.filter((t) => t.status === "agendada")
    const finalizadas = allTarefas.filter((t) => t.status === "finalizada")
    
    return { tarefas: allTarefas, tarefasAtivas: ativas, tarefasAgendadas: agendadas, tarefasFinalizadas: finalizadas }
  }, [bookings, bookingTurmasMap])

  // Função para carregar bookings
  const carregarBookings = useCallback(async () => {
    if (!currentUser) return

    setLoading(true)
    setError(null)

    try {
      // Buscar bookings e todas as turmas do professor em paralelo
      const [bookingsResponse, todasTurmas] = await Promise.all([
        getStudentBookings(teacherId, 1, 100),
        getTeacherClasses(teacherId).catch(() => []) // Se falhar, retorna array vazio
      ])
      
      const allBookings = bookingsResponse.items || []

      // Buscar turmas de cada booking
      // MOCK: Por enquanto, associa todas as turmas do professor a todos os bookings
      // TODO: Implementar busca de turmas específicas do booking quando a API suportar
      const bookingDataPromises = allBookings.map(async (booking) => {
        try {
          // MOCK: Usa todas as turmas do professor para cada booking
          // Em produção, isso deveria vir da API com as turmas específicas de cada booking
          let turmasDoBooking: TeacherClass[] = todasTurmas
          
          console.log(`Associando turmas ao booking ${booking.id}:`, turmasDoBooking.map(t => t.name))
          
          return { 
            bookingId: booking.id, 
            turmas: turmasDoBooking
          }
        } catch (error) {
          console.error(`Erro ao buscar dados para booking ${booking.id}:`, error)
          return { 
            bookingId: booking.id, 
            turmas: []
          }
        }
      })

      const bookingDataResults = await Promise.all(bookingDataPromises)
      const newBookingTurmasMap = new Map<number, TeacherClass[]>()
      
      bookingDataResults.forEach(({ bookingId, turmas }) => {
        newBookingTurmasMap.set(bookingId, turmas)
      })

      // Atualizar todos os estados juntos para evitar renderização intermediária
      setBookings(allBookings)
      setBookingTurmasMap(newBookingTurmasMap)
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || "Erro ao carregar tarefas"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [currentUser, teacherId])

  // Carregar bookings ao montar
  useEffect(() => {
    if (currentUser) {
      carregarBookings()
    }
  }, [carregarBookings, currentUser, teacherId])

  // Callback quando uma tarefa é criada com sucesso
  const handleTarefaCriada = () => {
    carregarBookings()
  }

  // Handler para ver detalhes do booking
  const handleVerDetalhes = (tarefaId: string, tabAtual?: string) => {
    const booking = bookings.find((b) => b.id.toString() === tarefaId)
    if (booking) {
      // Armazenar a tab atual antes de abrir os detalhes
      if (tabAtual) {
        setTabAtiva(tabAtual)
      }
      setBookingSelecionado(booking)
    }
  }

  // Se estiver visualizando detalhes de um booking
  if (bookingSelecionado) {
    return (
      <BookingDetalhes
        booking={bookingSelecionado}
        userId={teacherId}
        userRole="professor"
        onVoltar={() => {
          setBookingSelecionado(null)
          // Não precisa restaurar a tab aqui, pois o Tabs já mantém o estado
        }}
        onBookingUpdated={(updatedBooking, turmasIds) => {
          // Atualizar o booking na lista
          setBookings((prev) =>
            prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
          )
          setBookingSelecionado(updatedBooking)
          
          // Atualizar turmas do booking se fornecidas
          if (turmasIds && turmasIds.length > 0) {
            // Buscar as turmas completas pelos IDs
            getTeacherClasses(teacherId)
              .then((todasTurmas) => {
                const turmasDoBooking = todasTurmas.filter((t) => turmasIds.includes(t.id))
                setBookingTurmasMap((prev) => {
                  const newMap = new Map(prev)
                  newMap.set(updatedBooking.id, turmasDoBooking)
                  return newMap
                })
              })
              .catch((error) => {
                console.error("Erro ao atualizar turmas do booking:", error)
              })
          }
        }}
        turmasAssociadas={
          bookingTurmasMap.get(bookingSelecionado.id)?.map((t) => t.id) || []
        }
      />
    )
  }

  if (showBancoItens) {
    return (
      <BancoItens
        onVoltar={() => setShowBancoItens(false)}
        onAbrirColecoes={() => {
          setShowBancoItens(false)
          setShowColecoes(true)
        }}
      />
    )
  }

  if (showColecoes) {
    return (
      <ColecoesPage
        onVoltar={() => {
          setShowColecoes(false)
          setShowBancoItens(true)
        }}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-3">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="ativas">
              Ativas {tarefasAtivas.length > 0 && `(${tarefasAtivas.length})`}
            </TabsTrigger>
            <TabsTrigger value="agendadas">
              Agendadas {tarefasAgendadas.length > 0 && `(${tarefasAgendadas.length})`}
            </TabsTrigger>
            <TabsTrigger value="finalizadas">
              Finalizadas {tarefasFinalizadas.length > 0 && `(${tarefasFinalizadas.length})`}
            </TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={carregarBookings}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="default"
              className="gap-1.5"
              onClick={() => setShowBancoItens(true)}
            >
              <Database className="h-4 w-4" />
              Banco de Itens
            </Button>
            <Button onClick={() => setShowCriarTarefa(true)} size="default" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {loading && tarefas.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="font-medium text-sm">Erro ao carregar tarefas</p>
                  <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
                <Button onClick={carregarBookings} size="sm" variant="outline">
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            <TabsContent value="ativas" className="space-y-3 mt-3">
              {tarefasAtivas.length === 0 ? (
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
                      role="professor"
                      onVerDetalhes={() => handleVerDetalhes(tarefa.id, "ativas")}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="agendadas" className="space-y-3 mt-3">
              {tarefasAgendadas.length === 0 ? (
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
                      role="professor"
                      onVerDetalhes={() => handleVerDetalhes(tarefa.id, "agendadas")}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="finalizadas" className="space-y-3 mt-3">
              {tarefasFinalizadas.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    Nenhuma tarefa finalizada
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tarefasFinalizadas.map((tarefa) => (
                    <TarefaCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      role="professor"
                      onVerDetalhes={() => handleVerDetalhes(tarefa.id, "finalizadas")}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="relatorios" className="space-y-3 mt-3">
              {relatorios.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    Nenhum relatório disponível
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {relatorios.map((relatorio) => (
                    <RelatorioPedagogico key={relatorio.tarefaId} relatorio={relatorio} />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      <CriarTarefaDialog
        open={showCriarTarefa}
        onOpenChange={setShowCriarTarefa}
        onSuccess={handleTarefaCriada}
      />
    </div>
  )
}
