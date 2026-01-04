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
import { Plus, Trash2, Loader2, AlertCircle, ArrowLeft, Search, UserPlus, Users } from "lucide-react"
import { listUsersByClass, listAllUsers, addUserToClass, removeUserFromClass, getClassById, type Class } from "@/lib/api"
import { type User } from "@/lib/api/user-class"
import { useAuth } from "@/contexts/auth-context"
import { formatGrade } from "@/lib/utils"

export default function TurmaDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { currentUser } = useAuth()
  const classId = parseInt(params.id as string)

  const [classData, setClassData] = useState<Class | null>(null)
  const [students, setStudents] = useState<User[]>([])
  const [schoolUsers, setSchoolUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSchoolUsers, setLoadingSchoolUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [savingStudent, setSavingStudent] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const loadingRef = useRef(false)
  const loadedClassIdRef = useRef<number | null>(null)
  const loadedSchoolIdRef = useRef<number | null>(null)
  const loadingSchoolUsersRef = useRef(false)

  const loadAllStudents = useCallback(async () => {
    // Se já está carregando, não recarregar
    if (loadingSchoolUsersRef.current) {
      return
    }
    
    // Se já carregou, não recarregar
    if (loadedSchoolIdRef.current !== null) {
      return
    }

    try {
      loadingSchoolUsersRef.current = true
      loadedSchoolIdRef.current = -1 // Marcador para indicar que já carregou todos
      setLoadingSchoolUsers(true)
      
      // Buscar todos os alunos do banco
      const users = await listAllUsers({ roleName: "student" })
      // Filtrar apenas alunos (roleName === "student")
      const studentsOnly = users.filter(user => 
        user.roles.some(role => role.roleName === "student")
      )
      setSchoolUsers(studentsOnly)
    } catch (err: any) {
      console.error("Erro ao carregar todos os alunos:", err)
      setError(`Erro ao carregar alunos: ${err?.message || "Erro desconhecido"}`)
    } finally {
      setLoadingSchoolUsers(false)
      loadingSchoolUsersRef.current = false
    }
  }, [])

  const loadData = useCallback(async () => {
    if (!classId || isNaN(classId) || loadingRef.current) return
    
    // Evitar recarregar se já carregou para este classId
    if (loadedClassIdRef.current === classId) {
      return
    }

    try {
      loadingRef.current = true
      loadedClassIdRef.current = classId
      setLoading(true)
      setError(null)
      
      const [classResponse, studentsResponse] = await Promise.all([
        getClassById(classId).catch(() => null),
        listUsersByClass(classId, { page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }))
      ])

      setClassData(classResponse)
      setStudents(studentsResponse.data || [])

      // Carregar todos os alunos do banco
      loadAllStudents()
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados")
      loadedClassIdRef.current = null // Reset em caso de erro para permitir nova tentativa
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [classId, loadAllStudents])

  useEffect(() => {
    if (currentUser?.uid && classId && !isNaN(classId)) {
      loadData()
    }
    // Cleanup: reset ref quando mudar o classId
    return () => {
      if (loadedClassIdRef.current !== classId) {
        loadedClassIdRef.current = null
        loadingRef.current = false
      }
    }
  }, [currentUser?.uid, classId, loadData])

  const handleAddStudent = async (userId: string) => {
    if (!userId.trim()) {
      setError("Selecione um aluno")
      return
    }

    setSavingStudent(true)
    setError(null)

    // Encontrar o aluno que está sendo adicionado
    const studentToAdd = schoolUsers.find((user) => user.userId === userId.trim())

    try {
      await addUserToClass({
        userId: userId.trim(),
        classId: classId,
      })
      
      // Atualização otimista: adicionar o aluno ao estado imediatamente
      if (studentToAdd) {
        setStudents((prevStudents) => {
          // Verificar se já não está na lista (evitar duplicatas)
          if (prevStudents.some((s) => s.userId === studentToAdd.userId)) {
            return prevStudents
          }
          return [...prevStudents, studentToAdd]
        })
      }

      setSelectedUserId("")
      setStudentSearchQuery("")
      
      // Recarregar dados em background para garantir sincronização
      loadData().catch((err) => {
        console.error("Erro ao recarregar dados após adição:", err)
      })
    } catch (err: any) {
      setError(err?.message || "Erro ao adicionar aluno")
      // Se der erro, recarregar dados para garantir estado correto
      loadData().catch(() => {
        console.error("Erro ao recarregar dados após erro na adição:", err)
      })
    } finally {
      setSavingStudent(false)
    }
  }

  const handleRemoveStudent = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este aluno da turma?")) {
      return
    }

    setSavingStudent(true)
    setError(null)

    // Atualização otimista: remover o aluno do estado imediatamente
    setStudents((prevStudents) => prevStudents.filter((student) => student.userId !== userId))

    try {
      await removeUserFromClass(userId, classId)
      // Recarregar dados em background para garantir sincronização
      // Mas não aguardar, pois já atualizamos o estado acima
      loadData().catch((err) => {
        console.error("Erro ao recarregar dados após remoção:", err)
        // Se der erro ao recarregar, manter a atualização otimista
      })
    } catch (err: any) {
      // Se der erro na remoção, reverter a atualização otimista
      setError(err?.message || "Erro ao remover aluno")
      // Recarregar dados para restaurar o estado correto
      loadData().catch(() => {
        console.error("Erro ao recarregar dados após erro na remoção:", err)
      })
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

  // Filtrar alunos da escola para o dropdown (excluindo os que já estão na turma)
  const availableStudents = useMemo(() => {
    const studentsInClassIds = new Set(students.map(s => s.userId))
    const filtered = schoolUsers.filter(user => !studentsInClassIds.has(user.userId))
    
    if (!studentSearchQuery.trim()) {
      return filtered
    }

    const term = studentSearchQuery.toLowerCase().trim()
    return filtered.filter((student) => {
      const fullName = `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase()
      const email = (student.email || "").toLowerCase()
      return fullName.includes(term) || email.includes(term)
    })
  }, [schoolUsers, students, studentSearchQuery])

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
            onClick={() => router.push("/coordenador/turmas")}
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

      {/* Adicionar aluno */}
      <Card className="overflow-visible border-primary/20">
        <CardContent className="pt-6 overflow-visible">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Adicionar Aluno à Turma</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Busque e selecione um aluno do banco de dados para adicionar a esta turma
          </p>
          <div className="flex gap-2 relative">
            <div className="flex-1 relative z-[30]">
              <Label htmlFor="add-student-search" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Buscar aluno disponível
              </Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary z-10" />
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
                    if (loadedSchoolIdRef.current === null) {
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
                  {loadingSchoolUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Carregando alunos...</span>
                    </div>
                  ) : availableStudents.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                      {studentSearchQuery ? "Nenhum aluno encontrado" : schoolUsers.length === 0 ? "Nenhum aluno disponível na escola" : "Todos os alunos já estão nesta turma"}
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
              Aluno selecionado: {availableStudents.find(s => s.userId === selectedUserId)?.firstName} {availableStudents.find(s => s.userId === selectedUserId)?.lastName}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        onClick={() => handleRemoveStudent(student.userId)}
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
    </div>
  )
}
