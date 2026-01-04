"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search } from "lucide-react"
import { FaFileExcel, FaFileAlt, FaChartBar } from "react-icons/fa"
import * as XLSX from "xlsx"
import { ItemAnalysisResponse } from "@/lib/api/analytics"
import { TeacherClass } from "@/lib/api/bookings"

interface ItemAnalysisTableProps {
  data: ItemAnalysisResponse
  admissionId: number
  classIds?: number[]
  availableClasses?: TeacherClass[]
}

export function ItemAnalysisTable({
  data,
  admissionId,
  classIds,
  availableClasses = [],
}: ItemAnalysisTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"itemNumber" | "accuracy" | "component">("itemNumber")

  // Filtrar e ordenar dados
  const filteredData = data.items.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.itemNumber.toString().includes(searchLower) ||
      item.componentName.toLowerCase().includes(searchLower) ||
      (item.difficulty && item.difficulty.toLowerCase().includes(searchLower))
    )
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "itemNumber") {
      return a.itemNumber - b.itemNumber
    } else if (sortBy === "accuracy") {
      return b.accuracyRate - a.accuracyRate
    } else {
      return a.componentName.localeCompare(b.componentName)
    }
  })

  // Funções de cor baseadas em taxa de acerto
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.75) return "text-green-600 dark:text-green-400"
    if (accuracy >= 0.5) return "text-blue-600 dark:text-blue-400"
    if (accuracy >= 0.25) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 0.75) return "bg-green-500/10 border-green-500/20"
    if (accuracy >= 0.5) return "bg-blue-500/10 border-blue-500/20"
    if (accuracy >= 0.25) return "bg-yellow-500/10 border-yellow-500/20"
    return "bg-red-500/10 border-red-500/20"
  }

  // Exportação CSV
  const handleDownloadCSV = () => {
    const headers = [
      "Item",
      "Componente",
      "Acertos",
      "Total",
      "Taxa de Acerto (%)",
      "Dificuldade",
    ]

    const rows = sortedData.map((item) => [
      item.itemNumber,
      item.componentName,
      item.correctAnswers,
      item.totalAnswers,
      (item.accuracyRate * 100).toFixed(2),
      item.difficulty || "-",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `analise-itens-admission-${admissionId}-${new Date().toISOString().split("T")[0]}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportação Excel
  const handleDownloadExcel = () => {
    const headers = [
      "Item",
      "Componente",
      "Acertos",
      "Total",
      "Taxa de Acerto (%)",
      "Dificuldade",
    ]

    const rows = sortedData.map((item) => [
      item.itemNumber,
      item.componentName,
      item.correctAnswers,
      item.totalAnswers,
      (item.accuracyRate * 100).toFixed(2),
      item.difficulty || "-",
    ])

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Análise de Itens")
    XLSX.writeFile(
      workbook,
      `analise-itens-admission-${admissionId}-${new Date().toISOString().split("T")[0]}.xlsx`
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Análise de Itens</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {data.totalItems} itens • Taxa média de acerto: {(data.averageAccuracy * 100).toFixed(2)}%
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className="gap-2"
            >
              <FaFileAlt className="h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              className="gap-2"
            >
              <FaFileExcel className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Barra de busca e filtros */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por item, componente ou dificuldade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "itemNumber" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("itemNumber")}
            >
              Item
            </Button>
            <Button
              variant={sortBy === "accuracy" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("accuracy")}
            >
              Taxa de Acerto
            </Button>
            <Button
              variant={sortBy === "component" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("component")}
            >
              Componente
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <div className="min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-muted/50 to-muted/30 border-b-2">
                  <th className="text-left p-2 font-bold text-sm">Item</th>
                  <th className="text-left p-2 font-bold text-sm">Componente</th>
                  <th className="text-center p-2 font-bold text-sm">Acertos</th>
                  <th className="text-center p-2 font-bold text-sm">Total</th>
                  <th className="text-center p-2 font-bold text-sm min-w-[200px]">Taxa de Acerto</th>
                  <th className="text-center p-2 font-bold text-sm">Dificuldade</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum item encontrado
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item) => (
                    <tr key={item.itemId} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-2 font-medium">{item.itemNumber}</td>
                      <td className="p-2">{item.componentName}</td>
                      <td className="p-2 text-center">{item.correctAnswers}</td>
                      <td className="p-2 text-center">{item.totalAnswers}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Progress value={item.accuracyRate * 100} className="flex-1" />
                          <span className={`text-sm font-medium w-16 text-right ${getAccuracyColor(item.accuracyRate)}`}>
                            {(item.accuracyRate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        {item.difficulty ? (
                          <Badge
                            variant="outline"
                            className={getAccuracyBgColor(item.accuracyRate)}
                          >
                            {item.difficulty}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estatísticas resumidas */}
        {sortedData.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Itens com alta taxa de acerto (≥75%)</div>
                <div className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                  {sortedData.filter((item) => item.accuracyRate >= 0.75).length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Itens com baixa taxa de acerto (&lt;25%)</div>
                <div className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
                  {sortedData.filter((item) => item.accuracyRate < 0.25).length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Taxa média de acerto</div>
                <div className="text-2xl font-bold mt-1">
                  {sortedData.length > 0
                    ? (
                        sortedData.reduce((sum, item) => sum + item.accuracyRate, 0) /
                        sortedData.length
                      ).toFixed(1)
                    : "0.0"}
                  %
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
