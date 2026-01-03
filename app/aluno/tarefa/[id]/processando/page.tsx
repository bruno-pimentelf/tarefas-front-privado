"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getAdmissionsByBookingAndUser, Admission } from "@/lib/api/admissions"
import { getStudentBookings, Booking } from "@/lib/api/bookings"
import { finishRecord } from "@/lib/api/records"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ProcessandoTarefaPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tarefaId = params.id as string

  const [admission, setAdmission] = useState<Admission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    const processarAvaliacao = async () => {
      try {
        setLoading(true)
        // Buscar booking
        const bookingsResponse = await getStudentBookings(currentUser.uid, 1, 100)
        const foundBooking = bookingsResponse.items?.find((b) => b.id.toString() === tarefaId)
        
        if (!foundBooking) {
          setError("Tarefa não encontrada")
          return
        }

        // Buscar admissions
        const admissionsResponse = await getAdmissionsByBookingAndUser(foundBooking.id, currentUser.uid)
        const admissionAtiva = admissionsResponse.find(a => !a.record?.finishedAt) || admissionsResponse[0]
        
        if (!admissionAtiva || !admissionAtiva.record) {
          setError("Nenhuma avaliação em andamento encontrada")
          return
        }

        setAdmission(admissionAtiva)

        // Aguardar um pouco para mostrar o processamento
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Finalizar o record
        await finishRecord({ recordId: admissionAtiva.record.id })
        
        // Redirecionar para resultados
        router.push(`/aluno/tarefa/${tarefaId}/resultados`)
      } catch (err: any) {
        console.error("Erro ao processar avaliação:", err)
        setError(err?.message || "Erro ao processar avaliação")
      } finally {
        setLoading(false)
      }
    }

    processarAvaliacao()
  }, [currentUser, router, tarefaId])

  if (!currentUser) {
    return null
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push(`/aluno/tarefa/${tarefaId}`)} variant="outline">
          Voltar para tarefa
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Finalizando avaliação...</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Aguarde enquanto processamos suas respostas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

