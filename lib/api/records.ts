import { assessmentsApi } from "./client"

// ==========================================
// Types para Records API
// ==========================================

export interface Record {
  id: number
  userId: string
  admissionId: number
  score: number | null
  totalTime: number | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RecordQuestion {
  id: number
  recordId: number
  questionId: number
  alternativeId: number | null
  answer: string | null
  score: number | null
  correction: string | null
  createdAt: string
  updatedAt: string
}

export interface Essay {
  id: number
  content: string
  score: number | null
  correction: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateRecordInput {
  userId: string
  admissionId: number
}

export interface AnswerQuestionInput {
  recordId: number
  questionId: number
  alternativeId?: number // Para questões objetivas
  answer?: string // Para questões dissertativas
}

export interface AnswerEssayInput {
  recordId: number
  examId: number
  content: string
}

export interface FinishRecordInput {
  recordId: number
}

// ==========================================
// API Functions - Records
// ==========================================

/**
 * Cria um novo record (inicia avaliação)
 * POST /records
 */
export async function createRecord(data: CreateRecordInput): Promise<Record> {
  const response = await assessmentsApi.post<Record>("/records", data)
  return response
}

/**
 * Responde uma questão (objetiva ou dissertativa)
 * PATCH /records/answer-question
 */
export async function answerQuestion(data: AnswerQuestionInput): Promise<RecordQuestion> {
  const response = await assessmentsApi.patch<RecordQuestion>("/records/answer-question", data)
  return response
}

/**
 * Responde uma redação (essay)
 * PATCH /records/answer-essay
 */
export async function answerEssay(data: AnswerEssayInput): Promise<Essay> {
  const response = await assessmentsApi.patch<Essay>("/records/answer-essay", data)
  return response
}

/**
 * Finaliza o record (conclui avaliação)
 * PATCH /records/finish
 */
export async function finishRecord(data: FinishRecordInput): Promise<Record> {
  const response = await assessmentsApi.patch<Record>("/records/finish", data)
  return response
}

