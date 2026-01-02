# Debug do Timer - Logs de Console

## O que os logs mostram

Quando você abrir a avaliação, verá no console:

### 1. Carregamento do Record

```javascript
📋 Admission Record: {
  admissionId: 123,
  hasRecord: true,            // Se já existe record
  recordId: 456,
  elapsedTimeInSeconds: 600,  // Tempo já gasto (10 minutos)
  finishedAt: null            // null = ainda não terminou
}
```

**Se for a primeira vez:**
- `hasRecord: false`
- Cria novo record
- `elapsedTimeInSeconds: 0`

**Se estiver voltando:**
- `hasRecord: true`
- `elapsedTimeInSeconds: 600` (exemplo: 10 minutos já gastos)

### 2. Configuração Inicial do Timer

```javascript
🕐 Timer Debug: {
  duracaoTotal: 3600,          // Duration da admission (60 min)
  tempoJaDecorrido: 600,       // Tempo já gasto (vem do record)
  tempoRestanteInicial: 3000,  // 3600 - 600 = 50 minutos
  recordId: 456
}
```

### 3. Cálculo do Tempo Restante (a cada 5 segundos)

**Início da sessão:**
```javascript
⏱️ Tempo restante: {
  duracaoTotal: 3600,
  tempoDecorridoInicial: 600,  // Do record
  tempoNestaSessao: 0,         // Acabou de entrar
  tempoDecorridoTotal: 600,    // 600 + 0
  tempoRestante: 3000          // 3600 - 600 = 50 minutos
}
```

**Após 5 segundos:**
```javascript
⏱️ Tempo restante: {
  duracaoTotal: 3600,
  tempoDecorridoInicial: 600,
  tempoNestaSessao: 5,         // 5 segundos nesta sessão
  tempoDecorridoTotal: 605,    // 600 + 5
  tempoRestante: 2995          // 3600 - 605
}
```

**Após 10 minutos nesta sessão:**
```javascript
⏱️ Tempo restante: {
  duracaoTotal: 3600,
  tempoDecorridoInicial: 600,
  tempoNestaSessao: 600,       // 10 minutos desta sessão
  tempoDecorridoTotal: 1200,   // 600 + 600 = 20 min total
  tempoRestante: 2400          // 3600 - 1200 = 40 min
}
```

## Diagnóstico do Problema

### Se o timer resetar, você verá:

```javascript
// Segunda vez que abre
📋 Admission Record: {
  hasRecord: true,
  elapsedTimeInSeconds: 0      // ❌ PROBLEMA! Deveria ser 600
}

🕐 Timer Debug: {
  tempoJaDecorrido: 0,          // ❌ PROBLEMA!
  tempoRestanteInicial: 3600,   // Volta para 60 min
}
```

**Causa do problema:**
1. O `elapsedTimeInSeconds` não está sendo salvo no backend corretamente
2. OU o backend não está retornando o valor atualizado
3. OU a admission não está sendo recarregada com o record atualizado

### Se funcionar corretamente:

```javascript
// Segunda vez que abre (após usar 10 min)
📋 Admission Record: {
  hasRecord: true,
  elapsedTimeInSeconds: 600    // ✅ CORRETO! Tem o tempo anterior
}

🕐 Timer Debug: {
  tempoJaDecorrido: 600,        // ✅ CORRETO!
  tempoRestanteInicial: 3000,   // ✅ 50 minutos (continuou)
}
```

## Como Testar

1. **Primeira Sessão:**
   - Abra a avaliação
   - Verifique no console: `tempoJaDecorrido: 0`
   - Espere 30 segundos
   - Feche/saia da avaliação

2. **Segunda Sessão:**
   - Abra a avaliação novamente
   - **Verifique no console:**
     - `elapsedTimeInSeconds` deveria ser ~30 (ou mais)
     - `tempoRestanteInicial` deveria ser menor que a duration

3. **Se resetar:**
   - `elapsedTimeInSeconds: 0` ou `null`
   - Significa que o backend não está salvando/retornando

## Checklist de Verificação

- [ ] `admission.record` existe quando reabre?
- [ ] `admission.record.elapsedTimeInSeconds` tem valor > 0?
- [ ] `tempoDecorridoInicialRecord` é setado com o valor correto?
- [ ] `tempoRestante` = `duration - elapsedTime`?

## Possíveis Causas

### 1. Backend não salva
- API `/records/elapsed-time` não está funcionando
- Verificar no Network do browser se a chamada é feita
- Verificar se retorna status 200

### 2. Admission não recarrega
- O `admission.record` que vem para o componente está desatualizado
- Precisa recarregar a admission antes de abrir o `RealizarAvaliacao`
- Verificar em `BookingDetalhes` se chama `getAdmissionsByBookingAndUser`

### 3. Record não tem campo
- O tipo `Record` no backend não tem `elapsedTimeInSeconds`
- Verificar resposta da API no Network tab

## Solução Proposta

Se o problema for que a admission não recarrega:

```typescript
// Em BookingDetalhes ou AlunoDashboard
const handleIniciarAvaliacao = async (admission: Admission) => {
  // Recarregar a admission antes de abrir
  const admissionsAtualizadas = await getAdmissionsByBookingAndUser(
    booking.id, 
    userId
  )
  
  const admissionAtualizada = admissionsAtualizadas.find(
    a => a.id === admission.id
  )
  
  setAdmissionEmAndamento(admissionAtualizada || admission)
}
```
