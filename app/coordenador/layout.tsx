"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogOut, Users, School, GraduationCap, TrendingUp, User } from "lucide-react"
import { Fredoka } from "next/font/google"

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fredoka",
})

export default function CoordenadorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Determinar o título baseado na rota atual
  const pageTitle = useMemo(() => {
    if (pathname?.includes("/escolas")) return "Gerenciamento de Escolas"
    if (pathname?.includes("/turmas")) return "Gerenciamento de Turmas"
    if (pathname?.includes("/usuarios")) return "Criação de Usuários"
    return "Coordenador" // página principal
  }, [pathname])

  // Verificar se está na página principal
  const isHomePage = pathname === "/coordenador"

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
    router.push("/perfil")
  }

  if (!currentUser) {
    return null
  }

  const sidebarItems = [
    {
      icon: <School className="h-5 w-5" />,
      label: "Escolas",
      onClick: () => router.push("/coordenador/escolas"),
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      label: "Turmas",
      onClick: () => router.push("/coordenador/turmas"),
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Usuários",
      onClick: () => router.push("/coordenador/usuarios"),
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Trocar Perfil",
      onClick: handleVoltar,
    },
  ]

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
            {isHomePage ? (
              <h1 
                className={`text-xl font-semibold ${fredoka.variable}`}
                style={{ 
                  fontFamily: 'var(--font-fredoka), "Fredoka One", cursive, sans-serif',
                  letterSpacing: '0.05em',
                  textShadow: '2px 2px 4px rgba(37, 99, 235, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 30%, #1d4ed8 60%, #1e40af 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: '1.4',
                  display: 'inline-block',
                  fontWeight: 600
                }}
              >
                {pageTitle}
              </h1>
            ) : (
              <h1 className="text-lg font-semibold">
                {pageTitle}
              </h1>
            )}
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleLogout} size="sm" className="gap-1.5 h-8 hover:bg-accent/10 transition-all duration-200">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-16 relative pt-16">
        {children}
      </main>
    </div>
  )
}
