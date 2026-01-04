import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata o grade (série) para exibição
 * Ex: "9" -> "9º Ano", "8" -> "8º Ano"
 */
export function formatGrade(grade: string | null | undefined): string {
  if (!grade) return "-"
  
  // Remove espaços e converte para número
  const gradeNum = parseInt(grade.trim())
  
  // Se não for um número válido, retorna o valor original
  if (isNaN(gradeNum)) {
    return grade
  }
  
  // Formata como "9º Ano", "8º Ano", etc.
  return `${gradeNum}º Ano`
}