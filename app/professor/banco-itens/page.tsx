"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { BancoItens } from "@/components/banco-itens"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, ArrowLeft, FolderOpen, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BancoItensPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [totalQuestoes, setTotalQuestoes] = useState(0)
  const [questoesSelecionadasCount, setQuestoesSelecionadasCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
    }
  }, [currentUser, router])

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const handleVoltar = () => {
    router.push("/professor")
  }

  const handleAbrirColecoes = () => {
    router.push("/professor/colecoes")
  }

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleDataUpdate = useCallback((data: {
    total: number
    selected: number
    loading: boolean
  }) => {
    setTotalQuestoes(data.total)
    setQuestoesSelecionadasCount(data.selected)
    setIsLoading(data.loading)
  }, [])

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleVoltar}
                size="sm"
                className="gap-1.5 h-8"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs">Voltar</span>
              </Button>
              <h2 className="text-base font-semibold">Banco de Itens</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </Button>
              <Badge variant="outline" className="text-xs">
                {totalQuestoes} questões
              </Badge>
              {questoesSelecionadasCount > 0 && (
                <Badge className="text-xs">{questoesSelecionadasCount} selecionada(s)</Badge>
              )}
              <Button
                variant="outline"
                onClick={handleAbrirColecoes}
                size="sm"
                className="gap-1.5 h-8"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span className="text-xs">Ver Coleções</span>
              </Button>
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <BancoItens 
          onVoltar={handleVoltar} 
          onAbrirColecoes={handleAbrirColecoes}
          onDataUpdate={handleDataUpdate}
          refreshTrigger={refreshTrigger}
        />
      </main>
    </div>
  )
}
