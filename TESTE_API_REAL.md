# 🧪 Teste com Dados Reais da API

## 📊 Dados da API Fornecidos

### **Tarefa 1 - "Avaliação Bimestral - 1º Bimestre"**
```json
{
  "id": 1,
  "title": "Avaliação Bimestral - 1º Bimestre",
  "status": "finished",
  "startTime": "2025-12-25T05:00:00",
  "endTime": "2026-02-28T15:00:00",
  "totalQuestions": 16
}
```

**Análise:**
- ✅ `status: "finished"` 
- ✅ `endTime: "2026-02-28T15:00:00"` (futuro)
- **Resultado esperado**: `status: "finalizada"`, `atrasada: false` → **Aba Concluídas**

### **Tarefa 19 - "Toma jack"**
```json
{
  "id": 19,
  "title": "Toma jack",
  "status": "???", // Não fornecido completo
  "endTime": "???", // Não fornecido completo
}
```

## 🔧 Nova Lógica Implementada

```typescript
// REGRA PRINCIPAL: Se não é "finished" E o prazo expirou = ATRASADA
if (booking.status !== "finished" && prazoExpirou) {
  status = "finalizada"
  atrasada = true  // 🔴 VAI PARA ABA ATRASADAS
}
```

## 📋 Cenários de Teste

Para testar a nova lógica, precisamos de tarefas com:

### **Cenário 1: Tarefa Atrasada**
```json
{
  "status": "not_started",  // ❌ Não é "finished"
  "endTime": "2025-01-01T10:00:00"  // ❌ Prazo no passado
}
```
**Resultado**: `atrasada: true` → **Aba Atrasadas** ✅

### **Cenário 2: Tarefa Concluída**
```json
{
  "status": "finished",  // ✅ É "finished"
  "endTime": "2025-01-01T10:00:00"  // Qualquer data
}
```
**Resultado**: `atrasada: false` → **Aba Concluídas** ✅

### **Cenário 3: Tarefa Ativa**
```json
{
  "status": "in_progress",  // ❌ Não é "finished"
  "endTime": "2025-12-31T23:59:59"  // ✅ Prazo no futuro
}
```
**Resultado**: `atrasada: false` → **Aba Ativas** ✅

## 🔍 Como Verificar

### **1. Console do Navegador**
Procurar por logs como:
```
📋 Tarefa: Nome da Tarefa {
  bookingId: 19,
  bookingStatus: "not_started",
  endTime: "2025-01-01T10:00:00",
  prazoExpirou: true,
  isNotFinished: true,
  shouldBeAtrasada: true,  // ✅ Esta é a chave!
  statusFinal: "finalizada",
  atrasada: true
}
```

### **2. Verificar Classificação Final**
```
📊 Classificação de tarefas: {
  atrasadas: 1,
  tarefasAtrasadas: [
    { titulo: "Toma jack", atrasada: true, status: "finalizada" }
  ]
}
```

## 🎯 Teste Manual

Para forçar um teste, você pode:

1. **Modificar temporariamente uma tarefa:**
   - Alterar `status` de `"finished"` para `"not_started"`
   - Alterar `endTime` para uma data no passado

2. **Verificar no console:**
   - `shouldBeAtrasada: true`
   - `atrasada: true`

3. **Verificar na interface:**
   - Tarefa aparece na aba "Atrasadas"
   - Badge vermelho "Atrasada"
   - Contador da aba atualizado

## 🚨 Possíveis Problemas

### **Se ainda não aparecer tarefas atrasadas:**

1. **Verificar dados completos da API:**
   ```bash
   curl "https://api.trieduconline.com.br/assessments/bookings/student/student-001?page=1&limit=100"
   ```

2. **Verificar se há tarefas com:**
   - `status !== "finished"`
   - `endTime` no passado

3. **Verificar timezone:**
   - API retorna `"timezone": "America/Sao_Paulo"`
   - Verificar se conversão está correta

---

**Próximo passo**: Testar com dados reais e verificar logs no console.