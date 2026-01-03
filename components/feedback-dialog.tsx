"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Questao, Resposta } from "@/lib/types"
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resposta: Resposta
  questao: Questao
}

export function FeedbackDialog({
  open,
  onOpenChange,
  resposta,
  questao,
}: FeedbackDialogProps) {
  const isCorreta = resposta.correta

  // Feedback mockado - na realidade viria da IA
  const feedbackText = isCorreta
    ? "Parabéns! Você acertou esta questão. Continue assim!"
    : `A resposta correta é: ${questao.respostaCorreta}. Continue estudando e você vai melhorar!`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCorreta ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {isCorreta ? "Resposta Correta!" : "Resposta Incorreta"}
          </DialogTitle>
          <DialogDescription>
            Feedback imediato sobre sua resposta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              "p-4 rounded-md border-2",
              isCorreta
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-full",
                  isCorreta ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                )}
              >
                {isCorreta ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">
                  {isCorreta ? "Excelente trabalho!" : "Não foi dessa vez"}
                </p>
                <p className="text-sm text-muted-foreground">{feedbackText}</p>
              </div>
            </div>
          </div>

          {questao.competencia && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">Competência trabalhada:</div>
                  <div className="text-sm text-muted-foreground">{questao.competencia}</div>
                </div>
              </div>
            </div>
          )}

          {resposta.tempoGasto && (
            <div className="text-sm text-muted-foreground text-center">
              Tempo gasto: {resposta.tempoGasto} segundos
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

