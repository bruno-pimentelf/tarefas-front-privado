"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tarefa } from "@/lib/types"
import { Calendar, BookOpen, Play, BarChart3, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"

interface TarefaCardProps {
  tarefa: Tarefa
  onIniciar?: () => void
  onVerDetalhes?: () => void
  role?: "aluno" | "professor"
  concluida?: boolean
  atrasada?: boolean
}

export function TarefaCard({
  tarefa,
  onIniciar,
  onVerDetalhes,
  role = "aluno",
  concluida = false,
  atrasada = false,
}: TarefaCardProps) {
  const isAtiva = tarefa.status === "ativa"

  // Função para formatar horário no formato brasileiro (17h, 18h30min)
  const formatarHorario = (data: Date): string => {
    const horas = data.getHours()
    const minutos = data.getMinutes()
    
    if (minutos === 0) {
      return `${horas}h`
    } else {
      return `${horas}h${minutos.toString().padStart(2, "0")}min`
    }
  }

  // Função para formatar data com mês capitalizado
  const formatarDataComHorario = (data: Date, label: string): string => {
    const dataFormatada = format(data, "dd 'de' MMMM", { locale: ptBR })
    // Capitaliza a primeira letra e a primeira letra do mês (após "de ")
    const partes = dataFormatada.split(" de ")
    const dia = partes[0]
    const mes = partes[1] ? partes[1].charAt(0).toUpperCase() + partes[1].slice(1) : ""
    const dataCapitalizada = `${dia} de ${mes}`
    const horario = formatarHorario(data)
    return `${label}: ${dataCapitalizada}, às ${horario}`
  }

  return (
    <Card className={`flex flex-col transition-all ${concluida ? "hover:shadow-md hover:border-primary/30 cursor-pointer" : "hover:shadow-sm"}`}>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            {formatarDataComHorario(new Date(tarefa.dataInicio), "Início")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            {formatarDataComHorario(new Date(tarefa.dataFim), "Término")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span>{tarefa.questoes.length} questões</span>
        </div>
        {role === "professor" && tarefa.turmaNome && (
          <div className="text-xs text-muted-foreground">
            Turma: {tarefa.turmaNome}
          </div>
        )}
      </CardContent>
      {role === "aluno" && isAtiva && !concluida && (
        <CardFooter className="pt-2 mt-auto">
          <Button
            onClick={onVerDetalhes}
            variant="outline"
            className="w-full gap-1.5"
            size="default"
          >
            Ver Detalhes
          </Button>
        </CardFooter>
      )}
      {role === "aluno" && concluida && (
        <CardFooter className="pt-2 mt-auto">
          <Button
            onClick={onIniciar}
            variant="outline"
            className="w-full gap-1.5 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            size="default"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Ver Estatísticas
          </Button>
        </CardFooter>
      )}
      {role === "professor" && (
        <CardFooter className="pt-2 mt-auto">
          <Button onClick={onVerDetalhes} variant="outline" className="w-full" size="default">
            {tarefa.status === "finalizada" ? "Ver Detalhes e Relatório" : "Ver Detalhes"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
