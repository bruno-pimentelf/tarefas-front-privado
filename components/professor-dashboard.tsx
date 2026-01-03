"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TarefaCard } from "@/components/tarefa-card"
import { RelatorioPedagogico } from "@/components/relatorio-pedagogico"
import { CriarTarefaDialog } from "@/components/criar-tarefa-dialog"
import { BancoItens } from "@/components/banco-itens"
import { ColecoesPage } from "@/components/colecoes-page"
import { BookingDetalhes } from "@/components/booking-detalhes"
import { Tarefa, RelatorioPedagogico as RelatorioType } from "@/lib/types"
import { Plus, Database, Loader2, AlertCircle, RefreshCw, BarChart3 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getStudentBookings, Booking, getTeacherClasses, TeacherClass } from "@/lib/api/bookings"
import { bookingToTarefa } from "@/lib/api/utils"
import { getAdmissionsByBookingAndUser } from "@/lib/api/admissions"
import { getClassComponentReport, getComponentStats, getStudentScores } from "@/lib/api/analytics"
import { RelatoriosCompletos } from "@/components/analytics/relatorios-completos"

export function ProfessorDashboard() {
  const { currentUser } = useAuth()
  const router = useRouter()
  
  // Estado dos bookings/tarefas da API
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Estado removido - agora usamos totalQuestions diretamente do booking
  // Estado para armazenar turmas de cada booking (bookingId -> TeacherClass[])
  const [bookingTurmasMap, setBookingTurmasMap] = useState<Map<number, TeacherClass[]>>(new Map())
  
  // Estados de UI
  const [relatorios, setRelatorios] = useState<RelatorioType[]>([])
  const [relatoriosLoading, setRelatoriosLoading] = useState(false)
  const [showCriarTarefa, setShowCriarTarefa] = useState(false)
  const [showBancoItens, setShowBancoItens] = useState(false)
  const [showColecoes, setShowColecoes] = useState(false)
  const [bookingSelecionado, setBookingSelecionado] = useState<Booking | null>(null)
  const [tabAtiva, setTabAtiva] = useState<string>("ativas")


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
      if (!currentUser) return
      
      console.log("Carregando bookings para usuário:", currentUser.uid, currentUser.email)
      
      // Buscar bookings e todas as turmas do professor em paralelo
      const [bookingsResponse, todasTurmas] = await Promise.all([
        getStudentBookings(currentUser.uid, 1, 100),
        getTeacherClasses(currentUser.uid).catch(() => []) // Se falhar, retorna array vazio
      ])
      
      console.log("Bookings recebidos:", {
        total: bookingsResponse.items?.length || 0,
        items: bookingsResponse.items,
        meta: bookingsResponse.meta,
      })
      
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

  // Carregar bookings ao montar
  useEffect(() => {
    if (currentUser) {
      carregarBookings()
    }
  }, [carregarBookings, currentUser])

  // Função para carregar relatórios baseados nos bookings finalizados
  const carregarRelatorios = useCallback(async () => {
    if (!currentUser) return

    setRelatoriosLoading(true)
    try {
      const relatoriosPromises: Promise<RelatorioType | null>[] = []

      // Para cada booking finalizado, buscar relatórios
      for (const booking of bookings) {
        // Verifica se o booking está finalizado
        const isFinalizado = booking.status === "finished" || 
          (booking.endTime && new Date(booking.endTime) <= new Date())

        if (!isFinalizado) continue

        // Buscar admissions do booking
        try {
          const admissions = await getAdmissionsByBookingAndUser(booking.id, currentUser.uid)
          
          // Para cada admission finalizada, buscar dados de analytics
          for (const admission of admissions) {
            if (!admission.record?.finishedAt) continue

            // Buscar dados de analytics para esta admission
            try {
              const turmasIds = bookingTurmasMap.get(booking.id)?.map(t => t.id) || []
              
              const [componentStats, classReport, studentScores] = await Promise.all([
                getComponentStats(admission.id, { classIds: turmasIds }).catch(() => null),
                getClassComponentReport(admission.id, { classIds: turmasIds }).catch(() => null),
                getStudentScores(admission.id, { classIds: turmasIds }).catch(() => null),
              ])

              // Converter para formato RelatorioPedagogico
              if (componentStats && componentStats.components.length > 0) {
                const primeiroComponente = componentStats.components[0]
                const turmasDoBooking = bookingTurmasMap.get(booking.id) || []
                
                // Usar número real de estudantes se disponível, senão estimar
                const totalAlunos = studentScores?.students.length || 
                  turmasDoBooking.reduce((acc, t) => acc + 30, 0) // Estimativa: 30 alunos por turma
                
                // Calcular taxa de conclusão: número de estudantes que completaram
                const alunosCompletaram = studentScores?.students.length || 0
                
                // Calcular distribuição de desempenho baseado nos scores reais
                const alunosPorDesempenho = studentScores?.students.reduce((acc, student) => {
                  const score = student.averageScore
                  if (score >= 7.5) acc.excelente++
                  else if (score >= 5.0) acc.bom++
                  else if (score >= 2.5) acc.regular++
                  else acc.precisaMelhorar++
                  return acc
                }, { excelente: 0, bom: 0, regular: 0, precisaMelhorar: 0 }) || {
                  excelente: 0,
                  bom: 0,
                  regular: 0,
                  precisaMelhorar: 0,
                }

                const relatorio: RelatorioType = {
                  tarefaId: booking.id.toString(),
                  tarefaTitulo: booking.title,
                  componente: primeiroComponente.componentName as any,
                  totalAlunos: totalAlunos || 30,
                  alunosCompletaram: alunosCompletaram || 0,
                  taxaConclusao: totalAlunos > 0 ? (alunosCompletaram / totalAlunos) * 100 : 0,
                  desempenhoMedio: primeiroComponente.averageScore * 10, // Converter de 0-10 para 0-100
                  desempenhoPorHabilidade: componentStats.components.map(comp => ({
                    habilidade: comp.componentName,
                    acertos: comp.correctAnswers,
                    total: comp.totalQuestions,
                    percentual: comp.totalQuestions > 0 
                      ? (comp.correctAnswers / comp.totalQuestions) * 100 
                      : 0,
                  })),
                  tempoMedioPorQuestao: 120, // Não disponível na API atual
                  tempoTotalMedio: 720, // Não disponível na API atual
                  alunosPorDesempenho,
                }

                relatoriosPromises.push(Promise.resolve(relatorio))
              }
            } catch (err) {
              console.error(`Erro ao buscar analytics para admission ${admission.id}:`, err)
            }
          }
        } catch (err) {
          console.error(`Erro ao buscar admissions para booking ${booking.id}:`, err)
        }
      }

      const relatoriosResultados = await Promise.all(relatoriosPromises)
      setRelatorios(relatoriosResultados.filter((r): r is RelatorioType => r !== null))
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err)
    } finally {
      setRelatoriosLoading(false)
    }
  }, [bookings, bookingTurmasMap, currentUser])

  // Carregar relatórios quando bookings mudarem
  useEffect(() => {
    if (bookings.length > 0 && bookingTurmasMap.size > 0) {
      carregarRelatorios()
    }
  }, [bookings, bookingTurmasMap, carregarRelatorios])

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
        userId={currentUser?.uid || ""}
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
          if (turmasIds && turmasIds.length > 0 && currentUser) {
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

            <TabsContent value="relatorios" className="space-y-6 mt-3">
              <div className="mb-4">
                <Button
                  onClick={() => router.push("/professor/analytics/item-analysis")}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Análise de Itens
                </Button>
              </div>
              {relatoriosLoading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Carregando relatórios...</p>
                  </CardContent>
                </Card>
              ) : bookings.filter(b => {
                const isFinalizado = b.status === "finished" || 
                  (b.endTime && new Date(b.endTime) <= new Date())
                return isFinalizado
              }).length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    Nenhum relatório disponível
                    <p className="text-xs mt-2">Relatórios aparecerão aqui quando tarefas forem finalizadas</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {bookings
                    .filter((b) => {
                      const isFinalizado = b.status === "finished" || 
                        (b.endTime && new Date(b.endTime) <= new Date())
                      return isFinalizado
                    })
                    .map((booking) => (
                      <RelatoriosCompletos
                        key={booking.id}
                        booking={booking}
                        classIds={bookingTurmasMap.get(booking.id)?.map(t => t.id) || []}
                        userId={currentUser?.uid || ""}
                      />
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
