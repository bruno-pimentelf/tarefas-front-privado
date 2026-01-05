"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  UserPlus, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  GraduationCap, 
  Users,
  School,
  BookOpen,
  UserCheck,
  UserX
} from "lucide-react"
import { listAllUsers, getRoles, listSchools, listClasses, setUserRole, addUserToClass, removeUserFromClass, listClassesByUser, type User as UserClassUser, type Role, type School, type Class } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { formatGrade } from "@/lib/utils"

export function ProfessoresManagement() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserClassUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teacherClassesMap, setTeacherClassesMap] = useState<Map<string, Class[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialog states
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserClassUser | null>(null)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("")
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [usersData, rolesData, schoolsResponse, classesResponse] = await Promise.all([
        listAllUsers().catch(() => []),
        getRoles().catch(() => []),
        listSchools({ page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } })),
        listClasses({ page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }))
      ])
      
      setUsers(usersData)
      setRoles(rolesData)
      setSchools(schoolsResponse.data || [])
      setClasses(classesResponse.data || [])
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [])

  // Verificar se usuário já é professor (definido antes de ser usado)
  const isTeacher = useCallback((user: UserClassUser) => {
    return user.roles.some(role => 
      role.roleName.toLowerCase() === "teacher" || 
      role.roleName.toLowerCase() === "professor"
    )
  }, [])

  // Filtrar usuários por busca
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users
    }

    const term = searchTerm.toLowerCase().trim()
    return users.filter((user) => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase()
      const email = (user.email || "").toLowerCase()
      return fullName.includes(term) || email.includes(term)
    })
  }, [users, searchTerm])

  // Separar professores e não-professores
  const { teachers, nonTeachers } = useMemo(() => {
    const teachersList: UserClassUser[] = []
    const nonTeachersList: UserClassUser[] = []
    
    filteredUsers.forEach(user => {
      if (isTeacher(user)) {
        teachersList.push(user)
      } else {
        nonTeachersList.push(user)
      }
    })
    
    return { teachers: teachersList, nonTeachers: nonTeachersList }
  }, [filteredUsers, isTeacher])

  // Encontrar role de professor
  const teacherRole = useMemo(() => {
    return roles.find(r => r.name.toLowerCase() === "teacher" || r.name.toLowerCase() === "professor")
  }, [roles])

  // Carregar turmas de professores ao carregar dados
  useEffect(() => {
    const loadTeacherClasses = async () => {
      const teachersList = users.filter(user => isTeacher(user))
      if (teachersList.length === 0) {
        setTeacherClassesMap(new Map())
        return
      }
      
      const classesMap = new Map<string, Class[]>()
      
      // Carregar turmas de cada professor em paralelo
      // IMPORTANTE: Sempre incluir professores no mapa, mesmo que não tenham turmas
      const promises = teachersList.map(async (teacher) => {
        try {
          const response = await listClassesByUser(teacher.userId, { page: 1, limit: 100 })
          // Sempre definir no mapa, mesmo que seja array vazio (professor sem turmas)
          classesMap.set(teacher.userId, response.data || [])
        } catch (err) {
          console.error(`Erro ao buscar turmas do professor ${teacher.userId}:`, err)
          // Sempre definir no mapa como array vazio para professores sem turmas
          classesMap.set(teacher.userId, [])
        }
      })
      
      await Promise.all(promises)
      setTeacherClassesMap(classesMap)
    }
    
    if (users.length > 0) {
      loadTeacherClasses()
    }
  }, [users, isTeacher])

  // Obter turmas de um professor do mapa
  const getTeacherClasses = useCallback((userId: string): Class[] => {
    return teacherClassesMap.get(userId) || []
  }, [teacherClassesMap])

  const handleOpenAssignDialog = (user: UserClassUser) => {
    setSelectedUser(user)
    
    // Se já é professor, pré-selecionar escola e turmas existentes
    if (isTeacher(user) && user.roles.length > 0) {
      const teacherRoleData = user.roles.find(r => 
        r.roleName.toLowerCase() === "teacher" || r.roleName.toLowerCase() === "professor"
      )
      if (teacherRoleData) {
        setSelectedSchoolId(teacherRoleData.schoolId.toString())
        const existingClasses = getTeacherClasses(user.userId)
        setSelectedClassIds(existingClasses.map(c => c.id.toString()))
      } else {
        setSelectedSchoolId("")
        setSelectedClassIds([])
      }
    } else {
      setSelectedSchoolId("")
      setSelectedClassIds([])
    }
    
    setError(null)
    setSuccess(false)
    setShowAssignDialog(true)
  }

  const handleAssignTeacher = async () => {
    if (!selectedUser || !selectedSchoolId || !teacherRole) {
      setError("Selecione uma escola")
      return
    }

    // Permitir remover todas as turmas (selectedClassIds.length === 0 é válido)
    // Também permitir adicionar turmas a professores que já têm role teacher mas não têm turmas

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // 1. Se o usuário ainda não é professor OU se está mudando de escola, definir/atualizar role
      const isUserTeacher = isTeacher(selectedUser)
      const teacherRoleData = isUserTeacher ? selectedUser.roles.find(r => 
        r.roleName.toLowerCase() === "teacher" || r.roleName.toLowerCase() === "professor"
      ) : null
      
      // Só definir role se não for professor OU se a escola mudou
      if (!isUserTeacher || (teacherRoleData && teacherRoleData.schoolId !== parseInt(selectedSchoolId))) {
        try {
          await setUserRole({
            userId: selectedUser.userId,
            schoolId: parseInt(selectedSchoolId),
            roleId: teacherRole.id,
          })
        } catch (roleErr: any) {
          // Se for erro 404 (recurso não encontrado), fazer logout e redirecionar para login
          if (roleErr?.status === 404 || roleErr?.response?.status === 404) {
            await logout()
            router.push("/auth")
            return
          }
          // Se não for 404, relança o erro para ser tratado abaixo
          throw roleErr
        }
      }

      // 2. Obter turmas atuais do professor na escola selecionada
      const currentClasses = getTeacherClasses(selectedUser.userId)
        .filter(c => c.schoolId === parseInt(selectedSchoolId))
      const currentClassIds = new Set(currentClasses.map(c => c.id.toString()))
      const selectedClassIdsSet = new Set(selectedClassIds)

      // 3. Identificar turmas para remover (estão nas atuais mas não nas selecionadas)
      const classesToRemove = Array.from(currentClassIds).filter(id => !selectedClassIdsSet.has(id))
      
      // 4. Identificar turmas para adicionar (estão nas selecionadas mas não nas atuais)
      const classesToAdd = selectedClassIds.filter(id => !currentClassIds.has(id))

      // 5. Remover turmas desmarcadas
      if (classesToRemove.length > 0) {
        const removeResults = await Promise.allSettled(
          classesToRemove.map(classId =>
            removeUserFromClass(selectedUser.userId, parseInt(classId))
          )
        )

        const removeErrors: string[] = []
        removeResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            const classId = classesToRemove[index]
            const error = result.reason
            const errorMessage = error?.response?.data?.message || error?.message || error?.data?.message || JSON.stringify(error)
            removeErrors.push(`Turma ${classId}: ${errorMessage}`)
            console.error(`Erro ao remover professor da turma ${classId}:`, {
              error,
              status: error?.response?.status || error?.status,
              message: errorMessage,
              response: error?.response?.data
            })
          }
        })

        if (removeErrors.length > 0) {
          console.warn(`Algumas turmas não puderam ser removidas: ${removeErrors.join('; ')}`)
        }
      }

      // 6. Adicionar turmas novas
      if (classesToAdd.length > 0) {
        const addClassResults = await Promise.allSettled(
          classesToAdd.map(classId =>
            addUserToClass({
              userId: selectedUser.userId,
              classId: parseInt(classId),
            })
          )
        )

        const addErrors: string[] = []
        addClassResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            const classId = classesToAdd[index]
            const error = result.reason
            const errorMessage = error?.response?.data?.message || error?.message || error?.data?.message || JSON.stringify(error)
            const errorStatus = error?.response?.status || error?.status
            
            // Se for erro 409 (Conflict), o usuário já está na turma - não é um erro crítico
            if (errorStatus === 409) {
              console.log(`Usuário já está na turma ${classId}`)
            } else {
              addErrors.push(`Turma ${classId}: ${errorMessage}`)
              console.error(`Erro ao adicionar professor à turma ${classId}:`, {
                error,
                status: errorStatus,
                message: errorMessage,
                response: error?.response?.data
              })
            }
          }
        })

        // Se houver erros críticos ao adicionar, mostrar mensagem
        if (addErrors.length > 0 && addErrors.length === classesToAdd.length) {
          // Todos falharam
          throw new Error(`Erro ao adicionar professor às turmas: ${addErrors.join('; ')}`)
        } else if (addErrors.length > 0) {
          // Alguns falharam - mostrar aviso mas continuar
          console.warn(`Algumas turmas não puderam ser adicionadas: ${addErrors.join('; ')}`)
        }
      }

      setSuccess(true)
      
      // Atualizar turmas do professor no mapa
      // IMPORTANTE: Sempre atualizar o mapa, mesmo que o professor não tenha turmas
      try {
        const response = await listClassesByUser(selectedUser.userId, { page: 1, limit: 100 })
        setTeacherClassesMap(prev => {
          const newMap = new Map(prev)
          // Sempre definir no mapa, mesmo que seja array vazio (professor sem turmas)
          newMap.set(selectedUser.userId, response.data || [])
          return newMap
        })
      } catch (err) {
        console.error("Erro ao atualizar turmas do professor:", err)
        // Em caso de erro, definir como array vazio para garantir que o professor apareça
        setTeacherClassesMap(prev => {
          const newMap = new Map(prev)
          newMap.set(selectedUser.userId, [])
          return newMap
        })
      }
      
      // Recarregar dados para atualizar roles e turmas
      // Recarregar usuários primeiro para garantir que professores sem turma apareçam
      await loadData()
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setTimeout(() => {
        setShowAssignDialog(false)
      }, 1200)
    } catch (err: any) {
      setError(err?.message || "Erro ao atualizar turmas do professor")
    } finally {
      setSaving(false)
    }
  }

  // Filtrar turmas por escola selecionada
  const availableClasses = useMemo(() => {
    if (!selectedSchoolId) return []
    return classes.filter(cls => cls.schoolId === parseInt(selectedSchoolId))
  }, [classes, selectedSchoolId])

  const renderUserRow = (user: UserClassUser) => {
    const isUserTeacher = isTeacher(user)
    const teacherClasses = isUserTeacher ? getTeacherClasses(user.userId) : []
    const teacherRoleData = isUserTeacher ? user.roles.find(r => 
      r.roleName.toLowerCase() === "teacher" || r.roleName.toLowerCase() === "professor"
    ) : null
    
    return (
      <TableRow key={user.userId} className={isUserTeacher ? "bg-primary/5" : ""}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {isUserTeacher ? (
              <UserCheck className="h-4 w-4 text-primary" />
            ) : (
              <UserX className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <div className="font-medium">{user.firstName} {user.lastName}</div>
              {isUserTeacher && teacherRoleData && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <School className="h-3 w-3" />
                  {schools.find(s => s.id === teacherRoleData.schoolId)?.name || "Escola não encontrada"}
                </div>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">{user.email}</div>
        </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  // Filtrar roles únicas por roleName
                  const uniqueRoles = Array.from(
                    new Map(user.roles.map(role => [role.roleName.toLowerCase(), role])).values()
                  )
                  return uniqueRoles.length > 0 ? (
                    uniqueRoles.map((role, idx) => (
                      <Badge 
                        key={idx} 
                        variant={role.roleName.toLowerCase() === "teacher" || role.roleName.toLowerCase() === "professor" ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {role.roleName}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem roles</span>
                  )
                })()}
              </div>
            </TableCell>
        <TableCell>
          {isUserTeacher ? (
            teacherClasses.length > 0 ? (
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  {teacherClasses.slice(0, 3).map((cls) => (
                    <Badge key={cls.id} variant="outline" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {cls.name}
                    </Badge>
                  ))}
                </div>
                {teacherClasses.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{teacherClasses.length - 3} {teacherClasses.length - 3 === 1 ? "turma" : "turmas"}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Sem turmas atribuídas
              </span>
            )
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant={isUserTeacher ? "default" : "outline"}
            size="sm"
            onClick={() => handleOpenAssignDialog(user)}
            className="gap-2"
          >
            {isUserTeacher ? (
              <>
                <GraduationCap className="h-4 w-4" />
                Gerenciar
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Definir como Professor
              </>
            )}
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Usuários</CardTitle>
          <CardDescription>
            Busque por nome ou email para encontrar usuários e gerenciar professores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o nome ou email do usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {error && !showAssignDialog && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professores */}
      {teachers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Professores ({teachers.length})
                </CardTitle>
                <CardDescription className="mt-1">
                  Usuários que já possuem a role de professor
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Turmas Atribuídas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map(renderUserRow)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Outros Usuários */}
      {nonTeachers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Outros Usuários ({nonTeachers.length})
                </CardTitle>
                <CardDescription className="mt-1">
                  Usuários que ainda não são professores
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Turmas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonTeachers.map(renderUserRow)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
              </p>
              <p className="text-xs text-muted-foreground">
                {searchTerm ? "Tente ajustar os termos de busca" : "Não há usuários cadastrados no sistema"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para definir professor e delegar turmas */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {selectedUser && isTeacher(selectedUser) 
                ? `Gerenciar Professor: ${selectedUser.firstName} ${selectedUser.lastName}`
                : `Definir como Professor: ${selectedUser?.firstName} ${selectedUser?.lastName}`
              }
            </DialogTitle>
            <DialogDescription>
              {selectedUser && isTeacher(selectedUser)
                ? "Gerencie a escola e as turmas atribuídas a este professor"
                : "Selecione uma escola e delegue turmas para este usuário se tornar professor"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Professor definido e turmas delegadas com sucesso!</span>
              </div>
            )}

            {selectedUser && (
              <>
                {/* Informações do usuário */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</div>
                        <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Seleção de Escola */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-primary" />
                    <Label className="text-base font-semibold">Escola</Label>
                    <Badge variant="destructive" className="text-xs">*</Badge>
                  </div>
                  <Select 
                    value={selectedSchoolId} 
                    onValueChange={(value) => {
                      setSelectedSchoolId(value)
                      // Se mudar escola, limpar turmas selecionadas
                      // Mas se já é professor, tentar manter turmas da nova escola se existirem
                      if (selectedUser && isTeacher(selectedUser)) {
                        const existingClassIds = getTeacherClasses(selectedUser.userId)
                          .filter(c => c.schoolId === parseInt(value))
                          .map(c => c.id.toString())
                        setSelectedClassIds(existingClassIds)
                      } else {
                        setSelectedClassIds([])
                      }
                    }}
                  >
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
                  <p className="text-xs text-muted-foreground">
                    A escola onde o professor atuará
                  </p>
                </div>

                {/* Seleção de Turmas */}
                {selectedSchoolId && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <Label className="text-base font-semibold">Turmas para Delegar</Label>
                      <Badge variant="destructive" className="text-xs">*</Badge>
                    </div>
                    <Card className="border-2">
                      <CardContent className="p-4">
                        {availableClasses.length === 0 ? (
                          <div className="text-center py-8">
                            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Nenhuma turma disponível nesta escola
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableClasses.map((cls) => {
                              const isSelected = selectedClassIds.includes(cls.id.toString())
                              return (
                                <div
                                  key={cls.id}
                                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    isSelected 
                                      ? "bg-primary/10 border-primary/50" 
                                      : "hover:bg-accent border-transparent"
                                  }`}
                                  onClick={() => {
                                    setSelectedClassIds(prev => {
                                      if (prev.includes(cls.id.toString())) {
                                        return prev.filter(id => id !== cls.id.toString())
                                      } else {
                                        return [...prev, cls.id.toString()]
                                      }
                                    })
                                  }}
                                >
                                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                                    isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                                  }`}>
                                    {isSelected && (
                                      <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm flex items-center gap-2">
                                      {cls.name}
                                      <Badge variant="outline" className="text-xs">
                                        {formatGrade(cls.grade)}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      Ano Letivo: {cls.schoolYear}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    {selectedClassIds.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{selectedClassIds.length}</span>{" "}
                          {selectedClassIds.length === 1 ? "turma selecionada" : "turmas selecionadas"}
                        </span>
                      </div>
                    )}
                    {selectedClassIds.length === 0 && availableClasses.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Selecione pelo menos uma turma para delegar ao professor
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignTeacher} 
              disabled={saving || success || !selectedSchoolId}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4" />
                  {selectedUser && isTeacher(selectedUser) ? "Atualizar Turmas" : "Definir como Professor"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
