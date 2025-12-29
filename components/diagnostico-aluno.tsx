"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DiagnosticoAluno as DiagnosticoAlunoType } from "@/lib/types"
import { AlertCircle, TrendingUp, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface DiagnosticoAlunoProps {
  diagnostico: DiagnosticoAlunoType
}

export function DiagnosticoAluno({ diagnostico }: DiagnosticoAlunoProps) {
  const getComponenteColor = (componente: string) => {
    return componente === "Matemática"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      : "bg-green-500/10 text-green-700 dark:text-green-400"
  }

  const getPercentualColor = (percentual: number) => {
    if (percentual >= 80) return "text-green-600 dark:text-green-400"
    if (percentual >= 60) return "text-blue-600 dark:text-blue-400"
    if (percentual >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-primary" />
          Diagnóstico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {diagnostico.areasMelhoria.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
              <span>Áreas para Melhorar</span>
            </div>
            <div className="space-y-2">
              {diagnostico.areasMelhoria.map((area, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge className={getComponenteColor(area.componente)} variant="outline">
                        {area.componente}
                      </Badge>
                      <span className="text-sm font-medium">{area.habilidade}</span>
                    </div>
                    <span className={cn("text-xs font-semibold shrink-0", getPercentualColor(area.percentual))}>
                      {area.percentual}%
                    </span>
                  </div>
                  <Progress value={area.percentual} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {diagnostico.pontosFortes.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <BookOpen className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span>Pontos Fortes</span>
            </div>
            <div className="space-y-1.5">
              {diagnostico.pontosFortes.map((ponto, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className={getComponenteColor(ponto.componente)} variant="outline">
                      {ponto.componente}
                    </Badge>
                    <span className="text-muted-foreground">{ponto.habilidade}</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {ponto.percentual}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

