"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "lucide-react"
import { Booking } from "@/lib/api/bookings"
import {
  Admission,
  getAdmissionsByBookingAndUser,
} from "@/lib/api/admissions"
import { CriarAdmissionDialog } from "./criar-admission-dialog"
import { formatBookingDate } from "@/lib/api/utils"

interface BookingDetalhesProps {
  booking: Booking
  userId: string
  userRole: "professor" | "aluno"
  onVoltar: () => void
  onIniciarAvaliacao?: (admission: Admission) => void
}

export function BookingDetalhes({
  booking,
  userId,
  userRole,
  onVoltar,
  onIniciarAvaliacao,
}: BookingDetalhesProps) {
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCriarAdmission, setShowCriarAdmission] = useState(false)

  const carregarAdmissions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getAdmissionsByBookingAndUser(booking.id, userId)
      setAdmissions(response || [])
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar avaliações")
    } finally {
      setLoading(false)
    }
  }, [booking.id, userId])

  useEffect(() => {
    carregarAdmissions()
  }, [carregarAdmissions])

  const getAdmissionStatus = (admission: Admission) => {
    if (admission.record?.finishedAt) {
      return { label: "Concluída", variant: "default" as const, color: "bg-green-500" }
    }
    if (admission.record) {
      return { label: "Em andamento", variant: "secondary" as const, color: "bg-yellow-500" }
    }
    return { label: "Não iniciada", variant: "outline" as const, color: "bg-gray-500" }
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onVoltar} size="sm" className="gap-1.5 h-8">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
          <div>
            <h1 className="text-sm font-semibold">{booking.title}</h1>
            {booking.description && (
              <p className="text-xs text-muted-foreground">{booking.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={carregarAdmissions}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {/* Botão só aparece se for professor E não existir nenhuma admission */}
          {userRole === "professor" && admissions.length === 0 && !loading && (
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

      {/* Info do Booking */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Início: {formatBookingDate(booking.startTime, booking.timezone)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Término: {formatBookingDate(booking.endTime, booking.timezone)}</span>
            </div>
            <Badge variant={booking.available ? "default" : "secondary"}>
              {booking.available ? "Disponível" : "Indisponível"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Admissions */}
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
            {userRole === "professor" && (
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
            const status = getAdmissionStatus(admission)
            return (
              <Card key={admission.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{admission.title}</CardTitle>
                      {admission.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {admission.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info da Admission */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Duração: {admission.duration} min</span>
                    </div>
                    {admission.exams.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{admission.exams.length} prova(s)</span>
                      </div>
                    )}
                    {admission.record?.score != null && typeof admission.record.score === 'number' && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span>Nota: {admission.record.score.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Instruções */}
                  {admission.instructions && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs font-medium mb-1">Instruções:</p>
                      <p className="text-xs text-muted-foreground">{admission.instructions}</p>
                    </div>
                  )}

                  {/* Exams */}
                  {admission.exams.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Provas:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {admission.exams.map((exam) => (
                          <div
                            key={exam.id}
                            className="flex items-center gap-2 p-2 bg-muted/20 rounded border"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs">{exam.title}</span>
                            {exam.theme && (
                              <Badge variant="outline" className="text-xs">
                                {exam.theme.name}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ação do aluno */}
                  {userRole === "aluno" && !admission.record?.finishedAt && (
                    <Button
                      onClick={() => onIniciarAvaliacao?.(admission)}
                      className="w-full gap-1.5"
                      size="sm"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {admission.record ? "Continuar Avaliação" : "Iniciar Avaliação"}
                    </Button>
                  )}

                  {/* Resultado do aluno */}
                  {userRole === "aluno" && admission.record?.finishedAt && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Avaliação concluída
                          </span>
                        </div>
                        {admission.record.score != null && typeof admission.record.score === 'number' && (
                          <span className="text-sm font-bold text-green-800 dark:text-green-200">
                            Nota: {admission.record.score.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {admission.record.totalTime && (
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Tempo total: {Math.floor(admission.record.totalTime / 60)} min{" "}
                          {admission.record.totalTime % 60} seg
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de criar admission */}
      <CriarAdmissionDialog
        open={showCriarAdmission}
        onOpenChange={setShowCriarAdmission}
        bookingId={booking.id}
        bookingTitle={booking.title}
        onSuccess={carregarAdmissions}
      />
    </div>
  )
}
