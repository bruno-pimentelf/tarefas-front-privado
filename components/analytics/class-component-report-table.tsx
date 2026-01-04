"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search } from "lucide-react"
import { FaFileExcel, FaFileAlt, FaChartBar } from "react-icons/fa"
import * as XLSX from "xlsx"
import { ClassComponentReportResponse } from "@/lib/api/analytics"
import { AnalyticsFiltersDialog, type AnalyticsFilters } from "./analytics-filters"
import { TeacherClass } from "@/lib/api/bookings"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"media" | "ano" | "componente">("media")

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

  // Filtrar e ordenar dados
  const filteredData = data.data.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.className.toLowerCase().includes(searchLower) ||
      item.componentName.toLowerCase().includes(searchLower) ||
      item.year.toLowerCase().includes(searchLower) ||
      item.grade.toLowerCase().includes(searchLower)
    )
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "media") {
      return convertScore(b.averageScore) - convertScore(a.averageScore)
    } else if (sortBy === "ano") {
      return b.year.localeCompare(a.year)
    } else {
      return a.componentName.localeCompare(b.componentName)
    }
  })

  // Funções de cor baseadas em desempenho
  const getScoreColor = (score: number) => {
    const convertedScore = convertScore(score)
    if (convertedScore >= 7.5) return "text-green-600 dark:text-green-400"
    if (convertedScore >= 5.0) return "text-blue-600 dark:text-blue-400"
    if (convertedScore >= 2.5) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBgColor = (score: number) => {
    const convertedScore = convertScore(score)
    if (convertedScore >= 7.5) return "bg-green-500/10 border-green-500/20"
    if (convertedScore >= 5.0) return "bg-blue-500/10 border-blue-500/20"
    if (convertedScore >= 2.5) return "bg-yellow-500/10 border-yellow-500/20"
    return "bg-red-500/10 border-red-500/20"
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 50) return "text-green-600 dark:text-green-400 bg-green-500/10"
    if (percentile >= 30) return "text-blue-600 dark:text-blue-400 bg-blue-500/10"
    if (percentile >= 15) return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10"
    return "text-red-600 dark:text-red-400 bg-red-500/10"
  }

  // Exportação CSV
  const handleDownloadCSV = () => {
    const headers = [
      "Ano",
      "Série",
      "Turma",
      "Componente",
      "Média Geral",
      "0-2.5",
      "2.5-5.0",
      "5.0-7.5",
      "7.5-10",
    ]

    const rows = sortedData.map((item) => [
      item.year,
      item.grade,
      item.className,
      item.componentName,
      convertScore(item.averageScore).toFixed(1),
      `${item.percentile_0_2_5.toFixed(1)}%`,
      `${item.percentile_2_5_5_0.toFixed(1)}%`,
      `${item.percentile_5_0_7_5.toFixed(1)}%`,
      `${item.percentile_7_5_10.toFixed(1)}%`,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio-turma-admission-${admissionId}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportação Excel
  const handleDownloadExcel = () => {
    const headers = [
      "Ano",
      "Série",
      "Turma",
      "Componente",
      "Média Geral",
      "0-2.5",
      "2.5-5.0",
      "5.0-7.5",
      "7.5-10",
    ]

    const rows = sortedData.map((item) => [
      item.year,
      item.grade,
      item.className,
      item.componentName,
      parseFloat(convertScore(item.averageScore).toFixed(1)),
      item.percentile_0_2_5,
      item.percentile_2_5_5_0,
      item.percentile_5_0_7_5,
      item.percentile_7_5_10,
    ])

    const worksheetData = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E0E0E0" } },
      }
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Turma")

    const colWidths = [
      { wch: 8 }, // Ano
      { wch: 8 }, // Série
      { wch: 20 }, // Turma
      { wch: 25 }, // Componente
      { wch: 12 }, // Média geral
      { wch: 10 }, // 0-2.5
      { wch: 10 }, // 2.5-5.0
      { wch: 10 }, // 5.0-7.5
      { wch: 10 }, // 7.5-10
    ]
    worksheet["!cols"] = colWidths

    const fileName = `relatorio-turma-admission-${admissionId}-${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div className="space-y-4">
      {/* Filtros e controles melhorados */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por turma, componente, ano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Ordenar:</label>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="media">Maior média primeiro</SelectItem>
              <SelectItem value="ano">Ano (mais recente)</SelectItem>
              <SelectItem value="componente">Componente (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AnalyticsFiltersDialog
          availableClasses={availableClasses}
          currentFilters={localFilters}
          onFiltersChange={handleFiltersChange}
          filterTypes={["schoolYear", "grade", "classIds"]}
        />
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleDownloadCSV}
            variant="outline"
            className="gap-2 border-2 hover:bg-accent/10 transition-all"
          >
            <FaFileAlt className="h-4 w-4" />
            CSV
          </Button>
          <Button 
            onClick={handleDownloadExcel}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <FaFileExcel className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Tabela melhorada */}
      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <div className="min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-muted/50 to-muted/30 border-b-2">
                <th className="text-left p-2 font-bold text-sm sticky left-0 bg-gradient-to-r from-muted/50 to-muted/30 z-20 border-r">
                  <div className="flex items-center gap-2">
                    <span>Turma</span>
                    <Badge variant="outline" className="text-xs">
                      {sortedData.length}
                    </Badge>
                  </div>
                </th>
                <th className="text-left p-2 font-bold text-sm">Ano</th>
                <th className="text-left p-2 font-bold text-sm">Série</th>
                <th className="text-left p-2 font-bold text-sm min-w-[200px]">Componente</th>
                <th className="text-center p-2 font-bold text-sm min-w-[120px] bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex flex-col items-center gap-1">
                    <span>Média Geral</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      (0-10)
                    </span>
                  </div>
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[110px] border-l border-border/50 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                      0-2.5
                    </Badge>
                    <span className="text-xs font-normal text-muted-foreground mt-1">
                      (%)
                    </span>
                  </div>
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[110px] border-l border-border/50 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                      2.5-5.0
                    </Badge>
                    <span className="text-xs font-normal text-muted-foreground mt-1">
                      (%)
                    </span>
                  </div>
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[110px] border-l border-border/50 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                      5.0-7.5
                    </Badge>
                    <span className="text-xs font-normal text-muted-foreground mt-1">
                      (%)
                    </span>
                  </div>
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[110px] border-l border-border/50 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      7.5-10
                    </Badge>
                    <span className="text-xs font-normal text-muted-foreground mt-1">
                      (%)
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => {
                const convertedScore = convertScore(item.averageScore)
                return (
                  <tr 
                    key={`${item.classId}-${item.componentId}-${index}`}
                    className="border-b hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 group"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="p-2 font-semibold text-sm sticky left-0 bg-background z-10 border-r group-hover:bg-gradient-to-r group-hover:from-primary/5 group-hover:to-transparent transition-colors">
                      <span className="truncate max-w-[200px] block" title={item.className}>
                        {item.className}
                      </span>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">{item.year}</td>
                    <td className="p-2 text-sm text-muted-foreground">{item.grade}</td>
                    <td className="p-2 text-sm font-medium">{item.componentName}</td>
                    <td className="p-2">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-full max-w-[100px]">
                          <Progress
                            value={(convertedScore / 10) * 100}
                            className="h-2.5 shadow-sm"
                          />
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getScoreBgColor(item.averageScore)}`}>
                          <span className={`text-xs font-bold ${getScoreColor(item.averageScore)}`}>
                            {convertedScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors">
                      <Badge className={`${getPercentileColor(item.percentile_0_2_5)} border-0`}>
                        {item.percentile_0_2_5.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors">
                      <Badge className={`${getPercentileColor(item.percentile_2_5_5_0)} border-0`}>
                        {item.percentile_2_5_5_0.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors">
                      <Badge className={`${getPercentileColor(item.percentile_5_0_7_5)} border-0`}>
                        {item.percentile_5_0_7_5.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors">
                      <Badge className={`${getPercentileColor(item.percentile_7_5_10)} border-0`}>
                        {item.percentile_7_5_10.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo melhorado */}
      {sortedData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-primary/5 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <FaChartBar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Registros</p>
                <p className="text-xl font-bold text-foreground">{sortedData.length}</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <FaChartBar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Média Geral</p>
                <p className="text-xl font-bold text-foreground">
                  {(
                    sortedData.reduce((sum, item) => sum + convertScore(item.averageScore), 0) /
                    sortedData.length
                  ).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/20">
                <FaChartBar className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Componentes Únicos</p>
                <p className="text-xl font-bold text-foreground">
                  {new Set(sortedData.map((item) => item.componentName)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "Nenhum resultado encontrado para a busca." : "Nenhum dado disponível."}
          </p>
        </div>
      )}
    </div>
  )
}
