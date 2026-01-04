"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tarefa } from "@/lib/types"
import { FaCalendar, FaBook, FaChartBar, FaClock, FaRocket } from "react-icons/fa"
import { Eye } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"

interface TarefaCardProps {
  tarefa: Tarefa
  onIniciar?: () => void
  onVerDetalhes?: () => void
  role?: "aluno" | "professor"
  concluida?: boolean
  atrasada?: boolean
  style?: React.CSSProperties
}

export function TarefaCard({
  tarefa,
  onIniciar,
  onVerDetalhes,
  role = "aluno",
  concluida = false,
  atrasada = false,
  style,
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

  // Determinar cores e estilos baseados no status
  const getCardStyles = () => {
    if (concluida) {
      return {
        border: "border-l border-l-primary",
        hover: "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        gradient: "from-primary/3 via-transparent to-primary/3",
      }
    }
    if (atrasada) {
      return {
        border: "border-l border-l-destructive/60",
        hover: "hover:shadow-lg hover:shadow-destructive/5 hover:-translate-y-0.5",
        gradient: "from-destructive/3 via-transparent to-destructive/3",
      }
    }
    return {
      border: "border-l border-l-accent/60",
      hover: "hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5",
      gradient: "from-accent/3 via-transparent to-primary/3",
    }
  }

  const cardStyles = getCardStyles()

  return (
    <Card 
      size="sm" 
      className={`group relative overflow-hidden flex flex-col transition-all duration-500 ${cardStyles.border} ${cardStyles.hover} cursor-pointer opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]`}
      style={style}
    >
      {/* Background gradient effect - mais sutil */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cardStyles.gradient} opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
      
      <CardHeader className="pb-1.5 px-3 pt-3 space-y-0.5 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors duration-300">
              {tarefa.titulo}
            </CardTitle>
            {tarefa.descricao && (
              <CardDescription className="text-xs line-clamp-2 mt-0.5 text-foreground/60 group-hover:text-foreground/75 transition-colors duration-300">
                {tarefa.descricao}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-1 px-3 flex-1 relative">
        <div className="flex items-center gap-2 text-xs text-foreground/65 group-hover:text-foreground/80 transition-colors duration-300">
          <div className="flex items-center justify-center h-5 w-5 rounded-md bg-muted/40 group-hover:bg-muted/60 transition-colors duration-300">
            <FaCalendar className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="flex-1">
            {formatarDataComHorario(new Date(tarefa.dataInicio), "Início")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground/65 group-hover:text-foreground/80 transition-colors duration-300">
          <div className="flex items-center justify-center h-5 w-5 rounded-md bg-muted/40 group-hover:bg-muted/60 transition-colors duration-300">
            <FaCalendar className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="flex-1">
            {formatarDataComHorario(new Date(tarefa.dataFim), "Término")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground/65 group-hover:text-foreground/80 transition-colors duration-300">
          <div className="flex items-center justify-center h-5 w-5 rounded-md bg-muted/40 group-hover:bg-muted/60 transition-colors duration-300">
            <FaBook className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="flex-1">{tarefa.questoes.length} questões</span>
        </div>
        {role === "professor" && tarefa.turmaNome && (
          <div className="flex items-center gap-2 text-xs text-foreground/65 group-hover:text-foreground/80 transition-colors duration-300">
            <div className="flex items-center justify-center h-5 w-5 rounded-md bg-muted/40 group-hover:bg-muted/60 transition-colors duration-300">
              <FaClock className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="flex-1">Turma: {tarefa.turmaNome}</span>
          </div>
        )}
      </CardContent>
      {role === "aluno" && isAtiva && !concluida && (
        <CardFooter className="pt-2 px-3 mt-auto border-t border-border/50 relative">
          <Button
            onClick={onVerDetalhes}
            variant="outline"
            className="w-full gap-1.5 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 h-8 group/btn"
            size="sm"
          >
            <FaRocket className="h-3.5 w-3.5 text-primary group-hover/btn:rotate-12 transition-transform duration-300" />
            <span className="text-sm font-medium text-foreground group-hover/btn:text-primary transition-colors duration-300">
              Iniciar atividade
            </span>
          </Button>
        </CardFooter>
      )}
      {role === "aluno" && concluida && (
        <CardFooter className="pt-2 px-3 mt-auto border-t border-border/50 relative">
          <Button
            onClick={onIniciar}
            variant="outline"
            className="w-full gap-1.5 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 h-8 group/btn"
            size="sm"
          >
            <FaChartBar className="h-3.5 w-3.5 text-foreground/60 group-hover/btn:text-primary transition-colors duration-300" />
            <span className="text-sm font-medium text-foreground/70 group-hover/btn:text-primary transition-colors duration-300">Ver Estatísticas</span>
          </Button>
        </CardFooter>
      )}
      {role === "professor" && (
        <CardFooter className="pt-2 px-3 mt-auto border-t border-border/50 relative">
          <Button 
            onClick={onVerDetalhes} 
            variant="outline" 
            className="w-full gap-1.5 border border-border/50 hover:border-accent/40 hover:bg-accent/5 transition-all duration-300 h-8 group/btn" 
            size="sm"
          >
            <Eye className="h-3.5 w-3.5 text-foreground/60 group-hover/btn:text-accent transition-colors duration-300" />
            <span className="text-sm font-medium text-foreground/70 group-hover/btn:text-accent-foreground transition-colors duration-300">
              {tarefa.status === "finalizada" ? "Ver Detalhes e Relatório" : "Ver Detalhes"}
            </span>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
