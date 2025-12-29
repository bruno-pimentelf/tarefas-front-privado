"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  mockQuestoesMatematicaObjetiva,
  mockQuestoesMatematicaDissertativa,
  mockQuestoesPortuguesObjetiva,
  mockQuestoesPortuguesDissertativa,
} from "@/lib/mock-data"
import { Questao, ComponenteCurricular } from "@/lib/types"
import { ArrowLeft, Plus, FolderPlus, Check, X, BookOpen, FileText, Eye, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Colecao {
  id: string
  nome: string
  descricao?: string
  questoes: string[] // IDs das questões
  dataCriacao: Date
}

interface BancoItensProps {
  onVoltar: () => void
}

export function BancoItens({ onVoltar }: BancoItensProps) {
  const [colecoes, setColecoes] = useState<Colecao[]>([])
  const [showCriarColecao, setShowCriarColecao] = useState(false)
  const [nomeColecao, setNomeColecao] = useState("")
  const [descricaoColecao, setDescricaoColecao] = useState("")
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<Set<string>>(new Set())
  const [filtroComponente, setFiltroComponente] = useState<ComponenteCurricular | "todos">("todos")
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "objetiva" | "dissertativa">("todos")
  const [questaoPreview, setQuestaoPreview] = useState<Questao | null>(null)
  const [colecaoEditando, setColecaoEditando] = useState<string | null>(null)

  const todasQuestoes: Questao[] = [
    ...mockQuestoesMatematicaObjetiva,
    ...mockQuestoesMatematicaDissertativa,
    ...mockQuestoesPortuguesObjetiva,
    ...mockQuestoesPortuguesDissertativa,
  ]

  const questoesFiltradas = todasQuestoes.filter((q) => {
    if (filtroComponente !== "todos" && q.componente !== filtroComponente) return false
    if (filtroTipo !== "todos" && q.tipo !== filtroTipo) return false
    return true
  })

  const handleToggleQuestao = (questaoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setQuestoesSelecionadas((prev) => {
      const novo = new Set(prev)
      if (novo.has(questaoId)) {
        novo.delete(questaoId)
      } else {
        novo.add(questaoId)
      }
      return novo
    })
  }

  const handleCriarColecao = () => {
    if (!nomeColecao.trim() || questoesSelecionadas.size === 0) return

    const novaColecao: Colecao = {
      id: `colecao-${Date.now()}`,
      nome: nomeColecao,
      descricao: descricaoColecao || undefined,
      questoes: Array.from(questoesSelecionadas),
      dataCriacao: new Date(),
    }

    setColecoes([...colecoes, novaColecao])
    setNomeColecao("")
    setDescricaoColecao("")
    setQuestoesSelecionadas(new Set())
    setShowCriarColecao(false)
  }

  const handleAdicionarAColecao = (colecaoId: string) => {
    const colecao = colecoes.find((c) => c.id === colecaoId)
    if (!colecao) return

    const novasQuestoes = Array.from(questoesSelecionadas).filter(
      (id) => !colecao.questoes.includes(id)
    )

    setColecoes(
      colecoes.map((c) =>
        c.id === colecaoId
          ? { ...c, questoes: [...c.questoes, ...novasQuestoes] }
          : c
      )
    )
    setQuestoesSelecionadas(new Set())
  }

  const handleRemoverQuestaoColecao = (colecaoId: string, questaoId: string) => {
    setColecoes(
      colecoes.map((c) =>
        c.id === colecaoId
          ? { ...c, questoes: c.questoes.filter((id) => id !== questaoId) }
          : c
      )
    )
  }

  const handleDeletarColecao = (colecaoId: string) => {
    setColecoes(colecoes.filter((c) => c.id !== colecaoId))
  }

  const getComponenteColor = (componente: ComponenteCurricular) => {
    return componente === "Matemática"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      : "bg-green-500/10 text-green-700 dark:text-green-400"
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onVoltar} size="sm" className="gap-1.5 h-8">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
          <h1 className="text-sm font-semibold">Banco de Itens</h1>
        </div>
        {questoesSelecionadas.size > 0 && (
          <Button
            onClick={() => setShowCriarColecao(true)}
            size="default"
            className="gap-1.5 h-8"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Criar Coleção ({questoesSelecionadas.size})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-semibold">Questões Disponíveis</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {questoesFiltradas.length} questões
                  </Badge>
                  {questoesSelecionadas.size > 0 && (
                    <Badge className="text-xs">
                      {questoesSelecionadas.size} selecionada(s)
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Tabs
                  value={filtroComponente}
                  onValueChange={(v) => setFiltroComponente(v as ComponenteCurricular | "todos")}
                  className="w-auto"
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="todos" className="text-xs px-3">Todos</TabsTrigger>
                    <TabsTrigger value="Matemática" className="text-xs px-3">Matemática</TabsTrigger>
                    <TabsTrigger value="Língua Portuguesa" className="text-xs px-3">Português</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Tabs
                  value={filtroTipo}
                  onValueChange={(v) => setFiltroTipo(v as "todos" | "objetiva" | "dissertativa")}
                  className="w-auto"
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="todos" className="text-xs px-3">Todos</TabsTrigger>
                    <TabsTrigger value="objetiva" className="text-xs px-3">Objetiva</TabsTrigger>
                    <TabsTrigger value="dissertativa" className="text-xs px-3">Dissertativa</TabsTrigger>
                  </TabsList>
                </Tabs>
                {questoesSelecionadas.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuestoesSelecionadas(new Set())}
                    className="h-8 text-xs gap-1.5"
                  >
                    <X className="h-3 w-3" />
                    Limpar seleção
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {questoesFiltradas.map((questao) => {
                  const isSelecionada = questoesSelecionadas.has(questao.id)
                  return (
                    <Card
                      key={questao.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isSelecionada && "border-primary bg-primary/5 ring-2 ring-primary/20"
                      )}
                      onClick={() => setQuestaoPreview(questao)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap flex-1">
                              <Badge className={cn(getComponenteColor(questao.componente), "text-xs")} variant="outline">
                                {questao.componente}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {questao.tipo === "objetiva" ? (
                                  <BookOpen className="h-3 w-3 mr-1" />
                                ) : (
                                  <FileText className="h-3 w-3 mr-1" />
                                )}
                                {questao.tipo === "objetiva" ? "Objetiva" : "Dissertativa"}
                              </Badge>
                              {questao.competencia && (
                                <Badge variant="outline" className="text-xs">
                                  {questao.competencia}
                                </Badge>
                              )}
                            </div>
                            <div
                              className="shrink-0"
                              onClick={(e) => handleToggleQuestao(questao.id, e)}
                            >
                              {isSelecionada ? (
                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed line-clamp-3">{questao.enunciado}</p>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setQuestaoPreview(questao)
                              }}
                              className="h-7 text-xs gap-1.5"
                            >
                              <Eye className="h-3 w-3" />
                              Ver detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Minhas Coleções</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {colecoes.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
              {colecoes.length === 0 ? (
                <div className="text-center py-6">
                  <FolderPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Nenhuma coleção criada ainda
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione questões e clique em "Criar Coleção"
                  </p>
                </div>
              ) : (
                colecoes.map((colecao) => {
                  const questoesNaColecao = todasQuestoes.filter((q) =>
                    colecao.questoes.includes(q.id)
                  )
                  return (
                    <Card key={colecao.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-semibold line-clamp-1">{colecao.nome}</h3>
                            {colecao.descricao && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {colecao.descricao}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletarColecao(colecao.id)}
                            className="h-6 w-6 p-0 shrink-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {colecao.questoes.length} questão(ões)
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {new Date(colecao.dataCriacao).toLocaleDateString("pt-BR")}
                          </Badge>
                        </div>
                        {questoesNaColecao.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t">
                            {questoesNaColecao.slice(0, 2).map((q) => (
                              <div
                                key={q.id}
                                className="flex items-start justify-between gap-2 text-xs p-2 bg-muted/30 rounded"
                              >
                                <span className="line-clamp-2 flex-1 leading-relaxed">{q.enunciado}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoverQuestaoColecao(colecao.id, q.id)}
                                  className="h-5 w-5 p-0 shrink-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            {questoesNaColecao.length > 2 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{questoesNaColecao.length - 2} mais
                              </p>
                            )}
                          </div>
                        )}
                        {questoesSelecionadas.size > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdicionarAColecao(colecao.id)}
                            className="w-full h-7 text-xs gap-1.5"
                          >
                            <Plus className="h-3 w-3" />
                            Adicionar {questoesSelecionadas.size} questão(ões)
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showCriarColecao} onOpenChange={setShowCriarColecao}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Nova Coleção</DialogTitle>
            <DialogDescription className="text-xs">
              Crie uma coleção com {questoesSelecionadas.size} questão(ões) selecionada(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nome da Coleção</label>
              <Input
                value={nomeColecao}
                onChange={(e) => setNomeColecao(e.target.value)}
                placeholder="Ex: Exercícios de Porcentagem"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Descrição (opcional)</label>
              <Input
                value={descricaoColecao}
                onChange={(e) => setDescricaoColecao(e.target.value)}
                placeholder="Breve descrição da coleção"
                className="h-9 text-sm"
              />
            </div>
            <div className="p-3 bg-muted/30 rounded border">
              <p className="text-xs font-medium mb-1.5">Questões selecionadas:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Array.from(questoesSelecionadas).map((id) => {
                  const q = todasQuestoes.find((questao) => questao.id === id)
                  if (!q) return null
                  return (
                    <div key={id} className="text-xs p-1.5 bg-background rounded">
                      <p className="line-clamp-1">{q.enunciado}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCriarColecao(false)
                setNomeColecao("")
                setDescricaoColecao("")
              }}
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCriarColecao}
              disabled={!nomeColecao.trim() || questoesSelecionadas.size === 0}
              size="sm"
            >
              Criar Coleção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!questaoPreview} onOpenChange={(open) => !open && setQuestaoPreview(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {questaoPreview && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn(getComponenteColor(questaoPreview.componente), "text-xs")} variant="outline">
                    {questaoPreview.componente}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {questaoPreview.tipo === "objetiva" ? (
                      <BookOpen className="h-3 w-3 mr-1" />
                    ) : (
                      <FileText className="h-3 w-3 mr-1" />
                    )}
                    {questaoPreview.tipo === "objetiva" ? "Objetiva" : "Dissertativa"}
                  </Badge>
                  {questaoPreview.competencia && (
                    <Badge variant="outline" className="text-xs">
                      {questaoPreview.competencia}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-base mt-3">{questaoPreview.enunciado}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {questaoPreview.tipo === "objetiva" && questaoPreview.alternativas && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Alternativas:</p>
                    <div className="space-y-2">
                      {questaoPreview.alternativas.map((alt, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-3 rounded border text-sm",
                            alt === questaoPreview.respostaCorreta
                              ? "bg-green-500/10 border-green-500/20"
                              : "bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                            <span>{alt}</span>
                            {alt === questaoPreview.respostaCorreta && (
                              <Badge className="ml-auto bg-green-600 text-xs">Correta</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {questaoPreview.tipo === "dissertativa" && questaoPreview.modeloReferencia && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Modelo de Referência:</p>
                    <div className="p-3 bg-muted/30 rounded border text-sm">
                      {questaoPreview.modeloReferencia}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant={questoesSelecionadas.has(questaoPreview.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleQuestao(questaoPreview.id)}
                    className="gap-1.5"
                  >
                    {questoesSelecionadas.has(questaoPreview.id) ? (
                      <>
                        <Check className="h-3 w-3" />
                        Selecionada
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Selecionar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
