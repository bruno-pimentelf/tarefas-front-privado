import { assessmentsApi } from "./client"
import {
  Collection,
  CollectionDetail,
  CollectionCreateInput,
  CollectionUpdateInput,
  PaginatedResponse,
  DeleteCollectionResponse,
} from "./types"

/**
 * Lista collections com paginação
 * GET /collections?page=1&limit=10
 */
export async function listCollections(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Collection>> {
  return assessmentsApi.get<PaginatedResponse<Collection>>(
    `/collections?page=${page}&limit=${limit}`
  )
}

/**
 * Busca uma collection por ID com questões completas
 * GET /collections/:id
 */
export async function getCollectionById(id: number): Promise<CollectionDetail> {
  return assessmentsApi.get<CollectionDetail>(`/collections/${id}`)
}

/**
 * Cria uma nova collection
 * POST /collections
 */
export async function createCollection(
  data: CollectionCreateInput
): Promise<Collection> {
  return assessmentsApi.post<Collection>("/collections", data)
}

/**
 * Atualiza uma collection existente
 * PATCH /collections/:id
 */
export async function updateCollection(
  id: number,
  data: CollectionUpdateInput
): Promise<Collection> {
  return assessmentsApi.patch<Collection>(`/collections/${id}`, data)
}

/**
 * Deleta uma collection
 * DELETE /collections/:id
 */
export async function deleteCollection(
  id: number
): Promise<DeleteCollectionResponse> {
  return assessmentsApi.delete<DeleteCollectionResponse>(`/collections/${id}`)
}

/**
 * Adiciona questões a uma collection existente
 * Wrapper para facilitar a adição de questões
 */
export async function addQuestionsToCollection(
  collectionId: number,
  questionIds: number[]
): Promise<Collection> {
  // Primeiro, busca a collection atual para obter os questionIds existentes
  const collection = await getCollectionById(collectionId)
  
  // Combina os IDs existentes com os novos (sem duplicatas)
  const existingIds = collection.questionIds || []
  const newIds = [...new Set([...existingIds, ...questionIds])]
  
  // Atualiza a collection com os novos IDs
  return updateCollection(collectionId, { questionIds: newIds })
}

/**
 * Remove questões de uma collection existente
 * Wrapper para facilitar a remoção de questões
 */
export async function removeQuestionsFromCollection(
  collectionId: number,
  questionIdsToRemove: number[]
): Promise<Collection> {
  // Primeiro, busca a collection atual para obter os questionIds existentes
  const collection = await getCollectionById(collectionId)
  
  // Remove os IDs especificados
  const existingIds = collection.questionIds || []
  const newIds = existingIds.filter(id => !questionIdsToRemove.includes(id))
  
  // Atualiza a collection com os novos IDs
  return updateCollection(collectionId, { questionIds: newIds })
}

