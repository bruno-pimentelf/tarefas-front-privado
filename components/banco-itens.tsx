"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Question,
  QuestionsSearchFilters,
  searchQuestions,
  createCollection,
  getMatrices,
  MatrixItem,
  ComparisonOperator,
  SortField,
} from "@/lib/api"
import { HtmlRenderer } from "@/components/html-renderer"
import {
  Plus,
  FolderPlus,
  Check,
  X,
  BookOpen,
  FileText,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BancoItensProps {
  onVoltar: () => void
  onAbrirColecoes: () => void
  onDataUpdate?: (data: { total: number; selected: number; loading: boolean }) => void
  refreshTrigger?: number
}

export function BancoItens({ 
  onVoltar, 
  onAbrirColecoes,
  onDataUpdate,
  refreshTrigger = 0,
}: BancoItensProps) {
  // Estado das questões da API
  const [questoes, setQuestoes] = useState<Question[]>([])
  const [questoesLoading, setQuestoesLoading] = useState(true)
  const [questoesError, setQuestoesError] = useState<string | null>(null)
  const [questoesPagination, setQuestoesPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Estado do UI
  const [showCriarColecao, setShowCriarColecao] = useState(false)
  const [nomeColecao, setNomeColecao] = useState("")
  const [descricaoColecao, setDescricaoColecao] = useState("")
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<Set<number>>(new Set())
  const [filtroConteudo, setFiltroConteudo] = useState("")
  const [filtroLanguage, setFiltroLanguage] = useState("")
  const [filtroAnswersCountOperator, setFiltroAnswersCountOperator] = useState<"eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "">("")
  const [filtroAnswersCountValue, setFiltroAnswersCountValue] = useState("")
  const [filtroSort, setFiltroSort] = useState<"id" | "name" | "language" | "created_at" | "updated_at" | "answers_count" | "">("")
  const [filtroOrder, setFiltroOrder] = useState<"asc" | "desc">("desc")
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false)
  const [questaoPreview, setQuestaoPreview] = useState<Question | null>(null)
  const [operacaoEmAndamento, setOperacaoEmAndamento] = useState(false)

  // Estados para matrizes
  const [matrizes, setMatrizes] = useState<MatrixItem[]>([])
  const [matrizesLoading, setMatrizesLoading] = useState(false)
  const [matrizesSelecionadas, setMatrizesSelecionadas] = useState<string[]>([])
  const [showFiltroMatrizes, setShowFiltroMatrizes] = useState(false)
  const [termoBuscaMatriz, setTermoBuscaMatriz] = useState("")

  // Função para carregar matrizes
  const carregarMatrizes = useCallback(async (term?: string) => {
    setMatrizesLoading(true)
    try {
      const matrizesData = await getMatrices(term)
      setMatrizes(matrizesData)
    } catch (error: any) {
      console.error("Erro ao carregar matrizes:", error)
      setMatrizes([])
    } finally {
      setMatrizesLoading(false)
    }
  }, [])

  // Função para carregar questões
  const carregarQuestoes = useCallback(async () => {
    setQuestoesLoading(true)
    setQuestoesError(null)

    try {
      const filters: QuestionsSearchFilters = {
        page: questoesPagination.page,
        limit: questoesPagination.limit,
        // TODO: Futuramente aplicar filtro apenas para questões completas
        // status: "completed", // Sempre filtrar apenas questões completas
      }

      // Filtros básicos
      if (filtroConteudo.trim()) {
        filters.content = filtroConteudo.trim()
      }

      if (filtroLanguage.trim()) {
        filters.language = filtroLanguage.trim()
      }

      // Filtro por matrizes - concatena os IDs com §
      if (matrizesSelecionadas.length > 0) {
        filters.matrixValue = matrizesSelecionadas.join("§")
      }

      // Filtros numéricos - answersCount
      // Segundo a documentação: sempre enviar o par {campo}Operator e {campo}Value juntos
      if (filtroAnswersCountOperator && filtroAnswersCountValue && filtroAnswersCountValue.trim() !== "") {
        filters.answersCountOperator = filtroAnswersCountOperator
        filters.answersCountValue = filtroAnswersCountValue.trim()
      }

      // Ordenação
      if (filtroSort) {
        filters.sort = filtroSort
        filters.order = filtroOrder
      }

      const response = await searchQuestions(filters)
      setQuestoes(response.items)
      setQuestoesPagination((prev) => ({
        ...prev,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      }))
    } catch (error: any) {
      setQuestoesError(error.message || "Erro ao carregar questões")
    } finally {
      setQuestoesLoading(false)
    }
  }, [
    questoesPagination.page,
    questoesPagination.limit,
    filtroConteudo,
    filtroLanguage,
    matrizesSelecionadas,
    filtroAnswersCountOperator,
    filtroAnswersCountValue,
    filtroSort,
    filtroOrder,
  ])

  // Carregar matrizes quando abrir o dialog
  useEffect(() => {
    if (showFiltroMatrizes && matrizes.length === 0) {
      carregarMatrizes()
    }
  }, [showFiltroMatrizes, carregarMatrizes, matrizes.length])

  // Carregar dados iniciais
  useEffect(() => {
    carregarQuestoes()
  }, [carregarQuestoes])

  // Notificar mudanças de dados
  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({
        total: questoesPagination.total,
        selected: questoesSelecionadas.size,
        loading: questoesLoading,
      })
    }
  }, [questoesPagination.total, questoesSelecionadas.size, questoesLoading, onDataUpdate])

  // Trigger de refresh externo
  useEffect(() => {
    if (refreshTrigger > 0) {
      carregarQuestoes()
    }
  }, [refreshTrigger, carregarQuestoes])

  // Handlers de paginação
  const handlePaginaQuestoes = (novaPagina: number) => {
    setQuestoesPagination((prev) => ({ ...prev, page: novaPagina }))
  }

  // Handler para aplicar filtros
  const handleAplicarFiltros = () => {
    setQuestoesPagination((prev) => ({ ...prev, page: 1 }))
    carregarQuestoes()
  }

  // Handler para adicionar/remover matriz
  const handleToggleMatriz = (matrizId: string) => {
    setMatrizesSelecionadas((prev) => {
      if (prev.includes(matrizId)) {
        return prev.filter((id) => id !== matrizId)
      } else {
        return [...prev, matrizId]
      }
    })
  }

  // Handler para limpar filtro de matrizes
  const handleLimparMatrizes = () => {
    setMatrizesSelecionadas([])
  }

  // Handler para buscar matrizes por termo
  const handleBuscarMatrizes = () => {
    carregarMatrizes(termoBuscaMatriz.trim() || undefined)
  }

  const handleToggleQuestao = (questaoId: number, e?: React.MouseEvent) => {
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

  const handleCriarColecao = async () => {
    if (!descricaoColecao.trim() || questoesSelecionadas.size === 0) return

    setOperacaoEmAndamento(true)

    try {
      await createCollection({
        title: nomeColecao.trim() || undefined,
        description: descricaoColecao.trim(),
        questionIds: Array.from(questoesSelecionadas),
      })

      setNomeColecao("")
      setDescricaoColecao("")
      setQuestoesSelecionadas(new Set())
      setShowCriarColecao(false)
    } catch (error: any) {
      alert(error.message || "Erro ao criar coleção")
    } finally {
      setOperacaoEmAndamento(false)
    }
  }


  const isObjectiveQuestion = (question: Question) => {
    return question.alternativesRelation && question.alternativesRelation.length > 0
  }

  // Obter questões selecionadas para o preview
  const questoesSelecionadasList = questoes.filter((q) => questoesSelecionadas.has(q.id))

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      {/* Botão de voltar */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={onVoltar}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por conteúdo..."
                value={filtroConteudo}
                onChange={(e) => setFiltroConteudo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAplicarFiltros()}
                className="h-8 w-48 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                className="h-8 text-xs gap-1.5"
              >
                {showFiltrosAvancados ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Filtros Avançados
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltroMatrizes(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Filter className="h-3 w-3" />
                Matrizes
                {matrizesSelecionadas.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                    {matrizesSelecionadas.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAplicarFiltros}
                className="h-8 text-xs"
              >
                Buscar
              </Button>
            </div>
            <Button
              variant="default"
              size="default"
              onClick={onAbrirColecoes}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2 h-9 px-4"
            >
              <Layers className="h-4 w-4" />
              Coleções
            </Button>
            {matrizesSelecionadas.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLimparMatrizes}
                className="h-8 text-xs gap-1.5"
              >
                <X className="h-3 w-3" />
                Limpar filtro de matrizes
              </Button>
            )}
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

          {/* Filtros Avançados */}
          {showFiltrosAvancados && (
            <div className="border border-dashed rounded-md p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Idioma */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Idioma</label>
                  <Input
                    placeholder="pt-BR, en-US..."
                    value={filtroLanguage}
                    onChange={(e) => setFiltroLanguage(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Ordenação - Campo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Ordenar por</label>
                  <Select 
                    value={filtroSort || undefined} 
                    onValueChange={(v) => {
                      if (v === "status") return // Ignorar status se ainda estiver no select
                      setFiltroSort(v as typeof filtroSort)
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="language">Idioma</SelectItem>
                      <SelectItem value="created_at">Data de Criação</SelectItem>
                      <SelectItem value="updated_at">Data de Atualização</SelectItem>
                      <SelectItem value="answers_count">Quantidade de Respostas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ordenação - Ordem */}
                {filtroSort && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Ordem</label>
                    <Select value={filtroOrder} onValueChange={(v) => setFiltroOrder(v as "asc" | "desc")}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Crescente</SelectItem>
                        <SelectItem value="desc">Decrescente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filtro Answers Count */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Quantidade de Respostas</label>
                  <div className="flex gap-2">
                    <Select
                      value={filtroAnswersCountOperator || undefined}
                      onValueChange={(v) => setFiltroAnswersCountOperator(v as ComparisonOperator | "")}
                    >
                      <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue placeholder="Op" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">=</SelectItem>
                        <SelectItem value="ne">≠</SelectItem>
                        <SelectItem value="gt">&gt;</SelectItem>
                        <SelectItem value="gte">≥</SelectItem>
                        <SelectItem value="lt">&lt;</SelectItem>
                        <SelectItem value="lte">≤</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={filtroAnswersCountValue}
                      onChange={(e) => setFiltroAnswersCountValue(e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                  onClick={() => {
                    setFiltroLanguage("")
                    setFiltroAnswersCountOperator("")
                    setFiltroAnswersCountValue("")
                    setFiltroSort("")
                    setFiltroOrder("desc")
                  }}
                className="h-8 text-xs gap-1.5"
              >
                <X className="h-3 w-3" />
                Limpar Filtros Avançados
              </Button>
            </div>
          )}

          {/* Lista de questões */}
          {questoesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : questoesError ? (
            <div className="text-center py-12">
              <p className="text-sm text-destructive mb-2">{questoesError}</p>
              <Button variant="outline" size="sm" onClick={() => carregarQuestoes()}>
                Tentar novamente
              </Button>
            </div>
          ) : questoes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Nenhuma questão encontrada</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {questoes.map((questao) => {
                  const isSelecionada = questoesSelecionadas.has(questao.id)
                  const isObjective = isObjectiveQuestion(questao)
                  return (
                    <Card
                      key={questao.id}
                      className={cn(
                        "flex flex-col cursor-pointer transition-all hover:shadow-md",
                        isSelecionada && "border-primary bg-primary/5 ring-2 ring-primary/20"
                      )}
                      onClick={() => setQuestaoPreview(questao)}
                    >
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="space-y-3 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap flex-1">
                              <Badge variant="outline" className="text-xs">
                                {isObjective ? (
                                  <BookOpen className="h-3 w-3 mr-1" />
                                ) : (
                                  <FileText className="h-3 w-3 mr-1" />
                                )}
                                {isObjective ? "Objetiva" : "Dissertativa"}
                              </Badge>
                              {questao.language && (
                                <Badge variant="outline" className="text-xs">
                                  {questao.language}
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
                          <div className="space-y-1 flex-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {questao.name}
                            </p>
                            <HtmlRenderer
                              html={questao.content}
                              className="text-sm leading-relaxed line-clamp-3"
                            />
                            {questao.matrixPopulated && questao.matrixPopulated.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {questao.matrixPopulated.slice(0, 2).map((matrix) => (
                                  <Badge key={matrix.id} variant="outline" className="text-xs">
                                    {matrix.acronym}
                                  </Badge>
                                ))}
                                {questao.matrixPopulated.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{questao.matrixPopulated.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t mt-auto">
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
                            {questao.totalAnswersCount != null && questao.totalAnswersCount > 0 && (
                              <Badge variant="secondary" className="text-xs ml-auto">
                                {questao.totalAnswersCount} respostas
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Paginação de questões */}
              {questoesPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginaQuestoes(questoesPagination.page - 1)}
                    disabled={questoesPagination.page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Página {questoesPagination.page} de {questoesPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginaQuestoes(questoesPagination.page + 1)}
                    disabled={questoesPagination.page >= questoesPagination.totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview flutuante da coleção sendo criada - só aparece quando há itens selecionados */}
      {questoesSelecionadas.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <Card className="w-80 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Nova Coleção</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {questoesSelecionadas.size} questão(ões) selecionada(s)
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuestoesSelecionadas(new Set())}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Lista resumida de questões selecionadas */}
              <div className="max-h-32 overflow-y-auto space-y-1.5">
                {questoesSelecionadasList.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-xs"
                  >
                    <Badge variant="outline" className="text-xs shrink-0">
                      {isObjectiveQuestion(q) ? "Obj" : "Dis"}
                    </Badge>
                    <span className="line-clamp-1 flex-1">{q.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleQuestao(q.id)}
                      className="h-5 w-5 p-0 shrink-0 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {questoesSelecionadas.size > 5 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{questoesSelecionadas.size - 5} mais...
                  </p>
                )}
              </div>

              {/* Botão para criar coleção */}
              <Button
                onClick={() => setShowCriarColecao(true)}
                className="w-full gap-2"
                disabled={operacaoEmAndamento}
              >
                <FolderPlus className="h-4 w-4" />
                Criar Coleção
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog de criar coleção */}
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
              <label className="text-xs font-medium">Título da Coleção (opcional)</label>
              <Input
                value={nomeColecao}
                onChange={(e) => setNomeColecao(e.target.value)}
                placeholder="Ex: Exercícios de Porcentagem"
                className="h-9 text-sm"
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Descrição *</label>
              <Input
                value={descricaoColecao}
                onChange={(e) => setDescricaoColecao(e.target.value)}
                placeholder="Descrição da coleção"
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="p-3 bg-muted/30 rounded border">
              <p className="text-xs font-medium mb-1.5">Questões selecionadas:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Array.from(questoesSelecionadas).map((id) => {
                  const q = questoes.find((questao) => questao.id === id)
                  if (!q) return null
                  return (
                    <div key={id} className="text-xs p-1.5 bg-background rounded">
                      <p className="line-clamp-1">{q.name}</p>
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
              disabled={operacaoEmAndamento}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCriarColecao}
              disabled={!descricaoColecao.trim() || questoesSelecionadas.size === 0 || operacaoEmAndamento}
              size="sm"
            >
              {operacaoEmAndamento ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Coleção"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de preview da questão */}
      <Dialog open={!!questaoPreview} onOpenChange={(open) => !open && setQuestaoPreview(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {questaoPreview && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {isObjectiveQuestion(questaoPreview) ? (
                      <BookOpen className="h-3 w-3 mr-1" />
                    ) : (
                      <FileText className="h-3 w-3 mr-1" />
                    )}
                    {isObjectiveQuestion(questaoPreview) ? "Objetiva" : "Dissertativa"}
                  </Badge>
                  {questaoPreview.language && (
                    <Badge variant="outline" className="text-xs">
                      {questaoPreview.language}
                    </Badge>
                  )}
                  {questaoPreview.origin && (
                    <Badge variant="outline" className="text-xs">
                      {questaoPreview.origin}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-base mt-3">{questaoPreview.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Conteúdo da questão */}
                <HtmlRenderer html={questaoPreview.content} className="prose prose-sm max-w-none" />

                {/* Textos base */}
                {questaoPreview.baseTexts && questaoPreview.baseTexts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Textos base:</p>
                    {questaoPreview.baseTexts.map((text, index) => (
                      <div key={index} className="p-3 bg-muted/30 rounded border text-sm">
                        <HtmlRenderer html={text.content} />
                        {text.image && (
                          <img
                            src={text.image}
                            alt={`Texto base ${index + 1}`}
                            className="mt-2 max-w-full rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Alternativas (questão objetiva) */}
                {isObjectiveQuestion(questaoPreview) && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Alternativas:</p>
                    <div className="space-y-2">
                      {questaoPreview.alternativesRelation
                        .sort((a, b) => a.order - b.order)
                        .map((alt, index) => (
                          <div
                            key={alt.id}
                            className={cn(
                              "p-3 rounded border text-sm",
                              alt.isCorrect
                                ? "bg-green-500/10 border-green-500/20"
                                : "bg-muted/30"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                              <div className="flex-1">
                                <HtmlRenderer html={alt.content} />
                                {alt.image && (
                                  <img
                                    src={alt.image}
                                    alt={`Alternativa ${String.fromCharCode(65 + index)}`}
                                    className="mt-2 max-w-full rounded"
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {alt.answersCount > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {alt.answersCount} resp.
                                  </Badge>
                                )}
                                {alt.isCorrect && (
                                  <Badge className="bg-green-600 text-xs">Correta</Badge>
                                )}
                              </div>
                            </div>
                            {alt.contentFeedback && (
                              <div className="text-xs text-muted-foreground mt-2 pl-6">
                                <span className="font-medium">Feedback: </span>
                                <HtmlRenderer html={alt.contentFeedback} />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Feedback geral */}
                {questaoPreview.feedback && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Feedback:</p>
                    <div className="p-3 bg-muted/30 rounded border text-sm">
                      <HtmlRenderer html={questaoPreview.feedback} />
                    </div>
                  </div>
                )}

                {/* Matrizes */}
                {questaoPreview.matrixPopulated && questaoPreview.matrixPopulated.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Matrizes de Referência:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {questaoPreview.matrixPopulated.map((matrix) => (
                        <Badge key={matrix.id} variant="outline" className="text-xs">
                          {matrix.label} ({matrix.acronym})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estatísticas */}
                {questaoPreview.totalAnswersCount && questaoPreview.totalAnswersCount > 0 && (
                  <div className="p-3 bg-muted/30 rounded border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Estatísticas:</p>
                    <p className="text-sm">Total de respostas: {questaoPreview.totalAnswersCount}</p>
                  </div>
                )}

                {/* Ações */}
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

      {/* Dialog de filtro de matrizes */}
      <Dialog open={showFiltroMatrizes} onOpenChange={setShowFiltroMatrizes}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Filtrar por Matrizes de Conhecimento</DialogTitle>
            <DialogDescription className="text-xs">
              Selecione as matrizes para filtrar as questões
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Campo de busca */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar matriz por termo..."
                value={termoBuscaMatriz}
                onChange={(e) => setTermoBuscaMatriz(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscarMatrizes()}
                className="h-9 text-sm flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleBuscarMatrizes}
                disabled={matrizesLoading}
                className="h-9"
              >
                {matrizesLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Buscar"
                )}
              </Button>
            </div>
            {matrizesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : matrizes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {termoBuscaMatriz 
                    ? "Nenhuma matriz encontrada para este termo" 
                    : "Digite um termo para buscar matrizes"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {matrizes.map((matriz) => {
                  const isSelecionada = matrizesSelecionadas.includes(matriz.id)
                  return (
                    <div
                      key={matriz.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all hover:bg-muted/50",
                        isSelecionada && "bg-primary/5 border-primary/20 ring-1 ring-primary/20"
                      )}
                      onClick={() => handleToggleMatriz(matriz.id)}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isSelecionada ? (
                          <div className="h-4 w-4 rounded bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded border-2 border-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{matriz.label}</p>
                          <Badge variant="outline" className="text-xs">
                            {matriz.acronym}
                          </Badge>
                        </div>
                        {matriz.title && (
                          <p className="text-xs text-muted-foreground">{matriz.title}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleLimparMatrizes}
              size="sm"
              disabled={matrizesSelecionadas.length === 0}
            >
              Limpar
            </Button>
            <Button onClick={() => setShowFiltroMatrizes(false)} size="sm">
              Aplicar ({matrizesSelecionadas.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
