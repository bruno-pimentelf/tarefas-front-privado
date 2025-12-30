"use client"

import { useState, useEffect, useCallback } from "react"
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
  Question,
  Collection,
  CollectionDetail,
  PaginatedResponse,
  QuestionsSearchFilters,
  searchQuestions,
  listCollections,
  createCollection,
  deleteCollection,
  addQuestionsToCollection,
  removeQuestionsFromCollection,
  getCollectionById,
} from "@/lib/api"
import { ArrowLeft, Plus, FolderPlus, Check, X, BookOpen, FileText, Eye, Trash2, Loader2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface BancoItensProps {
  onVoltar: () => void
}

export function BancoItens({ onVoltar }: BancoItensProps) {
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

  // Estado das collections da API
  const [colecoes, setColecoes] = useState<Collection[]>([])
  const [colecoesLoading, setColecoesLoading] = useState(true)
  const [colecoesError, setColecoesError] = useState<string | null>(null)
  const [colecoesPagination, setColecoesPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Estado para detalhes de collections (com questões carregadas)
  const [collectionDetails, setCollectionDetails] = useState<Record<number, CollectionDetail>>({})
  const [loadingCollectionDetails, setLoadingCollectionDetails] = useState<Set<number>>(new Set())

  // Estado do UI
  const [showCriarColecao, setShowCriarColecao] = useState(false)
  const [nomeColecao, setNomeColecao] = useState("")
  const [descricaoColecao, setDescricaoColecao] = useState("")
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<Set<number>>(new Set())
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "completed" | "in_progress" | "not_started">("todos")
  const [filtroConteudo, setFiltroConteudo] = useState("")
  const [questaoPreview, setQuestaoPreview] = useState<Question | null>(null)
  const [operacaoEmAndamento, setOperacaoEmAndamento] = useState(false)

  // Função para carregar questões
  const carregarQuestoes = useCallback(async () => {
    setQuestoesLoading(true)
    setQuestoesError(null)

    try {
      const filters: QuestionsSearchFilters = {
        page: questoesPagination.page,
        limit: questoesPagination.limit,
      }

      if (filtroStatus !== "todos") {
        filters.status = filtroStatus
      }

      if (filtroConteudo.trim()) {
        filters.content = filtroConteudo.trim()
      }

      const response = await searchQuestions(filters)
      setQuestoes(response.items)
      setQuestoesPagination(prev => ({
        ...prev,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      }))
    } catch (error: any) {
      setQuestoesError(error.message || "Erro ao carregar questões")
    } finally {
      setQuestoesLoading(false)
    }
  }, [questoesPagination.page, questoesPagination.limit, filtroStatus, filtroConteudo])

  // Função para carregar collections
  const carregarColecoes = useCallback(async () => {
    setColecoesLoading(true)
    setColecoesError(null)

    try {
      const response = await listCollections(colecoesPagination.page, colecoesPagination.limit)
      setColecoes(response.items)
      setColecoesPagination(prev => ({
        ...prev,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      }))
    } catch (error: any) {
      setColecoesError(error.message || "Erro ao carregar coleções")
    } finally {
      setColecoesLoading(false)
    }
  }, [colecoesPagination.page, colecoesPagination.limit])

  // Função para carregar detalhes de uma collection
  const carregarDetalhesColecao = async (collectionId: number) => {
    if (collectionDetails[collectionId] || loadingCollectionDetails.has(collectionId)) {
      return
    }

    setLoadingCollectionDetails(prev => new Set(prev).add(collectionId))

    try {
      const details = await getCollectionById(collectionId)
      setCollectionDetails(prev => ({
        ...prev,
        [collectionId]: details,
      }))
    } catch (error) {
      console.error(`Erro ao carregar detalhes da collection ${collectionId}:`, error)
    } finally {
      setLoadingCollectionDetails(prev => {
        const newSet = new Set(prev)
        newSet.delete(collectionId)
        return newSet
      })
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    carregarQuestoes()
  }, [carregarQuestoes])

  useEffect(() => {
    carregarColecoes()
  }, [carregarColecoes])

  // Handlers de paginação
  const handlePaginaQuestoes = (novaPagina: number) => {
    setQuestoesPagination(prev => ({ ...prev, page: novaPagina }))
  }

  const handlePaginaColecoes = (novaPagina: number) => {
    setColecoesPagination(prev => ({ ...prev, page: novaPagina }))
  }

  // Handler para aplicar filtros
  const handleAplicarFiltros = () => {
    setQuestoesPagination(prev => ({ ...prev, page: 1 }))
    carregarQuestoes()
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
      
      // Recarrega a lista de coleções
      await carregarColecoes()
    } catch (error: any) {
      alert(error.message || "Erro ao criar coleção")
    } finally {
      setOperacaoEmAndamento(false)
    }
  }

  const handleAdicionarAColecao = async (colecaoId: number) => {
    if (questoesSelecionadas.size === 0) return

    setOperacaoEmAndamento(true)

    try {
      await addQuestionsToCollection(colecaoId, Array.from(questoesSelecionadas))
      setQuestoesSelecionadas(new Set())
      
      // Limpa o cache de detalhes para forçar recarregamento
      setCollectionDetails(prev => {
        const newDetails = { ...prev }
        delete newDetails[colecaoId]
        return newDetails
      })
      
      // Recarrega os detalhes
      await carregarDetalhesColecao(colecaoId)
    } catch (error: any) {
      alert(error.message || "Erro ao adicionar questões à coleção")
    } finally {
      setOperacaoEmAndamento(false)
    }
  }

  const handleRemoverQuestaoColecao = async (colecaoId: number, questaoId: number) => {
    setOperacaoEmAndamento(true)

    try {
      await removeQuestionsFromCollection(colecaoId, [questaoId])
      
      // Atualiza o cache de detalhes localmente
      setCollectionDetails(prev => {
        if (!prev[colecaoId]) return prev
        return {
          ...prev,
          [colecaoId]: {
            ...prev[colecaoId],
            questionIds: prev[colecaoId].questionIds.filter(id => id !== questaoId),
            questions: prev[colecaoId].questions.filter(q => q.id !== questaoId),
          },
        }
      })
    } catch (error: any) {
      alert(error.message || "Erro ao remover questão da coleção")
    } finally {
      setOperacaoEmAndamento(false)
    }
  }

  const handleDeletarColecao = async (colecaoId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta coleção?")) return

    setOperacaoEmAndamento(true)

    try {
      await deleteCollection(colecaoId)
      
      // Remove do estado local
      setColecoes(prev => prev.filter(c => c.id !== colecaoId))
      
      // Remove do cache de detalhes
      setCollectionDetails(prev => {
        const newDetails = { ...prev }
        delete newDetails[colecaoId]
        return newDetails
      })
    } catch (error: any) {
      alert(error.message || "Erro ao excluir coleção")
    } finally {
      setOperacaoEmAndamento(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "not_started":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
      default:
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completa"
      case "in_progress":
        return "Em progresso"
      case "not_started":
        return "Não iniciada"
      default:
        return status
    }
  }

  const isObjectiveQuestion = (question: Question) => {
    return question.alternativesRelation && question.alternativesRelation.length > 0
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
            disabled={operacaoEmAndamento}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => carregarQuestoes()}
                    disabled={questoesLoading}
                    className="h-7 w-7 p-0"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", questoesLoading && "animate-spin")} />
                  </Button>
                  <Badge variant="outline" className="text-xs">
                    {questoesPagination.total} questões
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
              {/* Filtros */}
              <div className="flex items-center gap-2 flex-wrap">
                <Tabs
                  value={filtroStatus}
                  onValueChange={(v) => {
                    setFiltroStatus(v as typeof filtroStatus)
                    setQuestoesPagination(prev => ({ ...prev, page: 1 }))
                  }}
                  className="w-auto"
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="todos" className="text-xs px-3">Todos</TabsTrigger>
                    <TabsTrigger value="completed" className="text-xs px-3">Completas</TabsTrigger>
                    <TabsTrigger value="in_progress" className="text-xs px-3">Em Progresso</TabsTrigger>
                    <TabsTrigger value="not_started" className="text-xs px-3">Não Iniciadas</TabsTrigger>
                  </TabsList>
                </Tabs>
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
                    onClick={handleAplicarFiltros}
                    className="h-8 text-xs"
                  >
                    Buscar
                  </Button>
                </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {questoes.map((questao) => {
                      const isSelecionada = questoesSelecionadas.has(questao.id)
                      const isObjective = isObjectiveQuestion(questao)
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
                                  <Badge className={cn(getStatusColor(questao.status), "text-xs")} variant="outline">
                                    {getStatusLabel(questao.status)}
                                  </Badge>
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
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">{questao.name}</p>
                                <div 
                                  className="text-sm leading-relaxed line-clamp-3"
                                  dangerouslySetInnerHTML={{ __html: questao.content }}
                                />
                              </div>
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
                                {questao.totalAnswersCount > 0 && (
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
        </div>

        {/* Sidebar de coleções */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Minhas Coleções</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => carregarColecoes()}
                    disabled={colecoesLoading}
                    className="h-7 w-7 p-0"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", colecoesLoading && "animate-spin")} />
                  </Button>
                  <Badge variant="outline" className="text-xs">
                    {colecoesPagination.total}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
              {colecoesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : colecoesError ? (
                <div className="text-center py-8">
                  <p className="text-xs text-destructive mb-2">{colecoesError}</p>
                  <Button variant="outline" size="sm" onClick={() => carregarColecoes()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : colecoes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                    <FolderPlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">Nenhuma coleção criada</p>
                  <p className="text-xs text-muted-foreground">
                    Selecione questões e clique em "Criar Coleção"
                  </p>
                </div>
              ) : (
                <>
                  {colecoes.map((colecao) => {
                    const details = collectionDetails[colecao.id]
                    const isLoadingDetails = loadingCollectionDetails.has(colecao.id)
                    const podeAdicionar = questoesSelecionadas.size > 0

                    // Carrega detalhes automaticamente quando a coleção é renderizada
                    if (!details && !isLoadingDetails) {
                      carregarDetalhesColecao(colecao.id)
                    }

                    return (
                      <Card key={colecao.id} className="p-4 border-2 hover:border-primary/30 transition-colors">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold mb-1">{colecao.title || "Sem título"}</h3>
                              {colecao.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {colecao.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletarColecao(colecao.id)}
                              disabled={operacaoEmAndamento}
                              className="h-7 w-7 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-xs">
                                {details ? details.questionIds.length : "..."} questão(ões)
                              </Badge>
                              {colecao.used && (
                                <Badge variant="secondary" className="text-xs">Em uso</Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground">
                              {new Date(colecao.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>

                          {/* Lista de questões na coleção */}
                          {isLoadingDetails ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : details && details.questions.length > 0 ? (
                            <div className="space-y-2 pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground">Questões na coleção:</p>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {details.questions.map((q) => (
                                  <Card
                                    key={q.id}
                                    className="p-2.5 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                                    onClick={() => {
                                      // Busca a questão completa se disponível
                                      const questaoCompleta = questoes.find(quest => quest.id === q.id)
                                      if (questaoCompleta) {
                                        setQuestaoPreview(questaoCompleta)
                                      }
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <Badge variant="outline" className="text-xs">
                                            {isObjectiveQuestion(q) ? "Objetiva" : "Dissertativa"}
                                          </Badge>
                                        </div>
                                        <p className="text-xs line-clamp-2 leading-relaxed">
                                          {q.name}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleRemoverQuestaoColecao(colecao.id, q.id)
                                        }}
                                        disabled={operacaoEmAndamento}
                                        className="h-6 w-6 p-0 shrink-0 hover:text-destructive"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {podeAdicionar && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdicionarAColecao(colecao.id)}
                              disabled={operacaoEmAndamento}
                              className="w-full h-8 text-xs gap-1.5 border-primary/20 hover:bg-primary/5"
                            >
                              {operacaoEmAndamento ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                              Adicionar {questoesSelecionadas.size} questão(ões) selecionada(s)
                            </Button>
                          )}
                        </div>
                      </Card>
                    )
                  })}

                  {/* Paginação de coleções */}
                  {colecoesPagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePaginaColecoes(colecoesPagination.page - 1)}
                        disabled={colecoesPagination.page === 1}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {colecoesPagination.page}/{colecoesPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePaginaColecoes(colecoesPagination.page + 1)}
                        disabled={colecoesPagination.page >= colecoesPagination.totalPages}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
                  <Badge className={cn(getStatusColor(questaoPreview.status), "text-xs")} variant="outline">
                    {getStatusLabel(questaoPreview.status)}
                  </Badge>
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
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: questaoPreview.content }}
                />

                {/* Textos base */}
                {questaoPreview.baseTexts && questaoPreview.baseTexts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Textos base:</p>
                    {questaoPreview.baseTexts.map((text, index) => (
                      <div key={index} className="p-3 bg-muted/30 rounded border text-sm">
                        <div dangerouslySetInnerHTML={{ __html: text.content }} />
                        {text.image && (
                          <img src={text.image} alt={`Texto base ${index + 1}`} className="mt-2 max-w-full rounded" />
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
                                <span dangerouslySetInnerHTML={{ __html: alt.content }} />
                                {alt.image && (
                                  <img src={alt.image} alt={`Alternativa ${String.fromCharCode(65 + index)}`} className="mt-2 max-w-full rounded" />
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
                              <p className="text-xs text-muted-foreground mt-2 pl-6">
                                Feedback: {alt.contentFeedback}
                              </p>
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
                      {questaoPreview.feedback}
                    </div>
                  </div>
                )}

                {/* Matrizes */}
                {questaoPreview.matrixPopulated && questaoPreview.matrixPopulated.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Matrizes de Referência:</p>
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
                {questaoPreview.totalAnswersCount > 0 && (
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
    </div>
  )
}
