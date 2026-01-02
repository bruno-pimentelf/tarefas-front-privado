# 🧪 Teste: Lógica de Tarefas Atrasadas

## 📋 Cenários de Teste

Para verificar se a lógica está funcionando corretamente, teste os seguintes cenários:

### **Cenário 1: Tarefa "not_started" com prazo expirado**
```json
{
  "title": "Tarefa Não Iniciada Atrasada",
  "status": "not_started",
  "endTime": "2025-01-01T10:00:00Z", // Prazo no passado
  "startTime": "2024-12-31T08:00:00Z"
}
```
**Resultado esperado**: `status: "finalizada"`, `atrasada: true` → **Aba Atrasadas** ✅

### **Cenário 2: Tarefa "in_progress" com prazo expirado**
```json
{
  "title": "Tarefa Em Progresso Atrasada", 
  "status": "in_progress",
  "endTime": "2025-01-01T10:00:00Z", // Prazo no passado
  "startTime": "2024-12-31T08:00:00Z"
}
```
**Resultado esperado**: `status: "finalizada"`, `atrasada: true` → **Aba Atrasadas** ✅

### **Cenário 3: Tarefa "finished"**
```json
{
  "title": "Tarefa Concluída",
  "status": "finished", 
  "endTime": "2025-01-01T10:00:00Z",
  "startTime": "2024-12-31T08:00:00Z"
}
```
**Resultado esperado**: `status: "finalizada"`, `atrasada: false` → **Aba Concluídas** ✅

### **Cenário 4: Tarefa "not_started" ainda no prazo**
```json
{
  "title": "Tarefa Agendada",
  "status": "not_started",
  "endTime": "2025-12-31T23:59:59Z", // Prazo no futuro
  "startTime": "2025-01-15T08:00:00Z"
}
```
**Resultado esperado**: `status: "agendada"` → **Aba Agendadas** ✅

## 🔍 Como Testar

### **1. Abrir Console do Navegador**
- F12 → Console
- Recarregar a página do dashboard do aluno

### **2. Verificar Logs de Debug**
Procurar por logs como:
```
📋 Tarefa: Nome da Tarefa {
  bookingStatus: "not_started",
  endTime: "2025-01-01T10:00:00Z",
  prazoExpirou: true,
  statusFinal: "finalizada", 
  atrasada: true
}

📊 Classificação de tarefas: {
  atrasadas: 2,
  tarefasAtrasadas: [
    { titulo: "Tarefa X", atrasada: true, status: "finalizada" }
  ]
}
```

### **3. Verificar Interface**
- Aba "Atrasadas" deve mostrar contador: `Atrasadas (X)`
- Cards devem ter badge vermelho "Atrasada"
- Cards devem ter borda vermelha sutil

## 🐛 Possíveis Problemas

### **Problema 1: Nenhuma tarefa na aba Atrasadas**
**Causa**: Todas as tarefas têm `status: "finished"` ou prazo não expirado
**Solução**: Verificar dados reais da API

### **Problema 2: Tarefas na aba errada**
**Causa**: Lógica de classificação incorreta
**Solução**: Verificar logs de debug no console

### **Problema 3: Erro de timezone**
**Causa**: Diferença entre timezone do servidor e cliente
**Solução**: Verificar se `endTime` está em UTC

## 🔧 Debug Avançado

### **Verificar dados da API diretamente:**
```javascript
// No console do navegador
fetch('/api/bookings/student/student-001')
  .then(r => r.json())
  .then(data => {
    console.log('📡 Dados da API:', data.items.map(booking => ({
      title: booking.title,
      status: booking.status,
      endTime: booking.endTime,
      expired: new Date(booking.endTime) < new Date()
    })))
  })
```

### **Testar função bookingToTarefa:**
```javascript
// No console do navegador
const testBooking = {
  id: 999,
  title: "Teste Atrasada",
  status: "not_started", 
  endTime: "2025-01-01T10:00:00Z", // Passado
  startTime: "2024-12-31T08:00:00Z",
  totalQuestions: 5
}

// Verificar resultado
console.log('🧪 Teste:', bookingToTarefa(testBooking, false))
```

---

**Próximos passos**: Executar testes e verificar logs no console do navegador.