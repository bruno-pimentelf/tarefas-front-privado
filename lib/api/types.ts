// ==========================================
// Types para Collections API (Assessments)
// ==========================================

export interface Collection {
  id: number
  title: string | null
  description: string
  used: boolean
  createdAt: string
  updatedAt: string
}

export interface CollectionDetail extends Collection {
  questionIds: number[]
  questions: Question[]
}

export interface CollectionCreateInput {
  title?: string
  description: string
  used?: boolean
  questionIds?: number[]
}

export interface CollectionUpdateInput {
  title?: string
  description?: string
  used?: boolean
  questionIds?: number[]
}

// ==========================================
// Types para Questions API (Items)
// ==========================================

export interface Alternative {
  id: number
  questionId: number
  content: string
  isCorrect: boolean
  answersCount: number
  order: number
  contentFeedback: string | null
  image: string | null
  createdAt: string
  updatedAt: string
}

export interface BaseText {
  content: string
  order: number
  image: string | null
}

export interface MatrixItem {
  id: string
  legacyId: string
  title: string
  label: string
  value: string
  acronym: string
  nodes: string[]
  depth: number
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: number
  status: 'completed' | 'in_progress' | 'not_started'
  name: string
  language: string
  content: string
  origin: string | null
  params: {
    a?: number
    b?: number
    c?: number
  } | null
  feedback: string | null
  baseTexts: BaseText[] | null
  deleted: boolean
  createdAt: string
  updatedAt: string
  alternativesRelation: Alternative[]
  matrixPopulated: MatrixItem[]
  totalAnswersCount: number
}

// Tipo simplificado para questão retornada no detalhe da collection
export interface QuestionSimple {
  id: number
  name: string
  content: string
  status: string
  type: 'objective' | 'subjective'
  language: string
  alternatives?: {
    id: number
    content: string
    isCorrect: boolean
  }[]
}

// ==========================================
// Types para Paginação
// ==========================================

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

// ==========================================
// Types para Filtros de Questions
// ==========================================

export type ComparisonOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
export type SortField = 'id' | 'name' | 'language' | 'origin' | 'status' | 'created_at' | 'updated_at' | 'answers_count'
export type SortOrder = 'asc' | 'desc'

export interface QuestionsSearchFilters {
  page?: number
  limit?: number
  language?: string
  origin?: string
  status?: 'completed' | 'in_progress' | 'not_started'
  content?: string
  matrixValue?: string
  aOperator?: ComparisonOperator
  aValue?: string
  bOperator?: ComparisonOperator
  bValue?: string
  answersCountOperator?: ComparisonOperator
  answersCountValue?: string
  sort?: SortField
  order?: SortOrder
}

// ==========================================
// Types para Respostas de API
// ==========================================

export interface DeleteCollectionResponse {
  message: string
}

