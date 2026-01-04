"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Medal, Award } from "lucide-react"

interface RankingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock data - TODO: Integrar com API de gamificação
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

export function RankingDialog({ open, onOpenChange }: RankingDialogProps) {
  const router = useRouter()

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      // Quando fechar o dialog, redirecionar para a página inicial do coordenador
      router.push("/coordenador")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking de Usuários
          </DialogTitle>
          <DialogDescription>
            Ranking de níveis por role
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  )
}
