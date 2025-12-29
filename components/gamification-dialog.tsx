"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Gamification } from "@/components/gamification"
import { Gamificacao } from "@/lib/types"

interface GamificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gamificacao: Gamificacao
}

export function GamificationDialog({
  open,
  onOpenChange,
  gamificacao,
}: GamificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Níveis e Sistema de Pontos</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <Gamification gamificacao={gamificacao} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

