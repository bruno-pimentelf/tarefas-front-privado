"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TarefaCard } from "@/components/tarefa-card"
import { RelatorioPedagogico } from "@/components/relatorio-pedagogico"
import { CriarTarefaDialog } from "@/components/criar-tarefa-dialog"
import { BancoItens } from "@/components/banco-itens"
import { ColecoesPage } from "@/components/colecoes-page"
import { BookingDetalhes } from "@/components/booking-detalhes"
import { mockRelatorios } from "@/lib/mock-data"
import { Tarefa, RelatorioPedagogico as RelatorioType } from "@/lib/types"
import { Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getStudentBookings, Booking, getTeacherClasses, TeacherClass } from "@/lib/api/bookings"
import { bookingToTarefa } from "@/lib/api/utils"

interface ProfessorDashboardProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  onCountsChange?: (counts: { ativas: number; agendadas: number; finalizadas: number }) => void
  refreshTrigger?: number
  currentUser?: { uid: string; email: string | null; displayName: string | null } | null
}

export function ProfessorDashboard({ activeTab = "ativas", onTabChange, onCountsChange, refreshTrigger, currentUser: currentUserProp }: ProfessorDashboardProps) {
  const { currentUser: currentUserAuth } = useAuth()
  const currentUser = currentUserProp || currentUserAuth
  
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

  // Notificar mudanças nos contadores
  useEffect(() => {
    if (onCountsChange) {
      onCountsChange({
        ativas: tarefasAtivas.length,
        agendadas: tarefasAgendadas.length,
        finalizadas: tarefasFinalizadas.length
      })
    }
  }, [tarefasAtivas.length, tarefasAgendadas.length, tarefasFinalizadas.length, onCountsChange])

  // Função para carregar bookings
  const carregarBookings = useCallback(async () => {
    if (!currentUser) return

    setLoading(true)
    setError(null)

    try {
      // Buscar bookings e todas as turmas do professor em paralelo
      const [bookingsResponse, todasTurmas] = await Promise.all([
        getStudentBookings(currentUser.uid, 1, 100),
        getTeacherClasses(currentUser.uid).catch(() => []) // Se falhar, retorna array vazio
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
  }, [currentUser])

  // Carregar bookings ao montar ou quando refreshTrigger mudar
  useEffect(() => {
    if (currentUser) {
      carregarBookings()
    }
  }, [carregarBookings, currentUser, refreshTrigger])

  // Callback quando uma tarefa é criada com sucesso
  const handleTarefaCriada = () => {
    carregarBookings()
  }

  // Handler para ver detalhes do booking
  const handleVerDetalhes = (tarefaId: string, tabAtual?: string) => {
    const booking = bookings.find((b) => b.id.toString() === tarefaId)
    if (booking) {
      // Armazenar a tab atual antes de abrir os detalhes
      if (tabAtual && onTabChange) {
        onTabChange(tabAtual)
      }
      setBookingSelecionado(booking)
    }
  }

  // Se estiver visualizando detalhes de um booking
  if (bookingSelecionado) {
    return (
      <BookingDetalhes
        booking={bookingSelecionado}
        userId={currentUser.uid}
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
            getTeacherClasses(currentUser.uid)
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

  // Determinar qual conteúdo mostrar baseado na tab ativa
  const getCurrentContent = () => {
    switch (activeTab) {
      case "agendadas":
        return (
          <>
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
                    role="professor"
                    onVerDetalhes={() => handleVerDetalhes(tarefa.id, "agendadas")}
                  />
                ))}
              </div>
            )}
          </>
        )
      case "finalizadas":
        return (
          <>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
            {!loading && tarefasFinalizadas.length === 0 ? (
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
          </>
        )
      default: // "ativas"
        return (
          <>
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
                    role="professor"
                    onVerDetalhes={() => handleVerDetalhes(tarefa.id, "ativas")}
                  />
                ))}
              </div>
            )}
          </>
        )
    }
  }

  return (
    <div className="space-y-3">
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
      {!loading && !error && getCurrentContent()}

      <CriarTarefaDialog
        open={showCriarTarefa}
        onOpenChange={setShowCriarTarefa}
        onSuccess={handleTarefaCriada}
      />
    </div>
  )
}
