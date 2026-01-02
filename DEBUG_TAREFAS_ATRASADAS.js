// 🧪 TESTE DE DEBUG - Execute no console do navegador

// Simular dados da API com tarefa atrasada
const tarefaAtrasadaTest = {
  id: 999,
  title: "TESTE - Tarefa Atrasada",
  status: "not_started", // ❌ Não é "finished"
  startTime: "2025-01-01T08:00:00",
  endTime: "2025-01-01T18:00:00", // ❌ Prazo no passado
  totalQuestions: 5,
  description: "Teste de tarefa atrasada"
}

const tarefaEmProgressoAtrasada = {
  id: 998,
  title: "TESTE - Em Progresso Atrasada", 
  status: "in_progress", // ❌ Não é "finished"
  startTime: "2025-01-01T08:00:00",
  endTime: "2025-01-01T18:00:00", // ❌ Prazo no passado
  totalQuestions: 3,
  description: "Teste de tarefa em progresso atrasada"
}

const tarefaConcluida = {
  id: 997,
  title: "TESTE - Tarefa Concluída",
  status: "finished", // ✅ É "finished"
  startTime: "2025-01-01T08:00:00", 
  endTime: "2025-01-01T18:00:00", // Qualquer data
  totalQuestions: 10,
  description: "Teste de tarefa concluída"
}

console.log("🧪 INICIANDO TESTES DE DEBUG...")

// Testar função bookingToTarefa (se disponível)
if (typeof bookingToTarefa !== 'undefined') {
  console.log("📋 Testando tarefa NOT_STARTED atrasada:")
  const resultado1 = bookingToTarefa(tarefaAtrasadaTest, false)
  console.log("Resultado:", resultado1)
  
  console.log("📋 Testando tarefa IN_PROGRESS atrasada:")
  const resultado2 = bookingToTarefa(tarefaEmProgressoAtrasada, false)
  console.log("Resultado:", resultado2)
  
  console.log("📋 Testando tarefa FINISHED:")
  const resultado3 = bookingToTarefa(tarefaConcluida, false)
  console.log("Resultado:", resultado3)
} else {
  console.log("❌ Função bookingToTarefa não encontrada no escopo global")
}

// Verificar dados reais da API
console.log("🌐 Verificando dados reais da API...")
fetch('https://api.trieduconline.com.br/assessments/bookings/student/student-001?page=1&limit=100')
  .then(r => r.json())
  .then(data => {
    console.log("📊 Dados da API:", data)
    
    if (data.items) {
      console.log("📋 Análise das tarefas:")
      data.items.forEach(booking => {
        const agora = new Date()
        const endTime = new Date(booking.endTime)
        const prazoExpirou = agora >= endTime
        const deveSerAtrasada = booking.status !== "finished" && prazoExpirou
        
        console.log(`📌 ${booking.title}:`, {
          id: booking.id,
          status: booking.status,
          endTime: booking.endTime,
          prazoExpirou,
          deveSerAtrasada,
          agora: agora.toISOString(),
          endTimeFormatted: endTime.toISOString()
        })
      })
    }
  })
  .catch(err => {
    console.error("❌ Erro ao buscar dados da API:", err)
  })

console.log("✅ Testes de debug executados. Verifique os logs acima.")