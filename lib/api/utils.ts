import { Booking } from "./bookings"
import { Tarefa } from "@/lib/types"
import { format, parseISO, isBefore, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Converte um Booking da API para o formato Tarefa usado no frontend
 */
export function bookingToTarefa(booking: Booking): Tarefa {
  const startTime = parseISO(booking.startTime)
  const endTime = parseISO(booking.endTime)
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
}

/**
 * Formata data para exibição
 */
export function formatBookingDate(dateString: string, timezone?: string): string {
  try {
    const date = parseISO(dateString)
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return dateString
  }
}

