"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ScoreDistributionResponse } from "@/lib/api/analytics"
import { AnalyticsFiltersDialog, type AnalyticsFilters } from "./analytics-filters"
import { TeacherClass } from "@/lib/api/bookings"

interface ScoreDistributionChartProps {
  data: ScoreDistributionResponse
  admissionId: number
  availableClasses?: TeacherClass[]
  onFiltersChange?: (filters: AnalyticsFilters) => void
  currentFilters?: AnalyticsFilters
}

export function ScoreDistributionChart({
  data,
  admissionId,
  availableClasses = [],
  onFiltersChange,
  currentFilters = {},
}: ScoreDistributionChartProps) {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(currentFilters)

  const handleFiltersChange = (filters: AnalyticsFilters) => {
    setLocalFilters(filters)
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }

  // Converter scores de 0-1 para 0-10 (se necessário)
  const convertScore = (score: number): number => {
    // A distribuição já vem com scores de 0-10, mas vamos garantir
    return score <= 1 ? score * 10 : score
  }

  const chartData = data.distribution.map((item) => ({
    nota: convertScore(item.score),
    estudantes: item.studentCount,
  }))

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
        <CardTitle className="text-lg font-semibold mt-4">Distribuição de notas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="nota"
                label={{ value: "Nota", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                label={{ value: "Número de estudantes", angle: -90, position: "insideLeft" }}
              />
              <Tooltip />
              <Bar dataKey="estudantes" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
