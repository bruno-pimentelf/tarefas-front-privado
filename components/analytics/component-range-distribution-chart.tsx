"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ComponentRangeDistributionResponse } from "@/lib/api/analytics"
import { AnalyticsFiltersDialog, type AnalyticsFilters } from "./analytics-filters"
import { TeacherClass } from "@/lib/api/bookings"

interface ComponentRangeDistributionChartProps {
  data: ComponentRangeDistributionResponse
  admissionId: number
  availableClasses?: TeacherClass[]
  onFiltersChange?: (filters: AnalyticsFilters) => void
  currentFilters?: AnalyticsFilters
}

export function ComponentRangeDistributionChart({
  data,
  admissionId,
  availableClasses = [],
  onFiltersChange,
  currentFilters = {},
}: ComponentRangeDistributionChartProps) {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(currentFilters)

  const handleFiltersChange = (filters: AnalyticsFilters) => {
    setLocalFilters(filters)
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-blue-600 dark:text-blue-400">DESEMPENHO</CardTitle>
          <div className="flex gap-2">
            <AnalyticsFiltersDialog
              availableClasses={availableClasses}
              currentFilters={localFilters}
              onFiltersChange={handleFiltersChange}
              filterTypes={["schoolYear", "grade", "classIds"]}
            />
          </div>
        </div>
        <CardTitle className="text-lg font-semibold mt-4">
          Distribuição de estudantes por faixa de média
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.components.map((component) => {
            const componentChartData = [
              { faixa: "Entre 0 e 2,5", estudantes: component.range_0_2_5 },
              { faixa: "Entre 2,5 e 5,0", estudantes: component.range_2_5_5_0 },
              { faixa: "Entre 5,0 e 7,5", estudantes: component.range_5_0_7_5 },
              { faixa: "Entre 7,5 e 10", estudantes: component.range_7_5_10 },
            ]

            return (
              <div key={component.componentId} className="space-y-2">
                <h3 className="text-sm font-semibold">{component.componentName}</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={componentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="faixa"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        label={{ value: "Número de estudantes", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip />
                      <Bar dataKey="estudantes" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
