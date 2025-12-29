"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Gamificacao } from "@/lib/types"
import { Trophy, Award, Target, CheckCircle2 } from "lucide-react"

interface GamificationProps {
  gamificacao: Gamificacao
}

export function Gamification({ gamificacao }: GamificationProps) {
  const progressoXP = (gamificacao.xp / gamificacao.xpProximoNivel) * 100

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Nível {gamificacao.nivel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Experiência</span>
              <span className="text-muted-foreground">
                {gamificacao.xp} / {gamificacao.xpProximoNivel} XP
              </span>
            </div>
            <Progress value={progressoXP} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className="text-center">
              <div className="text-xl font-semibold">{gamificacao.progresso.tarefasCompletas}</div>
              <div className="text-xs text-muted-foreground mt-1">Tarefas</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">{gamificacao.progresso.sequenciaDias}</div>
              <div className="text-xs text-muted-foreground mt-1">Dias seguidos</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">{gamificacao.progresso.melhorSequencia}</div>
              <div className="text-xs text-muted-foreground mt-1">Melhor sequência</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {gamificacao.conquistas.map((conquista) => (
              <div
                key={conquista.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  conquista.desbloqueada
                    ? "bg-muted/30 border-primary/20"
                    : "bg-muted/10 border-border opacity-50"
                }`}
              >
                <div className="mt-0.5">
                  {conquista.desbloqueada ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Target className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{conquista.titulo}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {conquista.descricao}
                  </div>
                </div>
                {conquista.desbloqueada && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Concluída
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

