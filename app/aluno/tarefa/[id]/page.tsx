"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { BookingDetalhes } from "@/components/booking-detalhes"
import { getStudentBookings, Booking } from "@/lib/api/bookings"
import { Loader2 } from "lucide-react"

export default function TarefaAlunoPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tarefaId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ID do aluno (mock para testes)
  const studentId = "student-001"

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    const carregarBooking = async () => {
      try {
        setLoading(true)
        // Buscar todos os bookings e encontrar o específico
        const response = await getStudentBookings(studentId, 1, 100)
        const foundBooking = response.items?.find((b) => b.id.toString() === tarefaId)
        
        if (foundBooking) {
          setBooking(foundBooking)
        } else {
          setError("Tarefa não encontrada")
        }
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar tarefa")
      } finally {
        setLoading(false)
      }
    }

    carregarBooking()
  }, [currentUser, router, tarefaId, studentId])

  const handleVoltar = () => {
    router.push("/aluno")
  }

  const handleIniciarAvaliacao = (admission: any) => {
    // TODO: Implementar lógica de iniciar avaliação se necessário
    console.log("Iniciar avaliação:", admission)
  }

  if (!currentUser) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">{error || "Tarefa não encontrada"}</p>
          <button
            onClick={handleVoltar}
            className="text-primary hover:underline"
          >
            Voltar para tarefas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      <BookingDetalhes
        booking={booking}
        userId={studentId}
        userRole="aluno"
        onVoltar={handleVoltar}
        onIniciarAvaliacao={handleIniciarAvaliacao}
      />
    </div>
  )
}

