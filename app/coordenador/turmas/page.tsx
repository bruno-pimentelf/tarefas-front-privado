"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, School, AlertCircle } from "lucide-react"
import { listSchools, type School } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export default function TurmasPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      const schoolsResponse = await listSchools({ page: 1, limit: 100 })
      setSchools(schoolsResponse.data || [])
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar escolas")
    } finally {
      setLoading(false)
    }
  }

  const handleSchoolClick = (schoolId: number) => {
    router.push(`/coordenador/turmas/${schoolId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando escolas...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
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
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Escolas
          </CardTitle>
          <CardDescription>
            Selecione uma escola para gerenciar suas turmas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schools.length === 0 ? (
            <div className="text-center py-12">
              <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Nenhuma escola cadastrada</p>
              <p className="text-xs text-muted-foreground">
                Cadastre escolas na seção de gerenciamento de escolas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schools.map((school) => (
                <Button
                  key={school.id}
                  variant="outline"
                  className="h-auto py-6 px-4 flex flex-col items-start gap-2 hover:bg-accent transition-colors"
                  onClick={() => handleSchoolClick(school.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <School className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-left">{school.name}</span>
                  </div>
                  {school.address && (
                    <p className="text-xs text-muted-foreground text-left">
                      {school.address.city}, {school.address.state}
                    </p>
                  )}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
