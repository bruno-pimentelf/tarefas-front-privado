import { Booking } from "./bookings"
import { Tarefa } from "@/lib/types"
import { format, parseISO, isBefore, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Converte um Booking da API para o formato Tarefa usado no frontend
 */
export function bookingToTarefa(booking: Booking): Tarefa {
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

    // Determinar status baseado nas datas
    let status: "agendada" | "ativa" | "finalizada"
    if (isBefore(now, startTime)) {
      status = "agendada"
    } else if (isAfter(now, endTime)) {
      status = "finalizada"
    } else {
      status = "ativa"
    }

    return {
      id: booking.id.toString(),
      titulo: booking.title,
      descricao: booking.description,
      componente: "Matemática", // TODO: Adicionar campo na API ou mapear de outra forma
      questoes: [], // TODO: Buscar questões do booking se necessário
      professorId: "", // TODO: Buscar do booking se necessário
      professorNome: "", // TODO: Buscar do booking se necessário
      turmaId: "", // TODO: Buscar do booking se necessário
      turmaNome: "", // TODO: Buscar do booking se necessário
      dataInicio: startTime,
      dataFim: endTime,
      status,
    }
  } catch (error) {
    // Retorna uma tarefa básica em caso de erro
    return {
      id: booking.id.toString(),
      titulo: booking.title || "Tarefa sem título",
      descricao: booking.description,
      componente: "Matemática",
      questoes: [],
      professorId: "",
      professorNome: "",
      turmaId: "",
      turmaNome: "",
      dataInicio: new Date(),
      dataFim: new Date(),
      status: "agendada",
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

