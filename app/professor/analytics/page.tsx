"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle } from "lucide-react"
import { getTeacherClasses, type TeacherClass } from "@/lib/api/bookings"
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
import { ItemAnalysisTable } from "@/components/analytics/item-analysis-table"
import { ClassComponentReportTable } from "@/components/analytics/class-component-report-table"
import { ComponentStatsCards } from "@/components/analytics/component-stats-cards"
import { StudentScoresTable } from "@/components/analytics/student-scores-table"
import { ScoreDistributionChart } from "@/components/analytics/score-distribution-chart"
import { ComponentRangeDistributionChart } from "@/components/analytics/component-range-distribution-chart"
import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { PerfilDialog } from "@/components/perfil-dialog"
import { FaSignOutAlt, FaArrowLeft } from "react-icons/fa"
import { Trophy, BarChart3, BookOpen, FileText, User } from "lucide-react"

export default function AnalyticsPage() {
  const router = useRouter()
  const { currentUser, logout } = useAuth()
  const [showPerfil, setShowPerfil] = useState(false)
  const [activeTab, setActiveTab] = useState("item-analysis")

  // Estados para turmas disponíveis
  const [availableClasses, setAvailableClasses] = useState<TeacherClass[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Estados de filtros independentes para cada endpoint
  const [filters, setFilters] = useState<Record<string, { admissionId: string; classIds: string }>>({
    "item-analysis": { admissionId: "37", classIds: "1" },
    "component-stats": { admissionId: "37", classIds: "1" },
    "class-report": { admissionId: "37", classIds: "1" },
    "student-scores": { admissionId: "37", classIds: "1" },
    "score-distribution": { admissionId: "37", classIds: "1" },
    "range-distribution": { admissionId: "37", classIds: "1" },
  })

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

  const parseClassIds = (input: string): number[] => {
    return input
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id))
  }

  const updateFilter = (endpointName: string, field: "admissionId" | "classIds", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [endpointName]: {
        ...prev[endpointName],
        [field]: value,
      },
    }))
  }

  const testarEndpoint = async (endpointName: string) => {
    const endpointFilters = filters[endpointName]
    const admissionIdNum = parseInt(endpointFilters.admissionId)
    
    if (isNaN(admissionIdNum)) {
      setErrorStates((prev) => ({
        ...prev,
        [endpointName]: "ID da admission inválido",
      }))
      return
    }

    const classIdsArray = parseClassIds(endpointFilters.classIds)
    const apiFilters = {
      classIds: classIdsArray.length > 0 ? classIdsArray : undefined,
    }

    setLoadingStates((prev) => ({ ...prev, [endpointName]: true }))
    setErrorStates((prev) => ({ ...prev, [endpointName]: null }))

    try {
      let result: any

      switch (endpointName) {
        case "item-analysis":
          result = await getItemAnalysis(admissionIdNum, apiFilters)
          setItemAnalysis(result)
          break
        case "class-report":
          result = await getClassComponentReport(admissionIdNum, apiFilters)
          setClassReport(result)
          break
        case "component-stats":
          result = await getComponentStats(admissionIdNum, apiFilters)
          setComponentStats(result)
          break
        case "student-scores":
          result = await getStudentScores(admissionIdNum, apiFilters)
          setStudentScores(result)
          break
        case "score-distribution":
          result = await getScoreDistribution(admissionIdNum, apiFilters)
          setScoreDistribution(result)
          break
        case "range-distribution":
          result = await getComponentRangeDistribution(admissionIdNum, apiFilters)
          setRangeDistribution(result)
          break
      }
    } catch (err: any) {
      console.error(`Erro ao testar ${endpointName}:`, err)
      setErrorStates((prev) => ({
        ...prev,
        [endpointName]: err?.message || `Erro ao testar ${endpointName}`,
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
    router.push("/professor")
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
              <h2 className="text-base font-semibold">Analytics</h2>
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
          {/* Tabs para cada endpoint */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList 
              variant="line" 
              className="w-full mb-6 bg-muted/30 p-1 rounded-lg border shadow-sm"
            >
              <TabsTrigger 
                value="item-analysis"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-md data-[active]:scale-[1.02]"
              >
                Análise de Itens
              </TabsTrigger>
              <TabsTrigger 
                value="component-stats"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-md data-[active]:scale-[1.02]"
              >
                Estatísticas
              </TabsTrigger>
              <TabsTrigger 
                value="class-report"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-md data-[active]:scale-[1.02]"
              >
                Relatório Turma
              </TabsTrigger>
              <TabsTrigger 
                value="student-scores"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-md data-[active]:scale-[1.02]"
              >
                Notas Estudantes
              </TabsTrigger>
              <TabsTrigger 
                value="score-distribution"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-md data-[active]:scale-[1.02]"
              >
                Distribuição Notas
              </TabsTrigger>
              <TabsTrigger 
                value="range-distribution"
                className="flex-1 transition-all duration-300 hover:bg-accent/20 data-[active]:bg-background data-[active]:shadow-md data-[active]:scale-[1.02]"
              >
                Faixa Média
              </TabsTrigger>
            </TabsList>

            {/* Tab: Análise de Itens */}
            <TabsContent value="item-analysis" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {/* Filtros específicos desta tab */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b items-end">
                    <div>
                      <Label htmlFor="item-analysis-admissionId">Admission ID</Label>
                      <Input
                        id="item-analysis-admissionId"
                        type="number"
                        value={filters["item-analysis"].admissionId}
                        onChange={(e) => updateFilter("item-analysis", "admissionId", e.target.value)}
                        placeholder="37"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-analysis-classIds">Class IDs (separados por vírgula)</Label>
                      <Input
                        id="item-analysis-classIds"
                        value={filters["item-analysis"].classIds}
                        onChange={(e) => updateFilter("item-analysis", "classIds", e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => testarEndpoint("item-analysis")}
                        disabled={loadingStates.itemAnalysis}
                        className="gap-2"
                      >
                        {loadingStates.itemAnalysis ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          "Carregar Dados"
                        )}
                      </Button>
                    </div>
                  </div>

                  {errorStates.itemAnalysis && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.itemAnalysis}</span>
                      </div>
                    </div>
                  )}
                  
                  {itemAnalysis ? (
                    <ItemAnalysisTable
                      data={itemAnalysis}
                      admissionId={parseInt(filters["item-analysis"].admissionId)}
                      classIds={parseClassIds(filters["item-analysis"].classIds)}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Clique em "Carregar Dados" para visualizar a análise de itens
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Estatísticas por Componente */}
            <TabsContent value="component-stats" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b items-end">
                    <div>
                      <Label htmlFor="component-stats-admissionId">Admission ID</Label>
                      <Input
                        id="component-stats-admissionId"
                        type="number"
                        value={filters["component-stats"].admissionId}
                        onChange={(e) => updateFilter("component-stats", "admissionId", e.target.value)}
                        placeholder="37"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="component-stats-classIds">Class IDs (separados por vírgula)</Label>
                      <Input
                        id="component-stats-classIds"
                        value={filters["component-stats"].classIds}
                        onChange={(e) => updateFilter("component-stats", "classIds", e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => testarEndpoint("component-stats")}
                        disabled={loadingStates.componentStats}
                        className="gap-2"
                      >
                        {loadingStates.componentStats ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          "Carregar Dados"
                        )}
                      </Button>
                    </div>
                  </div>

                  {errorStates.componentStats && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.componentStats}</span>
                      </div>
                    </div>
                  )}
                  
                  {componentStats ? (
                    <ComponentStatsCards
                      data={componentStats}
                      admissionId={parseInt(filters["component-stats"].admissionId)}
                      availableClasses={[]}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Clique em "Carregar Dados" para visualizar as estatísticas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Relatório Consolidado por Turma */}
            <TabsContent value="class-report" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b items-end">
                    <div>
                      <Label htmlFor="class-report-admissionId">Admission ID</Label>
                      <Input
                        id="class-report-admissionId"
                        type="number"
                        value={filters["class-report"].admissionId}
                        onChange={(e) => updateFilter("class-report", "admissionId", e.target.value)}
                        placeholder="37"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="class-report-classIds">Class IDs (separados por vírgula)</Label>
                      <Input
                        id="class-report-classIds"
                        value={filters["class-report"].classIds}
                        onChange={(e) => updateFilter("class-report", "classIds", e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => testarEndpoint("class-report")}
                        disabled={loadingStates.classReport}
                        className="gap-2"
                      >
                        {loadingStates.classReport ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          "Carregar Dados"
                        )}
                      </Button>
                    </div>
                  </div>

                  {errorStates.classReport && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.classReport}</span>
                      </div>
                    </div>
                  )}
                  
                  {classReport && classReport.data.length > 0 ? (
                    <ClassComponentReportTable
                      data={classReport}
                      admissionId={parseInt(filters["class-report"].admissionId)}
                      availableClasses={[]}
                    />
                  ) : classReport && classReport.data.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Nenhum dado encontrado para os filtros selecionados
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Clique em "Carregar Dados" para visualizar o relatório
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Notas por Estudante */}
            <TabsContent value="student-scores" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b items-end">
                    <div>
                      <Label htmlFor="student-scores-admissionId">Admission ID</Label>
                      <Input
                        id="student-scores-admissionId"
                        type="number"
                        value={filters["student-scores"].admissionId}
                        onChange={(e) => updateFilter("student-scores", "admissionId", e.target.value)}
                        placeholder="37"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="student-scores-classIds">Class IDs (separados por vírgula)</Label>
                      <Input
                        id="student-scores-classIds"
                        value={filters["student-scores"].classIds}
                        onChange={(e) => updateFilter("student-scores", "classIds", e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => testarEndpoint("student-scores")}
                        disabled={loadingStates.studentScores}
                        className="gap-2"
                      >
                        {loadingStates.studentScores ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          "Carregar Dados"
                        )}
                      </Button>
                    </div>
                  </div>

                  {errorStates.studentScores && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.studentScores}</span>
                      </div>
                    </div>
                  )}
                  
                  {studentScores && studentScores.students.length > 0 ? (
                    <StudentScoresTable
                      data={studentScores}
                      admissionId={parseInt(filters["student-scores"].admissionId)}
                      availableClasses={[]}
                    />
                  ) : studentScores && studentScores.students.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Nenhum estudante encontrado para os filtros selecionados
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Clique em "Carregar Dados" para visualizar as notas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Distribuição de Notas */}
            <TabsContent value="score-distribution" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b items-end">
                    <div>
                      <Label htmlFor="score-distribution-admissionId">Admission ID</Label>
                      <Input
                        id="score-distribution-admissionId"
                        type="number"
                        value={filters["score-distribution"].admissionId}
                        onChange={(e) => updateFilter("score-distribution", "admissionId", e.target.value)}
                        placeholder="37"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="score-distribution-classIds">Class IDs (separados por vírgula)</Label>
                      <Input
                        id="score-distribution-classIds"
                        value={filters["score-distribution"].classIds}
                        onChange={(e) => updateFilter("score-distribution", "classIds", e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => testarEndpoint("score-distribution")}
                        disabled={loadingStates.scoreDistribution}
                        className="gap-2"
                      >
                        {loadingStates.scoreDistribution ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          "Carregar Dados"
                        )}
                      </Button>
                    </div>
                  </div>

                  {errorStates.scoreDistribution && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.scoreDistribution}</span>
                      </div>
                    </div>
                  )}
                  
                  {scoreDistribution ? (
                    <ScoreDistributionChart
                      data={scoreDistribution}
                      admissionId={parseInt(filters["score-distribution"].admissionId)}
                      availableClasses={[]}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Clique em "Carregar Dados" para visualizar a distribuição
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Distribuição por Faixa de Média */}
            <TabsContent value="range-distribution" className="space-y-4">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b items-end">
                    <div>
                      <Label htmlFor="range-distribution-admissionId">Admission ID</Label>
                      <Input
                        id="range-distribution-admissionId"
                        type="number"
                        value={filters["range-distribution"].admissionId}
                        onChange={(e) => updateFilter("range-distribution", "admissionId", e.target.value)}
                        placeholder="37"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="range-distribution-classIds">Class IDs (separados por vírgula)</Label>
                      <Input
                        id="range-distribution-classIds"
                        value={filters["range-distribution"].classIds}
                        onChange={(e) => updateFilter("range-distribution", "classIds", e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => testarEndpoint("range-distribution")}
                        disabled={loadingStates.rangeDistribution}
                        className="gap-2"
                      >
                        {loadingStates.rangeDistribution ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          "Carregar Dados"
                        )}
                      </Button>
                    </div>
                  </div>

                  {errorStates.rangeDistribution && (
                    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errorStates.rangeDistribution}</span>
                      </div>
                    </div>
                  )}
                  
                  {rangeDistribution && rangeDistribution.components.length > 0 ? (
                    <ComponentRangeDistributionChart
                      data={rangeDistribution}
                      admissionId={parseInt(filters["range-distribution"].admissionId)}
                      availableClasses={[]}
                    />
                  ) : rangeDistribution && rangeDistribution.components.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Nenhum componente encontrado para os filtros selecionados
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Clique em "Carregar Dados" para visualizar a distribuição
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <PerfilDialog
        open={showPerfil}
        onOpenChange={setShowPerfil}
      />
    </div>
  )
}
