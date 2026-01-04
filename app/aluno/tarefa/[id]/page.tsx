"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { BookingDetalhes } from "@/components/booking-detalhes"
import { getStudentBookings, Booking } from "@/lib/api/bookings"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FaSpinner, FaArrowLeft, FaSignOutAlt, FaClock, FaCalendar } from "react-icons/fa"
import { formatBookingDate } from "@/lib/api/utils"

export default function TarefaAlunoPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tarefaId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    const carregarBooking = async () => {
      try {
        setLoading(true)
        // Buscar todos os bookings e encontrar o específico
        const response = await getStudentBookings(currentUser.uid, 1, 100)
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
  }, [currentUser, router, tarefaId])

  const handleVoltar = () => {
    router.push("/aluno")
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const handleIniciarAvaliacao = (admission: any) => {
    // TODO: Implementar lógica de iniciar avaliação se necessário
    console.log("Iniciar avaliação:", admission)
  }

  // Função para obter badge de status
  const getStatusBadge = (booking: Booking) => {
    if (booking.status === "finished") {
      return <Badge variant="secondary" className="text-xs">Finalizada</Badge>
    }
    if (booking.status === "in_progress") {
      return <Badge variant="default" className="text-xs">Em andamento</Badge>
    }
    return <Badge variant="outline" className="text-xs">Agendada</Badge>
  }

  if (!currentUser) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex h-12 items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={handleVoltar} size="sm" className="gap-1.5 h-8">
                  <FaArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8">
                  <FaSignOutAlt className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="ml-16 pt-16">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex h-12 items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={handleVoltar} size="sm" className="gap-1.5 h-8">
                  <FaArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8">
                  <FaSignOutAlt className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="ml-16 pt-16">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-muted-foreground">{error || "Tarefa não encontrada"}</p>
              <Button onClick={handleVoltar} variant="outline" size="sm">
                Voltar para tarefas
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-12 items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button 
                variant="ghost" 
                onClick={handleVoltar} 
                size="sm" 
                className="gap-1.5 h-8 shrink-0 hover:bg-accent/10 transition-all duration-200 hover:scale-105"
              >
                <FaArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Voltar
              </Button>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="opacity-0 animate-[fadeIn_0.5s_ease-out_0.1s_forwards]">
                  {getStatusBadge(booking)}
                </div>
                {booking.startTime && (
                  <div className="hidden md:flex items-center gap-1.5 text-xs text-foreground/70 shrink-0 opacity-0 animate-[fadeIn_0.6s_ease-out_0.2s_forwards]">
                    <FaCalendar className="h-3.5 w-3.5" />
                    <span>{formatBookingDate(booking.startTime)}</span>
                  </div>
                )}
                {booking.endTime && (
                  <div className="hidden lg:flex items-center gap-1.5 text-xs text-foreground/70 shrink-0 opacity-0 animate-[fadeIn_0.7s_ease-out_0.3s_forwards]">
                    <FaClock className="h-3.5 w-3.5" />
                    <span>Até {formatBookingDate(booking.endTime)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200">
                <FaSignOutAlt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="ml-16 relative pt-16">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <BookingDetalhes
            booking={booking}
            userId={currentUser.uid}
            userRole="aluno"
            onVoltar={handleVoltar}
            onIniciarAvaliacao={handleIniciarAvaliacao}
            hideHeader={true}
          />
        </div>
      </main>
    </div>
  )
}

