"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"
import { FaSpinner, FaExclamationCircle, FaArrowLeft, FaSignOutAlt } from "react-icons/fa"
import { Trophy, BarChart3, BookOpen, FileText, User } from "lucide-react"
import { getStudentBookings, getTeacherClasses, type Booking, type TeacherClass } from "@/lib/api/bookings"
import { getAdmissionsByBookingAndUser, type Admission } from "@/lib/api/admissions"
import { getItemAnalysis, type ItemAnalysisResponse } from "@/lib/api/analytics"
import { ItemAnalysisTable } from "@/components/analytics/item-analysis-table"
import { PerfilDialog } from "@/components/perfil-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ItemAnalysisPage() {
  const router = useRouter()
  const { currentUser, logout } = useAuth()
  const [showPerfil, setShowPerfil] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemAnalysis, setItemAnalysis] = useState<ItemAnalysisResponse | null>(null)

  // Estados para filtros
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<number | null>(null)
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([])

  // Estados para opções de filtros
  const [bookings, setBookings] = useState<Booking[]>([])
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [availableClasses, setAvailableClasses] = useState<TeacherClass[]>([])

  // Carregar bookings e turmas disponíveis
  useEffect(() => {
    const carregarDados = async () => {
      if (!currentUser) return

      try {
        setLoading(true)
        const [bookingsResponse, classes] = await Promise.all([
          getStudentBookings(currentUser.uid, 1, 100),
          getTeacherClasses(currentUser.uid).catch(() => []),
        ])

        setBookings(bookingsResponse.items || [])
        setAvailableClasses(classes)

        // Buscar admissions para cada booking individualmente (sem otimização - múltiplas chamadas)
        const allAdmissions: Admission[] = []
        for (const booking of bookingsResponse.items || []) {
          try {
            const admissions = await getAdmissionsByBookingAndUser(booking.id, currentUser.uid)
            allAdmissions.push(...admissions)
          } catch (err) {
            console.error(`Erro ao buscar admissions do booking ${booking.id}:`, err)
          }
        }
        setAdmissions(allAdmissions.filter((a) => a.record?.finishedAt)) // Apenas finalizadas
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar dados")
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [currentUser])

  // Carregar análise de itens quando filtros mudarem
  useEffect(() => {
    const carregarItemAnalysis = async () => {
      if (!selectedAdmissionId) {
        setItemAnalysis(null)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const filters = {
          classIds: selectedClassIds.length > 0 ? selectedClassIds : undefined,
        }

        const data = await getItemAnalysis(selectedAdmissionId, filters)
        setItemAnalysis(data)
      } catch (err: any) {
        console.error("Erro ao carregar análise de itens:", err)
        setError(err?.message || "Erro ao carregar análise de itens")
        setItemAnalysis(null)
      } finally {
        setLoading(false)
      }
    }

    carregarItemAnalysis()
  }, [selectedAdmissionId, selectedClassIds])

  const handleToggleClass = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    )
  }

  if (!currentUser) {
    return null
  }

  const sidebarItems = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Estatísticas",
      onClick: () => router.push("/professor"),
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: "Níveis",
      onClick: () => router.push("/professor"),
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Tarefas",
      onClick: () => router.push("/professor/tarefas"),
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Relatórios",
      onClick: () => router.push("/professor/analytics"),
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Trocar Perfil",
      onClick: () => router.push("/perfil"),
    },
  ]

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
      
      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-12 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()} 
                className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200"
              >
                <FaArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </Button>
              <h1 className="text-base font-semibold">Análise de Itens</h1>
            </div>
            <div className="flex items-center gap-1">
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
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="mb-6">
            <p className="text-sm text-foreground/60 mt-1">
              Análise detalhada de itens (questões) por estudante, mostrando taxa de acerto por questão
            </p>
          </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro de Avaliação (Admission) */}
            <div>
              <Label htmlFor="admission">Avaliação (Admission)</Label>
              <Select
                value={selectedAdmissionId?.toString() || ""}
                onValueChange={(value) =>
                  setSelectedAdmissionId(value ? parseInt(value) : null)
                }
              >
                <SelectTrigger id="admission">
                  <SelectValue placeholder="Selecione uma avaliação" />
                </SelectTrigger>
                <SelectContent>
                  {admissions.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhuma avaliação finalizada disponível
                    </SelectItem>
                  ) : (
                    admissions.map((admission) => {
                      const booking = bookings.find((b) => b.id === admission.bookingId)
                      return (
                        <SelectItem key={admission.id} value={admission.id.toString()}>
                          {booking?.title || `Avaliação ${admission.id}`} - ID: {admission.id}
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Turmas */}
            <div>
              <Label>Turmas</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2 mt-2">
                {availableClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma turma disponível</p>
                ) : (
                  availableClasses.map((classItem) => (
                    <div key={classItem.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`class-${classItem.id}`}
                        checked={selectedClassIds.includes(classItem.id)}
                        onChange={() => handleToggleClass(classItem.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`class-${classItem.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {classItem.name} ({classItem.grade})
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Erro */}
          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-destructive">
                  <FaExclamationCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado */}
          {loading && !itemAnalysis ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FaSpinner className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando análise de itens...</p>
              </CardContent>
            </Card>
          ) : itemAnalysis && selectedAdmissionId ? (
            <ItemAnalysisTable
              data={itemAnalysis}
              admissionId={selectedAdmissionId}
              classIds={selectedClassIds.length > 0 ? selectedClassIds : undefined}
              availableClasses={availableClasses}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Selecione uma avaliação para visualizar a análise de itens
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <PerfilDialog
        open={showPerfil}
        onOpenChange={setShowPerfil}
      />
    </div>
  )
}
