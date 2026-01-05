"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ComponentRangeDistributionResponse } from "@/lib/api/analytics"
import { TeacherClass } from "@/lib/api/bookings"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { FaChartBar } from "react-icons/fa"

interface ComponentRangeDistributionChartProps {
  data: ComponentRangeDistributionResponse
  admissionId: number
  availableClasses?: TeacherClass[]
}

export function ComponentRangeDistributionChart({
  data,
  admissionId,
  availableClasses = [],
}: ComponentRangeDistributionChartProps) {

  // Preparar dados para o gráfico empilhado
  const chartData = data.components.map((component) => ({
    componente: component.componentName,
    range_0_2_5: component.range_0_2_5 || 0,
    range_2_5_5_0: component.range_2_5_5_0 || 0,
    range_5_0_7_5: component.range_5_0_7_5 || 0,
    range_7_5_10: component.range_7_5_10 || 0,
  }))

  const chartConfig = {
    range_0_2_5: {
      label: "Insuficiente (0,0 a 2,5)",
      color: "#ef4444", // vermelho
    },
    range_2_5_5_0: {
      label: "Regular (2,5 a 5,0)",
      color: "#eab308", // amarelo
    },
    range_5_0_7_5: {
      label: "Bom (5,0 a 7,5)",
      color: "#3b82f6", // azul
    },
    range_7_5_10: {
      label: "Excelente (7,5 a 10,0)",
      color: "#22c55e", // verde
    },
  } satisfies ChartConfig

  // Calcular total de estudantes
  const totalStudents = chartData.reduce((sum, item) => {
    return sum + item.range_0_2_5 + item.range_2_5_5_0 + item.range_5_0_7_5 + item.range_7_5_10
  }, 0)

  return (
    <div className="space-y-6">
      {/* Gráfico */}
      <div className="rounded-lg border shadow-sm bg-background p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FaChartBar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">DESEMPENHO</h3>
              <p className="text-sm text-muted-foreground">
                Distribuição de estudantes por faixa de média
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="px-3 py-1.5 rounded-md bg-muted/50 border">
              <span className="text-xs text-muted-foreground">Total de estudantes: </span>
              <span className="text-sm font-semibold">{totalStudents}</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-muted/50 border">
              <span className="text-xs text-muted-foreground">Componentes: </span>
              <span className="text-sm font-semibold">{data.components.length}</span>
            </div>
          </div>
        </div>

        {/* Legenda melhorada e mais intuitiva */}
        <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
          <div className="text-sm font-semibold mb-3">Faixa de desempenho:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: "#ef4444" }} />
              <div className="flex flex-col">
                <span className="text-xs font-medium">Insuficiente</span>
                <span className="text-xs text-muted-foreground">0,0 a 2,5</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: "#eab308" }} />
              <div className="flex flex-col">
                <span className="text-xs font-medium">Regular</span>
                <span className="text-xs text-muted-foreground">2,5 a 5,0</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: "#3b82f6" }} />
              <div className="flex flex-col">
                <span className="text-xs font-medium">Bom</span>
                <span className="text-xs text-muted-foreground">5,0 a 7,5</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: "#22c55e" }} />
              <div className="flex flex-col">
                <span className="text-xs font-medium">Excelente</span>
                <span className="text-xs text-muted-foreground">7,5 a 10,0</span>
              </div>
            </div>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[500px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="componente"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              label={{ value: "Número de estudantes", angle: -90, position: "insideLeft" }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="range_0_2_5"
              stackId="a"
              fill="var(--color-range_0_2_5)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="range_2_5_5_0"
              stackId="a"
              fill="var(--color-range_2_5_5_0)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="range_5_0_7_5"
              stackId="a"
              fill="var(--color-range_5_0_7_5)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="range_7_5_10"
              stackId="a"
              fill="var(--color-range_7_5_10)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
