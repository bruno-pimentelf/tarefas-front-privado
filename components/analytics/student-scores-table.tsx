"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search } from "lucide-react"
import { FaFileExcel, FaFileAlt, FaChartBar, FaTrophy, FaUser, FaGraduationCap } from "react-icons/fa"
import * as XLSX from "xlsx"
import { StudentScoresResponse } from "@/lib/api/analytics"
import { TeacherClass } from "@/lib/api/bookings"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StudentScoresTableProps {
  data: StudentScoresResponse
  admissionId: number
  availableClasses?: TeacherClass[]
}

export function StudentScoresTable({
  data,
  admissionId,
  availableClasses = [],
}: StudentScoresTableProps) {
  const [viewMode, setViewMode] = useState<"media" | "acertos" | "porcentagem">("media")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"media" | "ranking" | "nome">("ranking")

  // Converter scores de 0-1 para 0-10
  const convertScore = (score: number | undefined): number => {
    if (score === undefined) return 0
    return score <= 1 ? score * 10 : score
  }

  const formatScore = (score: number | undefined): string => {
    if (score === undefined) return "-"
    return convertScore(score).toFixed(1)
  }

  // Filtrar e ordenar dados
  const filteredData = data.students.filter((student) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.studentName.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.className.toLowerCase().includes(searchLower)
    )
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "media") {
      return convertScore(b.averageScore) - convertScore(a.averageScore)
    } else if (sortBy === "ranking") {
      return a.rankingSchool - b.rankingSchool
    } else {
      return a.studentName.localeCompare(b.studentName)
    }
  })

  // Funções de cor baseadas em desempenho
  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return "text-muted-foreground"
    const convertedScore = convertScore(score)
    if (convertedScore >= 7.5) return "text-green-600 dark:text-green-400"
    if (convertedScore >= 5.0) return "text-blue-600 dark:text-blue-400"
    if (convertedScore >= 2.5) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBgColor = (score: number | undefined) => {
    if (score === undefined) return "bg-muted/10 border-muted/20"
    const convertedScore = convertScore(score)
    if (convertedScore >= 7.5) return "bg-green-500/10 border-green-500/20"
    if (convertedScore >= 5.0) return "bg-blue-500/10 border-blue-500/20"
    if (convertedScore >= 2.5) return "bg-yellow-500/10 border-yellow-500/20"
    return "bg-red-500/10 border-red-500/20"
  }

  const getRankingBadgeColor = (ranking: number, total: number) => {
    const percentile = (ranking / total) * 100
    if (percentile <= 10) return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
    if (percentile <= 25) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
    if (percentile <= 50) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
    return "bg-muted/10 text-muted-foreground border-muted/20"
  }

  // Exportação CSV
  const handleDownloadCSV = () => {
    const headers = [
      "Ranking TRIEduc",
      "Ranking na Escola",
      "Estudante",
      "Login",
      "Turma",
      "Linguagens e Códigos",
      "Matemática",
      "Ciências da Natureza",
      "Ciências Humanas",
      "Redação",
      "Média Geral",
    ]

    const rows = sortedData.map((student) => [
      student.rankingTrieduc.toString(),
      student.rankingSchool.toString(),
      student.studentName,
      student.email,
      student.className,
      student.componentScores?.LC !== undefined ? formatScore(student.componentScores.LC) : "-",
      student.componentScores?.MT !== undefined ? formatScore(student.componentScores.MT) : "-",
      student.componentScores?.CN !== undefined ? formatScore(student.componentScores.CN) : "-",
      student.componentScores?.CH !== undefined ? formatScore(student.componentScores.CH) : "-",
      student.essayScore !== null && student.essayScore !== undefined ? formatScore(student.essayScore) : "-",
      student.averageScore !== undefined ? formatScore(student.averageScore) : "-",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `notas-estudantes-admission-${admissionId}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportação Excel
  const handleDownloadExcel = () => {
    const headers = [
      "Ranking TRIEduc",
      "Ranking na Escola",
      "Estudante",
      "Login",
      "Turma",
      "Linguagens e Códigos",
      "Matemática",
      "Ciências da Natureza",
      "Ciências Humanas",
      "Redação",
      "Média Geral",
    ]

    const rows = sortedData.map((student) => [
      student.rankingTrieduc,
      student.rankingSchool,
      student.studentName,
      student.email,
      student.className,
      student.componentScores?.LC !== undefined ? convertScore(student.componentScores.LC) : null,
      student.componentScores?.MT !== undefined ? convertScore(student.componentScores.MT) : null,
      student.componentScores?.CN !== undefined ? convertScore(student.componentScores.CN) : null,
      student.componentScores?.CH !== undefined ? convertScore(student.componentScores.CH) : null,
      student.essayScore !== null && student.essayScore !== undefined ? convertScore(student.essayScore) : null,
      student.averageScore !== undefined ? convertScore(student.averageScore) : null,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Notas Estudantes")

    const colWidths = [
      { wch: 12 }, // Ranking TRIEduc
      { wch: 12 }, // Ranking na Escola
      { wch: 25 }, // Estudante
      { wch: 25 }, // Login
      { wch: 20 }, // Turma
      { wch: 18 }, // LC
      { wch: 12 }, // MT
      { wch: 20 }, // CN
      { wch: 18 }, // CH
      { wch: 10 }, // Redação
      { wch: 12 }, // Média geral
    ]
    worksheet["!cols"] = colWidths

    const fileName = `notas-estudantes-admission-${admissionId}-${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  // Calcular estatísticas
  const averageScore = sortedData.length > 0
    ? sortedData.reduce((sum, s) => sum + convertScore(s.averageScore), 0) / sortedData.length
    : 0

  const topStudents = sortedData.filter((s) => s.rankingSchool <= 3).length

  return (
    <div className="space-y-4">
      {/* Filtros e controles melhorados */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por estudante, login ou turma..."
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
              <SelectItem value="ranking">Ranking (menor primeiro)</SelectItem>
              <SelectItem value="media">Maior média primeiro</SelectItem>
              <SelectItem value="nome">Nome (A-Z)</SelectItem>
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

      {/* Modo de visualização */}
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
        <span className="text-sm font-medium text-muted-foreground">Visualizar:</span>
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList>
            <TabsTrigger value="media">Média</TabsTrigger>
            <TabsTrigger value="acertos">Número de Acertos</TabsTrigger>
            <TabsTrigger value="porcentagem">Porcentagem</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tabela melhorada */}
      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <div className="min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-muted/50 to-muted/30 border-b-2">
                <th className="text-center p-2 font-bold text-sm sticky left-0 bg-gradient-to-r from-muted/50 to-muted/30 z-20 border-r">
                  <div className="flex flex-col items-center gap-1">
                    <FaTrophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span>Rank</span>
                  </div>
                </th>
                <th className="text-center p-2 font-bold text-sm">
                  <div className="flex flex-col items-center gap-1">
                    <span>Rank</span>
                    <span className="text-xs font-normal text-muted-foreground">Escola</span>
                  </div>
                </th>
                <th className="text-left p-2 font-bold text-sm min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <FaUser className="h-4 w-4" />
                    <span>Estudante</span>
                    <Badge variant="outline" className="text-xs">
                      {sortedData.length}
                    </Badge>
                  </div>
                </th>
                <th className="text-left p-2 font-bold text-sm min-w-[200px]">Login</th>
                <th className="text-left p-2 font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <FaGraduationCap className="h-4 w-4" />
                    <span>Turma</span>
                  </div>
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[120px] border-l border-border/50 hover:bg-muted/20 transition-colors">
                  LC
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[120px] border-l border-border/50 hover:bg-muted/20 transition-colors">
                  MT
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[120px] border-l border-border/50 hover:bg-muted/20 transition-colors">
                  CN
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[120px] border-l border-border/50 hover:bg-muted/20 transition-colors">
                  CH
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[120px] border-l border-border/50 hover:bg-muted/20 transition-colors">
                  Redação
                </th>
                <th className="text-center p-2 font-bold text-sm min-w-[140px] bg-gradient-to-r from-primary/10 to-primary/5 border-l border-border/50">
                  <div className="flex flex-col items-center gap-1">
                    <span>Média Geral</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      (0-10)
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((student, index) => {
                const avgScore = convertScore(student.averageScore)
                return (
                  <tr 
                    key={`${student.email}-${index}`}
                    className="border-b hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 group"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <td className="p-2 text-center sticky left-0 bg-background z-10 border-r group-hover:bg-gradient-to-r group-hover:from-primary/5 group-hover:to-transparent transition-colors">
                      <Badge className={`${getRankingBadgeColor(student.rankingTrieduc, sortedData.length)} border`}>
                        #{student.rankingTrieduc}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <Badge className={`${getRankingBadgeColor(student.rankingSchool, sortedData.length)} border font-semibold`}>
                        #{student.rankingSchool}
                      </Badge>
                    </td>
                    <td className="p-2 font-semibold text-sm">
                      <span className="truncate max-w-[200px] block" title={student.studentName}>
                        {student.studentName}
                      </span>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      <span className="truncate max-w-[200px] block" title={student.email}>
                        {student.email}
                      </span>
                    </td>
                    <td className="p-2 text-sm">{student.className}</td>
                    <td className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors">
                      {student.componentScores?.LC !== undefined ? (
                        <Badge className={`${getScoreBgColor(student.componentScores.LC)} border-0`}>
                          <span className={getScoreColor(student.componentScores.LC)}>
                            {formatScore(student.componentScores.LC)}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors">
                      {student.componentScores?.MT !== undefined ? (
                        <Badge className={`${getScoreBgColor(student.componentScores.MT)} border-0`}>
                          <span className={getScoreColor(student.componentScores.MT)}>
                            {formatScore(student.componentScores.MT)}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors">
                      {student.componentScores?.CN !== undefined ? (
                        <Badge className={`${getScoreBgColor(student.componentScores.CN)} border-0`}>
                          <span className={getScoreColor(student.componentScores.CN)}>
                            {formatScore(student.componentScores.CN)}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors">
                      {student.componentScores?.CH !== undefined ? (
                        <Badge className={`${getScoreBgColor(student.componentScores.CH)} border-0`}>
                          <span className={getScoreColor(student.componentScores.CH)}>
                            {formatScore(student.componentScores.CH)}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center border-l border-border/30 hover:bg-muted/30 transition-colors">
                      {student.essayScore !== null ? (
                        <Badge className={`${getScoreBgColor(student.essayScore)} border-0`}>
                          <span className={getScoreColor(student.essayScore)}>
                            {formatScore(student.essayScore)}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2 border-l border-border/50">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-full max-w-[120px]">
                          <Progress
                            value={(avgScore / 10) * 100}
                            className="h-2.5 shadow-sm"
                          />
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getScoreBgColor(student.averageScore)}`}>
                          <span className={`text-xs font-bold ${getScoreColor(student.averageScore)}`}>
                            {formatScore(student.averageScore)}
                          </span>
                        </div>
                      </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-primary/5 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <FaUser className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Estudantes</p>
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
                <p className="text-xl font-bold text-foreground">{averageScore.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-yellow-500/20">
                <FaTrophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top 3</p>
                <p className="text-xl font-bold text-foreground">{topStudents}</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/20">
                <FaGraduationCap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Turmas Únicas</p>
                <p className="text-xl font-bold text-foreground">
                  {new Set(sortedData.map((s) => s.className)).size}
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
