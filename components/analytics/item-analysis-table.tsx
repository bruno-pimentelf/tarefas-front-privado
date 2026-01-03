"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Search, Download } from "lucide-react"
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-blue-600 dark:text-blue-400">
            ANÁLISE DOS ITENS
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros e controles */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Pesquisa"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Ordenar questões:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="mais-dificil">Mais difícil</option>
              <option value="mais-facil">Mais fácil</option>
              <option value="ordem">Ordem original</option>
            </select>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Planilha
          </Button>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-semibold text-sm sticky left-0 bg-background z-10">
                  Nome do Estudante
                </th>
                <th className="text-center p-2 font-semibold text-sm min-w-[120px]">
                  Acertos
                </th>
                {sortedQuestions.map((question) => (
                  <th key={question.id} className="text-center p-2 font-semibold text-sm min-w-[80px]">
                    <div className="flex flex-col items-center">
                      <span>{question.order}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {(question.correctRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.userId} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium text-sm sticky left-0 bg-background z-10">
                    {student.name}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col items-center gap-1">
                      <Progress
                        value={student.correctRate * 100}
                        className="w-full h-2"
                      />
                      <span className={`text-xs font-semibold ${getDesempenhoColor(student.correctRate * 100)}`}>
                        {(student.correctRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  {sortedQuestions.map((question) => {
                    const answer = student.answers.find((a) => a.questionId === question.id)
                    const isCorrect = answer?.isCorrect ?? false
                    return (
                      <td key={question.id} className="p-2 text-center">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <div>
            Total de estudantes: <span className="font-semibold text-foreground">{data.summary.totalStudents}</span>
          </div>
          <div>
            Total de questões: <span className="font-semibold text-foreground">{data.summary.totalQuestions}</span>
          </div>
          <div>
            Taxa média de acerto:{" "}
            <span className="font-semibold text-foreground">
              {(data.summary.averageCorrectRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
