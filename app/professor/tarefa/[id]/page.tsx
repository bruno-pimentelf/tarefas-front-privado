"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { BookingDetalhes } from "@/components/booking-detalhes"
import { getStudentBookings, Booking } from "@/lib/api/bookings"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"
import { FaSignOutAlt, FaArrowLeft } from "react-icons/fa"
import { Trophy, BarChart3, ClipboardList, User, UserCircle } from "lucide-react"

export default function TarefaProfessorPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tarefaId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const refreshRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    const carregarBooking = async () => {
      try {
        setLoading(true)
        // TODO: Quando houver endpoint específico para professor, usar aqui
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
    router.push("/professor/tarefas")
  }

  const handleRefresh = async () => {
    if (refreshRef.current) {
      setRefreshing(true)
      try {
        await refreshRef.current()
      } finally {
        setRefreshing(false)
      }
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const sidebarItems = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Dados",
      onClick: () => router.push("/professor/dados"),
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Tarefas",
      onClick: () => router.push("/professor/tarefas"),
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Relatórios",
      onClick: () => router.push("/professor/analytics"),
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: "Níveis",
      onClick: () => router.push("/professor"),
    },
    {
      icon: <UserCircle className="h-5 w-5" />,
      label: "Trocar Perfil",
      onClick: () => router.push("/perfil"),
    },
  ]

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

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{error || "Tarefa não encontrada"}</p>
        <button
          onClick={handleVoltar}
          className="text-primary hover:underline"
        >
          Voltar para tarefas
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      
      <Sidebar items={sidebarItems} />
      
      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto px-4 max-w-7xl w-full h-12 flex items-center">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleVoltar}
                size="sm"
                className="gap-2 h-9 hover:bg-accent/10 transition-all duration-200"
              >
                <FaArrowLeft className="h-4 w-4" />
                <span className="text-sm">Voltar</span>
              </Button>
              {booking && (
                <div>
                  <h2 className="text-base font-semibold">{booking.title}</h2>
                  {booking.description && (
                    <p className="text-xs text-muted-foreground">{booking.description}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8 p-0 hover:bg-accent/10 transition-all duration-200"
                title="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-2 h-9 hover:bg-accent/10 transition-all duration-200">
                <FaSignOutAlt className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-16 relative pt-16">
        <BookingDetalhes
          booking={booking}
          userId={currentUser.uid}
          userRole="professor"
          onVoltar={handleVoltar}
          hideHeader={true}
          onRefreshRef={refreshRef}
        />
      </main>
    </div>
  )
}

