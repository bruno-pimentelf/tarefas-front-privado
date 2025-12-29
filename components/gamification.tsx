"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Gamificacao } from "@/lib/types"
import { Trophy, Zap } from "lucide-react"

interface GamificationProps {
  gamificacao: Gamificacao
}

export function Gamification({ gamificacao }: GamificationProps) {
  const progressoXP = (gamificacao.xp / gamificacao.xpProximoNivel) * 100
  const taxaAcerto = gamificacao.progresso.questoesRespondidas > 0
    ? Math.round((gamificacao.progresso.questoesAcertadas / gamificacao.progresso.questoesRespondidas) * 100)
    : 0

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            Nível {gamificacao.nivel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Experiência</span>
              <span className="text-muted-foreground">
                {gamificacao.xp} / {gamificacao.xpProximoNivel} XP
              </span>
            </div>
            <Progress value={progressoXP} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {gamificacao.xpProximoNivel - gamificacao.xp} XP para o próximo nível
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">XP Total</span>
              <span className="font-semibold">{gamificacao.xpTotal} XP</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="font-semibold">{gamificacao.historicoPontos.tarefas}</div>
                <div className="text-muted-foreground">Tarefas</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="font-semibold">{gamificacao.historicoPontos.questoes}</div>
                <div className="text-muted-foreground">Questões</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="font-semibold">{gamificacao.historicoPontos.acertos}</div>
                <div className="text-muted-foreground">Acertos</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-base font-semibold">{gamificacao.progresso.tarefasCompletas}</div>
              <div className="text-xs text-muted-foreground">Tarefas</div>
            </div>
            <div className="text-center">
              <div className="text-base font-semibold">{taxaAcerto}%</div>
              <div className="text-xs text-muted-foreground">Taxa de acerto</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Sistema de Pontos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
            <span className="text-muted-foreground">Tarefa concluída</span>
            <span className="font-semibold">+{gamificacao.pontosPorTarefa} XP</span>
          </div>
          <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
            <span className="text-muted-foreground">Questão respondida</span>
            <span className="font-semibold">+{gamificacao.pontosPorQuestao} XP</span>
          </div>
          <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
            <span className="text-muted-foreground">Questão acertada</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              +{gamificacao.pontosPorAcerto} XP
            </span>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

