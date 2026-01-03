"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Booking } from "@/lib/api/bookings"
import { getAdmissionsByBookingAndUser } from "@/lib/api/admissions"
import {
  getComponentStats,
  getClassComponentReport,
  getStudentScores,
  getScoreDistribution,
  getComponentRangeDistribution,
  getItemAnalysis,
} from "@/lib/api/analytics"
import { ClassComponentReportTable } from "./class-component-report-table"
import { ComponentStatsCards } from "./component-stats-cards"
import { StudentScoresTable } from "./student-scores-table"
import { ScoreDistributionChart } from "./score-distribution-chart"
import { ComponentRangeDistributionChart } from "./component-range-distribution-chart"
import { ItemAnalysisTable } from "./item-analysis-table"
import { type AnalyticsFilters } from "./analytics-filters"
import { getTeacherClasses, type TeacherClass } from "@/lib/api/bookings"
import { useAuth } from "@/contexts/auth-context"

interface RelatoriosCompletosProps {
  booking: Booking
  classIds: number[]
  userId: string
}

export function RelatoriosCompletos({ booking, classIds, userId }: RelatoriosCompletosProps) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [admissionId, setAdmissionId] = useState<number | null>(null)
  const [availableClasses, setAvailableClasses] = useState<TeacherClass[]>([])
  const [filters, setFilters] = useState<AnalyticsFilters>({
    classIds: classIds.length > 0 ? classIds : undefined,
  })

  // Estados para cada tipo de dados
  const [componentStats, setComponentStats] = useState<any>(null)
  const [classReport, setClassReport] = useState<any>(null)
  const [studentScores, setStudentScores] = useState<any>(null)
  const [scoreDistribution, setScoreDistribution] = useState<any>(null)
  const [rangeDistribution, setRangeDistribution] = useState<any>(null)
  const [itemAnalysis, setItemAnalysis] = useState<any>(null)

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
    const carregarRelatorios = async () => {
      setLoading(true)
      setError(null)

      try {
        // Buscar admissions do booking
        const admissions = await getAdmissionsByBookingAndUser(booking.id, userId)
        
        // Pegar a primeira admission finalizada
        const admissionFinalizada = admissions.find((a) => a.record?.finishedAt)
        
        if (!admissionFinalizada) {
          setError("Nenhuma avaliação finalizada encontrada para este booking")
          setLoading(false)
          return
        }

        setAdmissionId(admissionFinalizada.id)

        const apiFilters = {
          schoolYear: filters.schoolYear,
          grade: filters.grade,
          classIds: filters.classIds && filters.classIds.length > 0 ? filters.classIds : (classIds.length > 0 ? classIds : undefined),
        }

        // Carregar todos os dados em paralelo
        const [
          stats,
          report,
          scores,
          distribution,
          rangeDist,
          itemAnalysisData,
        ] = await Promise.allSettled([
          getComponentStats(admissionFinalizada.id, apiFilters),
          getClassComponentReport(admissionFinalizada.id, apiFilters),
          getStudentScores(admissionFinalizada.id, apiFilters),
          getScoreDistribution(admissionFinalizada.id, apiFilters),
          getComponentRangeDistribution(admissionFinalizada.id, apiFilters),
          getItemAnalysis(admissionFinalizada.id, { classIds: apiFilters.classIds, grade: apiFilters.grade }),
        ])

        if (stats.status === "fulfilled") setComponentStats(stats.value)
        if (report.status === "fulfilled") setClassReport(report.value)
        if (scores.status === "fulfilled") setStudentScores(scores.value)
        if (distribution.status === "fulfilled") setScoreDistribution(distribution.value)
        if (rangeDist.status === "fulfilled") setRangeDistribution(rangeDist.value)
        if (itemAnalysisData.status === "fulfilled") setItemAnalysis(itemAnalysisData.value)
      } catch (err: any) {
        console.error("Erro ao carregar relatórios:", err)
        setError(err?.message || "Erro ao carregar relatórios")
      } finally {
        setLoading(false)
      }
    }

    if (booking.id && userId) {
      carregarRelatorios()
    }
  }, [booking.id, userId, classIds, filters])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando relatórios...</p>
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
              <p className="font-medium text-sm">Erro ao carregar relatórios</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{booking.title}</h3>
        {booking.description && (
          <p className="text-sm text-muted-foreground">{booking.description}</p>
        )}
      </div>

      {/* Análise de Itens */}
      {itemAnalysis && admissionId && (
        <ItemAnalysisTable
          data={itemAnalysis}
          admissionId={admissionId}
          classIds={filters.classIds || classIds}
          availableClasses={availableClasses}
        />
      )}

      {/* Estatísticas por Componente */}
      {componentStats && admissionId && (
        <ComponentStatsCards
          data={componentStats}
          admissionId={admissionId}
          availableClasses={availableClasses}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      )}

      {/* Relatório Consolidado por Turma */}
      {classReport && admissionId && (
        <ClassComponentReportTable
          data={classReport}
          admissionId={admissionId}
          availableClasses={availableClasses}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      )}

      {/* Notas por Estudante */}
      {studentScores && admissionId && (
        <StudentScoresTable
          data={studentScores}
          admissionId={admissionId}
          availableClasses={availableClasses}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      )}

      {/* Distribuição de Notas */}
      {scoreDistribution && admissionId && (
        <ScoreDistributionChart
          data={scoreDistribution}
          admissionId={admissionId}
          availableClasses={availableClasses}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      )}

      {/* Distribuição por Faixa de Média */}
      {rangeDistribution && admissionId && (
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
