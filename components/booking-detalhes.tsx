"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FaArrowLeft,
  FaPlus,
  FaSpinner,
  FaExclamationCircle,
  FaSync,
  FaClock,
  FaBook,
  FaCheckCircle,
  FaPlay,
  FaEdit,
  FaHandSparkles,
  FaBolt,
  FaBullseye,
} from "react-icons/fa"
import { Booking } from "@/lib/api/bookings"
import {
  Admission,
  getAdmissionsByBookingAndUser,
} from "@/lib/api/admissions"
import { CriarAdmissionDialog } from "./criar-admission-dialog"
import { EditarBookingDialog } from "./editar-booking-dialog"
import { BookingEstatisticas } from "./booking-estatisticas"
import { formatBookingDate } from "@/lib/api/utils"
import { ThemeToggle } from "./theme-toggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BookingDetalhesProps {
  booking: Booking
  userId: string
  userRole: "professor" | "aluno"
  onVoltar: () => void
  onIniciarAvaliacao?: (admission: Admission) => void
  turmaNome?: string // Nome da turma (opcional)
  onBookingUpdated?: (updatedBooking: Booking, turmasIds?: number[]) => void // Callback quando booking é atualizado
  turmasAssociadas?: number[] // IDs das turmas já associadas ao booking
  hideHeader?: boolean // Se true, oculta o header interno (útil quando a página tem seu próprio header)
}

export function BookingDetalhes({
  booking,
  userId,
  userRole,
  onVoltar,
  onIniciarAvaliacao,
  turmaNome,
  onBookingUpdated,
  turmasAssociadas = [],
  hideHeader = false,
}: BookingDetalhesProps) {
  const router = useRouter()
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCriarAdmission, setShowCriarAdmission] = useState(false)
  const [showEditarBooking, setShowEditarBooking] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<Booking>(booking)

  const carregarAdmissions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getAdmissionsByBookingAndUser(currentBooking.id, userId)
      setAdmissions(response || [])
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar avaliações")
    } finally {
      setLoading(false)
    }
  }, [currentBooking.id, userId])

  useEffect(() => {
    carregarAdmissions()
  }, [carregarAdmissions])

  // Atualizar currentBooking quando booking prop mudar
  useEffect(() => {
    setCurrentBooking(booking)
  }, [booking])

  // Verificar se pode criar avaliação: não pode se booking está finalizado
  const podeCriarAvaliacao = useMemo(() => {
    // Não permite criar avaliações em bookings finalizados
    // Verifica pelo status da API
    if (currentBooking.status === "finished") {
      return false
    }

    // Verificação adicional: se o endTime já passou, também considera finalizado
    // Para professor, um booking está finalizado quando o prazo expirou
    if (currentBooking.endTime) {
      try {
        const endTime = new Date(currentBooking.endTime)
        const now = new Date()
        // Se o endTime já passou, considera finalizado
        if (endTime.getTime() <= now.getTime()) {
          return false
        }
      } catch (e) {
        // Se houver erro ao parsear a data, permite criar (fallback)
        console.error("Erro ao verificar endTime:", e)
      }
    }

    return true
  }, [currentBooking.status, currentBooking.endTime])

  return (
    <div className="mx-auto px-4 py-4 max-w-7xl w-full">
      {/* Detalhes do Booking */}
      <Card className="mb-6 group relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-all duration-300">
              <FaBook className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-foreground mb-1">
                {currentBooking.title}
              </CardTitle>
              {currentBooking.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentBooking.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Turma */}
          {turmaNome && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 transition-all duration-200 hover:bg-muted/70">
              <div className="p-1.5 rounded-md bg-background">
                <FaBullseye className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Turma</p>
                <p className="text-sm font-semibold text-foreground">{turmaNome}</p>
              </div>
            </div>
          )}

          {/* Data e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <FaClock className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Início</p>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatBookingDate(currentBooking.startTime, currentBooking.timezone)}</p>
            </div>
            <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-accent/10">
                  <FaClock className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Término</p>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatBookingDate(currentBooking.endTime, currentBooking.timezone)}</p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Botão de Iniciar Avaliação - Apenas para alunos */}
      {userRole === "aluno" && admissions.length > 0 && !loading && (
        <div className="mb-6 opacity-0 animate-[fadeIn_0.8s_ease-out_0.4s_forwards]">
          {admissions.map((admission) => {
            // Se já finalizou, não mostra botão
            if (admission.record?.finishedAt) return null
            
            return (
              <div key={admission.id} className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 animate-pulse" />
                
                <Button
                  onClick={() => {
                    if (userRole === "aluno") {
                      // Redirecionar para rota de responder
                      router.push(`/aluno/tarefa/${booking.id}/responder`)
                    } else {
                      // Manter comportamento original para professor
                      onIniciarAvaliacao?.(admission)
                    }
                  }}
                  className="relative w-full gap-2 h-14 text-base font-semibold bg-gradient-to-r from-background via-background to-background border-2 border-primary/30 hover:border-primary/60 hover:bg-gradient-to-r hover:from-primary/5 hover:via-accent/5 hover:to-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 group"
                  size="default"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                      {admission.record ? (
                        <FaPlay className="h-5 w-5 text-primary" />
                      ) : (
                        <FaBolt className="h-5 w-5 text-primary animate-pulse" />
                      )}
                    </div>
                    <span className="text-foreground group-hover:text-primary transition-colors duration-300">
                      {admission.record ? "Continuar Avaliação" : "Iniciar Avaliação"}
                    </span>
                    <FaHandSparkles className="h-4 w-4 text-primary/60 group-hover:text-primary group-hover:animate-pulse ml-auto transition-all duration-300" />
                  </div>
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista de Admissions - Apenas para professores */}
      {userRole === "professor" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <FaSpinner className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando avaliações...</p>
              </div>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center gap-3 text-center">
                  <FaExclamationCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="font-medium text-sm">Erro ao carregar avaliações</p>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                  </div>
                  <Button onClick={carregarAdmissions} size="sm" variant="outline">
                    Tentar novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : admissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FaBook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-sm font-medium mb-2">Nenhuma avaliação encontrada</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {userRole === "professor"
                    ? "Crie a avaliação para este booking."
                    : "Ainda não há avaliações disponíveis para este booking."}
                </p>
                {userRole === "professor" && podeCriarAvaliacao && (
                  <Button
                    onClick={() => setShowCriarAdmission(true)}
                    size="sm"
                    className="gap-1.5"
                  >
                    <FaPlus className="h-3.5 w-3.5" />
                    Criar Avaliação
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Tabs defaultValue="avaliacoes" className="w-full">
                <TabsList variant="line" className="h-auto bg-transparent p-0 border-b w-full justify-start gap-6">
                  <TabsTrigger value="avaliacoes" className="text-sm">
                    Avaliações
                  </TabsTrigger>
                  <TabsTrigger value="estatisticas" disabled={!admissions.some(a => a.record?.finishedAt)} className="text-sm">
                    Estatísticas
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="avaliacoes" className="space-y-4 mt-4">
                  {admissions.map((admission, index) => {
                    return (
                      <Card key={admission.id} className="overflow-hidden hover:shadow-md transition-all duration-200" style={{ animationDelay: `${index * 0.1}s` }}>
                        <CardHeader className="pb-3 border-b bg-muted/30">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <CardTitle className="text-sm font-semibold mb-1">{admission.title}</CardTitle>
                              {admission.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {admission.description}
                                </p>
                              )}
                            </div>
                            {admission.record?.finishedAt && (
                              <Badge variant="default" className="shrink-0 text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                <FaCheckCircle className="h-3 w-3 mr-1" />
                                Concluída
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                          {/* Duração */}
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                            <div className="p-1.5 rounded-md bg-background">
                              <FaClock className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-0.5">Duração</p>
                              <p className="text-sm font-semibold">{admission.duration} minutos</p>
                            </div>
                          </div>

                          {/* Instruções */}
                          {admission.instructions && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Instruções</p>
                              <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="text-xs leading-relaxed">{admission.instructions}</p>
                              </div>
                            </div>
                          )}

                          {/* Exams */}
                          {admission.exams.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Prova</p>
                              <div className="space-y-2">
                                {admission.exams.map((exam) => (
                                  <Card key={exam.id} className="border bg-card hover:bg-muted/20 transition-colors">
                                    <CardContent className="p-3">
                                      <div className="flex items-start gap-2">
                                        <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                                          <FaBook className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium mb-1">{exam.title}</p>
                                          {exam.theme && (
                                            <Badge variant="outline" className="text-xs">
                                              {exam.theme.name}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Info adicional da Admission (se houver record) */}
                          {admission.record?.score != null && typeof admission.record.score === 'number' && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <FaCheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-muted-foreground">Nota: </span>
                              <span className="font-semibold">{admission.record.score.toFixed(1)}</span>
                            </div>
                          )}

                        </CardContent>
                      </Card>
                    )
                  })}
                </TabsContent>

                <TabsContent value="estatisticas" className="mt-4">
                  {admissions
                    .filter(a => a.record?.finishedAt)
                    .map((admission) => (
                      <BookingEstatisticas
                        key={admission.id}
                        admissionId={admission.id}
                        classIds={turmasAssociadas}
                      />
                    ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}


      {/* Dialog de editar booking */}
      <EditarBookingDialog
        open={showEditarBooking}
        onOpenChange={setShowEditarBooking}
        booking={currentBooking}
        turmasAssociadas={turmasAssociadas}
        onSuccess={(updatedBooking, turmasIds) => {
          setCurrentBooking(updatedBooking)
          onBookingUpdated?.(updatedBooking, turmasIds)
        }}
      />

      {/* Dialog de criar admission - só abre se pode criar avaliação */}
      {podeCriarAvaliacao && (
        <CriarAdmissionDialog
          open={showCriarAdmission}
          onOpenChange={(open) => {
            // Só permite abrir se pode criar avaliação
            if (open && !podeCriarAvaliacao) {
              return
            }
            setShowCriarAdmission(open)
          }}
          bookingId={currentBooking.id}
          bookingTitle={currentBooking.title}
          onSuccess={carregarAdmissions}
        />
      )}
    </div>
  )
}
