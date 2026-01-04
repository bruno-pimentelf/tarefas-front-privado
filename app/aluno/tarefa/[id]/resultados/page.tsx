"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getAdmissionsByBookingAndUser, Admission } from "@/lib/api/admissions"
import { getStudentBookings, Booking } from "@/lib/api/bookings"
import { Record } from "@/lib/api/records"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { FaCheckCircle, FaArrowLeft, FaSignOutAlt, FaSpinner, FaTrophy } from "react-icons/fa"

export default function ResultadosTarefaPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tarefaId = params.id as string

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const [admission, setAdmission] = useState<Admission | null>(null)
  const [record, setRecord] = useState<Record | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    const carregarResultados = async () => {
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
  }, [currentUser, router, tarefaId])

  const handleVoltar = () => {
    router.push(`/aluno/tarefa/${tarefaId}`)
  }

  if (!currentUser) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex h-14 items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button 
                  variant="ghost" 
                  onClick={handleVoltar} 
                  size="sm" 
                  className="gap-1.5 h-8 shrink-0 hover:bg-accent/10 transition-all duration-200"
                >
                  <FaArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </Button>
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
        <main className="ml-16 pt-14">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <FaSpinner className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !admission || !record) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex h-14 items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button 
                  variant="ghost" 
                  onClick={handleVoltar} 
                  size="sm" 
                  className="gap-1.5 h-8 shrink-0 hover:bg-accent/10 transition-all duration-200"
                >
                  <FaArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </Button>
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
        <main className="ml-16 pt-14">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4">
            <p className="text-muted-foreground">{error || "Erro ao carregar resultados"}</p>
            <Button onClick={handleVoltar} variant="outline">
              Voltar para tarefa
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const formatarTempoEmMinutos = (segundos: number | null) => {
    if (segundos === null || segundos === undefined) return "N/A"
    
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    
    if (minutos === 0) {
      return `${segs}s`
    } else if (segs === 0) {
      return `${minutos} min`
    } else {
      return `${minutos} min ${segs}s`
    }
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
      
      <header className="sticky top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button 
                variant="ghost" 
                onClick={handleVoltar} 
                size="sm" 
                className="gap-1.5 h-8 shrink-0 hover:bg-accent/10 transition-all duration-200"
              >
                <FaArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </Button>
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
      <main className="ml-16 relative pt-14">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Card className="relative overflow-hidden border-2 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <FaTrophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                  Avaliação Concluída!
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-foreground/60 mt-1">{admission.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 text-center group/item hover:scale-105 transition-transform duration-300">
                  <p className="text-xs text-foreground/60 mb-1 font-medium">Pontuação</p>
                  <p className="text-2xl font-bold text-primary">
                    {record.score !== null ? `${(record.score * 100).toFixed(0)}%` : "Processando..."}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 text-center group/item hover:scale-105 transition-transform duration-300">
                  <p className="text-xs text-foreground/60 mb-1 font-medium">Tempo Utilizado</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatarTempoEmMinutos(record.elapsedTimeInSeconds ?? record.elapsedTime)}
                  </p>
                </div>
              </div>
              <Button onClick={handleVoltar} variant="outline" className="w-full h-9 gap-1.5">
                <FaArrowLeft className="h-3.5 w-3.5" />
                Voltar para Tarefa
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

