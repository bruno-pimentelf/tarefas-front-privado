"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, Loader2, AlertCircle, ArrowLeft, Search, UserPlus, Users, UserCog, GraduationCap } from "lucide-react"
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
import { listUsersByClass, listStudentsWithoutClass, addUserToClass, removeUserFromClass, getClassById, listClassesByUser, listUsersBySchoolFromAPI, getTeacherClasses, setUserRole, getRoles, addUserToSchool, getUserRole, type Class, type UserSchool, type Role } from "@/lib/api"
import { type User } from "@/lib/api/user-class"
import { useAuth } from "@/contexts/auth-context"
import { formatGrade } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function TurmaDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { currentUser } = useAuth()
  const schoolId = parseInt(params.schoolId as string)
  const classId = parseInt(params.classId as string)

  const [classData, setClassData] = useState<Class | null>(null)
  const [students, setStudents] = useState<User[]>([])
  const [allStudents, setAllStudents] = useState<User[]>([])
  const [teachers, setTeachers] = useState<UserSchool[]>([])
  const [currentTeachers, setCurrentTeachers] = useState<UserSchool[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAllStudents, setLoadingAllStudents] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  const [savingStudent, setSavingStudent] = useState(false)
  const [savingTeacher, setSavingTeacher] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [showRemoveStudentDialog, setShowRemoveStudentDialog] = useState(false)
  const [showRemoveTeacherDialog, setShowRemoveTeacherDialog] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<User | null>(null)
  const [teacherToRemove, setTeacherToRemove] = useState<UserSchool | null>(null)

  const loadingRef = useRef(false)
  const loadedClassIdRef = useRef<number | null>(null)
  const loadingAllStudentsRef = useRef(false)
  const loadingTeachersRef = useRef(false)
  const loadedTeachersSchoolIdRef = useRef<number | null>(null)

  const loadAllStudents = useCallback(async () => {
    if (loadingAllStudentsRef.current || !schoolId || isNaN(schoolId)) {
      return
    }
    
    try {
      loadingAllStudentsRef.current = true
      setLoadingAllStudents(true)
      
      // Carregar alunos sem turma usando a nova rota específica
      // Esta rota retorna apenas alunos da escola que não estão em nenhuma turma
      const allStudentsList: User[] = []
      let currentPage = 1
      const limit = 100 // Maximum allowed by API
      let hasMorePages = true

      while (hasMorePages) {
        try {
          const response = await listStudentsWithoutClass(schoolId, {
            page: currentPage,
            limit,
          })

          if (response.data && response.data.length > 0) {
            allStudentsList.push(...response.data)
          }

          hasMorePages = currentPage < (response.meta?.totalPages || 0)
          currentPage++
        } catch (pageErr: any) {
          // Se houver erro em uma página específica, parar a paginação
          // Mas não tratar como erro fatal se já tivermos alguns resultados
          if (allStudentsList.length === 0) {
            // Se não temos nenhum resultado e há erro, relançar
            throw pageErr
          }
          // Se já temos resultados, apenas parar a paginação
          hasMorePages = false
        }
      }

      setAllStudents(allStudentsList)
    } catch (err: any) {
      setError(`Erro ao carregar alunos: ${err?.message || "Erro desconhecido"}`)
      setAllStudents([])
    } finally {
      setLoadingAllStudents(false)
      loadingAllStudentsRef.current = false
    }
  }, [schoolId])

  const checkCurrentTeachers = useCallback((allUsersInClass: User[], teachersList?: UserSchool[]) => {
    const teachersToCheck = teachersList || teachers
    if (teachersToCheck.length === 0 || allUsersInClass.length === 0) {
      setCurrentTeachers([])
      return
    }
    
    // Verificar quais professores estão na lista de usuários da turma
    // Usar todos os usuários (incluindo professores) para identificar professores na turma
    const userIdsInClass = new Set(allUsersInClass.map(u => u.userId))
    const teachersInClass = teachersToCheck.filter(t => userIdsInClass.has(t.userId))
    
    setCurrentTeachers(teachersInClass)
  }, [teachers])

  // Função auxiliar para validar que os usuários ainda estão na turma
  const validateUsersInClass = useCallback(async (users: User[], targetClassId: number): Promise<User[]> => {
    const validatedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // Verificar se o usuário ainda está na turma
          const userClasses = await listClassesByUser(user.userId, { page: 1, limit: 100 })
          const isInClass = userClasses.data?.some((cls) => cls.id === targetClassId) || false
          return isInClass ? user : null
        } catch (err: any) {
          // Se houver erro ao verificar (ex: 404), o usuário não está mais na turma
          console.debug(`Usuário ${user.userId} não está mais na turma ${targetClassId}:`, err)
          return null
        }
      })
    )
    
    // Filtrar nulls e manter apenas usuários válidos
    return validatedUsers.filter((user): user is User => user !== null)
  }, [])

  const loadTeachers = useCallback(async (schoolIdParam: number, allUsersInClass: User[] = []) => {
    if (loadingTeachersRef.current || !schoolIdParam || isNaN(schoolIdParam)) return

    if (loadedTeachersSchoolIdRef.current === schoolIdParam) {
      // Se já carregou, apenas verificar professores atuais
      checkCurrentTeachers(allUsersInClass)
      return
    }

    try {
      loadingTeachersRef.current = true
      loadedTeachersSchoolIdRef.current = schoolIdParam
      setLoadingTeachers(true)
      
      // Buscar todos os professores da escola
      const allTeachers: UserSchool[] = []
      let currentPage = 1
      const limit = 100
      let hasMorePages = true

      while (hasMorePages) {
        const response = await listUsersBySchoolFromAPI(schoolIdParam, {
          page: currentPage,
          limit,
        })

        if (response.data && response.data.length > 0) {
          // Filtrar apenas professores
          const teachersData = response.data.filter((member) => {
            const roleName = member.role?.name?.toLowerCase() || ""
            return roleName.includes("professor") || roleName.includes("teacher")
          })
          allTeachers.push(...teachersData)
        }

        hasMorePages = currentPage < (response.meta?.totalPages || 0)
        currentPage++
      }

      setTeachers(allTeachers)
      checkCurrentTeachers(allUsersInClass, allTeachers)
    } catch (err: any) {
      console.error("Erro ao carregar professores:", err)
      setTeachers([])
      loadedTeachersSchoolIdRef.current = null
    } finally {
      setLoadingTeachers(false)
      loadingTeachersRef.current = false
    }
  }, [checkCurrentTeachers])

  const loadData = useCallback(async () => {
    if (!classId || isNaN(classId) || loadingRef.current) return
    
    if (loadedClassIdRef.current === classId) {
      return
    }

    try {
      loadingRef.current = true
      loadedClassIdRef.current = classId
      setLoading(true)
      setError(null)
      
      const [classResponse, usersResponse] = await Promise.all([
        getClassById(classId).catch(() => null),
        listUsersByClass(classId, { page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }))
      ])

      setClassData(classResponse)
      const allUsersData = usersResponse.data || []
      
      // Validar que cada usuário ainda está na turma
      const validUsers = await validateUsersInClass(allUsersData, classId)
      
      // Filtrar apenas alunos (excluir professores)
      // Um aluno é alguém que NÃO tem role de teacher/professor
      const studentsData = validUsers.filter((user) => {
        // Verificar se o usuário tem role de professor/teacher
        const hasTeacherRole = user.roles.some(
          (role) =>
            role.roleName.toLowerCase() === "teacher" ||
            role.roleName.toLowerCase() === "professor"
        )
        // Retornar apenas usuários que NÃO são professores
        return !hasTeacherRole
      })
      
      setStudents(studentsData)
      
      // Carregar professores da escola e verificar professores atuais
      // Passar todos os usuários válidos (incluindo professores) para identificar professores na turma
      if (classResponse?.schoolId) {
        loadTeachers(classResponse.schoolId, validUsers)
      }

      // Carregar roles para atualizar grade
      try {
        const rolesData = await getRoles()
        setRoles(rolesData || [])
      } catch (err: any) {
        console.error("Erro ao carregar roles:", err)
      }

      // Carregar alunos sem turma
      if (!loadingAllStudentsRef.current) {
        loadAllStudents()
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados")
      loadedClassIdRef.current = null // Reset em caso de erro para permitir nova tentativa
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [classId, loadAllStudents, loadTeachers])

  useEffect(() => {
    if (currentUser?.uid && classId && !isNaN(classId)) {
      loadData()
    }
    return () => {
      if (loadedClassIdRef.current !== classId) {
        loadedClassIdRef.current = null
        loadingRef.current = false
        loadingAllStudentsRef.current = false
      }
    }
  }, [currentUser?.uid, classId, loadData])


  const handleAddStudent = async (userId: string) => {
    if (!userId.trim()) {
      setError("Selecione um aluno")
      return
    }

    // Validar que o usuário é um estudante (não é professor)
    const studentToAdd = allStudents.find(s => s.userId === userId)
    if (!studentToAdd) {
      setError("Aluno não encontrado")
      return
    }

    // Verificar se o usuário tem role de professor (não deve ser adicionado como aluno)
    const hasTeacherRole = studentToAdd.roles.some(
      (role) =>
        role.roleName.toLowerCase() === "teacher" ||
        role.roleName.toLowerCase() === "professor"
    )
    
    if (hasTeacherRole) {
      setError("Este usuário é um professor e não pode ser adicionado como aluno")
      return
    }

    setSavingStudent(true)
    setError(null)

    // Otimista: Adicionar o aluno ao estado imediatamente
    if (!students.some(s => s.userId === userId)) {
      setStudents((prevStudents) => [...prevStudents, studentToAdd])
      // Remover o aluno da lista de disponíveis (já que agora está na turma)
      setAllStudents((prev) => prev.filter((s) => s.userId !== userId))
    }

    try {
      // Adicionar aluno à turma
      await addUserToClass({
        userId: userId.trim(),
        classId: classId,
      })
      
      // Atualizar o grade do estudante com o grade da turma
      if (classData?.grade && classData?.schoolId) {
        try {
          // Encontrar a role de estudante
          const studentRole = roles.find(
            (r) =>
              r.name.toLowerCase() === "student" ||
              r.name.toLowerCase() === "estudante" ||
              r.name.toLowerCase() === "aluno"
          )
          
          if (studentRole) {
            // Verificar se o usuário já está na escola antes de tentar adicionar
            let userAlreadyInSchool = false
            try {
              await getUserRole(userId.trim(), classData.schoolId)
              userAlreadyInSchool = true
            } catch (checkErr: any) {
              // Se retornar 404, o usuário não está na escola
              userAlreadyInSchool = false
            }
            
            // Se o usuário não está na escola, tentar adicionar com o grade
            if (!userAlreadyInSchool) {
              try {
                await addUserToSchool({
                  userId: userId.trim(),
                  schoolId: classData.schoolId,
                  roleId: studentRole.id,
                  grade: classData.grade, // Atualizar o grade com o grade da turma
                })
              } catch (schoolErr: any) {
                // Se ainda assim retornar 409, apenas ignora (usuário foi adicionado entre a verificação e a adição)
                if (schoolErr?.status === 409 || schoolErr?.response?.status === 409) {
                  // Silenciosamente ignorar - usuário já está na escola
                } else {
                  // Para outros erros, apenas loga mas não bloqueia a adição
                  console.warn("Erro ao adicionar estudante à escola:", schoolErr)
                }
              }
            } else {
              // Usuário já está na escola - não podemos atualizar o grade via addUserToSchool ou setUserRole
              // A API não fornece uma rota específica para atualizar apenas o grade
              console.debug("Usuário já está na escola. O grade não será atualizado automaticamente.")
            }
          }
        } catch (roleErr: any) {
          // Se houver erro ao atualizar role, apenas loga mas não bloqueia a adição
          console.warn("Erro ao atualizar grade do estudante:", roleErr)
        }
      }
      
      setSelectedUserId("")
      setStudentSearchQuery("")
      setShowStudentDropdown(false)
      
      // Recarregar dados em background para garantir sincronização
      await Promise.all([
        loadData(),
        loadAllStudents(), // Recarregar lista de alunos sem turma
      ])
    } catch (err: any) {
      setError(err?.message || "Erro ao adicionar aluno")
      // Reverter a atualização otimista se a API falhar
      setStudents((prevStudents) => prevStudents.filter((s) => s.userId !== userId))
      if (studentToAdd) {
        setAllStudents((prev) => {
          if (!prev.some(s => s.userId === userId)) {
            return [...prev, studentToAdd]
          }
          return prev
        })
      }
      loadData().catch(() => {})
    } finally {
      setSavingStudent(false)
    }
  }

  const handleRemoveStudentClick = (userId: string) => {
    const student = students.find(s => s.userId === userId)
    if (student) {
      setStudentToRemove(student)
      setShowRemoveStudentDialog(true)
    }
  }

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return

    setSavingStudent(true)
    setError(null)

    // Otimista: remover o aluno do estado imediatamente
    setStudents((prevStudents) => prevStudents.filter((student) => student.userId !== studentToRemove.userId))

    try {
      await removeUserFromClass(studentToRemove.userId, classId)
      
      // Recarregar todos os dados após remoção bem-sucedida
      await Promise.all([
        loadData(), // Recarregar dados da turma
        loadAllStudents(), // Recarregar lista de alunos sem turma
      ])
      setShowRemoveStudentDialog(false)
      setStudentToRemove(null)
    } catch (err: any) {
      // Se der erro na remoção, reverter a atualização otimista
      setError(err?.message || "Erro ao remover aluno")
      setStudents((prevStudents) => [...prevStudents, studentToRemove])
      // Recarregar dados para restaurar o estado correto
      await loadData()
    } finally {
      setSavingStudent(false)
    }
  }

  // Filtrar alunos por nome na lista de alunos da turma
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students
    }

    const term = searchTerm.toLowerCase().trim()
    return students.filter((student) => {
      const fullName = `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase()
      const email = (student.email || "").toLowerCase()
      return fullName.includes(term) || email.includes(term)
    })
  }, [students, searchTerm])

  // Filtrar alunos disponíveis para o dropdown (excluindo apenas os que já estão nesta turma)
  // A rota listStudentsWithoutClass já retorna apenas alunos sem turma, então não precisamos
  // verificar se estão em outras turmas
  const availableStudents = useMemo(() => {
    const studentsInClassIds = new Set(students.map(s => s.userId))
    
    // Filtrar: remover apenas alunos que já estão nesta turma
    const filtered = allStudents.filter(user => !studentsInClassIds.has(user.userId))
    
    if (!studentSearchQuery.trim()) {
      return filtered
    }

    const term = studentSearchQuery.toLowerCase().trim()
    return filtered.filter((student) => {
      const fullName = `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase()
      const email = (student.email || "").toLowerCase()
      return fullName.includes(term) || email.includes(term)
    })
  }, [allStudents, students, studentSearchQuery])

  const handleAssignTeacher = async () => {
    if (!selectedTeacherId.trim()) {
      setError("Selecione um professor")
      return
    }

    // Verificar se o professor já está na turma
    const isAlreadyInClass = currentTeachers.some(t => t.userId === selectedTeacherId)
    if (isAlreadyInClass) {
      setError("Este professor já está atribuído a esta turma")
      return
    }

    // Validar que o usuário selecionado é realmente um professor
    const selectedTeacher = teachers.find(t => t.userId === selectedTeacherId)
    if (!selectedTeacher) {
      setError("Professor não encontrado")
      return
    }

    // Verificar se o usuário tem role de teacher/professor
    const hasTeacherRole = selectedTeacher.role?.name?.toLowerCase() === "teacher" ||
      selectedTeacher.role?.name?.toLowerCase() === "professor" ||
      selectedTeacher.user.roles?.some(
        (role) =>
          role.roleName.toLowerCase() === "teacher" ||
          role.roleName.toLowerCase() === "professor"
      )

    if (!hasTeacherRole) {
      setError("Este usuário não é um professor e não pode ser adicionado como professor")
      return
    }

    setSavingTeacher(true)
    setError(null)

    try {
      // Adicionar professor à turma
      await addUserToClass({
        userId: selectedTeacherId.trim(),
        classId: classId,
      })

      setSelectedTeacherId("")
      
      // Recarregar dados
      const [updatedClassResponse, updatedUsersResponse] = await Promise.all([
        getClassById(classId).catch(() => null),
        listUsersByClass(classId, { page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }))
      ])
      
      const allUpdatedUsersData = updatedUsersResponse.data || []
      
      // Validar que cada usuário ainda está na turma
      const validUpdatedUsers = await validateUsersInClass(allUpdatedUsersData, classId)
      
      // Filtrar apenas alunos (excluir professores)
      // Um aluno é alguém que NÃO tem role de teacher/professor
      const updatedStudents = validUpdatedUsers.filter((user) => {
        const hasTeacherRole = user.roles.some(
          (role) =>
            role.roleName.toLowerCase() === "teacher" ||
            role.roleName.toLowerCase() === "professor"
        )
        return !hasTeacherRole
      })
      
      setClassData(updatedClassResponse)
      setStudents(updatedStudents)
      
      if (updatedClassResponse?.schoolId) {
        await loadTeachers(updatedClassResponse.schoolId, validUpdatedUsers)
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao atribuir professor à turma")
    } finally {
      setSavingTeacher(false)
    }
  }

  const handleRemoveTeacherClick = (teacher: UserSchool) => {
    setTeacherToRemove(teacher)
    setShowRemoveTeacherDialog(true)
  }

  const handleRemoveTeacher = async () => {
    if (!teacherToRemove) return

    setSavingTeacher(true)
    setError(null)

    try {
      await removeUserFromClass(teacherToRemove.userId, classId)
      
      // Recarregar dados
      const [updatedClassResponse, updatedUsersResponse] = await Promise.all([
        getClassById(classId).catch(() => null),
        listUsersByClass(classId, { page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }))
      ])
      
      const allUpdatedUsersData = updatedUsersResponse.data || []
      
      // Validar que cada usuário ainda está na turma
      const validUpdatedUsers = await validateUsersInClass(allUpdatedUsersData, classId)
      
      // Filtrar apenas alunos (excluir professores)
      // Um aluno é alguém que NÃO tem role de teacher/professor
      const updatedStudents = validUpdatedUsers.filter((user) => {
        const hasTeacherRole = user.roles.some(
          (role) =>
            role.roleName.toLowerCase() === "teacher" ||
            role.roleName.toLowerCase() === "professor"
        )
        return !hasTeacherRole
      })
      
      setClassData(updatedClassResponse)
      setStudents(updatedStudents)
      
      if (updatedClassResponse?.schoolId) {
        await loadTeachers(updatedClassResponse.schoolId, validUpdatedUsers)
      }
      setShowRemoveTeacherDialog(false)
      setTeacherToRemove(null)
    } catch (err: any) {
      setError(err?.message || "Erro ao remover professor da turma")
    } finally {
      setSavingTeacher(false)
    }
  }

  // Filtrar professores disponíveis (excluindo os que já estão na turma)
  const availableTeachers = useMemo(() => {
    const currentTeacherIds = new Set(currentTeachers.map(t => t.userId))
    return teachers.filter(t => !currentTeacherIds.has(t.userId))
  }, [teachers, currentTeachers])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !classData) {
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
              {classData?.name || "Turma"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {classData?.school?.name || classData?.schoolName || "Escola"} • {formatGrade(classData?.grade)}
            </p>
          </div>
        </div>
      </div>

      {/* Erro */}
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

      {/* Professores da Turma */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <UserCog className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Professores da Turma</h2>
            <span className="text-sm text-muted-foreground">({currentTeachers.length})</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione professores da escola a esta turma. Uma turma pode ter múltiplos professores.
          </p>
          
          {/* Lista de Professores Atuais */}
          {currentTeachers.length > 0 && (
            <div className="mb-4 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Professores Atuais
              </Label>
              <div className="space-y-2">
                {currentTeachers.map((teacher) => (
                  <div
                    key={teacher.userId}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <UserCog className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">
                          {teacher.user.firstName} {teacher.user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {teacher.user.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTeacherClick(teacher)}
                      disabled={savingTeacher}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar Novo Professor */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="teacher-select" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Adicionar Professor
              </Label>
              <Select
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
                disabled={savingTeacher || loadingTeachers}
              >
                <SelectTrigger id="teacher-select" className="w-full">
                  <SelectValue placeholder={loadingTeachers ? "Carregando professores..." : availableTeachers.length === 0 ? "Todos os professores já estão na turma" : "Selecione um professor"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {loadingTeachers ? (
                    <div className="flex items-center justify-center px-3 py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                      <span className="text-sm text-muted-foreground">Carregando professores...</span>
                    </div>
                  ) : availableTeachers.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Todos os professores já estão na turma
                      </p>
                    </div>
                  ) : (
                    availableTeachers.map((teacher) => (
                      <SelectItem 
                        key={teacher.userId} 
                        value={teacher.userId}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col py-0.5">
                          <span className="font-medium">
                            {teacher.user.firstName} {teacher.user.lastName}
                          </span>
                          {teacher.user.email && (
                            <span className="text-xs text-muted-foreground">
                              {teacher.user.email}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAssignTeacher}
              disabled={savingTeacher || !selectedTeacherId || availableTeachers.length === 0}
              className="min-w-[140px]"
            >
              {savingTeacher ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Professor
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Adicionar aluno */}
      <Card className="overflow-visible border-primary/20">
        <CardContent className="pt-6 overflow-visible">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Adicionar Aluno à Turma</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Busque e selecione um aluno do banco de dados para adicionar a esta turma. Apenas alunos que não estão em nenhuma turma podem ser adicionados.
          </p>
              <div className="flex gap-2 relative">
                <div className="flex-1 relative z-[30]">
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="add-student-search" className="text-xs font-medium text-muted-foreground">
                      Buscar aluno disponível
                    </Label>
                  </div>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10 pointer-events-none" />
                <Input
                  id="add-student-search"
                  placeholder="Digite o nome do aluno para buscar..."
                  value={studentSearchQuery}
                  onChange={(e) => {
                    setStudentSearchQuery(e.target.value)
                    setShowStudentDropdown(true)
                    if (!e.target.value) {
                      setSelectedUserId("")
                    }
                  }}
                  onFocus={() => {
                    setShowStudentDropdown(true)
                    // Garantir que todos os alunos sejam carregados
                    if (!loadingAllStudentsRef.current) {
                      loadAllStudents()
                    }
                  }}
                  onBlur={() => {
                    // Delay para permitir clique no dropdown
                    setTimeout(() => setShowStudentDropdown(false), 200)
                  }}
                  className="pl-10 w-full border-primary/30 focus:border-primary"
                />
              </div>
              {/* Dropdown de resultados */}
              {showStudentDropdown && (
                <div className="absolute z-[30] w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingAllStudents ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Carregando alunos...</span>
                    </div>
                  ) : availableStudents.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                      {studentSearchQuery 
                        ? "Nenhum aluno sem turma encontrado" 
                        : allStudents.length === 0 
                          ? "Nenhum aluno sem turma disponível nesta escola" 
                          : "Nenhum aluno disponível"}
                    </div>
                  ) : (
                    <div className="py-1">
                      {availableStudents.map((student) => (
                        <div
                          key={student.userId}
                          className="px-4 py-2 hover:bg-accent cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault() // Prevenir blur do input
                          }}
                          onClick={() => {
                            setSelectedUserId(student.userId)
                            setStudentSearchQuery(`${student.firstName} ${student.lastName}`)
                            setShowStudentDropdown(false)
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button 
              onClick={() => handleAddStudent(selectedUserId)} 
              disabled={savingStudent || !selectedUserId.trim()}
              className="self-end"
            >
              {savingStudent ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Aluno
                </>
              )}
            </Button>
          </div>
          {selectedUserId && (
            <p className="text-sm text-muted-foreground mt-2">
              Aluno selecionado: {allStudents.find(s => s.userId === selectedUserId)?.firstName} {allStudents.find(s => s.userId === selectedUserId)?.lastName}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de alunos */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 pb-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Alunos da Turma</h2>
              <span className="text-sm text-muted-foreground">({students.length})</span>
            </div>
            <div className="relative">
              <Label htmlFor="filter-students-search" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Filtrar alunos da turma
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="filter-students-search"
                  placeholder="Buscar na lista de alunos da turma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum aluno encontrado com o termo de busca" : "Nenhum aluno nesta turma"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.userId}>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStudentClick(student.userId)}
                        disabled={savingStudent}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* AlertDialog para remover aluno */}
      <AlertDialog open={showRemoveStudentDialog} onOpenChange={setShowRemoveStudentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Remover Aluno da Turma
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Tem certeza que deseja remover o aluno <strong>"{studentToRemove?.firstName} {studentToRemove?.lastName}"</strong> desta turma?
              <br />
              <br />
              O aluno será removido da turma, mas continuará vinculado à escola.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingStudent}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveStudent}
              disabled={savingStudent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {savingStudent ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover Aluno"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para remover professor */}
      <AlertDialog open={showRemoveTeacherDialog} onOpenChange={setShowRemoveTeacherDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Remover Professor da Turma
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Tem certeza que deseja remover o professor <strong>"{teacherToRemove?.user.firstName} {teacherToRemove?.user.lastName}"</strong> desta turma?
              <br />
              <br />
              O professor será removido da turma, mas continuará vinculado à escola.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingTeacher}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveTeacher}
              disabled={savingTeacher}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {savingTeacher ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover Professor"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
