"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  BookOpen,
  CheckCircle2,
  Play,
  Edit,
} from "lucide-react"
import { Booking } from "@/lib/api/bookings"
import {
  Admission,
  getAdmissionsByBookingAndUser,
  clearAdmissionsCache,
} from "@/lib/api/admissions"
import { CriarAdmissionDialog } from "./criar-admission-dialog"
import { EditarBookingDialog } from "./editar-booking-dialog"
import { formatBookingDate } from "@/lib/api/utils"

interface BookingDetalhesProps {
  booking: Booking
  userId: string
  userRole: "professor" | "aluno"
  onVoltar: () => void
  onIniciarAvaliacao?: (admission: Admission) => void
  turmaNome?: string // Nome da turma (opcional)
  onBookingUpdated?: (updatedBooking: Booking, turmasIds?: number[]) => void // Callback quando booking é atualizado
  turmasAssociadas?: number[] // IDs das turmas já associadas ao booking
  hideHeader?: boolean // Esconde o header do componente (útil quando já existe header na página)
  onRefreshRef?: React.MutableRefObject<(() => void) | null> // Ref para expor função de refresh
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
  onRefreshRef,
}: BookingDetalhesProps) {
  const router = useRouter()
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCriarAdmission, setShowCriarAdmission] = useState(false)
  const [showEditarBooking, setShowEditarBooking] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<Booking>(booking)

  const carregarAdmissions = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const response = await getAdmissionsByBookingAndUser(currentBooking.id, userId, { 
        useCache: true,
        forceRefresh 
      })
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

  // Expor função de refresh através da ref
  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = carregarAdmissions
    }
    return () => {
      if (onRefreshRef) {
        onRefreshRef.current = null
      }
    }
  }, [carregarAdmissions, onRefreshRef])

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
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      {/* Header */}
      {!hideHeader && (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onVoltar} size="sm" className="gap-1.5 h-8">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
          <div>
            <h1 className="text-sm font-semibold">{currentBooking.title}</h1>
            {currentBooking.description && (
              <p className="text-xs text-muted-foreground">{currentBooking.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Botão de editar - apenas para professores */}
          {userRole === "professor" && (
            <Button
              onClick={() => setShowEditarBooking(true)}
              size="sm"
              variant="outline"
              className="gap-1.5 h-8"
            >
              <Edit className="h-3.5 w-3.5" />
              Editar
            </Button>
          )}
          {/* Botão só aparece se for professor E não existir nenhuma admission E pode criar avaliação */}
          {userRole === "professor" && admissions.length === 0 && !loading && podeCriarAvaliacao && (
            <Button
              onClick={() => setShowCriarAdmission(true)}
              size="sm"
              className="gap-1.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova Avaliação
            </Button>
          )}
        </div>
      </div>
      )}

      {/* Detalhes do Booking */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Detalhes da Tarefa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Turma */}
          {turmaNome && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Turma</p>
              <p className="text-sm font-semibold">{turmaNome}</p>
            </div>
          )}

          {/* Título */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Título</p>
            <p className="text-sm font-semibold">{currentBooking.title}</p>
          </div>

          {/* Descrição */}
          {currentBooking.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Descrição</p>
              <p className="text-sm">{currentBooking.description}</p>
            </div>
          )}

          {/* Data e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Data e Horário de Início</p>
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatBookingDate(currentBooking.startTime, currentBooking.timezone)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Data e Horário de Término</p>
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatBookingDate(currentBooking.endTime, currentBooking.timezone)}</span>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Botão de Iniciar Avaliação - Apenas para alunos */}
      {userRole === "aluno" && admissions.length > 0 && !loading && (
        <div className="mb-4">
          {admissions.map((admission) => {
            // Se já finalizou, não mostra botão
            if (admission.record?.finishedAt) return null
            
            return (
              <Button
                key={admission.id}
                onClick={() => {
                  if (userRole === "aluno") {
                    // Redirecionar para rota de responder
                    router.push(`/aluno/tarefa/${booking.id}/responder`)
                  } else {
                    // Manter comportamento original para professor
                    onIniciarAvaliacao?.(admission)
                  }
                }}
                className="w-full gap-1.5"
                size="default"
              >
                <Play className="h-4 w-4" />
                {admission.record ? "Continuar Avaliação" : "Iniciar Avaliação"}
              </Button>
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
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando avaliações...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
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
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                <Plus className="h-3.5 w-3.5" />
                Criar Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {admissions.map((admission) => {
            return (
              <Card key={admission.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div>
                    <CardTitle className="text-base">{admission.title}</CardTitle>
                    {admission.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {admission.description}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Duração */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Duração</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{admission.duration} minutos</span>
                    </div>
                  </div>

                  {/* Instruções */}
                  {admission.instructions && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Instruções</p>
                      <div className="p-3 bg-muted/30 rounded-md">
                        <p className="text-sm">{admission.instructions}</p>
                      </div>
                    </div>
                  )}

                  {/* Exams */}
                  {admission.exams.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Prova</p>
                      <div className="space-y-2">
                        {admission.exams.map((exam) => (
                          <Card key={exam.id} className="border">
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{exam.title}</p>
                                  {exam.theme && (
                                    <Badge variant="outline" className="text-xs mt-1">
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
                    <div className="flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-muted-foreground">Nota: </span>
                      <span className="font-semibold">{admission.record.score.toFixed(1)}</span>
                    </div>
                  )}

                </CardContent>
              </Card>
            )
          })}
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
          onSuccess={() => {
            // Limpar cache e recarregar admissions
            clearAdmissionsCache(currentBooking.id, userId)
            carregarAdmissions(true) // forceRefresh = true
          }}
        />
      )}
    </div>
  )
}
