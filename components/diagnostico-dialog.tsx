"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DiagnosticoAluno } from "@/components/diagnostico-aluno"
import { DiagnosticoAluno as DiagnosticoAlunoType } from "@/lib/types"

interface DiagnosticoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  diagnostico: DiagnosticoAlunoType
}

export function DiagnosticoDialog({
  open,
  onOpenChange,
  diagnostico,
}: DiagnosticoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Diagnóstico de Aprendizado</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <DiagnosticoAluno diagnostico={diagnostico} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

