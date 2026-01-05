"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, User, Mail, School, GraduationCap, Users } from "lucide-react"
import { listClassesByUser, getClassById, listUsersByClass, type User as UserClassUser, type Class } from "@/lib/api"
import { formatGrade } from "@/lib/utils"
import { FaArrowLeft } from "react-icons/fa"

// Interface para o cache de dados do aluno
interface AlunoDataCache {
  studentClasses: Class[]
  teachers: Map<number, UserClassUser[]>
  studentData: UserClassUser | null
  userId: string
}

export default function AlunoDadosPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [studentClasses, setStudentClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Map<number, UserClassUser[]>>(new Map())
  const [studentData, setStudentData] = useState<UserClassUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Cache para armazenar dados e evitar chamadas redundantes
  const dataCacheRef = useRef<AlunoDataCache | null>(null)

  useEffect(() => {
    const carregarDados = async () => {
      if (!currentUser) return

      // Verificar se já temos dados em cache para este usuário
      if (dataCacheRef.current && dataCacheRef.current.userId === currentUser.uid) {
        setStudentClasses(dataCacheRef.current.studentClasses)
        setTeachers(dataCacheRef.current.teachers)
        setStudentData(dataCacheRef.current.studentData)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 1. Buscar turmas do aluno
        const classesResponse = await listClassesByUser(currentUser.uid, { page: 1, limit: 100 })
        const classIds = (classesResponse.data || []).map((cls) => cls.id)

        if (classIds.length === 0) {
          setStudentClasses([])
          setTeachers(new Map())
          return
        }

        // 2. Buscar detalhes completos de cada turma (incluindo escola)
        const classDetailsPromises = classIds.map((classId) =>
          getClassById(classId).catch((err) => {
            console.error(`Erro ao buscar detalhes da turma ${classId}:`, err)
            return null
          })
        )

        const classDetails = (await Promise.all(classDetailsPromises)).filter(
          (cls): cls is Class => cls !== null
        )

        setStudentClasses(classDetails)

        // 3. Buscar dados do aluno (primeiro usuário encontrado nas turmas que corresponde ao currentUser.uid)
        let studentInfo: UserClassUser | null = null
        if (classDetails.length > 0) {
          try {
            const firstClassUsersResponse = await listUsersByClass(classDetails[0].id, { page: 1, limit: 100 })
            const allUsers = firstClassUsersResponse.data || []
            const foundStudent = allUsers.find((user) => user.userId === currentUser.uid)
            if (foundStudent) {
              studentInfo = foundStudent
            }
          } catch (err) {
            console.error("Erro ao buscar dados do aluno:", err)
          }
        }
        setStudentData(studentInfo)

        // 4. Para cada turma, buscar professores
        const teachersMap = new Map<number, UserClassUser[]>()
        const teachersPromises = classDetails.map(async (cls) => {
          try {
            const usersResponse = await listUsersByClass(cls.id, { page: 1, limit: 100 })
            const allUsers = usersResponse.data || []

            // Filtrar apenas professores
            const teachersList = allUsers.filter((user) => {
              const hasTeacherRole = user.roles.some(
                (role) =>
                  role.roleName.toLowerCase() === "teacher" ||
                  role.roleName.toLowerCase() === "professor"
              )
              return hasTeacherRole
            })

            teachersMap.set(cls.id, teachersList)
          } catch (err) {
            console.error(`Erro ao buscar professores da turma ${cls.id}:`, err)
            teachersMap.set(cls.id, [])
          }
        })

        await Promise.all(teachersPromises)
        setTeachers(teachersMap)
        
        // Armazenar dados no cache
        dataCacheRef.current = {
          studentClasses: classDetails,
          teachers: teachersMap,
          studentData: studentInfo,
          userId: currentUser.uid,
        }
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err)
        setError(err?.message || "Erro ao carregar dados do aluno")
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [currentUser])
  
  // Limpar cache quando o usuário mudar
  useEffect(() => {
    if (currentUser && dataCacheRef.current && dataCacheRef.current.userId !== currentUser.uid) {
      dataCacheRef.current = null
    }
  }, [currentUser])

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  // Pegar a primeira turma para exibir a escola (assumindo que o aluno está em apenas uma escola)
  const primaryClass = studentClasses[0]
  const schoolName = primaryClass?.school?.name || primaryClass?.schoolName || "Não informado"

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

      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-12 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/aluno/tarefas")}
                className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200"
              >
                <FaArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs">Voltar</span>
              </Button>
              <h1 className="text-xl font-semibold">Dados do Aluno</h1>
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
                      {studentData
                        ? `${studentData.firstName} ${studentData.lastName}`
                        : currentUser?.displayName || "Nome não disponível"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-base font-semibold">
                      {studentData?.email || currentUser?.email || "Email não disponível"}
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
              {/* Nome da Escola */}
              <div className="space-y-2 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <School className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Escola</p>
                    <p className="text-base font-semibold">{schoolName}</p>
                  </div>
                </div>
              </div>

              {/* Turmas */}
              {studentClasses.length === 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Turma</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhuma turma encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentClasses.map((turma) => {
                    const turmaTeachers = teachers.get(turma.id) || []
                    return (
                      <div key={turma.id} className="space-y-4">
                        {/* Nome da Turma */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Turma</p>
                              <p className="text-base font-semibold">{turma.name}</p>
                            </div>
                          </div>
                        </div>

                        {/* Lista de Professores */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">
                              Professores
                            </p>
                          </div>
                          {turmaTeachers.length > 0 ? (
                            <div className="space-y-2 pl-7">
                              {turmaTeachers.map((teacher) => (
                                <div key={teacher.userId} className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {teacher.firstName} {teacher.lastName}
                                    </p>
                                    {teacher.email && (
                                      <p className="text-xs text-muted-foreground">
                                        {teacher.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="pl-7">
                              <p className="text-sm text-muted-foreground">
                                Nenhum professor encontrado nesta turma
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
