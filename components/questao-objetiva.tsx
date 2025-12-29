"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Questao } from "@/lib/types"
import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestaoObjetivaProps {
  questao: Questao
  respostaAtual?: string
  onResponder: (resposta: string) => void
}

export function QuestaoObjetiva({
  questao,
  respostaAtual,
  onResponder,
}: QuestaoObjetivaProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg flex-1">{questao.enunciado}</CardTitle>
          <Badge variant="outline">Objetiva</Badge>
        </div>
        {questao.habilidade && (
          <div className="text-sm text-muted-foreground mt-2">
            Habilidade: {questao.habilidade}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {questao.alternativas?.map((alternativa, index) => {
            const letra = String.fromCharCode(65 + index) // A, B, C, D
            const isSelecionada = respostaAtual === alternativa

            return (
              <Button
                key={index}
                variant={isSelecionada ? "default" : "outline"}
                className={cn(
                  "w-full justify-start h-auto py-4 px-4 text-left",
                  isSelecionada && "bg-primary text-primary-foreground"
                )}
                onClick={() => onResponder(alternativa)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                      isSelecionada
                        ? "border-primary-foreground"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelecionada ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{letra}</span>
                    )}
                  </div>
                  <span className="flex-1">{alternativa}</span>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

