"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Combobox,
  ComboboxInput,
  ComboboxValue,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import { getStudentBookings, getTeacherClasses, type Booking, type TeacherClass } from "@/lib/api/bookings"
import { getAdmissionsByBookingAndUser, type Admission, type Exam } from "@/lib/api/admissions"
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

interface ExamOption {
  examId: number
  examTitle: string
  admissionId: number
  admissionTitle: string
  bookingTitle: string
}

export default function TesteAnalyticsPage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState("item-analysis")

  // Estados para exams e turmas disponíveis
  const [examOptions, setExamOptions] = useState<ExamOption[]>([])
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

  // Estado para o exam selecionado na tab de análise de itens
  const [selectedExam, setSelectedExam] = useState<ExamOption | null>(null)

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

  // Carregar turmas disponíveis (sem carregar bookings/admissions automaticamente)
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

  // Atualizar admissionId quando exam selecionado mudar
  useEffect(() => {
    if (selectedExam) {
      updateFilter("item-analysis", "admissionId", selectedExam.admissionId.toString())
    }
  }, [selectedExam])

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <h1 className="text-2xl font-bold mb-2">Teste de Analytics API</h1>
        <p className="text-sm text-muted-foreground">
          Teste todas as rotas de analytics. Por padrão, usa admission ID 37 e classID 1
        </p>
      </div>

      {/* Tabs para cada endpoint */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="item-analysis">Análise de Itens</TabsTrigger>
          <TabsTrigger value="component-stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="class-report">Relatório Turma</TabsTrigger>
          <TabsTrigger value="student-scores">Notas Estudantes</TabsTrigger>
          <TabsTrigger value="score-distribution">Distribuição Notas</TabsTrigger>
          <TabsTrigger value="range-distribution">Faixa Média</TabsTrigger>
        </TabsList>

        {/* Tab: Análise de Itens */}
        <TabsContent value="item-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Itens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros específicos desta tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                {/* Filtro de Admission ID */}
                <div>
                  <Label htmlFor="item-analysis-admissionId">Admission ID</Label>
                  <Input
                    id="item-analysis-admissionId"
                    type="number"
                    value={filters["item-analysis"].admissionId}
                    onChange={(e) => updateFilter("item-analysis", "admissionId", e.target.value)}
                    placeholder="37"
                  />
                </div>

                {/* Filtro de Class ID */}
                <div>
                  <Label htmlFor="item-analysis-classIds">Class IDs (separados por vírgula)</Label>
                  <Input
                    id="item-analysis-classIds"
                    value={filters["item-analysis"].classIds}
                    onChange={(e) => updateFilter("item-analysis", "classIds", e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => testarEndpoint("item-analysis")}
                  disabled={loadingStates.itemAnalysis}
                >
                  {loadingStates.itemAnalysis ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar Dados"
                  )}
                </Button>
              </div>

              {errorStates.itemAnalysis && (
                <div className="p-4 border border-destructive rounded-md">
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
                <p className="text-sm text-muted-foreground text-center py-8">
                  Clique em "Carregar Dados" para visualizar a análise de itens
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Estatísticas por Componente */}
        <TabsContent value="component-stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas por Componente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros específicos desta tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <Label htmlFor="component-stats-admissionId">Admission ID</Label>
                  <Input
                    id="component-stats-admissionId"
                    type="number"
                    value={filters["component-stats"].admissionId}
                    onChange={(e) => updateFilter("component-stats", "admissionId", e.target.value)}
                    placeholder="37"
                  />
                </div>
                <div>
                  <Label htmlFor="component-stats-classIds">Class IDs (separados por vírgula)</Label>
                  <Input
                    id="component-stats-classIds"
                    value={filters["component-stats"].classIds}
                    onChange={(e) => updateFilter("component-stats", "classIds", e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => testarEndpoint("component-stats")}
                  disabled={loadingStates.componentStats}
                >
                  {loadingStates.componentStats ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar Dados"
                  )}
                </Button>
              </div>

              {errorStates.componentStats && (
                <div className="p-4 border border-destructive rounded-md">
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
                <p className="text-sm text-muted-foreground text-center py-8">
                  Clique em "Carregar Dados" para visualizar as estatísticas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Relatório Consolidado por Turma */}
        <TabsContent value="class-report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Consolidado por Turma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros específicos desta tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <Label htmlFor="class-report-admissionId">Admission ID</Label>
                  <Input
                    id="class-report-admissionId"
                    type="number"
                    value={filters["class-report"].admissionId}
                    onChange={(e) => updateFilter("class-report", "admissionId", e.target.value)}
                    placeholder="37"
                  />
                </div>
                <div>
                  <Label htmlFor="class-report-classIds">Class IDs (separados por vírgula)</Label>
                  <Input
                    id="class-report-classIds"
                    value={filters["class-report"].classIds}
                    onChange={(e) => updateFilter("class-report", "classIds", e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => testarEndpoint("class-report")}
                  disabled={loadingStates.classReport}
                >
                  {loadingStates.classReport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar Dados"
                  )}
                </Button>
              </div>

              {errorStates.classReport && (
                <div className="p-4 border border-destructive rounded-md">
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
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum dado encontrado para os filtros selecionados
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Clique em "Carregar Dados" para visualizar o relatório
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notas por Estudante */}
        <TabsContent value="student-scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas por Estudante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros específicos desta tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <Label htmlFor="student-scores-admissionId">Admission ID</Label>
                  <Input
                    id="student-scores-admissionId"
                    type="number"
                    value={filters["student-scores"].admissionId}
                    onChange={(e) => updateFilter("student-scores", "admissionId", e.target.value)}
                    placeholder="37"
                  />
                </div>
                <div>
                  <Label htmlFor="student-scores-classIds">Class IDs (separados por vírgula)</Label>
                  <Input
                    id="student-scores-classIds"
                    value={filters["student-scores"].classIds}
                    onChange={(e) => updateFilter("student-scores", "classIds", e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => testarEndpoint("student-scores")}
                  disabled={loadingStates.studentScores}
                >
                  {loadingStates.studentScores ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar Dados"
                  )}
                </Button>
              </div>

              {errorStates.studentScores && (
                <div className="p-4 border border-destructive rounded-md">
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
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum estudante encontrado para os filtros selecionados
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Clique em "Carregar Dados" para visualizar as notas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Distribuição de Notas */}
        <TabsContent value="score-distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros específicos desta tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <Label htmlFor="score-distribution-admissionId">Admission ID</Label>
                  <Input
                    id="score-distribution-admissionId"
                    type="number"
                    value={filters["score-distribution"].admissionId}
                    onChange={(e) => updateFilter("score-distribution", "admissionId", e.target.value)}
                    placeholder="37"
                  />
                </div>
                <div>
                  <Label htmlFor="score-distribution-classIds">Class IDs (separados por vírgula)</Label>
                  <Input
                    id="score-distribution-classIds"
                    value={filters["score-distribution"].classIds}
                    onChange={(e) => updateFilter("score-distribution", "classIds", e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => testarEndpoint("score-distribution")}
                  disabled={loadingStates.scoreDistribution}
                >
                  {loadingStates.scoreDistribution ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar Dados"
                  )}
                </Button>
              </div>

              {errorStates.scoreDistribution && (
                <div className="p-4 border border-destructive rounded-md">
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
                <p className="text-sm text-muted-foreground text-center py-8">
                  Clique em "Carregar Dados" para visualizar a distribuição
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Distribuição por Faixa de Média */}
        <TabsContent value="range-distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Faixa de Média</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros específicos desta tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <Label htmlFor="range-distribution-admissionId">Admission ID</Label>
                  <Input
                    id="range-distribution-admissionId"
                    type="number"
                    value={filters["range-distribution"].admissionId}
                    onChange={(e) => updateFilter("range-distribution", "admissionId", e.target.value)}
                    placeholder="37"
                  />
                </div>
                <div>
                  <Label htmlFor="range-distribution-classIds">Class IDs (separados por vírgula)</Label>
                  <Input
                    id="range-distribution-classIds"
                    value={filters["range-distribution"].classIds}
                    onChange={(e) => updateFilter("range-distribution", "classIds", e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => testarEndpoint("range-distribution")}
                  disabled={loadingStates.rangeDistribution}
                >
                  {loadingStates.rangeDistribution ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar Dados"
                  )}
                </Button>
              </div>

              {errorStates.rangeDistribution && (
                <div className="p-4 border border-destructive rounded-md">
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
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum componente encontrado para os filtros selecionados
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Clique em "Carregar Dados" para visualizar a distribuição
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
