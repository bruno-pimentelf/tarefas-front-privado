import { ApiClient } from "./client"
import {
  Question,
  PaginatedResponse,
  QuestionsSearchFilters,
} from "./types"

const ITEMS_API_URL = "https://api.trieduconline.com.br/items"

// Cliente separado para Items API
const itemsApi = new ApiClient(ITEMS_API_URL)

/**
 * Busca questões com filtros avançados, ordenação e paginação
 * GET /questions/search-by-filters
 */
export async function searchQuestions(
  filters: QuestionsSearchFilters = {}
): Promise<PaginatedResponse<Question>> {
  const params = new URLSearchParams()

  // Adiciona apenas os parâmetros que foram definidos
  if (filters.page !== undefined) params.append("page", String(filters.page))
  if (filters.limit !== undefined) params.append("limit", String(filters.limit))
  if (filters.language) params.append("language", filters.language)
  if (filters.origin) params.append("origin", filters.origin)
  if (filters.status) params.append("status", filters.status)
  if (filters.content) params.append("content", filters.content)
  if (filters.matrixValue) params.append("matrixValue", filters.matrixValue)
  if (filters.aOperator) params.append("aOperator", filters.aOperator)
  if (filters.aValue) params.append("aValue", filters.aValue)
  if (filters.bOperator) params.append("bOperator", filters.bOperator)
  if (filters.bValue) params.append("bValue", filters.bValue)
  if (filters.answersCountOperator) params.append("answersCountOperator", filters.answersCountOperator)
  if (filters.answersCountValue) params.append("answersCountValue", filters.answersCountValue)
  if (filters.sort) params.append("sort", filters.sort)
  if (filters.order) params.append("order", filters.order)

  const queryString = params.toString()
  const url = queryString
    ? `/questions/search-by-filters?${queryString}`
    : "/questions/search-by-filters"

  return itemsApi.get<PaginatedResponse<Question>>(url)
}

/**
 * Busca uma questão específica por ID
 * GET /questions/:id
 */
export async function getQuestionById(id: number): Promise<Question> {
  return itemsApi.get<Question>(`/questions/${id}`)
}

/**
 * Busca múltiplas questões por IDs
 * Útil para carregar questões de uma collection
 */
export async function getQuestionsByIds(ids: number[]): Promise<Question[]> {
  const questions = await Promise.all(
    ids.map(async (id) => {
      try {
        return await getQuestionById(id)
      } catch {
        return null
      }
    })
  )
  return questions.filter((q): q is Question => q !== null)
}

// Export do cliente para uso direto se necessário
export { itemsApi }

