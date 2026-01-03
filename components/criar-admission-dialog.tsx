"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, AlertCircle, CheckCircle2, BookOpen } from "lucide-react"
import {
  createAdmission,
  CreateAdmissionInput,
  createExams,
  listCollections,
  Collection,
} from "@/lib/api"

interface CriarAdmissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: number
  bookingTitle: string
  onSuccess?: () => void
}

export function CriarAdmissionDialog({
  open,
  onOpenChange,
  bookingId,
  bookingTitle,
  onSuccess,
}: CriarAdmissionDialogProps) {
  // Form state - Admission
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [instrucoes, setInstrucoes] = useState("")
  const [bannerImage, setBannerImage] = useState("")
  const [duracao, setDuracao] = useState("60")

  // Collection selecionada (única)
  const [collectionId, setCollectionId] = useState<number | null>(null)

  // Collections state
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)

  // API state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Carrega collections quando o dialog abre
  useEffect(() => {
    if (open) {
      carregarCollections()
    }
  }, [open])

  // Reset do formulário quando fecha
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const carregarCollections = async () => {
    setCollectionsLoading(true)
    try {
      const response = await listCollections(1, 100)
      setCollections(response.items || [])
    } catch (error: any) {
      // Erro silencioso - collections vazias serão tratadas na UI
    } finally {
      setCollectionsLoading(false)
    }
  }

  const resetForm = () => {
    setTitulo("")
    setDescricao("")
    setInstrucoes("")
    setBannerImage("")
    setDuracao("60")
    setCollectionId(null)
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim()) {
      setSubmitError("O título é obrigatório")
      return
    }

    const duracaoNum = parseInt(duracao)
    if (isNaN(duracaoNum) || duracaoNum < 1) {
      setSubmitError("A duração deve ser pelo menos 1 minuto")
      return
    }

    if (!collectionId) {
      setSubmitError("Selecione uma collection de questões")
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Criar a admission
      const admissionData: CreateAdmissionInput = {
        bookingId,
        title: titulo.trim(),
        description: descricao.trim() || undefined,
        instructions: instrucoes.trim() || undefined,
        bannerImage: bannerImage.trim() || undefined,
        available: true,
        duration: duracaoNum,
      }

      const admission = await createAdmission(admissionData)

      // 2. Criar o exam associado à admission (apenas um)
      const selectedCollection = collections.find((c) => c.id === collectionId)
      const examTitle = selectedCollection?.title || titulo.trim()

      await createExams({
        exams: [
          {
            title: examTitle,
            admissionId: admission.id,
            collectionId: collectionId,
          },
        ],
      })

      setSubmitSuccess(true)

      // Fecha o dialog após 1.5 segundos de sucesso
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 1500)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Erro ao criar avaliação"
      setSubmitError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Avaliação</DialogTitle>
          <DialogDescription>
            Criar avaliação para o booking: <strong>{bookingTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {submitSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Avaliação criada com sucesso!</h3>
            <p className="text-sm text-muted-foreground">
              A avaliação foi criada e vinculada à collection selecionada.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informações da Admission */}
            <div className="space-y-4 p-4 border rounded-md">
              <h3 className="text-sm font-semibold">Informações da Avaliação</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
                    placeholder="Ex: Avaliação de Matemática"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracao">Duração (minutos) *</Label>
                  <Input
                    id="duracao"
                    type="number"
                    min="1"
                    value={duracao}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuracao(e.target.value)}
                    placeholder="60"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricao(e.target.value)}
                  placeholder="Descrição da avaliação..."
                  rows={2}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrucoes">Instruções para o aluno (opcional)</Label>
                <Textarea
                  id="instrucoes"
                  value={instrucoes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInstrucoes(e.target.value)}
                  placeholder="Leia atentamente cada questão antes de responder..."
                  rows={2}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerImage">URL da Imagem de Banner (opcional)</Label>
                <Input
                  id="bannerImage"
                  type="url"
                  value={bannerImage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBannerImage(e.target.value)}
                  placeholder="https://exemplo.com/banner.jpg"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Collection de Questões */}
            <div className="space-y-4 p-4 border rounded-md">
              <h3 className="text-sm font-semibold">Collection de Questões</h3>

              {collectionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Carregando collections...</span>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-md">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Nenhuma collection disponível
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Crie collections no Banco de Itens antes de criar uma avaliação.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Selecione a Collection *</Label>
                  <Select
                    value={collectionId?.toString() || ""}
                    onValueChange={(value) => setCollectionId(parseInt(value))}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma collection de questões..." />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem
                          key={collection.id}
                          value={collection.id.toString()}
                        >
                          {collection.title || `Collection ${collection.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    As questões da collection selecionada serão utilizadas na avaliação.
                  </p>
                </div>
              )}
            </div>

            {/* Mensagem de erro */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{submitError}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || !collectionId || collections.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Avaliação"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
