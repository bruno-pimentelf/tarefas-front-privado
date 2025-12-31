# API de Matrices - Find by Term

## Rota: `GET /matrices/find-by-term`

### Query Parameters

- **`term`** (string, opcional): Termo de busca que será pesquisado nos campos `title`, `label`, `value` e `acronym`
- **`matrixId`** (string, opcional): ID da matriz pai para buscar apenas filhos dessa matriz

### Comportamento

- Se `term` for fornecido: busca por termo nos campos mencionados
- Se `matrixId` for fornecido: busca apenas nas matrizes filhas dessa matriz
- Se ambos forem fornecidos: busca por termo apenas nas matrizes filhas
- Se nenhum for fornecido: retorna todas as matrizes raiz (depth = 0)

### Resposta

Array de objetos `Matrix` com os seguintes campos:

```json
[
  {
    "id": "string",
    "title": "string",
    "label": "string",
    "value": "string",
    "acronym": "string",
    "depth": "number"
  }
]
```

### Exemplo de Uso

```
GET /matrices/find-by-term?term=matemática
GET /matrices/find-by-term?matrixId=abc123
GET /matrices/find-by-term?term=português&matrixId=abc123
```