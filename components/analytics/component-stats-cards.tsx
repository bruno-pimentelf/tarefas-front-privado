"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComponentStatsResponse } from "@/lib/api/analytics"
import { AnalyticsFiltersDialog, type AnalyticsFilters } from "./analytics-filters"
import { TeacherClass } from "@/lib/api/bookings"
import { getComponentStats } from "@/lib/api/analytics"

interface ComponentStatsCardsProps {
  data: ComponentStatsResponse
  admissionId: number
  availableClasses?: TeacherClass[]
  onFiltersChange?: (filters: AnalyticsFilters) => void
  currentFilters?: AnalyticsFilters
}

export function ComponentStatsCards({
  data,
  admissionId,
  availableClasses = [],
  onFiltersChange,
  currentFilters = {},
}: ComponentStatsCardsProps) {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(currentFilters)

  const handleFiltersChange = (filters: AnalyticsFilters) => {
    setLocalFilters(filters)
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }

  const getComponentAbbreviation = (name: string): string => {
    if (name.includes("Linguagens") || name.includes("Língua")) return "LC"
    if (name.includes("Matemática")) return "MT"
    if (name.includes("Ciências da Natureza") || name.includes("Natureza")) return "CN"
    if (name.includes("Ciências Humanas") || name.includes("Humanas")) return "CH"
    return name.substring(0, 2).toUpperCase()
  }

  // Converter scores de 0-1 para 0-10
  const convertScore = (score: number): number => {
    // Se o score já está entre 0-10, retorna como está
    // Se está entre 0-1, converte para 0-10
    return score <= 1 ? score * 10 : score
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-blue-600 dark:text-blue-400">PAINEL</CardTitle>
          <div className="flex gap-2">
            <AnalyticsFiltersDialog
              availableClasses={availableClasses}
              currentFilters={localFilters}
              onFiltersChange={handleFiltersChange}
              filterTypes={["schoolYear", "grade", "classIds"]}
            />
          </div>
        </div>
        <CardTitle className="text-lg font-semibold mt-4">Média das notas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Média Geral */}
          <Card className="bg-blue-100 dark:bg-blue-900/30">
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-2">Média Geral</div>
              <div className="text-3xl font-bold mb-2">
                {convertScore(data.overallAverage).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">
                ({data.overallCorrectAnswers || 0} acertos em {data.overallTotalQuestions || 0} itens)
              </div>
            </CardContent>
          </Card>

          {/* Componentes */}
          {data.components.map((component) => (
            <Card key={component.componentId} className="bg-gray-100 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="text-sm font-medium mb-2">
                  {getComponentAbbreviation(component.componentName)}
                </div>
                <div className="text-2xl font-bold mb-2">
                  {convertScore(component.averageScore).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  ({component.correctAnswers} acertos em {component.totalQuestions} itens)
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
