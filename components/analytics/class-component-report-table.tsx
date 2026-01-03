"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassComponentReportResponse } from "@/lib/api/analytics"
import { AnalyticsFiltersDialog, type AnalyticsFilters } from "./analytics-filters"
import { TeacherClass } from "@/lib/api/bookings"

interface ClassComponentReportTableProps {
  data: ClassComponentReportResponse
  admissionId: number
  availableClasses?: TeacherClass[]
  onFiltersChange?: (filters: AnalyticsFilters) => void
  currentFilters?: AnalyticsFilters
}

export function ClassComponentReportTable({
  data,
  admissionId,
  availableClasses = [],
  onFiltersChange,
  currentFilters = {},
}: ClassComponentReportTableProps) {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(currentFilters)

  const handleFiltersChange = (filters: AnalyticsFilters) => {
    setLocalFilters(filters)
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }

  // Converter scores de 0-1 para 0-10
  const convertScore = (score: number): number => {
    return score <= 1 ? score * 10 : score
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-blue-600 dark:text-blue-400">
            Consolidado por turma
          </CardTitle>
          <div className="flex gap-2">
            <AnalyticsFiltersDialog
              availableClasses={availableClasses}
              currentFilters={localFilters}
              onFiltersChange={handleFiltersChange}
              filterTypes={["schoolYear", "grade", "classIds"]}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-blue-100 dark:bg-blue-900/30">
                <th className="border p-2 text-left font-semibold text-sm">Ano</th>
                <th className="border p-2 text-left font-semibold text-sm">Série</th>
                <th className="border p-2 text-left font-semibold text-sm">Turma</th>
                <th className="border p-2 text-left font-semibold text-sm">Componente</th>
                <th className="border p-2 text-center font-semibold text-sm">Média geral</th>
                <th className="border p-2 text-center font-semibold text-sm">Médias entre 0 e 2,5</th>
                <th className="border p-2 text-center font-semibold text-sm">Médias entre 2,5 e 5,0</th>
                <th className="border p-2 text-center font-semibold text-sm">Médias entre 5,0 e 7,5</th>
                <th className="border p-2 text-center font-semibold text-sm">Médias entre 7,5 e 10</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item, index) => (
                <tr key={index} className="bg-white dark:bg-gray-900">
                  <td className="border p-2 text-sm">{item.year}</td>
                  <td className="border p-2 text-sm">{item.grade}</td>
                  <td className="border p-2 text-sm">{item.className}</td>
                  <td className="border p-2 text-sm">{item.componentName}</td>
                  <td className="border p-2 text-center text-sm font-semibold">
                    {convertScore(item.averageScore).toFixed(1)}
                  </td>
                  <td className="border p-2 text-center text-sm">{item.percentile_0_2_5}%</td>
                  <td className="border p-2 text-center text-sm">{item.percentile_2_5_5_0}%</td>
                  <td className="border p-2 text-center text-sm">{item.percentile_5_0_7_5}%</td>
                  <td className="border p-2 text-center text-sm">{item.percentile_7_5_10}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
