"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ClipboardList, GraduationCap, School, AlertCircle, Search } from "lucide-react"
import { getTeacherClasses, getStudentBookings, type TeacherClass } from "@/lib/api/bookings"
import { getAdmissionsByBookingAndUser, type Admission } from "@/lib/api/admissions"
import { getItemAnalysis } from "@/lib/api/analytics"
import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { FaSignOutAlt, FaArrowLeft } from "react-icons/fa"
import { Trophy, BarChart3, User, UserCircle, ClipboardList as ClipboardListIcon } from "lucide-react"

interface AdmissionWithBooking extends Admission {
  bookingTitle: string
  bookingId: number
}

export default function TurmaAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const { currentUser, logout } = useAuth()
  const classId = params?.classId ? parseInt(params.classId as string) : null
  
  const [loading, setLoading] = useState(true)
  const [turma, setTurma] = useState<TeacherClass | null>(null)
  const [admissions, setAdmissions] = useState<AdmissionWithBooking[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }

    if (!classId || isNaN(classId)) {
      setError("ID da turma inválido")
      setLoading(false)
      return
    }

    const carregarDados = async () => {
      setLoading(true)
      setError(null)

      try {
        // 1. Buscar a turma específica
        const classes = await getTeacherClasses(currentUser.uid).catch(() => [])
        const foundTurma = classes.find((c) => c.id === classId)
        
        if (!foundTurma) {
          setError("Turma não encontrada")
          setLoading(false)
          return
        }

        setTurma(foundTurma)

        // 2. Buscar todos os bookings do professor
        const bookingsResponse = await getStudentBookings(currentUser.uid, 1, 100)
        const allBookings = bookingsResponse.items || []

        // 3. Filtrar bookings que contêm esta classId
        // Nota: Como a API não retorna classIds diretamente nos bookings,
        // vamos buscar admissions de todos os bookings e filtrar depois
        // ou assumir que todos os bookings do professor podem ter esta turma
        
        // 4. Buscar admissions de cada booking em paralelo (otimização) - incluir todas (ativas e finalizadas)
        const allAdmissions: AdmissionWithBooking[] = []
        
        // Buscar todas as admissions em paralelo para otimizar
        const admissionsPromises = allBookings.map(async (booking) => {
          try {
            const bookingAdmissions = await getAdmissionsByBookingAndUser(booking.id, currentUser.uid, { useCache: true })
            
            // Incluir todas as admissions (ativas e finalizadas)
            return bookingAdmissions.map((a) => ({
              ...a,
              bookingTitle: booking.title,
              bookingId: booking.id,
            }))
          } catch (err) {
            console.error(`Erro ao buscar admissions do booking ${booking.id}:`, err)
            return []
          }
        })
        
        const admissionsResults = await Promise.all(admissionsPromises)
        allAdmissions.push(...admissionsResults.flat())

        // 5. Filtrar admissions que pertencem à turma específica (classId)
        // Verificamos se a admission tem dados de analytics para esta turma
        const filteredAdmissions: AdmissionWithBooking[] = []
        
        // Verificar cada admission em paralelo para otimizar
        const validationPromises = allAdmissions.map(async (admission) => {
          try {
            // Tentar buscar dados de analytics para esta turma
            // Se retornar dados (não 404), significa que a admission pertence à turma
            await getItemAnalysis(admission.id, { classIds: [classId] })
            return admission
          } catch (err: any) {
            // Se retornar 404, a admission não pertence a esta turma
            if (err?.status === 404) {
              return null
            }
            // Para outros erros, ainda incluímos a admission (pode ser erro temporário)
            console.warn(`Erro ao validar admission ${admission.id} para turma ${classId}:`, err)
            return admission
          }
        })
        
        const validatedAdmissions = await Promise.all(validationPromises)
        filteredAdmissions.push(...validatedAdmissions.filter((a): a is AdmissionWithBooking => a !== null))

        // Ordenar: finalizadas primeiro (por data de finalização, mais recente primeiro), depois ativas (por data de criação, mais recente primeiro)
        filteredAdmissions.sort((a, b) => {
          const aFinished = a.record?.finishedAt
          const bFinished = b.record?.finishedAt
          
          // Se ambas são finalizadas, ordenar por data de finalização
          if (aFinished && bFinished) {
            return new Date(bFinished).getTime() - new Date(aFinished).getTime()
          }
          
          // Se apenas uma é finalizada, a finalizada vem primeiro
          if (aFinished && !bFinished) return -1
          if (!aFinished && bFinished) return 1
          
          // Se nenhuma é finalizada, ordenar por data de criação (mais recente primeiro)
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })

        setAdmissions(filteredAdmissions)
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err)
        setError(err?.message || "Erro ao carregar tarefas da turma")
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [currentUser, classId, router])

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const handleVoltar = () => {
    router.push("/professor/analytics")
  }

  // Filtrar admissions por título usando a busca
  const filteredAdmissions = useMemo(() => {
    if (!searchQuery.trim()) {
      return admissions
    }
    
    const query = searchQuery.toLowerCase().trim()
    return admissions.filter((admission) => {
      const titleMatch = admission.title?.toLowerCase().includes(query)
      const bookingTitleMatch = admission.bookingTitle?.toLowerCase().includes(query)
      return titleMatch || bookingTitleMatch
    })
  }, [admissions, searchQuery])

  if (!currentUser) {
    return null
  }

  const sidebarItems = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Dados",
      onClick: () => router.push("/professor/dados"),
    },
    {
      icon: <ClipboardListIcon className="h-5 w-5" />,
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
              <h2 className="text-base font-semibold">
                {turma ? `Tarefas - ${turma.name}` : "Tarefas da Turma"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
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
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="border-2 border-destructive shadow-lg">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleVoltar} variant="outline">
                  Voltar
                </Button>
              </CardContent>
            </Card>
          ) : !turma ? (
            <Card className="border-2 shadow-lg">
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Turma não encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  A turma selecionada não foi encontrada ou você não tem permissão para acessá-la.
                </p>
                <Button onClick={handleVoltar} variant="outline">
                  Voltar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Informações da Turma */}
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold">{turma.name}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <School className="h-4 w-4" />
                    <span>{turma.school?.name || "Escola não informada"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Tarefas */}
              <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Tarefas</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione uma tarefa para visualizar os relatórios e estatísticas
                </p>
                {/* Barra de busca */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar tarefa por título..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

                {filteredAdmissions.length === 0 ? (
                  <Card className="border-2 shadow-lg">
                    <CardContent className="p-12 text-center">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        {searchQuery ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa encontrada"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery 
                          ? `Não há tarefas que correspondam à busca "${searchQuery}" para esta turma.`
                          : "Não há tarefas disponíveis para esta turma no momento."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAdmissions.map((admission) => (
                      <Card
                        key={admission.id}
                        className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                        onClick={() => router.push(`/professor/analytics/turma/${classId}/tarefa/${admission.id}`)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <ClipboardList className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-base font-semibold line-clamp-2">{admission.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {admission.bookingTitle}
                              </p>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {admission.record?.finishedAt ? (
                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                Finalizada em: {new Date(admission.record.finishedAt).toLocaleDateString('pt-BR')}
                              </div>
                              {(() => {
                                const score = admission.record?.score
                                if (score === null || score === undefined) return null
                                const numScore = typeof score === 'number' ? score : Number(score)
                                if (isNaN(numScore)) return null
                                return (
                                  <div className="text-sm font-medium">
                                    Nota média: {numScore.toFixed(1)}
                                  </div>
                                )
                              })()}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Tarefa ativa
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
