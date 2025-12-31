"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tarefa } from "@/lib/types"
import { Calendar, BookOpen, Play, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"

interface TarefaCardProps {
  tarefa: Tarefa
  onIniciar?: () => void
  onVerDetalhes?: () => void
  role?: "aluno" | "professor"
  concluida?: boolean
}

export function TarefaCard({
  tarefa,
  onIniciar,
  onVerDetalhes,
  role = "aluno",
  concluida = false,
}: TarefaCardProps) {
  const isAtiva = tarefa.status === "ativa"

  const getComponenteColor = (componente: string) => {
    return componente === "Matemática" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" : "bg-green-500/10 text-green-700 dark:text-green-400"
  }

  return (
    <Card className={`transition-all hover:shadow-sm ${concluida ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight">
              {tarefa.titulo}
            </CardTitle>
            {tarefa.descricao && (
              <CardDescription className="text-xs line-clamp-2 mt-0.5">
                {tarefa.descricao}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={`${getComponenteColor(tarefa.componente)} text-xs`}>
              {tarefa.componente}
            </Badge>
            {tarefa.atrasada && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertCircle className="h-3 w-3" />
                Atrasada
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {format(new Date(tarefa.dataInicio), "dd 'de' MMMM", { locale: ptBR })} -{" "}
            {format(new Date(tarefa.dataFim), "dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span>{tarefa.questoes.length} questões</span>
        </div>
        {role === "professor" && (
          <div className="text-xs text-muted-foreground">
            Turma: {tarefa.turmaNome}
          </div>
        )}
      </CardContent>
      {role === "aluno" && isAtiva && !concluida && (
        <CardFooter className="pt-2">
          <Button onClick={onIniciar} className="w-full gap-1.5" size="default">
            <Play className="h-3.5 w-3.5" />
            Iniciar Tarefa
          </Button>
        </CardFooter>
      )}
      {role === "professor" && (
        <CardFooter className="pt-2">
          <Button onClick={onVerDetalhes} variant="outline" className="w-full" size="default">
            Ver Detalhes e Relatórios
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
