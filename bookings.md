# API de Bookings - Documentação para Integração Frontend

## Base URLs

- **Assessments API**: `{ASSESSMENTS_API_URL}`
- **Users API**: `{USERS_API_URL}`

---

## Bookings (Assessments API)

### 1. Listar Classes do Professor

Retorna as classes que o professor logado ministra.

```
GET /bookings/teacher-classes
```

**Headers:**
| Header | Valor |
|--------|-------|
| Authorization | Bearer {token} |

**Response 200:**
```json
[
  {
    "id": 1,
    "schoolId": 1,
    "name": "9º Ano A",
    "grade": "9",
    "school": {
      "id": 1,
      "name": "Escola ABC"
    }
  }
]
```

---

### 2. Listar Bookings do Aluno (Paginado)

Retorna os bookings disponíveis para o aluno logado, com horários convertidos para a timezone da escola.

```
GET /bookings/student?page=1&limit=10
```

**Headers:**
| Header | Valor |
|--------|-------|
| Authorization | Bearer {token} |

**Query Params:**
| Param | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| page | number | Não | 1 | Página atual |
| limit | number | Não | 10 | Itens por página (máx: 100) |

**Response 200:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Prova de Matemática - 1º Bimestre",
      "description": "Avaliação bimestral de matemática",
      "bannerImage": "https://exemplo.com/banner.jpg",
      "available": true,
      "startTime": "2025-01-15T08:00:00",
      "endTime": "2025-01-15T12:00:00",
      "timezone": "America/Sao_Paulo",
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-10T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

> **Nota:** Os campos `startTime` e `endTime` já vêm convertidos para a timezone da escola do aluno. O campo `timezone` indica qual timezone foi usada.

---

### 3. Criar Booking

Cria um novo booking associado a uma ou mais classes.

```
POST /bookings
```

**Headers:**
| Header | Valor |
|--------|-------|
| Authorization | Bearer {token} |
| Content-Type | application/json |

**Body:**
```json
{
  "title": "Prova de Matemática - 1º Bimestre",
  "description": "Avaliação bimestral de matemática para turmas do 9º ano",
  "bannerImage": "https://exemplo.com/banner.jpg",
  "available": true,
  "startTime": "2025-01-15T08:00:00.000Z",
  "endTime": "2025-01-15T12:00:00.000Z",
  "classIds": [1, 2, 3]
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| title | string | Sim | Título do booking |
| description | string | Não | Descrição detalhada |
| bannerImage | string | Não | URL da imagem de banner |
| available | boolean | Não | Se está disponível (default: true) |
| startTime | string (ISO 8601) | Sim | Data/hora de início (UTC) |
| endTime | string (ISO 8601) | Sim | Data/hora de término (UTC) |
| classIds | number[] | Sim | IDs das classes (mínimo 1) |

**Response 201:**
```json
{
  "id": 1,
  "title": "Prova de Matemática - 1º Bimestre",
  "description": "Avaliação bimestral de matemática para turmas do 9º ano",
  "bannerImage": "https://exemplo.com/banner.jpg",
  "available": true,
  "startTime": "2025-01-15T08:00:00.000Z",
  "endTime": "2025-01-15T12:00:00.000Z",
  "createdAt": "2025-01-10T10:00:00.000Z",
  "updatedAt": "2025-01-10T10:00:00.000Z"
}
```

---

## Users API (Endpoints auxiliares)

### 4. Buscar Classes por Professor

```
GET /classes/by-teacher/:userId
```

**Response 200:**
```json
[
  {
    "id": 1,
    "schoolId": 1,
    "name": "9º Ano A",
    "grade": "9",
    "school": {
      "id": 1,
      "name": "Escola ABC"
    }
  }
]
```

---

### 5. Buscar IDs de Classes por Aluno

```
GET /classes/by-student/:userId
```

**Response 200:**
```json
[1, 2, 3]
```

---

### 6. Buscar Timezone do Usuário

```
GET /users/:userId/timezone
```

**Response 200:**
```json
"America/Sao_Paulo"
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Parâmetros inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## Observações

1. **Autenticação**: Todas as rotas requerem JWT token no header `Authorization: Bearer {token}`

2. **Timezone**: Os horários são armazenados em UTC no banco. Na listagem de bookings para alunos, os horários são convertidos automaticamente para a timezone da escola do aluno.

3. **Paginação**: Use `page` e `limit` para paginar resultados. O response inclui `meta` com informações de paginação.

4. **Datas**: Envie datas no formato ISO 8601 (ex: `2025-01-15T08:00:00.000Z`)