"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { BancoItens } from "@/components/banco-itens"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FaSignOutAlt, FaArrowLeft, FaPlus, FaTimes, FaFilter, FaChevronDown, FaChevronUp, FaFolderOpen, FaSpinner, FaCheck, FaChartBar, FaTrophy, FaUser, FaFlask } from "react-icons/fa"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getMatrices, MatrixItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import { PerfilDialog } from "@/components/perfil-dialog"

export default function BancoItensPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [totalQuestoes, setTotalQuestoes] = useState(0)
  const [questoesSelecionadasCount, setQuestoesSelecionadasCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [modoSelecao, setModoSelecao] = useState(false)
  const [filtroConteudo, setFiltroConteudo] = useState("")
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false)
  const [showFiltroMatrizes, setShowFiltroMatrizes] = useState(false)
  const [matrizesSelecionadasCount, setMatrizesSelecionadasCount] = useState(0)
  const [matrizes, setMatrizes] = useState<MatrixItem[]>([])
  const [matrizesLoading, setMatrizesLoading] = useState(false)
  const [matrizesSelecionadas, setMatrizesSelecionadas] = useState<string[]>([])
  const [termoBuscaMatriz, setTermoBuscaMatriz] = useState("")
  const [showPerfil, setShowPerfil] = useState(false)

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

  const handleAplicarFiltros = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const carregarMatrizes = async (term?: string) => {
    setMatrizesLoading(true)
    try {
      const matrizesData = await getMatrices(term)
      setMatrizes(matrizesData)
    } catch (error: any) {
      console.error("Erro ao carregar matrizes:", error)
      setMatrizes([])
    } finally {
      setMatrizesLoading(false)
    }
  }

  useEffect(() => {
    if (showFiltroMatrizes && matrizes.length === 0) {
      carregarMatrizes()
    }
  }, [showFiltroMatrizes])

  const handleBuscarMatrizes = () => {
    carregarMatrizes(termoBuscaMatriz.trim() || undefined)
  }

  const handleToggleMatriz = (matrizId: string) => {
    setMatrizesSelecionadas((prev) => {
      if (prev.includes(matrizId)) {
        return prev.filter((id) => id !== matrizId)
      } else {
        return [...prev, matrizId]
      }
    })
  }

  const handleLimparMatrizes = () => {
    setMatrizesSelecionadas([])
    setMatrizesSelecionadasCount(0)
  }

  useEffect(() => {
    setMatrizesSelecionadasCount(matrizesSelecionadas.length)
  }, [matrizesSelecionadas])

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

  const sidebarItems = [
    {
      icon: <FaChartBar className="h-5 w-5" />,
      label: "Estatísticas",
      onClick: () => {},
    },
    {
      icon: <FaTrophy className="h-5 w-5" />,
      label: "Níveis",
      onClick: () => {},
    },
    {
      icon: <FaFlask className="h-5 w-5" />,
      label: "Analytics",
      onClick: () => router.push("/professor/analytics"),
    },
    {
      icon: <FaUser className="h-5 w-5" />,
      label: "Meu Perfil",
      onClick: () => setShowPerfil(true),
    },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      
      <Sidebar items={sidebarItems} />
      
      <header className="fixed top-0 z-50 left-16 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto px-4 max-w-7xl w-full h-14 flex items-center">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                onClick={handleVoltar}
                size="sm"
                className="gap-2 h-9 hover:bg-accent/10 transition-all duration-200 shrink-0"
              >
                <FaArrowLeft className="h-4 w-4" />
                <span className="text-sm">Voltar</span>
              </Button>
              <h2 className="text-sm font-semibold shrink-0">Banco de Itens</h2>
              <Badge variant="outline" className="text-xs shrink-0">
                {totalQuestoes} questões
              </Badge>
              {questoesSelecionadasCount > 0 && (
                <Badge className="text-xs shrink-0">{questoesSelecionadasCount} selecionada(s)</Badge>
              )}
              
              {/* Filtros */}
              <div className="flex items-center gap-2 ml-3 flex-1 min-w-0">
                <Input
                  placeholder="Buscar por conteúdo..."
                  value={filtroConteudo}
                  onChange={(e) => setFiltroConteudo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAplicarFiltros()}
                  className="h-8 w-48 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                  className="h-8 text-sm gap-1.5 px-3"
                >
                  {showFiltrosAvancados ? (
                    <FaChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <FaChevronDown className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Filtros</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFiltroMatrizes(true)}
                  className="h-8 text-sm gap-1.5 px-3"
                >
                  <FaFilter className="h-3.5 w-3.5" />
                  Matrizes
                  {matrizesSelecionadasCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs h-4 px-1.5">
                      {matrizesSelecionadasCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAplicarFiltros}
                  className="h-8 text-sm px-3"
                >
                  Buscar
                </Button>
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={modoSelecao ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setModoSelecao(!modoSelecao)
                  if (modoSelecao) {
                    setQuestoesSelecionadasCount(0)
                  }
                }}
                className={modoSelecao ? "bg-primary hover:bg-primary/90 text-white font-medium gap-1.5 h-8 px-3 text-sm" : "font-medium gap-1.5 h-8 px-3 text-sm"}
              >
                {modoSelecao ? (
                  <>
                    <FaTimes className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Cancelar</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Selecionar</span>
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleAbrirColecoes}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1.5 h-8 px-3 text-sm"
              >
                <FaFolderOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Minhas Coleções</span>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-2 h-9 hover:bg-accent/10 transition-all duration-200">
                <FaSignOutAlt className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-16 relative pt-[4.5rem]">
        <BancoItens 
          onDataUpdate={handleDataUpdate}
          refreshTrigger={refreshTrigger}
          modoSelecao={modoSelecao}
          onModoSelecaoChange={setModoSelecao}
          onAbrirFiltroMatrizes={() => setShowFiltroMatrizes(true)}
          onAplicarFiltros={handleAplicarFiltros}
          filtroConteudo={filtroConteudo}
          onFiltroConteudoChange={setFiltroConteudo}
          showFiltrosAvancados={showFiltrosAvancados}
          onShowFiltrosAvancadosChange={setShowFiltrosAvancados}
          onMatrizesSelecionadasChange={setMatrizesSelecionadasCount}
          matrizesSelecionadas={matrizesSelecionadas}
          onMatrizesSelecionadasChangeList={setMatrizesSelecionadas}
        />
      </main>

      {/* Dialog de filtro de matrizes */}
      <Dialog open={showFiltroMatrizes} onOpenChange={setShowFiltroMatrizes}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Filtrar por Matrizes de Conhecimento</DialogTitle>
            <DialogDescription className="text-xs">
              Selecione as matrizes para filtrar as questões
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Campo de busca */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar matriz por termo..."
                value={termoBuscaMatriz}
                onChange={(e) => setTermoBuscaMatriz(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscarMatrizes()}
                className="h-9 text-sm flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleBuscarMatrizes}
                disabled={matrizesLoading}
                className="h-9"
              >
                {matrizesLoading ? (
                  <FaSpinner className="h-4 w-4 animate-spin" />
                ) : (
                  "Buscar"
                )}
              </Button>
            </div>
            {matrizesLoading ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : matrizes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {termoBuscaMatriz 
                    ? "Nenhuma matriz encontrada para este termo" 
                    : "Digite um termo para buscar matrizes"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {matrizes.map((matriz) => {
                  const isSelecionada = matrizesSelecionadas.includes(matriz.id)
                  return (
                    <div
                      key={matriz.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all hover:bg-muted/50",
                        isSelecionada && "bg-primary/5 border-primary/20 ring-1 ring-primary/20"
                      )}
                      onClick={() => handleToggleMatriz(matriz.id)}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isSelecionada ? (
                          <div className="h-4 w-4 rounded bg-primary flex items-center justify-center">
                            <FaCheck className="h-3 w-3 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded border-2 border-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{matriz.label}</p>
                          <Badge variant="outline" className="text-xs">
                            {matriz.acronym}
                          </Badge>
                        </div>
                        {matriz.title && (
                          <p className="text-xs text-muted-foreground">{matriz.title}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleLimparMatrizes}
              size="sm"
              disabled={matrizesSelecionadas.length === 0}
            >
              Limpar
            </Button>
            <Button 
              onClick={() => {
                setShowFiltroMatrizes(false)
                handleAplicarFiltros()
              }} 
              size="sm"
            >
              Aplicar ({matrizesSelecionadas.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PerfilDialog
        open={showPerfil}
        onOpenChange={setShowPerfil}
      />
    </div>
  )
}
