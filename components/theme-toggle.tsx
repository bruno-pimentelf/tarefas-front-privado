"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
        <Sun className="h-3.5 w-3.5" />
      </Button>
    )
  }

  // Usa resolvedTheme para detectar o tema atual (considera "system")
  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Alternar tema"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

