"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Mail, School, GraduationCap, Users, Trophy, ClipboardList, BarChart3, UserCircle } from "lucide-react"
import { getTeacherClasses, type TeacherClass } from "@/lib/api/bookings"
import { listUsersByClass, type User as UserClassUser } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { FaSignOutAlt, FaArrowLeft } from "react-icons/fa"

// Interface para o cache de dados do professor
interface ProfessorDataCache {
  teacherClasses: TeacherClass[]
  teacherData: UserClassUser | null
  userId: string
}

export default function ProfessorDadosPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null)
  const [classStudents, setClassStudents] = useState<UserClassUser[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [showStudentsDialog, setShowStudentsDialog] = useState(false)
  const [teacherData, setTeacherData] = useState<UserClassUser | null>(null)
  
  // Cache para armazenar dados e evitar chamadas redundantes
  const dataCacheRef = useRef<ProfessorDataCache | null>(null)
  // Cache para alunos de turmas (classId -> UserClassUser[])
  const classStudentsCacheRef = useRef<Map<number, UserClassUser[]>>(new Map())

  // Carregar turmas do professor
  const carregarTurmas = useCallback(async () => {
    if (!currentUser) return

    // Verificar se já temos dados em cache para este usuário
    if (dataCacheRef.current && dataCacheRef.current.userId === currentUser.uid) {
      setTeacherClasses(dataCacheRef.current.teacherClasses)
      setTeacherData(dataCacheRef.current.teacherData)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const classes = await getTeacherClasses(currentUser.uid)
      setTeacherClasses(classes)

      // Buscar dados do professor através da primeira turma
      if (classes.length > 0) {
        try {
          const { listUsersByClass } = await import("@/lib/api")
          const usersResponse = await listUsersByClass(classes[0].id, { page: 1, limit: 100 })
          const allUsers = usersResponse.data || []
          
          // Encontrar o professor (usuário com role de professor/teacher que corresponde ao currentUser.uid)
          const foundTeacher = allUsers.find((user) => {
            const isCurrentUser = user.userId === currentUser.uid
            const hasTeacherRole = user.roles.some(
              (role) =>
                role.roleName.toLowerCase() === "teacher" ||
                role.roleName.toLowerCase() === "professor"
            )
            return isCurrentUser && hasTeacherRole
          })
          
          if (foundTeacher) {
            setTeacherData(foundTeacher)
            
            // Armazenar dados no cache
            dataCacheRef.current = {
              teacherClasses: classes,
              teacherData: foundTeacher,
              userId: currentUser.uid,
            }
          } else {
            // Armazenar dados no cache mesmo sem teacherData
            dataCacheRef.current = {
              teacherClasses: classes,
              teacherData: null,
              userId: currentUser.uid,
            }
          }
        } catch (err) {
          console.error("Erro ao buscar dados do professor:", err)
          // Armazenar dados no cache mesmo com erro
          dataCacheRef.current = {
            teacherClasses: classes,
            teacherData: null,
            userId: currentUser.uid,
          }
        }
      } else {
        // Armazenar dados no cache mesmo sem turmas
        dataCacheRef.current = {
          teacherClasses: classes,
          teacherData: null,
          userId: currentUser.uid,
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar turmas:", err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  // Carregar alunos de uma turma
  const carregarAlunosTurma = useCallback(async (classId: number) => {
    // Verificar se já temos alunos em cache para esta turma
    if (classStudentsCacheRef.current.has(classId)) {
      setClassStudents(classStudentsCacheRef.current.get(classId) || [])
      return
    }

    setLoadingStudents(true)
    try {
      const { listUsersByClass } = await import("@/lib/api")
      const response = await listUsersByClass(classId, { page: 1, limit: 100 })
      // Filtrar apenas alunos (excluir professores)
      const students = (response.data || []).filter((user) => {
        const hasTeacherRole = user.roles.some(
          (role) =>
            role.roleName.toLowerCase() === "teacher" ||
            role.roleName.toLowerCase() === "professor"
        )
        return !hasTeacherRole
      })
      
      // Armazenar no cache
      classStudentsCacheRef.current.set(classId, students)
      setClassStudents(students)
    } catch (err: any) {
      console.error("Erro ao carregar alunos da turma:", err)
      setClassStudents([])
      // Armazenar array vazio no cache para evitar novas tentativas
      classStudentsCacheRef.current.set(classId, [])
    } finally {
      setLoadingStudents(false)
    }
  }, [])

  // Handler para abrir dialog de alunos
  const handleVerAlunos = async (turma: TeacherClass) => {
    setSelectedClass(turma)
    setShowStudentsDialog(true)
    await carregarAlunosTurma(turma.id)
  }

  useEffect(() => {
    if (currentUser) {
      carregarTurmas()
    }
  }, [carregarTurmas, currentUser])
  
  // Limpar cache quando o usuário mudar
  useEffect(() => {
    if (currentUser && dataCacheRef.current && dataCacheRef.current.userId !== currentUser.uid) {
      dataCacheRef.current = null
      classStudentsCacheRef.current.clear()
    }
  }, [currentUser])

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const sidebarItems = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Dados",
      onClick: () => router.push("/professor/dados"),
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Tarefas",
      onClick: () => router.push("/professor/tarefas"),
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Relatórios",
      onClick: () => router.push("/professor/analytics"),
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: "Níveis",
      onClick: () => router.push("/professor"),
    },
    {
      icon: <UserCircle className="h-5 w-5" />,
      label: "Trocar Perfil",
      onClick: () => router.push("/perfil"),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />

      <Sidebar items={sidebarItems} />

      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-12 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/professor/tarefas")}
                className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200"
              >
                <FaArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs">Voltar</span>
              </Button>
              <h1 className="text-xl font-semibold">Dados do Professor</h1>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                onClick={handleLogout}
                size="sm"
                className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200"
              >
                <FaSignOutAlt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-16 relative pt-16">
        <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="text-base font-semibold">
                      {teacherData
                        ? `${teacherData.firstName} ${teacherData.lastName}`
                        : currentUser?.displayName || "Nome não disponível"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-base font-semibold">
                      {teacherData?.email || currentUser?.email || "Email não disponível"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Institucionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-primary" />
                Dados Institucionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacherClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma turma encontrada
                </p>
              ) : (
                <>
                  {/* Nome da Escola */}
                  {teacherClasses.length > 0 && teacherClasses[0].school && (
                    <div className="space-y-2 pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <School className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Escola</p>
                          <p className="text-base font-semibold">
                            {teacherClasses[0].school.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de Turmas */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Turmas</p>
                    </div>
                    <div className="space-y-2">
                      {teacherClasses.map((turma) => (
                        <div
                          key={turma.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => handleVerAlunos(turma)}
                        >
                          <div className="flex items-center gap-3">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium">{turma.name}</p>
                              <p className="text-xs text-muted-foreground">{turma.grade}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Users className="h-4 w-4 mr-2" />
                            Ver Alunos
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog para exibir alunos da turma */}
      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Alunos da Turma: {selectedClass?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedClass?.grade && `Série: ${selectedClass.grade}`}
            </DialogDescription>
          </DialogHeader>

          {loadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : classStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aluno encontrado nesta turma
            </div>
          ) : (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student) => (
                    <TableRow key={student.userId}>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
