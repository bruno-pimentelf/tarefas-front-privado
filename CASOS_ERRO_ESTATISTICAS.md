# Casos em que a Tela de Erro de Estatísticas é Renderizada

A tela de erro **"Não foi possível carregar as estatísticas desta tarefa"** é renderizada quando `estatisticas.record` é `null` após a busca, e `estatisticas.loading` é `false`.

## Código de Renderização

```typescript
// Em aluno-dashboard.tsx, linha ~485-490
) : (
  <div className="py-8 text-center">
    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
    <p className="text-sm text-muted-foreground">
      Não foi possível carregar as estatísticas desta tarefa.
    </p>
  </div>
)
```

## Casos que Levam ao Erro

### 1. **Booking não encontrado** (linha 131-133)
```typescript
const booking = bookings.find((b) => b.id.toString() === tarefa.id)
if (!booking) {
  setEstatisticas({ tarefa, record: null, loading: false })
  return
}
```
**Quando acontece:**
- O `id` da tarefa não corresponde a nenhum `booking.id` no array `bookings`
- Pode ocorrer se houver inconsistência entre os dados ou se o booking foi removido

---

### 2. **Nenhuma admission com record finalizado** (linha 140-145)
```typescript
const admissionComRecord = admissions.find(a => a.record?.finishedAt != null)

if (admissionComRecord?.record) {
  setEstatisticas({ tarefa, record: admissionComRecord.record, loading: false })
} else {
  setEstatisticas({ tarefa, record: null, loading: false })
}
```
**Quando acontece:**
- Não existe nenhuma admission com `record.finishedAt != null`
- Todas as admissions retornadas têm `record.finishedAt === null` ou `record === null`
- O booking pode ter `status === "finished"`, mas o record não foi finalizado corretamente

**Possíveis causas:**
- A tarefa foi marcada como concluída no booking, mas o record nunca teve `finishedAt` preenchido
- O aluno iniciou a tarefa mas nunca finalizou (não chamou `finishRecord`)
- Erro no backend ao salvar `finishedAt` quando a tarefa foi concluída

---

### 3. **Erro na chamada da API** (linha 147-149)
```typescript
} catch (error) {
  console.error("Erro ao buscar estatísticas:", error)
  setEstatisticas({ tarefa, record: null, loading: false })
}
```
**Quando acontece:**
- Erro de rede ao chamar `getAdmissionsByBookingAndUser(booking.id, studentId)`
- Erro 404, 500, ou qualquer exceção lançada pela API
- Timeout na requisição
- Problemas de autenticação/autorização

---

### 4. **Admission sem record** (linha 140)
```typescript
const admissionComRecord = admissions.find(a => a.record?.finishedAt != null)
```
**Quando acontece:**
- Existem admissions, mas nenhuma tem `record` associado (`admission.record === null` ou `admission.record === undefined`)
- O aluno pode ter iniciado a tarefa, mas o record nunca foi criado

---

### 5. **Record sem finishedAt** (linha 140)
```typescript
const admissionComRecord = admissions.find(a => a.record?.finishedAt != null)
```
**Quando acontece:**
- Existe um `record`, mas `record.finishedAt === null`
- A tarefa está em progresso ou foi abandonada sem finalização
- O record foi criado mas nunca foi finalizado via `finishRecord()`

---

## Resumo Visual

```
handleVerEstatisticas(tarefa)
    │
    ├─> Buscar booking por tarefa.id
    │   └─> ❌ Não encontrado → ERRO (Caso 1)
    │
    ├─> getAdmissionsByBookingAndUser()
    │   └─> ❌ Erro na API → ERRO (Caso 3)
    │
    ├─> Procurar admission com record.finishedAt != null
    │   │
    │   ├─> ❌ Nenhuma admission → ERRO (Caso 2)
    │   ├─> ❌ Admission sem record → ERRO (Caso 4)
    │   └─> ❌ Record sem finishedAt → ERRO (Caso 5)
    │
    └─> ✅ Record encontrado → Mostra estatísticas
```

## Possível Melhoria

Atualmente, o código só busca por `record.finishedAt != null`. Se o booking tem `status === "finished"`, mas não há record com `finishedAt`, a tela de erro aparece.

**Sugestão:** Considerar também usar o primeiro record disponível se o booking está marcado como `finished`, mesmo sem `finishedAt`:

```typescript
// Alternativa: se booking.status === "finished", usar qualquer record disponível
if (booking.status === "finished") {
  const admissionComRecord = admissions.find(a => a.record != null)
  if (admissionComRecord?.record) {
    setEstatisticas({ tarefa, record: admissionComRecord.record, loading: false })
    return
  }
}
```
