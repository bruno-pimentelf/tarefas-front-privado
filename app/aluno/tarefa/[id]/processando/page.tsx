"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getAdmissionsByBookingAndUser, Admission } from "@/lib/api/admissions"
import { getStudentBookings, Booking } from "@/lib/api/bookings"
import { finishRecord } from "@/lib/api/records"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { FaSpinner, FaArrowLeft, FaSignOutAlt } from "react-icons/fa"

export default function ProcessandoTarefaPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tarefaId = params.id as string

  const handleVoltar = () => {
    router.push(`/aluno/tarefa/${tarefaId}`)
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

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
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleVoltar} variant="outline">
              Voltar para tarefa
            </Button>
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
      <main className="ml-16 relative">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Card className="relative overflow-hidden border-2 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="py-12 relative">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <FaSpinner className="h-12 w-12 animate-spin text-primary relative" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Finalizando avaliação...</h3>
                  <p className="text-sm text-foreground/60 mt-1">
                    Aguarde enquanto processamos suas respostas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

