"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Loader2, AlertCircle, ArrowLeft, GraduationCap, Users } from "lucide-react"
import { createClass, updateClass, deleteClass, listClasses, getSchoolById, listUsersByClass, removeUserFromClass, type Class, type CreateClassInput, type UpdateClassInput } from "@/lib/api"
import { type School } from "@/lib/api/schools"
import { useAuth } from "@/contexts/auth-context"
import { formatGrade } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SchoolClassesPage() {
  const { currentUser } = useAuth()
  const params = useParams()
  const router = useRouter()
  const schoolIdParam = params?.schoolId as string
  const schoolId = schoolIdParam ? parseInt(schoolIdParam) : NaN

  const [school, setSchool] = useState<School | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [classToDelete, setClassToDelete] = useState<Class | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const [schoolYear, setSchoolYear] = useState(new Date().getFullYear().toString())

  const loadingRef = useRef(false)
  const loadedSchoolIdRef = useRef<number | null>(null)

  const loadData = useCallback(async () => {
    if (!currentUser || !schoolId || isNaN(schoolId) || loadingRef.current) return
    
    // Evitar chamadas redundantes para o mesmo schoolId
    if (loadedSchoolIdRef.current === schoolId) {
      return
    }
    
    try {
      loadingRef.current = true
      loadedSchoolIdRef.current = schoolId
      setLoading(true)
      setError(null)
      const [schoolResponse, classesResponse] = await Promise.all([
        getSchoolById(schoolId).catch(() => null),
        listClasses({ schoolId, page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }))
      ])
      
      const classesArray = Array.isArray(classesResponse.data) ? classesResponse.data : []
      setClasses(classesArray)
      setSchool(schoolResponse)
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados")
      setClasses([])
      loadedSchoolIdRef.current = null // Reset em caso de erro para permitir nova tentativa
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [currentUser, schoolId])

  useEffect(() => {
    if (currentUser && schoolId && !isNaN(schoolId) && schoolId > 0) {
      loadData()
    } else if (schoolIdParam && (isNaN(schoolId) || schoolId <= 0)) {
      setError("ID da escola inválido")
      setLoading(false)
    }
    
    return () => {
      // Reset apenas se mudou o schoolId
      if (loadedSchoolIdRef.current !== schoolId) {
        loadedSchoolIdRef.current = null
        loadingRef.current = false
      }
    }
  }, [currentUser, schoolId, schoolIdParam, loadData])

  const handleOpenDialog = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls)
      setName(cls.name)
      setGrade(cls.grade)
      setSchoolYear(cls.schoolYear)
    } else {
      setEditingClass(null)
      resetForm()
    }
    setShowDialog(true)
  }

  const resetForm = () => {
    setName("")
    setGrade("")
    setSchoolYear(new Date().getFullYear().toString())
  }

  const handleSave = async () => {
    if (!name.trim() || !grade.trim() || !schoolYear.trim()) {
      setError("Todos os campos são obrigatórios")
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingClass) {
        const updateData: UpdateClassInput = {
          schoolId: schoolId,
          name: name.trim(),
          grade: grade.trim(),
          schoolYear: schoolYear.trim(),
        }
        await updateClass(editingClass.id, updateData)
      } else {
        const createData: CreateClassInput = {
          schoolId: schoolId,
          name: name.trim(),
          grade: grade.trim(),
          schoolYear: schoolYear.trim(),
        }
        await createClass(createData)
        // Refresh da página após criar turma
        router.refresh()
      }
      setShowDialog(false)
      resetForm()
      loadData()
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar turma")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (cls: Class) => {
    setClassToDelete(cls)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!classToDelete) return

    setDeleting(true)
    setError(null)

    try {
      // 1. Buscar todos os membros da turma (alunos e professores) com paginação
      let allMembers: Array<{ userId: string }> = []
      try {
        let currentPage = 1
        const limit = 100
        let hasMorePages = true

        while (hasMorePages) {
          const membersResponse = await listUsersByClass(classToDelete.id, {
            page: currentPage,
            limit,
          })
          
          if (membersResponse.data && membersResponse.data.length > 0) {
            const pageMembers = membersResponse.data.map(user => ({ userId: user.userId }))
            allMembers.push(...pageMembers)
          }

          hasMorePages = currentPage < (membersResponse.meta?.totalPages || 0)
          currentPage++
        }
      } catch (membersErr: any) {
        // Se houver erro ao buscar membros, apenas loga mas continua
        console.warn("Erro ao buscar membros da turma:", membersErr)
      }

      // 2. Remover todos os membros da turma antes de deletar
      // Nota: Não há uma rota de bulk delete, então removemos em paralelo usando Promise.allSettled
      if (allMembers.length > 0) {
        try {
          // Remover todos os membros em paralelo usando Promise.allSettled
          // para garantir que todos sejam removidos mesmo se algum falhar
          const removePromises = allMembers.map((member) =>
            removeUserFromClass(member.userId, classToDelete.id).catch((err) => {
              // Ignorar erros 404 (usuário já não está na turma)
              if (err?.status !== 404 && err?.response?.status !== 404) {
                console.warn(`Erro ao remover membro ${member.userId} da turma:`, err)
              }
              return null
            })
          )
          
          const results = await Promise.allSettled(removePromises)
          const successful = results.filter(r => r.status === 'fulfilled').length
          console.log(`Removidos ${successful} de ${allMembers.length} membros da turma antes de deletar`)
        } catch (removeErr: any) {
          // Se houver erro ao remover membros, apenas loga mas continua
          console.warn("Erro ao remover membros da turma:", removeErr)
        }
      }

      // 3. Deletar a turma
      await deleteClass(classToDelete.id)
      
      // 4. Atualização otimista: remover a turma da lista imediatamente
      setClasses((prevClasses) => prevClasses.filter((cls) => cls.id !== classToDelete.id))
      
      // 5. Sempre dar refresh após deletar turma
      // Resetar a referência para forçar recarregamento
      loadedSchoolIdRef.current = null
      router.refresh()
      
      // 6. Recarregar dados em background para garantir sincronização
      loadData().catch(() => {
        // Se houver erro, apenas loga mas não bloqueia
        console.warn("Erro ao recarregar dados após deletar turma")
      })
      
      setShowDeleteDialog(false)
      setClassToDelete(null)
    } catch (err: any) {
      setError(err?.message || "Erro ao deletar turma")
      // Dar refresh mesmo em caso de erro para garantir que a lista seja atualizada
      loadedSchoolIdRef.current = null
      router.refresh()
      await loadData()
    } finally {
      setDeleting(false)
    }
  }

  const handleOpenClassDetails = (cls: Class) => {
    router.push(`/coordenador/turmas/${schoolId}/turma/${cls.id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando turmas...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !school) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/coordenador/escolas")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {school?.name || "Escola"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerenciamento de turmas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/coordenador/escolas/${schoolId}/membros`)}
              >
                <Users className="h-4 w-4 mr-2" />
                Ver Membros
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Turmas ({classes.length})
          </CardTitle>
          <CardDescription>
            Clique em uma turma para gerenciar seus alunos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium align-middle">Turma</TableHead>
                <TableHead className="align-middle">Série</TableHead>
                <TableHead className="align-middle">Ano Letivo</TableHead>
                <TableHead className="text-right align-middle">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!Array.isArray(classes) || classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhuma turma cadastrada nesta escola
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id} className="cursor-pointer hover:bg-accent" onClick={() => handleOpenClassDetails(cls)}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{formatGrade(cls.grade)}</TableCell>
                    <TableCell>{cls.schoolYear || "-"}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(cls)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(cls)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? "Editar Turma" : "Nova Turma"}</DialogTitle>
            <DialogDescription>
              {editingClass ? "Atualize as informações da turma" : "Preencha os dados da nova turma"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Turma *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: 3º A"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Série *</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Selecione a série" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6º Ano</SelectItem>
                    <SelectItem value="7">7º Ano</SelectItem>
                    <SelectItem value="8">8º Ano</SelectItem>
                    <SelectItem value="9">9º Ano</SelectItem>
                    <SelectItem value="1">1º EM</SelectItem>
                    <SelectItem value="2">2º EM</SelectItem>
                    <SelectItem value="3">3º EM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolYear">Ano Letivo *</Label>
                <Input
                  id="schoolYear"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  placeholder="2026"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para deletar turma */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Deletar Turma
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Tem certeza que deseja deletar a turma <strong>"{classToDelete?.name}"</strong>?
            </AlertDialogDescription>
            <div className="pt-2 space-y-2">
              <p className="text-sm text-muted-foreground">Esta ação irá:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Remover todos os alunos e professores desta turma</li>
                <li>Deletar permanentemente a turma</li>
              </ul>
              <p className="text-sm font-semibold text-destructive mt-2">Esta ação não pode ser desfeita.</p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar Turma"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
