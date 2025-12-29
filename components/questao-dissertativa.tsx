"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Questao } from "@/lib/types"
import { Send } from "lucide-react"

interface QuestaoDissertativaProps {
  questao: Questao
  respostaAtual?: string
  onResponder: (resposta: string) => void
}

export function QuestaoDissertativa({
  questao,
  respostaAtual,
  onResponder,
}: QuestaoDissertativaProps) {
  const [resposta, setResposta] = useState(respostaAtual || "")
  const maxCaracteres = 1000

  useEffect(() => {
    if (respostaAtual) {
      setResposta(respostaAtual)
    }
  }, [respostaAtual])

  const handleEnviar = () => {
    if (resposta.trim().length > 0 && resposta.length <= maxCaracteres) {
      onResponder(resposta)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg flex-1">{questao.enunciado}</CardTitle>
          <Badge variant="outline">Dissertativa</Badge>
        </div>
        {questao.habilidade && (
          <div className="text-sm text-muted-foreground mt-2">
            Habilidade: {questao.habilidade}
          </div>
        )}
        <CardDescription className="mt-2">
          Escreva sua resposta abaixo. A correção será feita automaticamente por IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            placeholder="Digite sua resposta aqui..."
            rows={8}
            maxLength={maxCaracteres}
            className="resize-none"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {resposta.length} / {maxCaracteres} caracteres
            </span>
            {resposta.length > maxCaracteres * 0.9 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                Você está próximo do limite
              </span>
            )}
          </div>
        </div>

        <Button
          onClick={handleEnviar}
          disabled={!resposta.trim() || resposta.length > maxCaracteres}
          className="w-full"
          size="lg"
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar Resposta
        </Button>

        {respostaAtual && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Sua resposta:</div>
            <div className="text-sm text-muted-foreground">{respostaAtual}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

