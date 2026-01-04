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
import { Badge } from "@/components/ui/badge"
import { FaSpinner, FaTimes, FaExclamationCircle, FaCheckCircle, FaBook, FaPlus } from "react-icons/fa"
import { useAuth } from "@/contexts/auth-context"
import {
  TeacherClass,
  getTeacherClasses,
  createBooking,
  CreateBookingInput,
} from "@/lib/api/bookings"
import { Collection, listCollections } from "@/lib/api"
import { createAdmission } from "@/lib/api/admissions"
import { createExams } from "@/lib/api/exams"

interface CriarTarefaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CriarTarefaDialog({ open, onOpenChange, onSuccess }: CriarTarefaDialogProps) {
  const { currentUser } = useAuth()
  
  // Form state - Booking
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [bannerImage, setBannerImage] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<number[]>([])

  // Form state - Admission
  const [admissionTitle, setAdmissionTitle] = useState("")
  const [admissionDuration, setAdmissionDuration] = useState("60")
  const [admissionInstructions, setAdmissionInstructions] = useState("")

  // Form state - Collection/Exam
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null)

  // API state - Turmas
  const [turmas, setTurmas] = useState<TeacherClass[]>([])
  const [turmasLoading, setTurmasLoading] = useState(false)
  const [turmasError, setTurmasError] = useState<string | null>(null)

  // API state - Collections
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [collectionsError, setCollectionsError] = useState<string | null>(null)

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>("")

  // Carrega turmas e collections quando o dialog abre
  useEffect(() => {
    if (open && currentUser) {
      carregarTurmas()
      carregarCollections()
    }
  }, [open, currentUser])

  // Reset do formulário quando fecha
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  // Sincroniza título da admission com título do booking
  useEffect(() => {
    if (!admissionTitle && titulo) {
      setAdmissionTitle(titulo)
    }
  }, [titulo])


  const carregarTurmas = async () => {
    if (!currentUser) return

    setTurmasLoading(true)
    setTurmasError(null)

    try {
      if (!currentUser) return
      const classes = await getTeacherClasses(currentUser.uid)
      setTurmas(classes)
    } catch (error: any) {
      setTurmasError(error?.data?.message || error?.message || "Erro ao carregar turmas")
    } finally {
      setTurmasLoading(false)
    }
  }

  const carregarCollections = async () => {
    setCollectionsLoading(true)
    setCollectionsError(null)

    try {
      const response = await listCollections(1, 100)
      setCollections(response.items || [])
    } catch (error: any) {
      setCollectionsError(error?.data?.message || error?.message || "Erro ao carregar coleções")
    } finally {
      setCollectionsLoading(false)
    }
  }

  const resetForm = () => {
    setTitulo("")
    setDescricao("")
    setBannerImage("")
    setDataInicio("")
    setDataFim("")
    setTurmasSelecionadas([])
    setAdmissionTitle("")
    setAdmissionDuration("60")
    setAdmissionInstructions("")
    setSelectedCollectionId(null)
    setSubmitError(null)
    setSubmitSuccess(false)
    setCurrentStep("")
  }

  const handleAddTurma = (turmaId: string) => {
    const id = parseInt(turmaId)
    if (!turmasSelecionadas.includes(id)) {
      setTurmasSelecionadas([...turmasSelecionadas, id])
    }
  }

  const handleRemoveTurma = (turmaId: number) => {
    setTurmasSelecionadas(turmasSelecionadas.filter(id => id !== turmaId))
  }

  const getTurmaById = (id: number): TeacherClass | undefined => {
    return turmas.find(t => t.id === id)
  }

  const getSelectedCollection = (): Collection | undefined => {
    return collections.find(c => c.id === selectedCollectionId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!titulo.trim()) {
      setSubmitError("O título é obrigatório")
      return
    }

    if (!dataInicio || !dataFim) {
      setSubmitError("As datas de início e término são obrigatórias")
      return
    }

    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    if (fim <= inicio) {
      setSubmitError("A data de término deve ser posterior à data de início")
      return
    }

    if (!selectedCollectionId) {
      setSubmitError("Selecione uma coleção de questões para a avaliação")
      return
    }

    const duration = parseInt(admissionDuration)
    if (isNaN(duration) || duration <= 0) {
      setSubmitError("A duração deve ser um número positivo")
      return
    }

    // Validar que pelo menos uma turma foi selecionada
    if (turmasSelecionadas.length === 0) {
      setSubmitError("Selecione pelo menos uma turma")
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Criar o Booking
      setCurrentStep("Criando tarefa...")
      const bookingData: CreateBookingInput = {
        title: titulo.trim(),
        description: descricao.trim() || undefined,
        bannerImage: bannerImage.trim() || undefined,
        available: true,
        startTime: inicio.toISOString(),
        endTime: fim.toISOString(),
        classIds: turmasSelecionadas,
      }

      const booking = await createBooking(bookingData)

      // 2. Criar a Admission
      setCurrentStep("Criando avaliação...")
      const admission = await createAdmission({
        bookingId: booking.id,
        title: admissionTitle.trim() || titulo.trim(),
        description: descricao.trim() || undefined,
        instructions: admissionInstructions.trim() || undefined,
        bannerImage: bannerImage.trim() || undefined,
        available: true,
        duration: duration,
      })

      // 3. Criar o Exam com a Collection
      setCurrentStep("Associando questões...")
      const selectedCollection = getSelectedCollection()
      await createExams({
        exams: [{
          title: selectedCollection?.title || selectedCollection?.description || "Prova",
          admissionId: admission.id,
          collectionId: selectedCollectionId,
        }]
      })
      
      setSubmitSuccess(true)
      setCurrentStep("")
      
      // Fecha o dialog após 1.5 segundos de sucesso
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 1500)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Erro ao criar tarefa"
      setSubmitError(errorMessage)
      setCurrentStep("")
    } finally {
      setSubmitting(false)
    }
  }

  const turmasDisponiveis = turmas.filter(t => !turmasSelecionadas.includes(t.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col sm:max-w-5xl">
        {/* Header fixo */}
        <DialogHeader className="flex-shrink-0 bg-background border-b px-6 py-4">
          <DialogTitle className="text-xl font-bold">Criar Nova Tarefa</DialogTitle>
          <DialogDescription className="text-sm text-foreground/70 mt-1">
            Crie uma tarefa completa com avaliação e questões para seus alunos
          </DialogDescription>
        </DialogHeader>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {submitSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <FaCheckCircle className="h-10 w-10 text-green-600 dark:text-green-400 relative z-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Tarefa criada com sucesso!</h3>
              <p className="text-sm text-foreground/60 text-center max-w-md">
                A tarefa foi criada com a avaliação e questões associadas.
              </p>
            </div>
          ) : (
            <form id="criar-tarefa-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Seção: Informações da Tarefa */}
            <div className="space-y-5 p-5 bg-muted/30 rounded-lg border border-border/50">
              <h4 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Informações da Tarefa
              </h4>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo" className="text-sm font-medium">Título da Tarefa *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
                  placeholder="Ex: Prova de Matemática - 1º Bimestre"
                  required
                  disabled={submitting}
                  className="h-10"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-sm font-medium">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricao(e.target.value)}
                  placeholder="Descreva a tarefa para os alunos..."
                  rows={3}
                  disabled={submitting}
                  className="resize-none"
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data e Hora de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="datetime-local"
                    value={dataInicio}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataInicio(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data e Hora de Término *</Label>
                  <Input
                    id="dataFim"
                    type="datetime-local"
                    value={dataFim}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataFim(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Turmas */}
              <div className="space-y-2">
                <Label>Turmas</Label>
                
                {turmasLoading ? (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                    <FaSpinner className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-foreground/60">Carregando turmas...</span>
                  </div>
                ) : turmasError ? (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive border border-destructive/20">
                    <FaExclamationCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{turmasError}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={carregarTurmas}
                      className="ml-auto"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : turmas.length === 0 ? (
                  <div className="p-3 bg-muted/30 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Nenhuma turma encontrada. Por favor, adicione turmas ao sistema antes de criar uma tarefa.
                    </p>
                  </div>
                ) : (
                  <>
                    <Select
                      value=""
                      onValueChange={handleAddTurma}
                      disabled={submitting || turmasDisponiveis.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          turmasDisponiveis.length === 0
                            ? "Todas as turmas já foram selecionadas"
                            : "Selecione uma turma..."
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {turmasDisponiveis.map((turma) => (
                          <SelectItem key={turma.id} value={String(turma.id)}>
                            <div className="flex items-center gap-2">
                              <span>{turma.name}</span>
                              <span className="text-muted-foreground">- {turma.grade}</span>
                              <span className="text-xs text-muted-foreground">
                                ({turma.school.name})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {turmasSelecionadas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {turmasSelecionadas.map((turmaId) => {
                          const turma = getTurmaById(turmaId)
                          if (!turma) return null
                          return (
                            <Badge
                              key={turmaId}
                              variant="secondary"
                              className="pl-2 pr-1 py-1 flex items-center gap-1"
                            >
                              <span>{turma.name} - {turma.grade}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTurma(turmaId)}
                                disabled={submitting}
                                className="h-5 w-5 p-0 hover:bg-destructive/20"
                              >
                                <FaTimes className="h-3 w-3" />
                              </Button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Separador */}
            <div className="space-y-5 p-5 bg-muted/30 rounded-lg border border-border/50">
              <h4 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Configuração da Avaliação
              </h4>

              {/* Título da Admission (opcional, herda do booking) */}
              <div className="space-y-2">
                <Label htmlFor="admissionTitle">Título da Avaliação (opcional)</Label>
                <Input
                  id="admissionTitle"
                  value={admissionTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdmissionTitle(e.target.value)}
                  placeholder={titulo || "Usa o título da tarefa se vazio"}
                  disabled={submitting}
                />
              </div>

              {/* Duração */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="admissionDuration">Duração (minutos) *</Label>
                <Input
                  id="admissionDuration"
                  type="number"
                  min="1"
                  value={admissionDuration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdmissionDuration(e.target.value)}
                  placeholder="60"
                  disabled={submitting}
                />
              </div>

              {/* Instruções */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="admissionInstructions">Instruções para o aluno (opcional)</Label>
                <Textarea
                  id="admissionInstructions"
                  value={admissionInstructions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdmissionInstructions(e.target.value)}
                  placeholder="Ex: Leia atentamente cada questão antes de responder..."
                  rows={2}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Separador */}
            <div className="space-y-5 p-5 bg-muted/30 rounded-lg border border-border/50">
              <h4 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Seleção de Questões
              </h4>

              {/* Collection */}
              <div className="space-y-2">
                <Label>Coleção de Questões *</Label>
                
                {collectionsLoading ? (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                    <FaSpinner className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-foreground/60">Carregando coleções...</span>
                  </div>
                ) : collectionsError ? (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive border border-destructive/20">
                    <FaExclamationCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{collectionsError}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={carregarCollections}
                      className="ml-auto"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : collections.length === 0 ? (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Nenhuma coleção encontrada. Crie uma coleção no Banco de Itens primeiro.
                    </p>
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedCollectionId?.toString() || ""}
                      onValueChange={(value) => setSelectedCollectionId(parseInt(value))}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coleção de questões..." />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={String(collection.id)}>
                            <div className="flex items-center gap-2">
                              <FaBook className="h-4 w-4 text-foreground/60" />
                              <span>{collection.title || collection.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedCollectionId && (
                      <div className="mt-2 p-4 bg-primary/5 border border-primary/20 rounded-md transition-all duration-200 hover:bg-primary/10">
                        <div className="flex items-center gap-2">
                          <FaBook className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {getSelectedCollection()?.title || getSelectedCollection()?.description}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/60 mt-1.5">
                          As questões desta coleção serão incluídas na avaliação.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Mensagem de erro */}
            {submitError && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-md text-destructive border border-destructive/20">
                <FaExclamationCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{submitError}</span>
              </div>
            )}

            {/* Progresso de criação */}
            {submitting && currentStep && (
              <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-md border border-primary/20">
                <FaSpinner className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-primary font-medium">{currentStep}</span>
              </div>
            )}
            </form>
          )}
        </div>

        {/* Footer fixo */}
        {!submitSuccess && (
          <div className="flex-shrink-0 bg-background border-t px-6 py-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="criar-tarefa-form"
              disabled={submitting || turmasLoading || collectionsLoading || collections.length === 0}
              className="h-10 gap-2"
            >
              {submitting ? (
                <>
                  <FaSpinner className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <FaPlus className="h-4 w-4" />
                  Criar Tarefa
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
