"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getAdmissionsByBookingAndUser, Admission } from "@/lib/api/admissions"
import { getStudentBookings, Booking } from "@/lib/api/bookings"
import { Record } from "@/lib/api/records"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function ResultadosTarefaPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tarefaId = params.id as string

  const [admission, setAdmission] = useState<Admission | null>(null)
  const [record, setRecord] = useState<Record | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ID do aluno (mock para testes)
  const studentId = "student-001"

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    const carregarResultados = async () => {
      try {
        setLoading(true)
        // Buscar booking
        const bookingsResponse = await getStudentBookings(studentId, 1, 100)
        const foundBooking = bookingsResponse.items?.find((b) => b.id.toString() === tarefaId)
        
        if (!foundBooking) {
          setError("Tarefa não encontrada")
          return
        }

        // Buscar admissions
        const admissionsResponse = await getAdmissionsByBookingAndUser(foundBooking.id, studentId)
        const admissionFinalizada = admissionsResponse.find(a => a.record?.finishedAt) || admissionsResponse[0]
        
        if (!admissionFinalizada || !admissionFinalizada.record) {
          setError("Nenhuma avaliação finalizada encontrada")
          return
        }

        setAdmission(admissionFinalizada)
        setRecord(admissionFinalizada.record)
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar resultados")
      } finally {
        setLoading(false)
      }
    }

    carregarResultados()
  }, [currentUser, router, tarefaId, studentId])

  const handleVoltar = () => {
    router.push(`/aluno/tarefa/${tarefaId}`)
  }

  if (!currentUser) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !admission || !record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{error || "Erro ao carregar resultados"}</p>
        <Button onClick={handleVoltar} variant="outline">
          Voltar para tarefa
        </Button>
      </div>
    )
  }


  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Avaliação Concluída!
          </CardTitle>
          <CardDescription>{admission.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Pontuação</p>
              <p className="text-2xl font-bold text-primary">
                {record.score !== null ? `${(record.score * 100).toFixed(0)}%` : "Processando..."}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Tempo Utilizado</p>
              <p className="text-2xl font-bold">
                {record.elapsedTime ? `${Math.floor(record.elapsedTime / 60)}:${String(record.elapsedTime % 60).padStart(2, '0')}` : "N/A"}
              </p>
            </div>
          </div>
          <Button onClick={handleVoltar} variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Tarefa
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

