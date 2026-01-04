"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SidebarItem {
  icon: ReactNode
  label: string
  onClick: () => void
  badge?: string | number
}

interface SidebarProps {
  items: SidebarItem[]
  className?: string
}

export function Sidebar({ items, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40",
        "group",
        "transition-all duration-300 ease-in-out",
        "w-16 hover:w-56 hover:z-[60]",
        "bg-background",
        "border-r border-border",
        "shadow-lg",
        className
      )}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Espaço para o header - alinhado com altura do header */}
        <div className="h-12 border-b border-border"></div>
        
        {/* Menu Items */}
        <div className="flex flex-col gap-1 px-2 py-4 flex-1 overflow-y-auto">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-3 py-2.5 rounded-lg",
                "px-2 group-hover:px-3",
                "hover:bg-accent hover:text-accent-foreground",
                "transition-all duration-200",
                "group/item",
                "min-w-0", // Permite que o conteúdo seja cortado
                "justify-center group-hover:justify-start",
                "cursor-pointer"
              )}
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {item.icon}
              </div>
              <span
                className={cn(
                  "text-sm font-medium whitespace-nowrap",
                  "opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-300",
                  "overflow-hidden",
                  "flex-1 min-w-0",
                  "text-left"
                )}
              >
                {item.label}
              </span>
              {item.badge && (
                <span
                  className={cn(
                    "ml-auto text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0",
                    "bg-primary/10 text-primary",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-300"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

