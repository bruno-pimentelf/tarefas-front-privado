"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react"
import { createClass, updateClass, deleteClass, listSchools, listClasses, type Class, type CreateClassInput, type UpdateClassInput } from "@/lib/api"
import { type School } from "@/lib/api/schools"
import { useAuth } from "@/contexts/auth-context"
import { formatGrade } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function TurmasManagement() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [schoolId, setSchoolId] = useState<string>("")
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const [schoolYear, setSchoolYear] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      setError(null)
      const [schoolsResponse, classesResponse] = await Promise.all([
        listSchools({ page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } })),
        listClasses({ page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }))
      ])
      // Extrair array de classes da resposta paginada
      const classesArray = Array.isArray(classesResponse.data) ? classesResponse.data : []
      setClasses(classesArray)
      setSchools(schoolsResponse.data || [])
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados")
      setClasses([]) // Garantir que seja um array vazio em caso de erro
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls)
      setSchoolId(cls.schoolId.toString())
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
    setSchoolId("")
    setName("")
    setGrade("")
    setSchoolYear(new Date().getFullYear().toString())
  }

  const handleSave = async () => {
    if (!schoolId || !name.trim() || !grade.trim() || !schoolYear.trim()) {
      setError("Todos os campos são obrigatórios")
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingClass) {
        const updateData: UpdateClassInput = {
          schoolId: parseInt(schoolId),
          name: name.trim(),
          grade: grade.trim(),
          schoolYear: schoolYear.trim(),
        }
        await updateClass(editingClass.id, updateData)
      } else {
        const createData: CreateClassInput = {
          schoolId: parseInt(schoolId),
          name: name.trim(),
          grade: grade.trim(),
          schoolYear: schoolYear.trim(),
        }
        await createClass(createData)
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

  const handleDelete = async (cls: Class) => {
    if (!confirm(`Tem certeza que deseja deletar a turma "${cls.name}"?`)) {
      return
    }

    try {
      await deleteClass(cls.id)
      loadData()
    } catch (err: any) {
      setError(err?.message || "Erro ao deletar turma")
    }
  }

  const handleOpenClassDetails = (cls: Class) => {
    router.push(`/coordenador/turmas/${cls.id}`)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Turma
        </Button>
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium align-middle">Turma</TableHead>
                <TableHead className="align-middle">Série</TableHead>
                <TableHead className="align-middle">Ano Letivo</TableHead>
                <TableHead className="align-middle">Escola</TableHead>
                <TableHead className="text-right align-middle">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!Array.isArray(classes) || classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma turma cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{formatGrade(cls.grade)}</TableCell>
                    <TableCell>{cls.schoolYear || "-"}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleOpenClassDetails(cls)}
                        className="text-primary hover:underline cursor-pointer text-left"
                      >
                        {cls.school?.name || cls.schoolName || "-"}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
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
                          onClick={() => handleDelete(cls)}
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
              <Label htmlFor="schoolId">Escola *</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma escola" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                <Input
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Ex: 3º Ano"
                />
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
    </div>
  )
}
