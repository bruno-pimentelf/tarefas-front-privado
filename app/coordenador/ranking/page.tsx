"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, Loader2, Users, GraduationCap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// Mock data - TODO: Integrar com API de gamificação
const mockRankingStudents = [
  { userId: "1", name: "João Silva", nivel: 5, xp: 1250, role: "student", email: "joao.silva@email.com" },
  { userId: "2", name: "Maria Santos", nivel: 4, xp: 980, role: "student", email: "maria.santos@email.com" },
  { userId: "3", name: "Pedro Costa", nivel: 4, xp: 920, role: "student", email: "pedro.costa@email.com" },
  { userId: "4", name: "Ana Oliveira", nivel: 3, xp: 750, role: "student", email: "ana.oliveira@email.com" },
  { userId: "5", name: "Carlos Souza", nivel: 3, xp: 680, role: "student", email: "carlos.souza@email.com" },
  { userId: "6", name: "Julia Ferreira", nivel: 3, xp: 650, role: "student", email: "julia.ferreira@email.com" },
  { userId: "7", name: "Lucas Almeida", nivel: 2, xp: 450, role: "student", email: "lucas.almeida@email.com" },
  { userId: "8", name: "Fernanda Lima", nivel: 2, xp: 380, role: "student", email: "fernanda.lima@email.com" },
  { userId: "9", name: "Rafael Martins", nivel: 2, xp: 320, role: "student", email: "rafael.martins@email.com" },
  { userId: "10", name: "Beatriz Rocha", nivel: 1, xp: 150, role: "student", email: "beatriz.rocha@email.com" },
]

const mockRankingTeachers = [
  { userId: "1", name: "Prof. Maria Silva", nivel: 8, xp: 3200, role: "teacher", email: "maria.silva@email.com" },
  { userId: "2", name: "Prof. João Santos", nivel: 7, xp: 2800, role: "teacher", email: "joao.santos@email.com" },
  { userId: "3", name: "Prof. Ana Costa", nivel: 6, xp: 2400, role: "teacher", email: "ana.costa@email.com" },
  { userId: "4", name: "Prof. Pedro Oliveira", nivel: 5, xp: 2000, role: "teacher", email: "pedro.oliveira@email.com" },
  { userId: "5", name: "Prof. Carlos Souza", nivel: 5, xp: 1950, role: "teacher", email: "carlos.souza@email.com" },
  { userId: "6", name: "Prof. Julia Ferreira", nivel: 4, xp: 1600, role: "teacher", email: "julia.ferreira@email.com" },
  { userId: "7", name: "Prof. Lucas Almeida", nivel: 4, xp: 1450, role: "teacher", email: "lucas.almeida@email.com" },
  { userId: "8", name: "Prof. Fernanda Lima", nivel: 3, xp: 1200, role: "teacher", email: "fernanda.lima@email.com" },
  { userId: "9", name: "Prof. Rafael Martins", nivel: 3, xp: 1100, role: "teacher", email: "rafael.martins@email.com" },
  { userId: "10", name: "Prof. Beatriz Rocha", nivel: 2, xp: 850, role: "teacher", email: "beatriz.rocha@email.com" },
]

interface RankingUser {
  userId: string
  name: string
  nivel: number
  xp: number
  role: string
  email?: string
}

function RankingItem({ user, position }: { user: RankingUser, position: number }) {
  const getIcon = () => {
    if (position === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (position === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (position === 3) return <Award className="h-6 w-6 text-amber-600" />
    return (
      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
        {position}
      </span>
    )
  }

  const getPositionColor = () => {
    if (position === 1) return "border-yellow-500/30 bg-yellow-500/5"
    if (position === 2) return "border-gray-400/30 bg-gray-400/5"
    if (position === 3) return "border-amber-600/30 bg-amber-600/5"
    return "border-border"
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 ${getPositionColor()}`}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base truncate">{user.name}</p>
        {user.email && (
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm font-medium text-primary">Nível {user.nivel}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground">{user.xp.toLocaleString()} XP</span>
        </div>
      </div>
    </div>
  )
}

export default function RankingPage() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [rankingStudents, setRankingStudents] = useState<RankingUser[]>([])
  const [rankingTeachers, setRankingTeachers] = useState<RankingUser[]>([])

  useEffect(() => {
    // TODO: Buscar dados reais da API de gamificação
    // Por enquanto, usar dados mockados
    setLoading(true)
    
    // Simular carregamento
    setTimeout(() => {
      setRankingStudents(mockRankingStudents)
      setRankingTeachers(mockRankingTeachers)
      setLoading(false)
    }, 500)
  }, [])

  if (!currentUser) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Ranking de Usuários</h1>
        </div>
        <p className="text-muted-foreground">
          Visualize o ranking de alunos e professores baseado em níveis e experiência (XP)
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Professores
          </TabsTrigger>
        </TabsList>

        {/* Ranking de Alunos */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Ranking de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">Carregando ranking...</span>
                </div>
              ) : rankingStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum aluno encontrado no ranking
                </div>
              ) : (
                <div className="space-y-3">
                  {rankingStudents.map((user, index) => (
                    <RankingItem key={user.userId} user={user} position={index + 1} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking de Professores */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Ranking de Professores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">Carregando ranking...</span>
                </div>
              ) : rankingTeachers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum professor encontrado no ranking
                </div>
              ) : (
                <div className="space-y-3">
                  {rankingTeachers.map((user, index) => (
                    <RankingItem key={user.userId} user={user} position={index + 1} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
