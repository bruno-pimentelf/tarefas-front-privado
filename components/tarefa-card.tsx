"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tarefa } from "@/lib/types"
import { Calendar, Clock, BookOpen, Play } from "lucide-react"
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
  const isAgendada = tarefa.status === "agendada"
  const isFinalizada = tarefa.status === "finalizada"

  const getComponenteColor = (componente: string) => {
    return componente === "Matemática" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" : "bg-green-500/10 text-green-700 dark:text-green-400"
  }

  return (
    <Card className={`transition-all hover:shadow-sm ${concluida ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold leading-tight mb-1">
              {tarefa.titulo}
            </CardTitle>
            {tarefa.descricao && (
              <CardDescription className="text-sm line-clamp-2 mt-1">
                {tarefa.descricao}
              </CardDescription>
            )}
          </div>
          <Badge className={`${getComponenteColor(tarefa.componente)} shrink-0`}>
            {tarefa.componente}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
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
        <div className="flex items-center gap-2 pt-1">
          {isAtiva && (
            <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
              Ativa
            </Badge>
          )}
          {isAgendada && (
            <Badge variant="secondary" className="text-xs">
              Agendada
            </Badge>
          )}
          {isFinalizada && (
            <Badge variant="outline" className="text-xs">
              Finalizada
            </Badge>
          )}
          {concluida && (
            <Badge variant="default" className="bg-primary/10 text-primary text-xs">
              Concluída
            </Badge>
          )}
        </div>
      </CardContent>
      {role === "aluno" && isAtiva && !concluida && (
        <CardFooter className="pt-3">
          <Button onClick={onIniciar} className="w-full gap-2" size="default">
            <Play className="h-4 w-4" />
            Iniciar Tarefa
          </Button>
        </CardFooter>
      )}
      {role === "professor" && (
        <CardFooter className="pt-3">
          <Button onClick={onVerDetalhes} variant="outline" className="w-full" size="default">
            Ver Detalhes e Relatórios
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

