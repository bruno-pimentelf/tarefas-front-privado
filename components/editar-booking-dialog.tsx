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
import { Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  TeacherClass,
  getTeacherClasses,
  updateBooking,
  UpdateBookingInput,
  Booking,
} from "@/lib/api/bookings"

interface EditarBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking
  onSuccess?: (updatedBooking: Booking, turmasIds?: number[]) => void
  turmasAssociadas?: number[] // IDs das turmas já associadas ao booking
}

export function EditarBookingDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
  turmasAssociadas = [],
}: EditarBookingDialogProps) {
  const { currentUser } = useAuth()

  // Form state
  const [titulo, setTitulo] = useState(booking.title || "")
  const [descricao, setDescricao] = useState(booking.description || "")
  const [bannerImage, setBannerImage] = useState(booking.bannerImage || "")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<number[]>([])
  const [selectTurmaValue, setSelectTurmaValue] = useState<string>("")

  // API state - Turmas
  const [turmas, setTurmas] = useState<TeacherClass[]>([])
  const [turmasLoading, setTurmasLoading] = useState(false)
  const [turmasError, setTurmasError] = useState<string | null>(null)

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // ID do professor (mock para testes)
  const teacherId = "teacher-001"

  // Inicializar formulário com dados do booking
  useEffect(() => {
    if (open && booking) {
      setTitulo(booking.title || "")
      setDescricao(booking.description || "")
      setBannerImage(booking.bannerImage || "")

      // Converter datas para formato de input datetime-local
      if (booking.startTime) {
        const startDate = new Date(booking.startTime)
        const startLocal = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
        setDataInicio(startLocal.toISOString().slice(0, 16))
      }

      if (booking.endTime) {
        const endDate = new Date(booking.endTime)
        const endLocal = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000)
        setDataFim(endLocal.toISOString().slice(0, 16))
      }

      // Inicializar turmas associadas
      if (turmasAssociadas.length > 0) {
        setTurmasSelecionadas([...turmasAssociadas])
      }
    }
  }, [open, booking, turmasAssociadas])

  // Carrega turmas quando o dialog abre
  useEffect(() => {
    if (open && currentUser) {
      carregarTurmas()
    }
  }, [open, currentUser])

  // Reset do formulário quando fecha
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const carregarTurmas = async () => {
    if (!currentUser) return

    setTurmasLoading(true)
    setTurmasError(null)

    try {
      const classes = await getTeacherClasses(teacherId)
      setTurmas(classes)
      // TODO: Carregar turmas já associadas ao booking quando a API suportar
      // Por enquanto, deixamos vazio
    } catch (error: any) {
      setTurmasError(error?.data?.message || error?.message || "Erro ao carregar turmas")
    } finally {
      setTurmasLoading(false)
    }
  }

  const resetForm = () => {
    setTitulo(booking.title || "")
    setDescricao(booking.description || "")
    setBannerImage(booking.bannerImage || "")
    setDataInicio("")
    setDataFim("")
    setTurmasSelecionadas(turmasAssociadas || [])
    setSelectTurmaValue("")
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  const handleAddTurma = (turmaId: string) => {
    const id = parseInt(turmaId)
    if (!turmasSelecionadas.includes(id)) {
      setTurmasSelecionadas([...turmasSelecionadas, id])
      // Limpar o select para permitir adicionar outra turma
      setSelectTurmaValue("")
      // Limpar erro se houver
      if (submitError) {
        setSubmitError(null)
      }
    }
  }

  const handleRemoveTurma = (turmaId: number) => {
    // Não permite remover se for a última turma
    if (turmasSelecionadas.length <= 1) {
      setSubmitError("É necessário ter pelo menos uma turma associada ao booking")
      return
    }
    setTurmasSelecionadas(turmasSelecionadas.filter((id) => id !== turmaId))
    // Limpar erro se houver
    if (submitError && submitError.includes("pelo menos uma turma")) {
      setSubmitError(null)
    }
  }

  const getTurmaById = (id: number): TeacherClass | undefined => {
    return turmas.find((t) => t.id === id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitting(true)
    setSubmitError(null)

    try {
      const updateData: UpdateBookingInput = {}

      // Adicionar apenas campos que foram alterados
      if (titulo.trim() !== booking.title) {
        updateData.title = titulo.trim()
      }

      if (descricao.trim() !== (booking.description || "")) {
        updateData.description = descricao.trim() || undefined
      }

      if (bannerImage.trim() !== (booking.bannerImage || "")) {
        updateData.bannerImage = bannerImage.trim() || undefined
      }

      if (dataInicio) {
        const inicio = new Date(dataInicio)
        const inicioISO = inicio.toISOString()
        if (inicioISO !== booking.startTime) {
          updateData.startTime = inicioISO
        }
      }

      if (dataFim) {
        const fim = new Date(dataFim)
        const fimISO = fim.toISOString()
        if (fimISO !== booking.endTime) {
          updateData.endTime = fimISO
        }
      }

      // Validar datas se ambas foram fornecidas
      if (updateData.startTime && updateData.endTime) {
        const inicio = new Date(updateData.startTime)
        const fim = new Date(updateData.endTime)
        if (fim <= inicio) {
          setSubmitError("A data de término deve ser posterior à data de início")
          setSubmitting(false)
          return
        }
      } else if (updateData.startTime && booking.endTime) {
        const inicio = new Date(updateData.startTime)
        const fim = new Date(booking.endTime)
        if (fim <= inicio) {
          setSubmitError("A data de término deve ser posterior à data de início")
          setSubmitting(false)
          return
        }
      } else if (updateData.endTime && booking.startTime) {
        const inicio = new Date(booking.startTime)
        const fim = new Date(updateData.endTime)
        if (fim <= inicio) {
          setSubmitError("A data de término deve ser posterior à data de início")
          setSubmitting(false)
          return
        }
      }

      // Validar que há pelo menos uma turma selecionada
      if (turmasSelecionadas.length === 0) {
        setSubmitError("É necessário ter pelo menos uma turma associada ao booking")
        setSubmitting(false)
        return
      }

      // Comparar com turmas associadas iniciais para ver se houve mudança
      const turmasIniciais = turmasAssociadas || []
      const turmasMudaram = 
        turmasSelecionadas.length !== turmasIniciais.length ||
        turmasSelecionadas.some(id => !turmasIniciais.includes(id)) ||
        turmasIniciais.some(id => !turmasSelecionadas.includes(id))
      
      if (turmasMudaram) {
        updateData.classIds = turmasSelecionadas
      }

      // Só fazer update se houver algo para atualizar
      if (Object.keys(updateData).length === 0) {
        setSubmitError("Nenhuma alteração foi feita")
        setSubmitting(false)
        return
      }

      const updatedBooking = await updateBooking(booking.id, updateData)

      setSubmitSuccess(true)

      // Fecha o dialog após 1.5 segundos de sucesso
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.(updatedBooking, turmasSelecionadas)
      }, 1500)
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || error?.message || "Erro ao atualizar tarefa"
      setSubmitError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const turmasDisponiveis = turmas.filter((t) => !turmasSelecionadas.includes(t.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
          <DialogDescription>
            Atualize as informações da tarefa. Apenas os campos alterados serão atualizados.
          </DialogDescription>
        </DialogHeader>

        {submitSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tarefa atualizada com sucesso!</h3>
            <p className="text-sm text-muted-foreground text-center">
              As alterações foram salvas com sucesso.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Tarefa</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
                placeholder="Ex: Prova Bimestral"
                disabled={submitting}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescricao(e.target.value)
                }
                placeholder="Descreva a tarefa..."
                rows={3}
                disabled={submitting}
              />
            </div>

            {/* Banner Image */}
            <div className="space-y-2">
              <Label htmlFor="bannerImage">URL da Imagem de Banner</Label>
              <Input
                id="bannerImage"
                type="url"
                value={bannerImage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBannerImage(e.target.value)
                }
                placeholder="https://example.com/banner.jpg"
                disabled={submitting}
              />
            </div>

            {/* Data e Horário de Início */}
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data e Horário de Início</Label>
              <Input
                id="dataInicio"
                type="datetime-local"
                value={dataInicio}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataInicio(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Data e Horário de Término */}
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data e Horário de Término</Label>
              <Input
                id="dataFim"
                type="datetime-local"
                value={dataFim}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataFim(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Turmas */}
            <div className="space-y-2">
              <Label>Turmas</Label>
              {turmasLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando turmas...
                </div>
              ) : turmasError ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {turmasError}
                </div>
              ) : (
                <>
                  {/* Dropdown para adicionar turmas */}
                  {turmasDisponiveis.length > 0 ? (
                    <div>
                      <Select
                        value={selectTurmaValue}
                        onValueChange={handleAddTurma}
                        disabled={submitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Adicionar turma" />
                        </SelectTrigger>
                        <SelectContent>
                          {turmasDisponiveis.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id.toString()}>
                              {turma.name} - {turma.grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : turmas.length > 0 && turmasSelecionadas.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Todas as turmas disponíveis já estão associadas
                    </p>
                  ) : null}

                  {/* Turmas associadas - exibidas abaixo do dropdown */}
                  {turmasSelecionadas.length > 0 && (
                    <div className="space-y-2">
                      {turmasSelecionadas.length === 1 && (
                        <p className="text-xs text-muted-foreground italic">
                          (Mínimo de 1 turma obrigatório)
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {turmasSelecionadas.map((turmaId) => {
                          const turma = getTurmaById(turmaId)
                          const isUltimaTurma = turmasSelecionadas.length === 1
                          return (
                            <Badge
                              key={turmaId}
                              variant="secondary"
                              className="gap-1.5 pr-1.5"
                            >
                              {turma?.name || `Turma ${turmaId}`}
                              {turma?.grade && ` - ${turma.grade}`}
                              <button
                                type="button"
                                onClick={() => handleRemoveTurma(turmaId)}
                                disabled={submitting || isUltimaTurma}
                                className={`ml-1 rounded-full p-0.5 ${
                                  isUltimaTurma
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-destructive/20"
                                }`}
                                title={
                                  isUltimaTurma
                                    ? "Não é possível remover a última turma"
                                    : "Remover turma"
                                }
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {turmas.length === 0 && !turmasLoading && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma turma disponível
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Erro */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Footer */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
