"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { ArrowLeft, Users, Loader2, AlertCircle, Plus, Trash2, Search } from "lucide-react"
import { getSchoolById, listUsersBySchoolFromAPI, addUserToSchool, removeUserFromSchool, getRoles, listAllUsers, listClasses, removeUserFromClass, type School, type UserSchool, type Role, type UserClassUser } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Label } from "@/components/ui/label"

export default function EscolaAlunosPage() {
  const { currentUser } = useAuth()
  const params = useParams()
  const router = useRouter()
  const schoolIdParam = params?.schoolId as string
  const schoolId = schoolIdParam ? parseInt(schoolIdParam) : NaN

  const [school, setSchool] = useState<School | null>(null)
  const [students, setStudents] = useState<UserSchool[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<UserSchool | null>(null)
  const [userId, setUserId] = useState("")
  const [roleId, setRoleId] = useState<string>("")
  const [grade, setGrade] = useState("")
  const [saving, setSaving] = useState(false)
  
  // User search states
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [allUsers, setAllUsers] = useState<UserClassUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const loadingRef = useRef(false)
  const loadedSchoolIdRef = useRef<number | null>(null)
  const loadingStudentsRef = useRef(false)
  const loadedStudentsSchoolIdRef = useRef<number | null>(null)
  const loadingUsersRef = useRef(false)
  const loadedUsersRef = useRef(false)

  const loadSchoolData = useCallback(async () => {
    if (!schoolId || isNaN(schoolId) || loadingRef.current) return

    // Evitar chamadas redundantes para o mesmo schoolId
    if (loadedSchoolIdRef.current === schoolId) {
      return
    }

    try {
      loadingRef.current = true
      loadedSchoolIdRef.current = schoolId
      setLoading(true)
      setError(null)
      const schoolData = await getSchoolById(schoolId)
      setSchool(schoolData)
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados da escola")
      loadedSchoolIdRef.current = null // Reset em caso de erro para permitir nova tentativa
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [schoolId])

  const loadStudents = useCallback(async () => {
    if (!schoolId || isNaN(schoolId) || loadingStudentsRef.current) return

    // Evitar chamadas redundantes para o mesmo schoolId
    if (loadedStudentsSchoolIdRef.current === schoolId) {
      return
    }

    try {
      loadingStudentsRef.current = true
      loadedStudentsSchoolIdRef.current = schoolId
      setLoadingStudents(true)
      setError(null)
      
      // Buscar todos os alunos com paginação
      const allStudents: UserSchool[] = []
      let currentPage = 1
      const limit = 100
      let hasMorePages = true

      while (hasMorePages) {
        const response = await listUsersBySchoolFromAPI(schoolId, {
          page: currentPage,
          limit,
          search: searchTerm || undefined,
        })

        if (response.data && response.data.length > 0) {
          allStudents.push(...response.data)
        }

        hasMorePages = currentPage < (response.meta?.totalPages || 0)
        currentPage++
      }

      setStudents(allStudents)
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar alunos")
      setStudents([])
      loadedStudentsSchoolIdRef.current = null
    } finally {
      setLoadingStudents(false)
      loadingStudentsRef.current = false
    }
  }, [schoolId, searchTerm])

  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await getRoles()
      setRoles(rolesData || [])
    } catch (err: any) {
      console.error("Erro ao carregar roles:", err)
    }
  }, [])

  const loadAllUsers = useCallback(async () => {
    if (loadingUsersRef.current || loadedUsersRef.current) return
    
    try {
      loadingUsersRef.current = true
      setLoadingUsers(true)
      
      const users = await listAllUsers({ page: 1, limit: 100 })
      setAllUsers(users || [])
      loadedUsersRef.current = true
    } catch (err: any) {
      console.error("Erro ao carregar usuários:", err)
      setAllUsers([])
    } finally {
      setLoadingUsers(false)
      loadingUsersRef.current = false
    }
  }, [])

  // Filtrar usuários disponíveis para o dropdown
  const availableUsers = useMemo(() => {
    // Filtrar usuários que já estão na escola atual
    const studentsInSchoolIds = new Set(students.map(s => s.userId))
    const filtered = allUsers.filter(user => 
      !studentsInSchoolIds.has(user.userId)
    )
    
    if (!userSearchQuery.trim()) {
      return filtered
    }

    const term = userSearchQuery.toLowerCase().trim()
    return filtered.filter((user) => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase()
      const email = (user.email || "").toLowerCase()
      return fullName.includes(term) || email.includes(term)
    })
  }, [allUsers, students, userSearchQuery])

  useEffect(() => {
    if (currentUser && schoolId && !isNaN(schoolId) && schoolId > 0) {
      loadSchoolData()
      loadStudents()
      loadRoles()
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
      if (loadedStudentsSchoolIdRef.current !== schoolId) {
        loadedStudentsSchoolIdRef.current = null
        loadingStudentsRef.current = false
      }
    }
  }, [currentUser, schoolId, schoolIdParam, loadSchoolData, loadStudents, loadRoles])

  // Recarregar alunos quando o termo de busca mudar
  useEffect(() => {
    if (schoolId && !isNaN(schoolId) && schoolId > 0) {
      const timeoutId = setTimeout(() => {
        loadedStudentsSchoolIdRef.current = null
        loadStudents()
      }, 500) // Debounce de 500ms

      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, schoolId, loadStudents])

  const handleOpenAddDialog = () => {
    setUserId("")
    setUserSearchQuery("")
    setRoleId("")
    setGrade("")
    setShowAddDialog(true)
    setShowUserDropdown(false)
    if (!loadedUsersRef.current) {
      loadAllUsers()
    }
  }

  const handleOpenRemoveDialog = (student: UserSchool) => {
    setSelectedStudent(student)
    setShowRemoveDialog(true)
  }

  const handleAddStudent = async () => {
    if (!userId.trim() || !roleId) {
      setError("Preencha todos os campos obrigatórios")
      return
    }

    setSaving(true)
    setError(null)

    try {
      await addUserToSchool({
        userId: userId.trim(),
        schoolId: schoolId,
        roleId: parseInt(roleId),
        grade: grade.trim() || undefined,
      })
      
      setShowAddDialog(false)
      setUserId("")
      setUserSearchQuery("")
      setRoleId("")
      setGrade("")
      
      // Recarregar lista de alunos
      loadedStudentsSchoolIdRef.current = null
      loadedUsersRef.current = false // Permitir recarregar usuários na próxima vez
      await loadStudents()
    } catch (err: any) {
      setError(err?.message || "Erro ao adicionar aluno à escola")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveStudent = async () => {
    if (!selectedStudent) return

    setSaving(true)
    setError(null)

    try {
      // Primeiro, remover o usuário de todas as turmas da escola
      try {
        // Buscar todas as turmas da escola
        const classesResponse = await listClasses({ 
          schoolId: schoolId, 
          page: 1, 
          limit: 100 
        })
        
        const classes = classesResponse.data || []
        
        // Remover o usuário de todas as turmas em paralelo
        const removeFromClassPromises = classes.map((cls) =>
          removeUserFromClass(selectedStudent.userId, cls.id).catch((err) => {
            // Se o usuário não estiver na turma, ignora o erro
            if (err?.status !== 404) {
              console.warn(`Erro ao remover usuário da turma ${cls.id}:`, err)
            }
            return null
          })
        )
        
        await Promise.allSettled(removeFromClassPromises)
      } catch (classErr: any) {
        // Se houver erro ao buscar turmas ou remover, apenas loga mas continua
        console.warn("Erro ao remover usuário das turmas:", classErr)
      }
      
      // Depois, remover o usuário da escola
      await removeUserFromSchool(selectedStudent.userId, schoolId)
      
      setShowRemoveDialog(false)
      setSelectedStudent(null)
      
      // Recarregar lista de alunos
      loadedStudentsSchoolIdRef.current = null
      await loadStudents()
    } catch (err: any) {
      setError(err?.message || "Erro ao remover aluno da escola")
    } finally {
      setSaving(false)
    }
  }

  // A busca é feita pela API, então apenas exibimos os resultados
  const filteredStudents = students

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando dados da escola...</p>
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
            onClick={() => router.push(`/coordenador/turmas/${schoolId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {school?.name || "Escola"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Lista de alunos
            </p>
          </div>
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

      {/* Lista de Alunos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Alunos ({filteredStudents.length})
              </CardTitle>
              <CardDescription>
                Lista de todos os alunos cadastrados nesta escola
              </CardDescription>
            </div>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aluno
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 pb-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {loadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado nesta escola"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.user.firstName} {student.user.lastName}
                      </TableCell>
                      <TableCell>{student.user.email}</TableCell>
                      <TableCell>{student.role?.name || "-"}</TableCell>
                      <TableCell>{student.grade || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRemoveDialog(student)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Adicionar Aluno */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Aluno à Escola</DialogTitle>
            <DialogDescription>
              Preencha os dados para adicionar um aluno à escola
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userSearch">Buscar Aluno *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="userSearch"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value)
                    setShowUserDropdown(true)
                    if (!e.target.value) {
                      setUserId("")
                    }
                  }}
                  onFocus={() => {
                    setShowUserDropdown(true)
                    if (!loadedUsersRef.current) {
                      loadAllUsers()
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowUserDropdown(false), 200)
                  }}
                  placeholder="Digite o nome ou email do aluno..."
                  className="pl-10"
                />
                {/* Dropdown de resultados */}
                {showUserDropdown && (
                  <div className="absolute z-[30] w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Carregando usuários...</span>
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        {userSearchQuery 
                          ? "Nenhum usuário encontrado com o termo de busca" 
                          : "Digite para buscar um aluno"}
                      </div>
                    ) : (
                      <div className="py-1">
                        {availableUsers.map((user) => (
                          <div
                            key={user.userId}
                            className="px-4 py-2 hover:bg-accent cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault()
                            }}
                            onClick={() => {
                              setUserId(user.userId)
                              setUserSearchQuery(`${user.firstName} ${user.lastName}`)
                              setShowUserDropdown(false)
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {userId && (
                <p className="text-sm text-muted-foreground">
                  Aluno selecionado: {allUsers.find(u => u.userId === userId)?.firstName} {allUsers.find(u => u.userId === userId)?.lastName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleId">Role *</Label>
              <select
                id="roleId"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione uma role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id.toString()}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Série (opcional)</Label>
              <Input
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Ex: 9º ano"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAddStudent} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Remover Aluno */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Aluno da Escola</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              {selectedStudent
                ? `${selectedStudent.user.firstName} ${selectedStudent.user.lastName}`
                : "este aluno"}{" "}
              da escola? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveStudent}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
