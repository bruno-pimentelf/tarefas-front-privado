"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Question,
  Collection,
  CollectionDetail,
  listCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  removeQuestionsFromCollection,
} from "@/lib/api"
import { HtmlRenderer } from "@/components/html-renderer"
import {
  FolderOpen,
  Eye,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  BookOpen,
  FileText,
  Pencil,
  Check,
  Calendar,
  Hash,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ColecoesPageProps {}

export function ColecoesPage({}: ColecoesPageProps = {}) {
  const router = useRouter()
  // Estado das collections da API
  const [colecoes, setColecoes] = useState<Collection[]>([])
  const [colecoesLoading, setColecoesLoading] = useState(true)
  const [colecoesError, setColecoesError] = useState<string | null>(null)
  const [colecoesPagination, setColecoesPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  // Estado para detalhes de collections (com questões carregadas)
  const [collectionDetails, setCollectionDetails] = useState<Record<number, CollectionDetail>>({})
  const [loadingCollectionDetails, setLoadingCollectionDetails] = useState<Set<number>>(new Set())

  // Estado do UI
  const [colecaoSelecionada, setColecaoSelecionada] = useState<CollectionDetail | null>(null)
  const [questaoPreview, setQuestaoPreview] = useState<Question | null>(null)
  const [operacaoEmAndamento, setOperacaoEmAndamento] = useState(false)
  const [editandoColecao, setEditandoColecao] = useState<CollectionDetail | null>(null)
  const [novoTitulo, setNovoTitulo] = useState("")
  const [novaDescricao, setNovaDescricao] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [colecaoParaDeletar, setColecaoParaDeletar] = useState<{ id: number; title: string | null } | null>(null)

  // Função para carregar collections
  const carregarColecoes = useCallback(async () => {
    setColecoesLoading(true)
    setColecoesError(null)

    try {
      const response = await listCollections(colecoesPagination.page, colecoesPagination.limit)
      setColecoes(response.items)
      setColecoesPagination((prev) => ({
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
      return collectionDetails[collectionId]
    }

    setLoadingCollectionDetails((prev) => new Set(prev).add(collectionId))

    try {
      const details = await getCollectionById(collectionId)
      setCollectionDetails((prev) => ({
        ...prev,
        [collectionId]: details,
      }))
      return details
    } catch (error) {
      console.error(`Erro ao carregar detalhes da collection ${collectionId}:`, error)
      return null
    } finally {
      setLoadingCollectionDetails((prev) => {
        const newSet = new Set(prev)
        newSet.delete(collectionId)
        return newSet
      })
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    carregarColecoes()
  }, [carregarColecoes])

  // Handler de paginação
  const handlePaginaColecoes = (novaPagina: number) => {
    setColecoesPagination((prev) => ({ ...prev, page: novaPagina }))
  }

  // Handler para ver detalhes da collection
  const handleVerColecao = async (colecao: Collection) => {
    const details = collectionDetails[colecao.id] || (await carregarDetalhesColecao(colecao.id))
    if (details) {
      setColecaoSelecionada(details)
    }
  }

  // Handler para editar collection
  const handleIniciarEdicao = (colecao: CollectionDetail) => {
    setEditandoColecao(colecao)
    setNovoTitulo(colecao.title || "")
    setNovaDescricao(colecao.description || "")
  }

  const handleSalvarEdicao = async () => {
    if (!editandoColecao) return

    setOperacaoEmAndamento(true)

    try {
      await updateCollection(editandoColecao.id, {
        title: novoTitulo.trim() || undefined,
        description: novaDescricao.trim() || undefined,
      })

      // Atualiza o estado local
      const updatedDetails = {
        ...editandoColecao,
        title: novoTitulo.trim() || editandoColecao.title,
        description: novaDescricao.trim() || editandoColecao.description,
      }

      setCollectionDetails((prev) => ({
        ...prev,
        [editandoColecao.id]: updatedDetails,
      }))

      if (colecaoSelecionada?.id === editandoColecao.id) {
        setColecaoSelecionada(updatedDetails)
      }

      // Atualiza a lista de coleções
      setColecoes((prev) =>
        prev.map((c) =>
          c.id === editandoColecao.id
            ? { ...c, title: updatedDetails.title, description: updatedDetails.description }
            : c
        )
      )

      setEditandoColecao(null)
    } catch (error: any) {
      alert(error.message || "Erro ao atualizar coleção")
    } finally {
      setOperacaoEmAndamento(false)
    }
  }

  const handleRemoverQuestaoColecao = async (colecaoId: number, questaoId: number) => {
    setOperacaoEmAndamento(true)

    try {
      await removeQuestionsFromCollection(colecaoId, [questaoId])

      // Atualiza o cache de detalhes localmente
      setCollectionDetails((prev) => {
        if (!prev[colecaoId]) return prev
        return {
          ...prev,
          [colecaoId]: {
            ...prev[colecaoId],
            questionIds: prev[colecaoId].questionIds.filter((id) => id !== questaoId),
            questions: prev[colecaoId].questions.filter((q) => q.id !== questaoId),
          },
        }
      })

      // Atualiza a coleção selecionada se for a mesma
      if (colecaoSelecionada?.id === colecaoId) {
        setColecaoSelecionada((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            questionIds: prev.questionIds.filter((id) => id !== questaoId),
            questions: prev.questions.filter((q) => q.id !== questaoId),
          }
        })
      }
    } catch (error: any) {
      alert(error.message || "Erro ao remover questão da coleção")
    } finally {
      setOperacaoEmAndamento(false)
    }
  }

  const handleAbrirDialogDeletar = (colecao: Collection) => {
    setColecaoParaDeletar({ id: colecao.id, title: colecao.title })
    setShowDeleteDialog(true)
  }

  const handleConfirmarDeletar = async () => {
    if (!colecaoParaDeletar) return

    const colecaoId = colecaoParaDeletar.id
    setOperacaoEmAndamento(true)
    setShowDeleteDialog(false)

    try {
      await deleteCollection(colecaoId)

      // Remove do estado local
      setColecoes((prev) => prev.filter((c) => c.id !== colecaoId))

      // Remove do cache de detalhes
      setCollectionDetails((prev) => {
        const newDetails = { ...prev }
        delete newDetails[colecaoId]
        return newDetails
      })

      // Fecha o modal se estava visualizando esta coleção
      if (colecaoSelecionada?.id === colecaoId) {
        setColecaoSelecionada(null)
      }

      setColecaoParaDeletar(null)
    } catch (error: any) {
      alert(error.message || "Erro ao excluir coleção")
    } finally {
      setOperacaoEmAndamento(false)
    }
  }


  const isObjectiveQuestion = (question: Question) => {
    return question.alternativesRelation && question.alternativesRelation.length > 0
  }

  return (
    <div className="mx-auto px-4 py-4 max-w-7xl w-full">
      {/* Content */}
      {colecoesLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando coleções...</p>
          </div>
        </div>
      ) : colecoesError ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-medium">Erro ao carregar coleções</p>
                <p className="text-sm text-muted-foreground mt-1">{colecoesError}</p>
              </div>
              <Button variant="outline" onClick={() => carregarColecoes()}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : colecoes.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-lg">Nenhuma coleção criada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesse o Banco de Itens para selecionar questões e criar coleções
                </p>
              </div>
              <Button onClick={() => router.push('/professor/banco-itens')} variant="outline" className="mt-2">
                Ir para Banco de Itens
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid de coleções */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colecoes.map((colecao) => {
              return (
                <Card
                  key={colecao.id}
                  className="group hover:shadow-lg transition-all duration-200 hover:border-primary/30 cursor-pointer"
                  onClick={() => handleVerColecao(colecao)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold line-clamp-1">
                          {colecao.title || "Sem título"}
                        </CardTitle>
                        {colecao.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {colecao.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAbrirDialogDeletar(colecao)
                        }}
                        disabled={operacaoEmAndamento}
                        className="h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Hash className="h-3 w-3" />
                          {colecao.questionCount ?? 0} questões
                        </Badge>
                        {colecao.used && (
                          <Badge variant="secondary" className="text-xs">
                            Em uso
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(colecao.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Paginação */}
          {colecoesPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePaginaColecoes(colecoesPagination.page - 1)}
                disabled={colecoesPagination.page === 1}
                className="h-9 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {colecoesPagination.page} de {colecoesPagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePaginaColecoes(colecoesPagination.page + 1)}
                disabled={colecoesPagination.page >= colecoesPagination.totalPages}
                className="h-9 px-3"
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Dialog de detalhes da coleção */}
      <Dialog open={!!colecaoSelecionada} onOpenChange={(open) => !open && setColecaoSelecionada(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {colecaoSelecionada && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-xl flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      {colecaoSelecionada.title || "Sem título"}
                    </DialogTitle>
                    {colecaoSelecionada.description && (
                      <DialogDescription className="mt-2">
                        {colecaoSelecionada.description}
                      </DialogDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIniciarEdicao(colecaoSelecionada)}
                      className="gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAbrirDialogDeletar(colecaoSelecionada)}
                      disabled={operacaoEmAndamento}
                      className="gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="outline" className="text-sm gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    {colecaoSelecionada.questionIds.length} questões
                  </Badge>
                  <Badge variant="outline" className="text-sm gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(colecaoSelecionada.createdAt).toLocaleDateString("pt-BR")}
                  </Badge>
                  {colecaoSelecionada.used && (
                    <Badge variant="secondary" className="text-sm">
                      Em uso
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <h3 className="text-sm font-medium">Questões na coleção:</h3>
                {colecaoSelecionada.questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma questão nesta coleção
                  </div>
                ) : (
                  <div className="space-y-3">
                    {colecaoSelecionada.questions.map((questao, index) => (
                      <Card key={questao.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs gap-1">
                                  {isObjectiveQuestion(questao) ? (
                                    <>
                                      <BookOpen className="h-3 w-3" />
                                      Objetiva
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-3 w-3" />
                                      Dissertativa
                                    </>
                                  )}
                                </Badge>
                                {questao.language && (
                                  <Badge variant="outline" className="text-xs">
                                    {questao.language}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium mb-1">{questao.name}</p>
                              <HtmlRenderer
                                html={questao.content}
                                className="text-sm text-muted-foreground line-clamp-2"
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuestaoPreview(questao)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoverQuestaoColecao(colecaoSelecionada.id, questao.id)
                                }
                                disabled={operacaoEmAndamento}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de edição da coleção */}
      <Dialog open={!!editandoColecao} onOpenChange={(open) => !open && setEditandoColecao(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Coleção</DialogTitle>
            <DialogDescription>Atualize o título e descrição da coleção</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                placeholder="Título da coleção"
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Descrição da coleção"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditandoColecao(null)}
              disabled={operacaoEmAndamento}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvarEdicao} disabled={operacaoEmAndamento}>
              {operacaoEmAndamento ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvar
                </>
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
                </div>
                <DialogTitle className="text-base mt-3">{questaoPreview.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <HtmlRenderer html={questaoPreview.content} className="prose prose-sm max-w-none" />

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
                              </div>
                              {alt.isCorrect && (
                                <Badge className="bg-green-600 text-xs shrink-0">Correta</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para deletar coleção */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <div className="rounded-full bg-destructive/10 p-3">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
            </AlertDialogMedia>
            <AlertDialogTitle>Excluir coleção?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a coleção{" "}
              <span className="font-semibold text-foreground">
                "{colecaoParaDeletar?.title || "Sem título"}"
              </span>
              ? Esta ação não pode ser desfeita e todas as questões associadas serão removidas da coleção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={operacaoEmAndamento}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarDeletar}
              disabled={operacaoEmAndamento}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {operacaoEmAndamento ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
