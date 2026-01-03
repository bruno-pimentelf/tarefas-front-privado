"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentScoresResponse } from "@/lib/api/analytics"
import { AnalyticsFiltersDialog, type AnalyticsFilters } from "./analytics-filters"
import { TeacherClass } from "@/lib/api/bookings"

interface StudentScoresTableProps {
  data: StudentScoresResponse
  admissionId: number
  availableClasses?: TeacherClass[]
  onFiltersChange?: (filters: AnalyticsFilters) => void
  currentFilters?: AnalyticsFilters
}

export function StudentScoresTable({
  data,
  admissionId,
  availableClasses = [],
  onFiltersChange,
  currentFilters = {},
}: StudentScoresTableProps) {
  const [viewMode, setViewMode] = useState<"media" | "acertos" | "porcentagem">("media")
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(currentFilters)

  const handleFiltersChange = (filters: AnalyticsFilters) => {
    setLocalFilters(filters)
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }

  // Converter scores de 0-1 para 0-10
  const convertScore = (score: number | undefined): string => {
    if (score === undefined) return "-"
    const converted = score <= 1 ? score * 10 : score
    return converted.toFixed(1)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-blue-600 dark:text-blue-400">
            Notas por estudante
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
        <div className="flex gap-2 mt-4">
          <Button
            variant={viewMode === "media" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("media")}
          >
            Média
          </Button>
          <Button
            variant={viewMode === "acertos" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("acertos")}
          >
            Número de acertos
          </Button>
          <Button
            variant={viewMode === "porcentagem" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("porcentagem")}
          >
            Porcentagem de acertos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-semibold text-sm">Ranking TRIEduc</th>
                <th className="text-left p-2 font-semibold text-sm">Ranking na escola</th>
                <th className="text-left p-2 font-semibold text-sm">Estudante</th>
                <th className="text-left p-2 font-semibold text-sm">Login</th>
                <th className="text-left p-2 font-semibold text-sm">Turma</th>
                <th className="text-center p-2 font-semibold text-sm">Linguagens e códigos</th>
                <th className="text-center p-2 font-semibold text-sm">Matemática</th>
                <th className="text-center p-2 font-semibold text-sm">Ciências da Natureza</th>
                <th className="text-center p-2 font-semibold text-sm">Ciências Humanas</th>
                <th className="text-center p-2 font-semibold text-sm">Redação</th>
                <th className="text-center p-2 font-semibold text-sm">Média geral</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((student, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="p-2 text-sm">{student.rankingTrieduc}</td>
                  <td className="p-2 text-sm font-semibold">{student.rankingSchool}</td>
                  <td className="p-2 text-sm font-medium">
                    <a href="#" className="hover:underline text-blue-600 dark:text-blue-400">
                      {student.studentName}
                    </a>
                  </td>
                  <td className="p-2 text-sm text-muted-foreground">{student.email}</td>
                  <td className="p-2 text-sm">{student.className}</td>
                  <td className="p-2 text-center text-sm">
                    {convertScore(student.componentScores.LC)}
                  </td>
                  <td className="p-2 text-center text-sm">
                    {convertScore(student.componentScores.MT)}
                  </td>
                  <td className="p-2 text-center text-sm">
                    {convertScore(student.componentScores.CN)}
                  </td>
                  <td className="p-2 text-center text-sm">
                    {convertScore(student.componentScores.CH)}
                  </td>
                  <td className="p-2 text-center text-sm">
                    {student.essayScore !== null ? (
                      <a href="#" className="hover:underline text-blue-600 dark:text-blue-400">
                        {convertScore(student.essayScore)}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2 text-center text-sm font-semibold">
                    {convertScore(student.averageScore)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
