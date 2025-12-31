# Buscar Questões por Filtros

## Resumo

Esta rota permite buscar questões com paginação e múltiplos filtros. Suporta filtros por idioma, origem, status, conteúdo, matrizes, parâmetros TRI (a, b) e quantidade de respostas. Também permite ordenação por diferentes campos.

## Request

**Método:** `GET`  
**Endpoint:** `/questions/search-by-filters`

## Query Parameters

Todos os parâmetros são opcionais.

### Paginação

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | `1` | Número da página |
| `limit` | number | `25` | Quantidade de itens por página (máximo recomendado: 100) |

### Filtros Básicos

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `language` | string | Filtrar por idioma (ex: `pt-BR`, `en-US`) |
| `origin` | string | Filtrar por origem da questão (ex: `ENEM 2023`) |
| `status` | string | Filtrar por status: `completed`, `in_progress`, `not_started` |
| `content` | string | Busca parcial no conteúdo da questão (LIKE) |

### Filtros de Matriz

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `matrixValue` | string | IDs das matrizes separados por `§` (ex: `matrix-1§matrix-2`) |

### Filtros Numéricos (Parâmetros TRI)

Para os parâmetros `a`, `b` e `answersCount`, é necessário enviar dois query parameters:
- `{campo}Operator`: Operador de comparação
- `{campo}Value`: Valor numérico

**Operadores disponíveis:**
- `eq` - Igual a
- `ne` - Diferente de
- `gt` - Maior que
- `gte` - Maior ou igual a
- `lt` - Menor que
- `lte` - Menor ou igual a

**Exemplos:**
- Filtrar questões com parâmetro `a` maior que 1.2:
  ```
  ?aOperator=gt&aValue=1.2
  ```

- Filtrar questões com parâmetro `b` menor ou igual a 0.5:
  ```
  ?bOperator=lte&bValue=0.5
  ```

- Filtrar questões com `totalAnswersCount` maior ou igual a 10:
  ```
  ?answersCountOperator=gte&answersCountValue=10
  ```

### Ordenação

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `sort` | string | - | Campo para ordenação. Valores: `id`, `name`, `language`, `origin`, `status`, `created_at`, `updated_at`, `answers_count` |
| `order` | string | `asc` | Ordem: `asc` ou `desc` |

## Response

### Estrutura

```typescript
{
  items: QuestionWithFiltersResponseDto[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### QuestionWithFiltersResponseDto

```typescript
{
  id: number,
  status: "completed" | "in_progress" | "not_started",
  name: string,
  language: string,
  content: string,
  origin: string,
  params: {
    a: number,
    b: number,
    c: number
  } | null,
  feedback: string,
  baseTexts: Array<{
    content: string,
    order: number,
    image?: string
  }>,
  deleted: boolean,
  createdAt: string, // ISO 8601
  updatedAt: string, // ISO 8601
  alternativesRelation: Alternative[],
  matrixPopulated: Matrix[],
  totalAnswersCount?: number
}
```

## Exemplos de Uso

### Exemplo 1: Buscar questões em português, página 1

```http
GET /questions/search-by-filters?language=pt-BR&page=1&limit=10
```

### Exemplo 2: Buscar questões com filtros múltiplos

```http
GET /questions/search-by-filters?language=pt-BR&status=completed&content=matemática&page=1&limit=25
```

### Exemplo 3: Buscar questões por matrizes

```http
GET /questions/search-by-filters?matrixValue=matrix-123§matrix-456&page=1&limit=25
```

### Exemplo 4: Buscar questões com filtro numérico e ordenação

```http
GET /questions/search-by-filters?aOperator=gte&aValue=1.0&sort=created_at&order=desc&page=1&limit=25
```

### Exemplo 5: Buscar questões com múltiplos filtros numéricos

```http
GET /questions/search-by-filters?aOperator=gt&aValue=1.2&bOperator=lte&bValue=0.5&answersCountOperator=gte&answersCountValue=10&page=1&limit=25
```

## Notas Importantes

1. **Separador de matrizes**: Use `§` (símbolo de parágrafo) para separar múltiplos IDs de matrizes no parâmetro `matrixValue`.

2. **Filtros numéricos**: Sempre envie o par `{campo}Operator` e `{campo}Value` juntos. Se um estiver faltando, o filtro será ignorado.

3. **Busca de conteúdo**: O parâmetro `content` faz uma busca parcial (LIKE) no conteúdo da questão.

4. **Ordenação padrão**: Se não especificar `sort`, a ordenação padrão é por `createdAt` em ordem decrescente.

5. **Paginação**: A resposta sempre inclui metadados de paginação (`meta`) com informações sobre total de itens, página atual e total de páginas.