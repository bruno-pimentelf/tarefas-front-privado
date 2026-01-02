# Sistema de Timelapse - Contador Regressivo

## Visão Geral

O sistema rastreia o tempo durante avaliações com **contagem regressiva** no frontend (baseada na `duration`) e **tempo decorrido** no backend (para análise). O usuário nunca vê o tempo decorrido, apenas o tempo restante.

## Características

✅ **Backend**: Armazena tempo DECORRIDO (crescente)  
✅ **Frontend**: Exibe tempo RESTANTE (regressivo)  
✅ **Atualização Visual**: A cada 1 segundo  
✅ **Persistência Backend**: A cada 10 segundos  
✅ **Alertas Visuais**: Laranja aos 5min, vermelho pulsante no último minuto  
✅ **Finalização Automática**: Quando o tempo zera  

## Implementação

### 1. Inicialização

```typescript
// Duration vem da admission (minutos → segundos)
const duracaoEmSegundos = admission.duration * 60
setDuracaoTotal(duracaoEmSegundos)

// Marcar início local
setTempoInicioLocal(new Date())

// Restaurar tempo já decorrido do backend
const tempoJaDecorridoRecord = currentRecord.elapsedTimeInSeconds || 0
setTempoDecorridoInicialRecord(tempoJaDecorridoRecord)
```

### 2. Cálculo do Tempo

**Backend (crescente):**
```typescript
tempoDecorrido = tempoInicialRecord + tempoDesdeInicioLocal
```

**Frontend (regressivo):**
```typescript
tempoRestante = duracaoTotal - tempoDecorrido
```

**Exemplo:**
- Duration: 60 min (3600s)
- Tempo gasto: 10 min (600s)
- **Display**: `50:00` ⏱️

### 3. Atualização no Backend (a cada 10s)

```typescript
useEffect(() => {
  const atualizarTempoDecorrido = async () => {
    const tempoDesdeInicioLocal = Math.floor((Date.now() - tempoInicioLocal.getTime()) / 1000)
    const tempoDecorridoTotal = tempoDecorridoInicialRecord + tempoDesdeInicioLocal
    
    if (tempoDecorridoTotal - lastElapsedTimeUpdateRef.current >= 5) {
      await updateElapsedTime({
        recordId: record.id,
        elapsedTime: tempoDecorridoTotal, // Crescente para backend
      })
    }
  }

  intervalRef.current = setInterval(atualizarTempoDecorrido, 10000)
  return () => clearInterval(intervalRef.current)
}, [record, estado, tempoInicioLocal, tempoDecorridoInicialRecord])
```

### 4. Exibição no Frontend (a cada 1s)

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    forceUpdate({}) // Re-render para atualizar display
    
    const tempoRestanteAtual = calcularTempoRestante()
    if (tempoRestanteAtual <= 0 && record) {
      handleFinalizar() // Finalização automática
    }
  }, 1000)

  return () => clearInterval(timer)
}, [estado, record])
```

### 5. Alertas Visuais

```typescript
<Badge 
  className={`
    ${tempoRestante <= 300 && tempoRestante > 60 ? "border-orange-500 text-orange-600" : ""}
    ${tempoRestante <= 60 ? "border-red-500 text-red-600 animate-pulse" : ""}
  `}
>
  <Clock />
  {formatarTempo(tempoRestante)}
</Badge>
```

## Fluxo Completo

### Primeira Vez
1. Duration: 60min (3600s)
2. elapsedTime: 0
3. **Display**: `60:00`
4. Timer decrementa a cada segundo
5. Backend recebe updates crescentes a cada 10s

### Continuando Avaliação
1. Record tem: `elapsedTime = 600s`
2. Duration: 3600s
3. Cálculo: `3600 - 600 = 3000s`
4. **Display**: `50:00`
5. Timer continua normalmente

### Tempo Esgota
1. Display: `0:00`
2. Finalização automática
3. Backend: `elapsedTime = 3600`

## Estados do Timer

| Tempo | Cor | Comportamento |
|-------|-----|---------------|
| > 5min | Cinza | Normal |
| ≤ 5min | Laranja | Alerta |
| ≤ 1min | Vermelho + Pulse | Crítico |
| = 0 | - | Finaliza auto |

## Separação Backend/Frontend

### Backend
- Armazena: **Tempo DECORRIDO** (0 → 3600)
- Campo: `elapsedTimeInSeconds`
- Update: A cada 10s
- Propósito: Análise/auditoria

### Frontend
- Exibe: **Tempo RESTANTE** (60:00 → 0:00)
- Cálculo: `duration - elapsedTime`
- Update: A cada 1s
- Propósito: UX para aluno

## Exemplo Prático

**Prova de 60 minutos:**

| Momento | Backend | Frontend | Visual |
|---------|---------|----------|--------|
| Início | `elapsedTime: 0` | `60:00` | Normal |
| +10min | `elapsedTime: 600` | `50:00` | Normal |
| +55min | `elapsedTime: 3300` | `5:00` | 🟠 Laranja |
| +59min | `elapsedTime: 3540` | `1:00` | 🔴 Vermelho |
| +60min | `elapsedTime: 3600` | `0:00` | Finaliza |

### 🔄 Cenário: Aluno sai e volta

**Sessão 1: Aluno responde 10 minutos e sai**
1. Aluno entra na prova
2. Timer mostra: `60:00`
3. Após 10 minutos: Timer mostra `50:00`
4. Backend salva: `elapsedTimeInSeconds = 600`
5. Aluno fecha o navegador/sai da prova

**Sessão 2: Aluno volta depois de 2 horas**
1. Aluno entra novamente na prova
2. Sistema carrega record: `elapsedTimeInSeconds = 600`
3. Cálculo: `duracaoTotal (3600) - tempoDecorrido (600) = 3000s`
4. ✅ Timer mostra: `50:00` (exatamente onde parou!)
5. Timer continua decrementando normalmente: `49:59`, `49:58`...

**Sessão 3: Aluno responde mais 20 minutos**
1. Timer está em `50:00` (continuou de onde parou)
2. Após 20 minutos nesta sessão: Timer mostra `30:00`
3. Backend recebe updates: `elapsedTime = 600 + 1200 = 1800`
4. Aluno sai novamente

**Sessão 4: Aluno volta e finaliza**
1. Timer carrega: `3600 - 1800 = 1800s` → `30:00` ✅
2. Responde mais 30 minutos
3. Timer: `0:00`
4. Finalização automática
5. Backend final: `elapsedTime = 3600`

### 📊 Visualização do Fluxo

```
Duration: 60 minutos (3600 segundos)

Sessão 1 (10 min):
├─ Início:     duration=3600, record=0     → Display: 60:00
├─ +5 min:     duration=3600, record=300   → Display: 55:00
├─ +10 min:    duration=3600, record=600   → Display: 50:00
└─ Sai (record salva: 600)

[TEMPO OFFLINE: 2 horas - record não muda!]

Sessão 2 (20 min):
├─ Volta:      duration=3600, record=600   → Display: 50:00 ✅
├─ +10 min:    duration=3600, record=1200  → Display: 40:00
├─ +20 min:    duration=3600, record=1800  → Display: 30:00
└─ Sai (record salva: 1800)

[TEMPO OFFLINE: 1 dia - record não muda!]

Sessão 3 (30 min):
├─ Volta:      duration=3600, record=1800  → Display: 30:00 ✅
├─ +15 min:    duration=3600, record=2700  → Display: 15:00
├─ +25 min:    duration=3600, record=3300  → Display: 5:00 🟠
├─ +30 min:    duration=3600, record=3600  → Display: 0:00
└─ Finaliza automaticamente
```

### 🔑 Pontos-Chave

1. **`elapsedTimeInSeconds` no backend é acumulativo**
   - Sessão 1: 0 → 600
   - Sessão 2: 600 → 1800
   - Sessão 3: 1800 → 3600

2. **Display sempre calcula: `duration - elapsedTime`**
   - Sessão 1: 3600 - 600 = 3000s = 50:00
   - Sessão 2: 3600 - 1800 = 1800s = 30:00
   - Sessão 3: 3600 - 3600 = 0s = 0:00

3. **Tempo offline NÃO conta**
   - Record só atualiza quando aluno está respondendo
   - Pode ficar 1 dia offline: tempo restante continua o mesmo ✅

## Tipos TypeScript

```typescript
// Admission
interface Admission {
  duration: number // em MINUTOS
}

// Record
interface Record {
  elapsedTimeInSeconds: number | null // DECORRIDO em segundos
}

// Input
interface UpdateElapsedTimeInput {
  recordId: number
  elapsedTime: number // DECORRIDO crescente
}
```

## Observações

- ❌ Backend NUNCA recebe tempo restante
- ❌ Frontend NUNCA mostra tempo decorrido
- ✅ Duration é a referência máxima
- ✅ Funciona após reload da página
- ✅ Finalização automática no timeout
