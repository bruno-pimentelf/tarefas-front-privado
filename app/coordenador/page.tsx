"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { School as SchoolIcon, GraduationCap, Users, User, Trophy, Medal, Award, Loader2 } from "lucide-react"
import { listSchools, listUsersByClass, getCoordinatorClasses, type School, type Class, type UserClassUser } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

// Mock data para ranking - TODO: Integrar com API de gamificação
const mockRankingStudents = [
  { userId: "1", name: "João Silva", nivel: 5, xp: 1250, role: "student" },
  { userId: "2", name: "Maria Santos", nivel: 4, xp: 980, role: "student" },
  { userId: "3", name: "Pedro Costa", nivel: 4, xp: 920, role: "student" },
  { userId: "4", name: "Ana Oliveira", nivel: 3, xp: 750, role: "student" },
  { userId: "5", name: "Carlos Souza", nivel: 3, xp: 680, role: "student" },
]

const mockRankingTeachers = [
  { userId: "1", name: "Prof. Maria Silva", nivel: 8, xp: 3200, role: "teacher" },
  { userId: "2", name: "Prof. João Santos", nivel: 7, xp: 2800, role: "teacher" },
  { userId: "3", name: "Prof. Ana Costa", nivel: 6, xp: 2400, role: "teacher" },
  { userId: "4", name: "Prof. Pedro Oliveira", nivel: 5, xp: 2000, role: "teacher" },
  { userId: "5", name: "Prof. Carlos Souza", nivel: 5, xp: 1950, role: "teacher" },
]

function RankingItem({ user, position }: { user: { name: string; nivel: number; xp: number }, position: number }) {
  const getIcon = () => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">{position}</span>
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-sm text-muted-foreground">Nível {user.nivel} • {user.xp} XP</p>
      </div>
    </div>
  )
}

export default function CoordenadorPage() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [schools, setSchools] = useState<School[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [allUsers, setAllUsers] = useState<UserClassUser[]>([])

  useEffect(() => {
    const carregarDados = async () => {
      if (!currentUser) return
      
      try {
        setLoading(true)
        
        // Carregar escolas e turmas
        const [schoolsResponse, classesData] = await Promise.all([
          listSchools({ page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } })),
          getCoordinatorClasses(currentUser.uid).catch(() => [])
        ])
        
        setSchools(schoolsResponse.data || [])
        // Garantir que classesData seja sempre um array
        const classesArray = Array.isArray(classesData) ? classesData : []
        setClasses(classesArray)
        
        // Carregar usuários de todas as turmas
        const usersPromises = classesArray.map(async (cls) => {
          try {
            const usersResponse = await listUsersByClass(cls.id, { page: 1, limit: 100 })
            return usersResponse.data || []
          } catch (err) {
            console.error(`Erro ao buscar users da classe ${cls.id}:`, err)
            return []
          }
        })
        
        const usersArrays = await Promise.all(usersPromises)
        const uniqueUsers = new Map<string, UserClassUser>()
        usersArrays.flat().forEach(user => {
          if (!uniqueUsers.has(user.userId)) {
            uniqueUsers.set(user.userId, user)
          }
        })
        setAllUsers(Array.from(uniqueUsers.values()))
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [currentUser])

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const totalSchools = schools.length
    const totalClasses = Array.isArray(classes) ? classes.length : 0
    const totalUsers = allUsers.length
    
    // Contar usuários por role
    const usersByRole = allUsers.reduce((acc, user) => {
      user.roles.forEach(role => {
        const roleName = role.roleName.toLowerCase()
        if (!acc[roleName]) {
          acc[roleName] = 0
        }
        acc[roleName]++
      })
      return acc
    }, {} as Record<string, number>)
    
    const students = usersByRole.student || 0
    const teachers = usersByRole.teacher || 0
    
    return {
      totalSchools,
      totalClasses,
      totalUsers,
      students,
      teachers,
    }
  }, [schools, classes, allUsers])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <SchoolIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Escolas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalSchools}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.totalSchools === 1 ? "escola cadastrada" : "escolas cadastradas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Turmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.totalClasses === 1 ? "turma cadastrada" : "turmas cadastradas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.students}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.students === 1 ? "aluno cadastrado" : "alunos cadastrados"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Professores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.teachers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.teachers === 1 ? "professor cadastrado" : "professores cadastrados"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Gamificação */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Ranking de Usuários
        </h2>
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students">Alunos</TabsTrigger>
            <TabsTrigger value="teachers">Professores</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-3 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {mockRankingStudents.map((user, index) => (
                    <RankingItem key={user.userId} user={user} position={index + 1} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-3 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {mockRankingTeachers.map((user, index) => (
                    <RankingItem key={user.userId} user={user} position={index + 1} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
