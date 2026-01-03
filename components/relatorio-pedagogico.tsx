"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RelatorioPedagogico as RelatorioType } from "@/lib/types"
import { BarChart3, Users, Clock, Target } from "lucide-react"

interface RelatorioPedagogicoProps {
  relatorio: RelatorioType
}

export function RelatorioPedagogico({ relatorio }: RelatorioPedagogicoProps) {
  const getDesempenhoColor = (percentual: number) => {
    if (percentual >= 80) return "text-green-600 dark:text-green-400"
    if (percentual >= 60) return "text-blue-600 dark:text-blue-400"
    if (percentual >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold">{relatorio.tarefaTitulo}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {relatorio.componente} • {relatorio.totalAlunos} alunos
            </CardDescription>
          </div>
          <Badge
            className={`${
              relatorio.componente === "Matemática"
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                : "bg-green-500/10 text-green-700 dark:text-green-400"
            } shrink-0 text-xs`}
          >
            {relatorio.componente}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Users className="h-3.5 w-3.5" />
              Conclusão
            </div>
            <div className="text-xl font-semibold mb-0.5">{relatorio.taxaConclusao.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              {relatorio.alunosCompletaram}/{relatorio.totalAlunos} alunos
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Target className="h-3.5 w-3.5" />
              Desempenho Médio
            </div>
            <div className={`text-xl font-semibold ${getDesempenhoColor(relatorio.desempenhoMedio)}`}>
              {relatorio.desempenhoMedio.toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Clock className="h-3.5 w-3.5" />
              Tempo Médio/Questão
            </div>
            <div className="text-xl font-semibold">{relatorio.tempoMedioPorQuestao}s</div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Clock className="h-3.5 w-3.5" />
              Tempo Total Médio
            </div>
            <div className="text-xl font-semibold">
              {Math.floor(relatorio.tempoTotalMedio / 60)}min
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-xs flex items-center gap-1.5 mb-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Desempenho por Habilidade
          </h3>
          <div className="space-y-3">
            {relatorio.desempenhoPorHabilidade.map((habilidade, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{habilidade.habilidade}</span>
                  <span className={getDesempenhoColor(habilidade.percentual)}>
                    {habilidade.percentual}%
                  </span>
                </div>
                <Progress value={habilidade.percentual} />
                <div className="text-xs text-muted-foreground">
                  {habilidade.acertos} acertos de {habilidade.total} alunos
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-xs mb-2">Distribuição de Desempenho</h3>
          <div className="grid grid-cols-4 gap-1.5">
            <div className="text-center p-3 rounded-md bg-green-500/10 border border-green-500/20">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {relatorio.alunosPorDesempenho.excelente}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Excelente</div>
            </div>
            <div className="text-center p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {relatorio.alunosPorDesempenho.bom}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Bom</div>
            </div>
            <div className="text-center p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {relatorio.alunosPorDesempenho.regular}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Regular</div>
            </div>
            <div className="text-center p-3 rounded-md bg-red-500/10 border border-red-500/20">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                {relatorio.alunosPorDesempenho.precisaMelhorar}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Precisa Melhorar</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

