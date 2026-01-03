"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, AlertCircle, BarChart3, Users, Target, TrendingUp } from "lucide-react"
import {
  getComponentStats,
  getClassComponentReport,
  getStudentScores,
  getScoreDistribution,
  getComponentRangeDistribution,
  getItemAnalysis,
  type ComponentStatsResponse,
  type ClassComponentReportResponse,
  type StudentScoresResponse,
  type ScoreDistributionResponse,
  type ComponentRangeDistributionResponse,
  type ItemAnalysisResponse,
} from "@/lib/api/analytics"
import { ItemAnalysisTable } from "@/components/analytics/item-analysis-table"
import { ClassComponentReportTable } from "@/components/analytics/class-component-report-table"
import { ComponentStatsCards } from "@/components/analytics/component-stats-cards"
import { StudentScoresTable } from "@/components/analytics/student-scores-table"
import { ScoreDistributionChart } from "@/components/analytics/score-distribution-chart"
import { ComponentRangeDistributionChart } from "@/components/analytics/component-range-distribution-chart"
import { type AnalyticsFilters } from "@/components/analytics/analytics-filters"
import { getTeacherClasses, type TeacherClass } from "@/lib/api/bookings"
import { useAuth } from "@/contexts/auth-context"

interface BookingEstatisticasProps {
  admissionId: number
  classIds?: number[]
  grade?: string
  schoolYear?: string
}

export function BookingEstatisticas({
  admissionId,
  classIds,
  grade,
  schoolYear,
}: BookingEstatisticasProps) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [componentStats, setComponentStats] = useState<ComponentStatsResponse | null>(null)
  const [classReport, setClassReport] = useState<ClassComponentReportResponse | null>(null)
  const [studentScores, setStudentScores] = useState<StudentScoresResponse | null>(null)
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistributionResponse | null>(null)
  const [rangeDistribution, setRangeDistribution] = useState<ComponentRangeDistributionResponse | null>(null)
  const [itemAnalysis, setItemAnalysis] = useState<ItemAnalysisResponse | null>(null)
  const [availableClasses, setAvailableClasses] = useState<TeacherClass[]>([])
  const [filters, setFilters] = useState<AnalyticsFilters>({
    schoolYear,
    grade,
    classIds,
  })

  // Carregar turmas disponíveis
  useEffect(() => {
    const carregarTurmas = async () => {
      if (!currentUser) return
      try {
        const classes = await getTeacherClasses(currentUser.uid)
        setAvailableClasses(classes)
      } catch (err) {
        console.error("Erro ao carregar turmas:", err)
      }
    }
    carregarTurmas()
  }, [currentUser])

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters)
  }

  useEffect(() => {
    const carregarEstatisticas = async () => {
      setLoading(true)
      setError(null)

      try {
        const apiFilters = {
          schoolYear: filters.schoolYear || schoolYear,
          grade: filters.grade || grade,
          classIds: filters.classIds && filters.classIds.length > 0 ? filters.classIds : classIds,
        }

        // Carregar todas as estatísticas em paralelo
        const [
          stats,
          report,
          scores,
          distribution,
          rangeDist,
          itemAnalysisData,
        ] = await Promise.all([
          getComponentStats(admissionId, apiFilters),
          getClassComponentReport(admissionId, apiFilters),
          getStudentScores(admissionId, apiFilters),
          getScoreDistribution(admissionId, apiFilters),
          getComponentRangeDistribution(admissionId, apiFilters),
          getItemAnalysis(admissionId, { classIds: apiFilters.classIds, grade: apiFilters.grade }).catch(() => null),
        ])

        setComponentStats(stats)
        setClassReport(report)
        setStudentScores(scores)
        setScoreDistribution(distribution)
        setRangeDistribution(rangeDist)
        setItemAnalysis(itemAnalysisData)
      } catch (err: any) {
        console.error("Erro ao carregar estatísticas:", err)
        setError(err?.message || "Erro ao carregar estatísticas")
      } finally {
        setLoading(false)
      }
    }

    if (admissionId) {
      carregarEstatisticas()
    }
  }, [admissionId, filters, classIds, grade, schoolYear])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando estatísticas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium text-sm">Erro ao carregar estatísticas</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getDesempenhoColor = (percentual: number) => {
    if (percentual >= 80) return "text-green-600 dark:text-green-400"
    if (percentual >= 60) return "text-blue-600 dark:text-blue-400"
    if (percentual >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <div className="space-y-4">
      {/* Análise de Itens */}
      {itemAnalysis && (
        <ItemAnalysisTable
          data={itemAnalysis}
          admissionId={admissionId}
          classIds={filters.classIds || classIds}
          availableClasses={availableClasses}
        />
      )}

      {/* Estatísticas por Componente */}
      {componentStats && (
        <ComponentStatsCards
          data={componentStats}
          admissionId={admissionId}
          availableClasses={availableClasses}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      )}


      {/* Relatório por Turma e Componente */}
      {classReport && classReport.data.length > 0 && (
        <ClassComponentReportTable
          data={classReport}
          admissionId={admissionId}
          availableClasses={availableClasses}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      )}

      {/* Notas por Estudante */}
      {studentScores && studentScores.students.length > 0 && (
        <StudentScoresTable
          data={studentScores}
          admissionId={admissionId}
          availableClasses={availableClasses}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      )}

      {/* Distribuição de Notas */}
      {scoreDistribution && (
        <ScoreDistributionChart
          data={scoreDistribution}
          admissionId={admissionId}
          availableClasses={availableClasses}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      )}

      {/* Análise de Itens */}
      {itemAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análise de Itens (Questões)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo */}
            <div className="p-4 bg-muted/30 rounded-md">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{itemAnalysis.summary.totalStudents}</div>
                  <div className="text-xs text-muted-foreground">Estudantes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{itemAnalysis.summary.totalQuestions}</div>
                  <div className="text-xs text-muted-foreground">Questões</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {(itemAnalysis.summary.averageCorrectRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Taxa Média de Acerto</div>
                </div>
              </div>
            </div>

            {/* Questões */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Taxa de Acerto por Questão</h3>
              <div className="space-y-2">
                {itemAnalysis.questions.map((question) => (
                  <div key={question.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        Q{question.order}: {question.name}
                      </span>
                      <span className={getDesempenhoColor(question.correctRate * 100)}>
                        {(question.correctRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={question.correctRate * 100} />
                  </div>
                ))}
              </div>
            </div>

            {/* Estudantes */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Desempenho por Estudante</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {itemAnalysis.students.slice(0, 10).map((student) => (
                  <div key={student.userId} className="p-2 border rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{student.name}</span>
                      <span className={`text-sm font-semibold ${getDesempenhoColor(student.correctRate * 100)}`}>
                        {(student.correctRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {student.correctCount} acertos de {student.totalQuestions} questões
                    </div>
                  </div>
                ))}
                {itemAnalysis.students.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Mostrando 10 de {itemAnalysis.students.length} estudantes
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Faixa de Média */}
      {rangeDistribution && rangeDistribution.components.length > 0 && (
        <ComponentRangeDistributionChart
          data={rangeDistribution}
          admissionId={admissionId}
          availableClasses={availableClasses}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      )}
    </div>
  )
}
