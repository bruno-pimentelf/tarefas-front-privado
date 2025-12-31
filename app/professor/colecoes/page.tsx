"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ColecoesPage } from "@/components/colecoes-page"
import { Button } from "@/components/ui/button"
import { LogOut, ArrowLeft } from "lucide-react"

export default function ColecoesPageRoute() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()

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
    router.push("/professor/banco-itens")
  }

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
              <h2 className="text-base font-semibold">Coleções</h2>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <ColecoesPage onVoltar={handleVoltar} />
      </main>
    </div>
  )
}

