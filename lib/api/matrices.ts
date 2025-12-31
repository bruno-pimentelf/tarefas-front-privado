import { assessmentsApi } from "./client"
import { MatrixItem } from "./types"

/**
 * Busca matrizes de conhecimento com filtros opcionais
 * GET /matrices
 * @param term - Termo para busca
 * @param matrixId - ID da matriz pai
 */
export async function getMatrices(
  term?: string,
  matrixId?: string
): Promise<MatrixItem[]> {
  const params = new URLSearchParams()
  
  if (term) params.append("term", term)
  if (matrixId) params.append("matrixId", matrixId)
  
  const queryString = params.toString()
  const url = queryString ? `/collections/matrices?${queryString}` : "/collections/matrices"
  
  return assessmentsApi.get<MatrixItem[]>(url)
}

