"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts"
import { ScoreDistributionResponse } from "@/lib/api/analytics"
import { AnalyticsFiltersDialog, type AnalyticsFilters } from "./analytics-filters"
import { TeacherClass } from "@/lib/api/bookings"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { FaChartBar } from "react-icons/fa"

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
    return score <= 1 ? score * 10 : score
  }

  const chartData = (data.buckets || []).map((item) => ({
    nota: item.range,
    estudantes: item.count,
  }))

  const chartConfig = {
    estudantes: {
      label: "Estudantes",
      color: "#3b82f6",
    },
  } satisfies ChartConfig

  const totalStudents = data.totalStudents || data.buckets.reduce((sum, item) => sum + item.count, 0)
  const maxCount = Math.max(...data.buckets.map((item) => item.count), 0)

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center justify-end p-4 bg-muted/30 rounded-lg border">
        <AnalyticsFiltersDialog
          availableClasses={availableClasses}
          currentFilters={localFilters}
          onFiltersChange={handleFiltersChange}
          filterTypes={["schoolYear", "grade", "classIds"]}
        />
      </div>

      {/* Gráfico */}
      <div className="rounded-lg border shadow-sm bg-background p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FaChartBar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Distribuição de Notas</h3>
              <p className="text-sm text-muted-foreground">
                Quantidade de estudantes por faixa de nota
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="px-3 py-1.5 rounded-md bg-muted/50 border">
              <span className="text-xs text-muted-foreground">Total de estudantes: </span>
              <span className="text-sm font-semibold">{totalStudents}</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-muted/50 border">
              <span className="text-xs text-muted-foreground">Maior frequência: </span>
              <span className="text-sm font-semibold">{maxCount} estudantes</span>
            </div>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="nota"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => value}
              label={{ value: "Nota", position: "insideBottom", offset: -10 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              label={{ value: "Número de Estudantes", angle: -90, position: "insideLeft" }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="estudantes"
              fill="var(--color-estudantes)"
              radius={[8, 8, 0, 0]}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: any) => String(value || 0)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
