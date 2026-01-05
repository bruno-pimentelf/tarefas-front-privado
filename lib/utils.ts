import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata o grade (série) para exibição
 * Ex: "9" -> "9º Ano", "8" -> "8º Ano", "1" -> "1º EM"
 * Valores suportados: 6, 7, 8, 9 (Ensino Fundamental), 1, 2, 3 (Ensino Médio)
 */
export function formatGrade(grade: string | null | undefined): string {
  if (!grade) return "-"
  
  const gradeTrimmed = grade.trim()
  
  // Remove espaços e converte para número
  const gradeNum = parseInt(gradeTrimmed.replace(/[^0-9]/g, ""))
  
  // Se não for um número válido, retorna o valor original
  if (isNaN(gradeNum)) {
    return gradeTrimmed
  }
  
  // Verificar se é Ensino Médio (1, 2, 3)
  if (gradeNum >= 1 && gradeNum <= 3) {
    return `${gradeNum}º EM`
  }
  
  // Verificar se é Ensino Fundamental (6, 7, 8, 9)
  if (gradeNum >= 6 && gradeNum <= 9) {
    return `${gradeNum}º Ano`
  }
  
  // Para outros valores, verificar se contém "em" no texto original
  if (gradeTrimmed.toLowerCase().includes("em")) {
    return `${gradeNum}º EM`
  }
  
  // Formata como "Xº Ano" para outros valores
  return `${gradeNum}º Ano`
}

/**
 * Formata o nome da role para exibição
 * Ex: "student" -> "Estudante", "teacher" -> "Professor", "coordinator" -> "Coordenador"
 */
export function formatRoleName(roleName: string | null | undefined): string {
  if (!roleName) return "-"
  
  const roleLower = roleName.toLowerCase()
  
  if (roleLower.includes("student") || roleLower.includes("estudante") || roleLower.includes("aluno")) {
    return "Estudante"
  }
  
  if (roleLower.includes("teacher") || roleLower.includes("professor")) {
    return "Professor"
  }
  
  if (roleLower.includes("coordinator") || roleLower.includes("coordenador")) {
    return "Coordenador"
  }
  
  // Retorna o nome original se não corresponder a nenhum padrão
  return roleName
}