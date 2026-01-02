# 🔍 Verificação do ElapsedTime - Checklist Completo

## ✅ Frontend Garantido

O frontend está implementado corretamente e **NÃO está resetando o elapsedTime**. Aqui está a garantia:

### 1. Nunca Cria Record Duplicado
```typescript
// Verifica admission atualizada
if (!admissionAtualizada.record) {
  // Verifica admission original como fallback
  if (admission.record) {
    currentRecord = admission.record  // Usa existente
  } else {
    currentRecord = await createRecord(...)  // Cria APENAS se não existir
  }
}
```

### 2. Sempre Usa Valor Salvo
```typescript
const tempoJaDecorridoRecord = currentRecord.elapsedTimeInSeconds || 0
setTempoDecorridoInicialRecord(tempoJaDecorridoRecord)
lastElapsedTimeUpdateRef.current = tempoJaDecorridoRecord  // ✅
```

### 3. Sempre Incrementa
```typescript
const tempoTotal = tempoDecorridoInicialRecord + tempoNestaSessao
// Exemplo: 600 + 10 = 610 (SEMPRE MAIOR!)
```

## 🔍 Como Verificar se o BACKEND Está Salvando

### Passo 1: Abrir Console do Navegador

Quando iniciar a avaliação, você deve ver:

```javascript
🕐 Timer Configurado: {
  duracaoTotal: 3600,
  tempoJaDecorrido: 0,        // Normal na primeira vez
  tempoRestanteInicial: 3600,
  recordId: 456
}
```

### Passo 2: Esperar 10-15 Segundos

Você deve ver:

```javascript
⏲️ Tentando atualizar elapsed time: {
  tempoInicialDoRecord: 0,
  tempoNestaSessao: 10,
  tempoTotalCalculado: 10,
  vaiAtualizar: true
}

📤 Enviando update para backend: {
  recordId: 456,
  elapsedTime: 10
}

✅ Backend respondeu: {
  elapsedTimeInSeconds: 10    // ✅ DEVE TER VALOR!
}
```

### Passo 3: Abrir Network Tab

Procure por requisições:

```
PATCH /records/elapsed-time

Request:
{
  "recordId": 456,
  "elapsedTime": 10
}

Response (Status 200):
{
  "id": 456,
  "elapsedTimeInSeconds": 10,  // ✅ DEVE ESTAR AQUI!
  "userId": "abc123",
  "admissionId": 789,
  ...
}
```

### Passo 4: Sair e Voltar

Ao voltar, você DEVE ver:

```javascript
📦 Admission atualizada carregada: {
  admissionId: 789,
  hasRecord: true,
  recordId: 456,
  elapsedTimeInSeconds: 10,    // ✅ DEVE TER O VALOR SALVO!
  finishedAt: null
}

🕐 Timer Configurado: {
  tempoJaDecorrido: 10,        // ✅ CONTINUOU!
  tempoRestanteInicial: 3590
}
```

## 🚨 Alertas no Console

### Se o Backend NÃO Estiver Salvando

Você verá este alerta após 1 minuto:

```javascript
🚨 ALERTA: Record existe há mais de 1 minuto mas elapsedTime é 0! {
  recordId: 456,
  recordAge: 65s,
  createdAt: "2025-01-01T10:00:00Z",
  elapsedTimeInSeconds: 0      // ❌ PROBLEMA!
}
🚨 Possível causa: Backend não está salvando o elapsedTime!
```

**Isso significa que o BACKEND não está salvando!**

## 🔧 Verificação do Backend

### 1. Endpoint Existe?
```bash
# Testar manualmente
curl -X PATCH http://sua-api/records/elapsed-time \
  -H "Content-Type: application/json" \
  -d '{"recordId": 456, "elapsedTime": 600}'
```

**Resposta esperada:**
```json
{
  "id": 456,
  "elapsedTimeInSeconds": 600,
  ...
}
```

### 2. Banco de Dados

Verificar se a coluna existe:

```sql
-- Verificar estrutura da tabela
DESCRIBE records;

-- Deve ter:
-- elapsed_time_in_seconds INT (ou similar)

-- Verificar dados
SELECT id, user_id, admission_id, elapsed_time_in_seconds 
FROM records 
WHERE id = 456;
```

**Resultado esperado:**
```
id  | user_id | admission_id | elapsed_time_in_seconds
456 | abc123  | 789          | 600
```

### 3. Controller/Model do Backend

Verificar se está salvando:

```typescript
// Controller (exemplo)
async updateElapsedTime(recordId: number, elapsedTime: number) {
  // ❌ NÃO FAZER:
  // record.elapsedTime = elapsedTime  // Campo errado!
  
  // ✅ FAZER:
  record.elapsedTimeInSeconds = elapsedTime
  await record.save()
  
  return record  // Deve incluir elapsedTimeInSeconds na resposta
}
```

### 4. Serializer/Response

Verificar se está retornando:

```typescript
// ❌ NÃO OMITIR:
{
  id: record.id,
  userId: record.userId,
  // elapsedTimeInSeconds: omitido ❌
}

// ✅ INCLUIR:
{
  id: record.id,
  userId: record.userId,
  elapsedTimeInSeconds: record.elapsedTimeInSeconds,  // ✅
}
```

## ✅ Checklist Final

### Frontend (100% OK)
- [x] Nunca cria record duplicado
- [x] Sempre usa valor salvo
- [x] Sempre incrementa
- [x] Logs completos
- [x] Alerta se backend não salvar

### Backend (VERIFICAR)
- [ ] Endpoint `/records/elapsed-time` existe
- [ ] Recebe `recordId` e `elapsedTime`
- [ ] Salva em `elapsed_time_in_seconds` (ou similar)
- [ ] Retorna `elapsedTimeInSeconds` na resposta
- [ ] GET `/admissions/...` inclui `record.elapsedTimeInSeconds`
- [ ] Banco de dados tem a coluna
- [ ] Dados são persistidos corretamente

## 🎯 Teste Definitivo

1. Inicie avaliação (primeira vez)
2. Espere 30 segundos
3. Verifique no banco: `elapsed_time_in_seconds` deve ser ~30
4. Saia da avaliação
5. Volte na avaliação
6. Console deve mostrar: `tempoJaDecorrido: 30` ✅
7. Espere mais 30 segundos
8. Banco deve ter: `elapsed_time_in_seconds` = ~60 ✅

**Se o passo 6 falhar, o problema está no backend!**

## 📞 Quando Reportar Problema

Se você ver:
```javascript
📦 Admission atualizada carregada: {
  elapsedTimeInSeconds: 0  // ❌ Deveria ser > 0
}
```

**Isso significa:**
1. Backend recebeu o update
2. Mas não salvou no banco
3. OU salvou mas não retorna na GET

**Verifique:**
- Logs do backend
- Banco de dados diretamente
- Response do endpoint no Network tab
