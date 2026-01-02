import { Booking } from "./bookings"
import { Tarefa } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getAdmissionsByBookingAndUser } from "./admissions"
import { getCollectionById } from "./collections"

/**
 * Verifica se um booking foi concluído pelo aluno (tem record.finishedAt)
 * @deprecated A API agora retorna o campo `status` diretamente no booking.
 * Use `booking.status === "finished"` ao invés desta função.
 */
/**
 * @deprecated A API agora retorna o campo `status` diretamente no booking.
 * Use `booking.status === "finished"` ao invés desta função.
 */
export async function isBookingCompleted(
  bookingId: number,
  userId: string
): Promise<boolean> {
  try {
    const admissions = await getAdmissionsByBookingAndUser(bookingId, userId)
    
    if (!admissions || admissions.length === 0) {
      return false
    }

    // Verifica se há pelo menos uma admission com record.finishedAt
    return admissions.some(admission => admission.record?.finishedAt != null)
  } catch (error) {
    console.error("Erro ao verificar conclusão do booking:", error)
    return false
  }
}

/**
 * @deprecated A API agora retorna o campo `totalQuestions` diretamente no booking.
 * Use `booking.totalQuestions` ao invés desta função.
 */
export async function getBookingQuestionsCount(
  bookingId: number,
  userId: string
): Promise<number> {
  try {
    // Buscar todas as admissions do booking
    const admissions = await getAdmissionsByBookingAndUser(bookingId, userId)
    
    if (!admissions || admissions.length === 0) {
      return 0
    }

    // Coletar todos os collectionIds únicos de todos os exams
    const collectionIds = new Set<number>()
    admissions.forEach(admission => {
      if (admission.exams && Array.isArray(admission.exams)) {
        admission.exams.forEach(exam => {
          if (exam.collectionId) {
            collectionIds.add(exam.collectionId)
          }
        })
      }
    })

    if (collectionIds.size === 0) {
      return 0
    }

    // Buscar todas as collections em paralelo
    const collectionPromises = Array.from(collectionIds).map(collectionId =>
      getCollectionById(collectionId).catch(() => null) // Ignora erros
    )

    const collections = await Promise.all(collectionPromises)
    
    // Somar o total de questões de todas as collections
    let totalQuestions = 0
    collections.forEach(collection => {
      if (collection && collection.questionIds && Array.isArray(collection.questionIds)) {
        totalQuestions += collection.questionIds.length
      }
    })

    return totalQuestions
  } catch (error) {
    console.error("Erro ao calcular total de questões do booking:", error)
    return 0
  }
}

/**
 * Converte um Booking da API para o formato Tarefa usado no frontend
 * @param booking - O booking a ser convertido (agora inclui totalQuestions e status)
 * @param isProfessor - Se true, usa lógica de professor (apenas endTime determina finalizada)
 */
export function bookingToTarefa(
  booking: Booking, 
  isProfessor: boolean = false
): Tarefa {
  try {
    // Tenta fazer parse da data, com fallback para new Date se falhar
    let startTime: Date
    let endTime: Date

    try {
      startTime = parseISO(booking.startTime)
      // Verifica se a data é válida
      if (isNaN(startTime.getTime())) {
        startTime = new Date(booking.startTime)
      }
    } catch (e) {
      startTime = new Date(booking.startTime)
    }

    try {
      endTime = parseISO(booking.endTime)
      // Verifica se a data é válida
      if (isNaN(endTime.getTime())) {
        endTime = new Date(booking.endTime)
      }
    } catch (e) {
      endTime = new Date(booking.endTime)
    }

    const now = new Date()
    const nowTime = now.getTime()
    const startTimeTime = startTime.getTime()
    const endTimeTime = endTime.getTime()
    
    // Verifica se o prazo expirou
    const prazoExpirou = nowTime >= endTimeTime

    // Determinar status e flag de atrasada
    let status: "agendada" | "ativa" | "finalizada"
    let atrasada = false
    
    if (isProfessor) {
      // Para professor: verifica apenas endTime para determinar se está finalizada
      if (prazoExpirou) {
        status = "finalizada"
      } else if (nowTime < startTimeTime) {
        status = "agendada"
      } else {
        status = "ativa"
      }
      // Professor não tem conceito de "atrasada"
    } else {
      // Para aluno: lógica baseada no status da API e endTime
      if (booking.status) {
        // REGRA PRINCIPAL: Se não é "finished" E o prazo expirou = ATRASADA
        if (booking.status !== "finished" && prazoExpirou) {
          status = "finalizada"
          atrasada = true
        } else {
          // Aplicar lógica normal para outros casos
          switch (booking.status) {
            case "finished":
              status = "finalizada"
              atrasada = false // Concluída no prazo
              break
            case "in_progress":
              status = "ativa" // Ainda em progresso
              break
            case "not_started":
              if (nowTime < startTimeTime) {
                status = "agendada" // Ainda não começou
              } else {
                status = "ativa" // Período ativo
              }
              break
            default:
              // Para status desconhecidos, usar lógica de tempo
              if (nowTime < startTimeTime) {
                status = "agendada"
              } else {
                status = "ativa"
              }
          }
        }
      } else {
        // Fallback para lógica anterior se não tiver status da API
        if (prazoExpirou) {
          status = "finalizada"
          atrasada = true
        } else if (nowTime < startTimeTime) {
          status = "agendada"
        } else {
          status = "ativa"
        }
      }
    }

    // Usar totalQuestions da API ou 0 como fallback
    const questionsCount = booking.totalQuestions || 0
    
    // Criar array de questões vazias com o tamanho correto para manter compatibilidade
    const questoesArray = new Array(questionsCount).fill(null).map((_, index) => ({
      id: `placeholder-${index}`,
      enunciado: "",
      tipo: "objetiva" as const,
      componente: "Matemática" as const,
    }))

    return {
      id: booking.id.toString(),
      titulo: booking.title,
      descricao: booking.description,
      componente: "Matemática" as const,
      questoes: questoesArray,
      professorId: "", // TODO: Buscar do booking se necessário
      professorNome: "", // TODO: Buscar do booking se necessário
      turmaId: "", // TODO: Buscar do booking se necessário
      turmaNome: "", // TODO: Buscar do booking se necessário
      dataInicio: startTime,
      dataFim: endTime,
      status,
      atrasada,
    }
  } catch (error) {
    // Retorna uma tarefa básica em caso de erro
    const questionsCount = booking.totalQuestions || 0
    const questoesArray = new Array(questionsCount).fill(null).map((_, index) => ({
      id: `placeholder-${index}`,
      enunciado: "",
      tipo: "objetiva" as const,
      componente: "Matemática" as const,
    }))

    return {
      id: booking.id.toString(),
      titulo: booking.title || "Tarefa sem título",
      descricao: booking.description,
      componente: "Matemática" as const,
      questoes: questoesArray,
      professorId: "",
      professorNome: "",
      turmaId: "",
      turmaNome: "",
      dataInicio: new Date(),
      dataFim: new Date(),
      status: "agendada",
      atrasada: false,
    }
  }
}

/**
 * Formata data para exibição
 * Converte de UTC para timezone da escola se fornecido
 */
export function formatBookingDate(dateString: string, timezone?: string): string {
  try {
    const date = parseISO(dateString)
    
    // Se timezone for fornecido, considera a conversão (a API já deve retornar convertido)
    // Por enquanto, formata diretamente - a API deve retornar já convertido para timezone da escola
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return dateString
  }
}
