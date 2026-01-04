"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Search } from "lucide-react"
import { FaFileExcel, FaFileAlt, FaArrowUp, FaArrowDown, FaChartBar } from "react-icons/fa"
import * as XLSX from "xlsx"
import { ItemAnalysisResponse } from "@/lib/api/analytics"
import { TeacherClass } from "@/lib/api/bookings"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [sortBy, setSortBy] = useState<"mais-dificil" | "mais-facil" | "ordem">("mais-dificil")

  // Ordenar questões
  const sortedQuestions = [...data.questions].sort((a, b) => {
    if (sortBy === "mais-dificil") {
      return a.correctRate - b.correctRate // Menor taxa = mais difícil
    } else if (sortBy === "mais-facil") {
      return b.correctRate - a.correctRate // Maior taxa = mais fácil
    } else {
      return a.order - b.order // Ordem original
    }
  })

  // Filtrar estudantes por busca
  const filteredStudents = data.students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDesempenhoColor = (percentual: number) => {
    if (percentual >= 80) return "text-green-600 dark:text-green-400"
    if (percentual >= 60) return "text-blue-600 dark:text-blue-400"
    if (percentual >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getDesempenhoBgColor = (percentual: number) => {
    if (percentual >= 80) return "bg-green-500/10 border-green-500/20"
    if (percentual >= 60) return "bg-blue-500/10 border-blue-500/20"
    if (percentual >= 40) return "bg-yellow-500/10 border-yellow-500/20"
    return "bg-red-500/10 border-red-500/20"
  }

  const getDesempenhoDotColor = (percentual: number) => {
    if (percentual >= 80) return "bg-green-600 dark:bg-green-400"
    if (percentual >= 60) return "bg-blue-600 dark:bg-blue-400"
    if (percentual >= 40) return "bg-yellow-600 dark:bg-yellow-400"
    return "bg-red-600 dark:bg-red-400"
  }

  const getQuestionDifficultyColor = (correctRate: number) => {
    if (correctRate >= 0.8) return "text-green-600 dark:text-green-400 bg-green-500/10"
    if (correctRate >= 0.6) return "text-blue-600 dark:text-blue-400 bg-blue-500/10"
    if (correctRate >= 0.4) return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10"
    return "text-red-600 dark:text-red-400 bg-red-500/10"
  }

  const handleDownloadCSV = () => {
    // Criar cabeçalho CSV
    const headers = [
      "Nome do Estudante",
      "Taxa de Acerto (%)",
      "Total de Acertos",
      ...sortedQuestions.map((q) => `Q${q.order} (${(q.correctRate * 100).toFixed(0)}%)`),
    ]

    // Criar linhas de dados
    const rows = filteredStudents.map((student) => {
      const totalCorrect = student.answers.filter((a) => a.isCorrect).length
      const row = [
        student.name,
        (student.correctRate * 100).toFixed(1),
        totalCorrect.toString(),
        ...sortedQuestions.map((question) => {
          const answer = student.answers.find((a) => a.questionId === question.id)
          return answer?.isCorrect ? "Acertou" : "Errou"
        }),
      ]
      return row
    })

    // Adicionar linha de resumo
    const summaryRow = [
      "RESUMO",
      (data.summary.averageCorrectRate * 100).toFixed(1),
      data.summary.totalStudents.toString(),
      ...sortedQuestions.map((q) => `${(q.correctRate * 100).toFixed(1)}%`),
    ]

    // Combinar tudo
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      summaryRow.map((cell) => `"${cell}"`).join(","),
    ].join("\n")

    // Criar blob e download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `analise-itens-admission-${admissionId}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadExcel = () => {
    // Criar cabeçalho
    const headers = [
      "Nome do Estudante",
      "Taxa de Acerto (%)",
      "Total de Acertos",
      ...sortedQuestions.map((q) => `Q${q.order} (${(q.correctRate * 100).toFixed(0)}%)`),
    ]

    // Criar linhas de dados
    const rows = filteredStudents.map((student) => {
      const totalCorrect = student.answers.filter((a) => a.isCorrect).length
      return [
        student.name,
        parseFloat((student.correctRate * 100).toFixed(2)),
        totalCorrect,
        ...sortedQuestions.map((question) => {
          const answer = student.answers.find((a) => a.questionId === question.id)
          return answer?.isCorrect ? "Acertou" : "Errou"
        }),
      ]
    })

    // Adicionar linha de resumo
    const summaryRow = [
      "RESUMO",
      parseFloat((data.summary.averageCorrectRate * 100).toFixed(2)),
      data.summary.totalStudents,
      ...sortedQuestions.map((q) => `${(q.correctRate * 100).toFixed(0)}%`),
    ]

    // Criar workbook e worksheet
    const worksheetData = [headers, ...rows, summaryRow]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Estilizar cabeçalho (negrito)
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E0E0E0" } },
      }
    }

    // Estilizar linha de resumo
    const summaryRowIndex = rows.length + 1
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: summaryRowIndex, c: col })
      if (!worksheet[cellAddress]) continue
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F0F0F0" } },
      }
    }

    // Criar workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Análise de Itens")

    // Ajustar largura das colunas
    const colWidths = headers.map((header, index) => {
      if (index === 0) return { wch: 30 } // Nome do estudante
      if (index === 1) return { wch: 15 } // Taxa de acerto
      if (index === 2) return { wch: 15 } // Total de acertos
      return { wch: 12 } // Questões
    })
    worksheet["!cols"] = colWidths

    // Gerar arquivo Excel
    const fileName = `analise-itens-admission-${admissionId}-${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div className="space-y-4">
        {/* Filtros e controles melhorados */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar estudante..."
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
                <SelectItem value="mais-dificil">
                  <div className="flex items-center gap-2">
                    <FaArrowDown className="h-4 w-4 text-red-500" />
                    Mais difícil primeiro
                  </div>
                </SelectItem>
                <SelectItem value="mais-facil">
                  <div className="flex items-center gap-2">
                    <FaArrowUp className="h-4 w-4 text-green-500" />
                    Mais fácil primeiro
                  </div>
                </SelectItem>
                <SelectItem value="ordem">Ordem original</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                      <span>Estudante</span>
                      <Badge variant="outline" className="text-xs">
                        {filteredStudents.length}
                      </Badge>
                    </div>
                  </th>
                  <th className="text-center p-2 font-bold text-sm min-w-[140px] bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex flex-col items-center gap-1">
                      <span>Desempenho</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Taxa de acerto
                      </span>
                    </div>
                  </th>
                  {sortedQuestions.map((question, index) => (
                    <th 
                      key={question.id} 
                      className="text-center p-2 font-semibold text-sm min-w-[90px] border-l border-border/50 hover:bg-muted/20 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-bold ${getQuestionDifficultyColor(question.correctRate)}`}
                        >
                          Q{question.order}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs">
                          {question.correctRate >= 0.6 ? (
                            <FaArrowUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <FaArrowDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className="font-medium">
                            {(question.correctRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, studentIndex) => (
                  <tr 
                    key={student.userId} 
                    className="border-b hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 group"
                    style={{ animationDelay: `${studentIndex * 30}ms` }}
                  >
                    <td className="p-2 font-semibold text-sm sticky left-0 bg-background z-10 border-r group-hover:bg-gradient-to-r group-hover:from-primary/5 group-hover:to-transparent transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getDesempenhoDotColor(student.correctRate * 100)}`} />
                        <span className="truncate max-w-[200px]" title={student.name}>
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-full max-w-[120px]">
                          <Progress
                            value={student.correctRate * 100}
                            className="h-2.5 shadow-sm"
                          />
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getDesempenhoBgColor(student.correctRate * 100)}`}>
                          <span className={`text-xs font-bold ${getDesempenhoColor(student.correctRate * 100)}`}>
                            {(student.correctRate * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({student.answers.filter(a => a.isCorrect).length}/{student.answers.length})
                          </span>
                        </div>
                      </div>
                    </td>
                    {sortedQuestions.map((question, qIndex) => {
                      const answer = student.answers.find((a) => a.questionId === question.id)
                      const isCorrect = answer?.isCorrect ?? false
                      return (
                        <td 
                          key={question.id} 
                          className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-center">
                            {isCorrect ? (
                              <div className="p-1 rounded-full bg-green-500/10 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <div className="p-1 rounded-full bg-red-500/10 group-hover:scale-110 transition-transform">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumo melhorado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-primary/5 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <FaChartBar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Estudantes</p>
                <p className="text-xl font-bold text-foreground">{data.summary.totalStudents}</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <FaFileExcel className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Questões</p>
                <p className="text-xl font-bold text-foreground">{data.summary.totalQuestions}</p>
              </div>
            </div>
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${getDesempenhoBgColor(data.summary.averageCorrectRate * 100)} border`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${getDesempenhoBgColor(data.summary.averageCorrectRate * 100)}`}>
                {data.summary.averageCorrectRate >= 0.6 ? (
                  <FaArrowUp className={`h-4 w-4 ${getDesempenhoColor(data.summary.averageCorrectRate * 100)}`} />
                ) : (
                  <FaArrowDown className={`h-4 w-4 ${getDesempenhoColor(data.summary.averageCorrectRate * 100)}`} />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Média de Acerto</p>
                <p className={`text-xl font-bold ${getDesempenhoColor(data.summary.averageCorrectRate * 100)}`}>
                  {(data.summary.averageCorrectRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
