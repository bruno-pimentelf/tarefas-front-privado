"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { RealizarAvaliacao } from "@/components/realizar-avaliacao"
import { getAdmissionsByBookingAndUser, Admission } from "@/lib/api/admissions"
import { getStudentBookings, Booking } from "@/lib/api/bookings"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function ResponderTarefaPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tarefaId = params.id as string

  const [admission, setAdmission] = useState<Admission | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    const carregarDados = async () => {
      try {
        setLoading(true)
        // Buscar booking
        const bookingsResponse = await getStudentBookings(currentUser.uid, 1, 100)
        const foundBooking = bookingsResponse.items?.find((b) => b.id.toString() === tarefaId)
        
        if (!foundBooking) {
          setError("Tarefa não encontrada")
          return
        }

        setBooking(foundBooking)

        // Buscar admissions
        const admissionsResponse = await getAdmissionsByBookingAndUser(foundBooking.id, currentUser.uid)
        
        if (admissionsResponse.length === 0) {
          setError("Nenhuma avaliação encontrada para esta tarefa")
          return
        }

        // Pegar a primeira admission que não está finalizada, ou a primeira disponível
        const admissionAtiva = admissionsResponse.find(a => !a.record?.finishedAt) || admissionsResponse[0]
        
        if (!admissionAtiva) {
          setError("Nenhuma avaliação disponível")
          return
        }

        setAdmission(admissionAtiva)
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar dados")
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [currentUser, router, tarefaId])

  const handleVoltar = () => {
    router.push(`/aluno/tarefa/${tarefaId}`)
  }

  const handleConcluir = () => {
    router.push(`/aluno/tarefa/${tarefaId}/resultados`)
  }

  const handleFinalizar = () => {
    router.push(`/aluno/tarefa/${tarefaId}/processando`)
  }

  if (!currentUser) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !admission) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-4">
        <p className="text-muted-foreground">{error || "Erro ao carregar avaliação"}</p>
        <Button onClick={() => router.push(`/aluno/tarefa/${tarefaId}`)} variant="outline" size="sm" className="h-8">
          Voltar para tarefa
        </Button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <RealizarAvaliacao
        admission={admission}
        userId={currentUser.uid}
        onVoltar={handleVoltar}
        onConcluir={handleConcluir}
        onFinalizar={handleFinalizar}
      />
    </div>
  )
}

