"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TeacherClass } from "@/lib/api/bookings"

export interface AnalyticsFilters {
  schoolYear?: string
  grade?: string
  classIds?: number[]
  admissionId?: number
  matrixIds?: string[]
}

interface AnalyticsFiltersProps {
  availableClasses?: TeacherClass[]
  availableAdmissions?: Array<{ id: number; title: string }>
  currentFilters: AnalyticsFilters
  onFiltersChange: (filters: AnalyticsFilters) => void
  filterTypes?: ("schoolYear" | "grade" | "classIds" | "admissionId" | "matrixIds")[]
}

export function AnalyticsFiltersDialog({
  availableClasses = [],
  availableAdmissions = [],
  currentFilters,
  onFiltersChange,
  filterTypes = ["schoolYear", "grade", "classIds"],
}: AnalyticsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(currentFilters)
  const [open, setOpen] = useState(false)

  // Sincronizar filtros locais quando os filtros externos mudarem
  useEffect(() => {
    setLocalFilters(currentFilters)
  }, [currentFilters])

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleResetFilters = () => {
    const resetFilters: AnalyticsFilters = {}
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
    setOpen(false)
  }

  const toggleClassId = (classId: number) => {
    const currentClassIds = localFilters.classIds || []
    if (currentClassIds.includes(classId)) {
      setLocalFilters({
        ...localFilters,
        classIds: currentClassIds.filter((id) => id !== classId),
      })
    } else {
      setLocalFilters({
        ...localFilters,
        classIds: [...currentClassIds, classId],
      })
    }
  }

  const hasActiveFilters = () => {
    return !!(
      localFilters.schoolYear ||
      localFilters.grade ||
      (localFilters.classIds && localFilters.classIds.length > 0) ||
      localFilters.admissionId ||
      (localFilters.matrixIds && localFilters.matrixIds.length > 0)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          {hasActiveFilters() ? "FILTROS ATIVOS" : "FILTROS"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtros de Análise</DialogTitle>
          <DialogDescription>
            Selecione os filtros para refinar os dados exibidos
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {filterTypes.includes("schoolYear") && (
            <div className="space-y-2">
              <Label htmlFor="schoolYear">Ano Letivo</Label>
              <Input
                id="schoolYear"
                placeholder="Ex: 2025"
                value={localFilters.schoolYear || ""}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, schoolYear: e.target.value || undefined })
                }
              />
            </div>
          )}

          {filterTypes.includes("grade") && (
            <div className="space-y-2">
              <Label htmlFor="grade">Ano Escolar / Série</Label>
              <Input
                id="grade"
                placeholder="Ex: 6ºEF, 5ªA"
                value={localFilters.grade || ""}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, grade: e.target.value || undefined })
                }
              />
            </div>
          )}

          {filterTypes.includes("classIds") && availableClasses.length > 0 && (
            <div className="space-y-2">
              <Label>Turmas</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {availableClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`class-${classItem.id}`}
                      checked={localFilters.classIds?.includes(classItem.id) || false}
                      onChange={() => toggleClassId(classItem.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={`class-${classItem.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {classItem.name} ({classItem.grade})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filterTypes.includes("admissionId") && availableAdmissions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="admissionId">Avaliação</Label>
              <select
                id="admissionId"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={localFilters.admissionId || ""}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    admissionId: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              >
                <option value="">Todas as avaliações</option>
                {availableAdmissions.map((admission) => (
                  <option key={admission.id} value={admission.id}>
                    {admission.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleApplyFilters} className="flex-1">
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Limpar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
