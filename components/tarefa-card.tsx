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
    <Card size="sm" className={`group flex flex-col transition-all duration-300 border-l-[3px] ${
      concluida 
        ? "border-l-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer" 
        : atrasada
        ? "border-l-destructive/60 hover:shadow-md hover:shadow-destructive/5 hover:-translate-y-0.5"
        : "border-l-accent hover:shadow-md hover:shadow-accent/5 hover:-translate-y-0.5"
    }`}>
      <CardHeader className="pb-1.5 px-3 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight group-hover:text-accent-foreground transition-colors">
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
      <CardContent className="space-y-1.5 pt-0 px-3 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/50 group-hover:bg-accent/10 transition-colors">
            <Calendar className="h-3 w-3" />
          </div>
          <span className="flex-1">
            {formatarDataComHorario(new Date(tarefa.dataInicio), "Início")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/50 group-hover:bg-accent/10 transition-colors">
            <Calendar className="h-3 w-3" />
          </div>
          <span className="flex-1">
            {formatarDataComHorario(new Date(tarefa.dataFim), "Término")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/50 group-hover:bg-accent/10 transition-colors">
            <BookOpen className="h-3 w-3" />
          </div>
          <span className="flex-1">{tarefa.questoes.length} questões</span>
        </div>
        {role === "professor" && tarefa.turmaNome && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
            <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/50 group-hover:bg-accent/10 transition-colors">
              <Clock className="h-3 w-3" />
            </div>
            <span className="flex-1">Turma: {tarefa.turmaNome}</span>
          </div>
        )}
      </CardContent>
      {role === "aluno" && isAtiva && !concluida && (
        <CardFooter className="pt-1.5 px-3 mt-auto border-t">
          <Button
            onClick={onVerDetalhes}
            variant="outline"
            className="w-full gap-1.5 hover:bg-accent/5 transition-all h-8"
            size="sm"
          >
            Iniciar atividade
          </Button>
        </CardFooter>
      )}
      {role === "aluno" && concluida && (
        <CardFooter className="pt-1.5 px-3 mt-auto border-t border-primary/10">
          <Button
            onClick={onIniciar}
            variant="outline"
            className="w-full gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all h-8"
            size="sm"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Ver Estatísticas
          </Button>
        </CardFooter>
      )}
      {role === "professor" && (
        <CardFooter className="pt-1.5 px-3 mt-auto border-t">
          <Button 
            onClick={onVerDetalhes} 
            variant="outline" 
            className="w-full hover:bg-accent/5 transition-all h-8" 
            size="sm"
          >
            {tarefa.status === "finalizada" ? "Ver Detalhes e Relatório" : "Ver Detalhes"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
