"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle } from "lucide-react"
import { getTeacherClasses, getStudentBookings, type TeacherClass } from "@/lib/api/bookings"
import {
  getItemAnalysis,
  getClassComponentReport,
  getComponentStats,
  getStudentScores,
  getScoreDistribution,
  getComponentRangeDistribution,
  type ItemAnalysisResponse,
  type ClassComponentReportResponse,
  type ComponentStatsResponse,
  type StudentScoresResponse,
  type ScoreDistributionResponse,
  type ComponentRangeDistributionResponse,
} from "@/lib/api/analytics"
import { getAdmissionsByBookingAndUser, type Admission } from "@/lib/api/admissions"
import { ItemAnalysisTable } from "@/components/analytics/item-analysis-table"
import { ClassComponentReportTable } from "@/components/analytics/class-component-report-table"
import { ComponentStatsCards } from "@/components/analytics/component-stats-cards"
import { StudentScoresTable } from "@/components/analytics/student-scores-table"
import { ScoreDistributionChart } from "@/components/analytics/score-distribution-chart"
import { ComponentRangeDistributionChart } from "@/components/analytics/component-range-distribution-chart"
import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { FaSignOutAlt, FaArrowLeft } from "react-icons/fa"
import { Trophy, BarChart3, ClipboardList, User, UserCircle } from "lucide-react"

export default function TarefaAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const { currentUser, logout } = useAuth()
  const classId = params?.classId ? parseInt(params.classId as string) : null
  const admissionId = params?.admissionId ? parseInt(params.admissionId as string) : null
  
  const [activeTab, setActiveTab] = useState("item-analysis")
  const [availableClasses, setAvailableClasses] = useState<TeacherClass[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [admissionTitle, setAdmissionTitle] = useState<string>("Relatórios e Estatísticas")

  // Estados de loading para cada endpoint
  const [loadingStates, setLoadingStates] = useState({
    itemAnalysis: false,
    classReport: false,
    componentStats: false,
    studentScores: false,
    scoreDistribution: false,
    rangeDistribution: false,
  })

  // Estados de erro para cada endpoint
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({
    itemAnalysis: null,
    classReport: null,
    componentStats: null,
    studentScores: null,
    scoreDistribution: null,
    rangeDistribution: null,
  })

  // Estados para cada tipo de resposta
  const [itemAnalysis, setItemAnalysis] = useState<ItemAnalysisResponse | null>(null)
  const [classReport, setClassReport] = useState<ClassComponentReportResponse | null>(null)
  const [componentStats, setComponentStats] = useState<ComponentStatsResponse | null>(null)
  const [studentScores, setStudentScores] = useState<StudentScoresResponse | null>(null)
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistributionResponse | null>(null)
  const [rangeDistribution, setRangeDistribution] = useState<ComponentRangeDistributionResponse | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
    }
  }, [currentUser, router])

  // Buscar o título da admission
  useEffect(() => {
    const carregarTituloAdmission = async () => {
      if (!currentUser || !admissionId) return

      try {
        // Buscar todos os bookings do professor
        const bookingsResponse = await getStudentBookings(currentUser.uid, 1, 100)
        const allBookings = bookingsResponse.items || []

        // Buscar admissions de cada booking até encontrar a admission desejada
        for (const booking of allBookings) {
          try {
            const admissions = await getAdmissionsByBookingAndUser(booking.id, currentUser.uid, { useCache: true })
            const foundAdmission = admissions.find((a) => a.id === admissionId)
            if (foundAdmission) {
              setAdmissionTitle(foundAdmission.title)
              return
            }
          } catch (err) {
            console.error(`Erro ao buscar admissions do booking ${booking.id}:`, err)
          }
        }
      } catch (err) {
        console.error("Erro ao carregar título da admission:", err)
      }
    }

    carregarTituloAdmission()
  }, [currentUser, admissionId])

  // Função para verificar se uma tab tem dados carregados
  const hasDataForTab = (tabName: string): boolean => {
    switch (tabName) {
      case "item-analysis":
        return !!itemAnalysis
      case "component-stats":
        return !!componentStats
      case "class-report":
        return !!classReport && classReport.data.length > 0
      case "student-scores":
        return !!studentScores && studentScores.students.length > 0
      case "score-distribution":
        return !!scoreDistribution
      case "range-distribution":
        return !!rangeDistribution && rangeDistribution.components.length > 0
      default:
        return false
    }
  }

  // Carregar dados automaticamente quando a tab mudar
  useEffect(() => {
    if (!admissionId || !classId) {
      return
    }

    // Carregar dados da tab ativa automaticamente
    const endpointMap: Record<string, string> = {
      "item-analysis": "item-analysis",
      "component-stats": "component-stats",
      "class-report": "class-report",
      "student-scores": "student-scores",
      "score-distribution": "score-distribution",
      "range-distribution": "range-distribution",
    }

    const endpointName = endpointMap[activeTab]
    if (endpointName && !hasDataForTab(endpointName)) {
      testarEndpoint(endpointName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, admissionId, classId])

  // Carregar turmas disponíveis
  useEffect(() => {
    const carregarTurmas = async () => {
      if (!currentUser) return

      setLoadingOptions(true)
      try {
        const classes = await getTeacherClasses(currentUser.uid).catch(() => [])
        setAvailableClasses(classes)
      } catch (err) {
        console.error("Erro ao carregar turmas:", err)
      } finally {
        setLoadingOptions(false)
      }
    }

    carregarTurmas()
  }, [currentUser])

  const testarEndpoint = async (endpointName: string) => {
    if (!admissionId || !classId) {
      setErrorStates((prev) => ({
        ...prev,
        [endpointName]: "ID da admission ou turma inválido",
      }))
      return
    }

    const apiFilters = {
      classIds: [classId],
    }

    setLoadingStates((prev) => ({ ...prev, [endpointName]: true }))
    setErrorStates((prev) => ({ ...prev, [endpointName]: null }))

    try {
      let result: any

      switch (endpointName) {
        case "item-analysis":
          result = await getItemAnalysis(admissionId, apiFilters)
          setItemAnalysis(result)
          break
        case "class-report":
          result = await getClassComponentReport(admissionId, apiFilters)
          setClassReport(result)
          break
        case "component-stats":
          result = await getComponentStats(admissionId, apiFilters)
          setComponentStats(result)
          break
        case "student-scores":
          result = await getStudentScores(admissionId, apiFilters)
          setStudentScores(result)
          break
        case "score-distribution":
          result = await getScoreDistribution(admissionId, apiFilters)
          setScoreDistribution(result)
          break
        case "range-distribution":
          result = await getComponentRangeDistribution(admissionId, apiFilters)
          setRangeDistribution(result)
          break
      }
    } catch (err: any) {
      console.error(`Erro ao testar ${endpointName}:`, err)
      setErrorStates((prev) => ({
        ...prev,
        [endpointName]: err?.message || `Erro ao carregar ${endpointName}`,
      }))
    } finally {
      setLoadingStates((prev) => ({ ...prev, [endpointName]: false }))
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const handleVoltar = () => {
    if (classId) {
      router.push(`/professor/analytics/turma/${classId}`)
    } else {
      router.push("/professor/analytics")
    }
  }

  if (!currentUser || !admissionId || !classId) {
    return null
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
      
      {/* Tabs wrapper que envolve header e main */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
          <div className="mx-auto px-4 max-w-7xl w-full">
            <div className="flex items-center justify-between gap-3 w-full h-12">
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
                <h2 className="text-base font-semibold">{admissionTitle}</h2>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-2 h-9 hover:bg-accent/10 transition-all duration-200">
                  <FaSignOutAlt className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">Sair</span>
                </Button>
              </div>
            </div>
            {/* Tabs no header */}
            <TabsList 
              variant="line" 
              className="w-full h-auto bg-transparent p-0 border-t"
            >
              <TabsTrigger 
                value="item-analysis"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-sm"
              >
                Análise do item
              </TabsTrigger>
              <TabsTrigger 
                value="component-stats"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-sm"
              >
                Estatística do item
              </TabsTrigger>
              <TabsTrigger 
                value="class-report"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-sm"
              >
                Relatório de turma
              </TabsTrigger>
              <TabsTrigger 
                value="student-scores"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-sm"
              >
                Notas
              </TabsTrigger>
              <TabsTrigger 
                value="score-distribution"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-sm"
              >
                Distribuição de notas
              </TabsTrigger>
              <TabsTrigger 
                value="range-distribution"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-sm"
              >
                Faixa média
              </TabsTrigger>
            </TabsList>
          </div>
        </header>

        <main className="ml-16 relative pt-28">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Tab: Análise do item */}
            <TabsContent value="item-analysis" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {loadingStates.itemAnalysis && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {errorStates.itemAnalysis && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.itemAnalysis}</span>
                      </div>
                    </div>
                  )}
                  
                  {!loadingStates.itemAnalysis && itemAnalysis ? (
                    <ItemAnalysisTable
                      data={itemAnalysis}
                      admissionId={admissionId}
                      classIds={[classId]}
                    />
                  ) : !loadingStates.itemAnalysis && !errorStates.itemAnalysis ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Carregando análise de itens...
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Estatísticas por Componente */}
            <TabsContent value="component-stats" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {loadingStates.componentStats && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {errorStates.componentStats && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.componentStats}</span>
                      </div>
                    </div>
                  )}
                  
                  {!loadingStates.componentStats && componentStats ? (
                    <ComponentStatsCards
                      data={componentStats}
                      admissionId={admissionId}
                      availableClasses={availableClasses}
                    />
                  ) : !loadingStates.componentStats && !errorStates.componentStats ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Carregando estatísticas...
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Relatório Consolidado por Turma */}
            <TabsContent value="class-report" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {loadingStates.classReport && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {errorStates.classReport && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.classReport}</span>
                      </div>
                    </div>
                  )}
                  
                  {!loadingStates.classReport && classReport && classReport.data.length > 0 ? (
                    <ClassComponentReportTable
                      data={classReport}
                      admissionId={admissionId}
                      availableClasses={availableClasses}
                    />
                  ) : !loadingStates.classReport && !errorStates.classReport ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Carregando relatório...
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Notas por Estudante */}
            <TabsContent value="student-scores" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {loadingStates.studentScores && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {errorStates.studentScores && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.studentScores}</span>
                      </div>
                    </div>
                  )}
                  
                  {!loadingStates.studentScores && studentScores && studentScores.students.length > 0 ? (
                    <StudentScoresTable
                      data={studentScores}
                      admissionId={admissionId}
                      availableClasses={availableClasses}
                    />
                  ) : !loadingStates.studentScores && !errorStates.studentScores ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Carregando notas...
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Distribuição de Notas */}
            <TabsContent value="score-distribution" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {loadingStates.scoreDistribution && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {errorStates.scoreDistribution && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.scoreDistribution}</span>
                      </div>
                    </div>
                  )}
                  
                  {!loadingStates.scoreDistribution && scoreDistribution ? (
                    <ScoreDistributionChart
                      data={scoreDistribution}
                      admissionId={admissionId}
                      availableClasses={availableClasses}
                    />
                  ) : !loadingStates.scoreDistribution && !errorStates.scoreDistribution ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Carregando distribuição de notas...
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Distribuição por Faixa de Média */}
            <TabsContent value="range-distribution" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {loadingStates.rangeDistribution && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {errorStates.rangeDistribution && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.rangeDistribution}</span>
                      </div>
                    </div>
                  )}
                  
                  {!loadingStates.rangeDistribution && rangeDistribution && rangeDistribution.components.length > 0 ? (
                    <ComponentRangeDistributionChart
                      data={rangeDistribution}
                      admissionId={admissionId}
                      availableClasses={availableClasses}
                    />
                  ) : !loadingStates.rangeDistribution && !errorStates.rangeDistribution ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Carregando distribuição por faixa...
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </main>
      </Tabs>
    </div>
  )
}
