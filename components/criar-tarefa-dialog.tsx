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
import { Loader2, X, AlertCircle, CheckCircle2, BookOpen } from "lucide-react"
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

  // ID do professor (mock para testes)
  const teacherId = "teacher-001"

  const carregarTurmas = async () => {
    if (!currentUser) return

    setTurmasLoading(true)
    setTurmasError(null)

    try {
      const classes = await getTeacherClasses(teacherId)
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
          <DialogDescription>
            Crie uma tarefa completa com avaliação e questões para seus alunos
          </DialogDescription>
        </DialogHeader>

        {submitSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tarefa criada com sucesso!</h3>
            <p className="text-sm text-muted-foreground text-center">
              A tarefa foi criada com a avaliação e questões associadas.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção: Informações da Tarefa */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações da Tarefa
              </h4>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Título da Tarefa *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
                  placeholder="Ex: Prova de Matemática - 1º Bimestre"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricao(e.target.value)}
                  placeholder="Descreva a tarefa para os alunos..."
                  rows={2}
                  disabled={submitting}
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Carregando turmas...</span>
                  </div>
                ) : turmasError ? (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
                    <AlertCircle className="h-4 w-4" />
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
                                <X className="h-3 w-3" />
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
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
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
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Seleção de Questões
              </h4>

              {/* Collection */}
              <div className="space-y-2">
                <Label>Coleção de Questões *</Label>
                
                {collectionsLoading ? (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Carregando coleções...</span>
                  </div>
                ) : collectionsError ? (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
                    <AlertCircle className="h-4 w-4" />
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
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span>{collection.title || collection.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedCollectionId && (
                      <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {getSelectedCollection()?.title || getSelectedCollection()?.description}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
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
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{submitError}</span>
              </div>
            )}

            {/* Progresso de criação */}
            {submitting && currentStep && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-primary">{currentStep}</span>
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
                disabled={submitting || turmasLoading || collectionsLoading || collections.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Tarefa"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
