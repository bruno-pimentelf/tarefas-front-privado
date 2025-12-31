# Estrutura de Rotas da Aplicação

## 📂 Organização de Rotas

A aplicação foi reorganizada para usar o sistema de rotas do Next.js App Router de forma profissional, com separação clara de responsabilidades.

### Rotas Disponíveis

#### `/` - Página Inicial (Redirecionamento)
- **Arquivo**: `app/page.tsx`
- **Descrição**: Ponto de entrada da aplicação
- **Comportamento**: 
  - Se usuário **autenticado** → redireciona para `/perfil`
  - Se usuário **não autenticado** → redireciona para `/auth`

#### `/auth` - Autenticação
- **Arquivo**: `app/auth/page.tsx`
- **Descrição**: Página de login e cadastro
- **Componente**: `AuthScreen`
- **Proteção**: Rota pública
- **Redirecionamento**: Após login → `/perfil`

#### `/perfil` - Seleção de Perfil
- **Arquivo**: `app/perfil/page.tsx`
- **Descrição**: Escolha entre Aluno ou Professor
- **Componente**: `ProfileSelector`
- **Proteção**: Requer autenticação
- **Redirecionamento**:
  - Aluno → `/aluno`
  - Professor → `/professor`
  - Não autenticado → `/auth`

#### `/aluno` - Dashboard do Aluno
- **Arquivo**: `app/aluno/page.tsx`
- **Descrição**: Área completa do aluno
- **Componente**: `AlunoDashboard`
- **Funcionalidades**:
  - Visualizar tarefas (ativas, agendadas, concluídas)
  - Iniciar tarefas
  - Ver gamificação
  - Ver diagnóstico
- **Proteção**: Requer autenticação
- **Header**: Inclui navegação e ações específicas do aluno

#### `/professor` - Dashboard do Professor
- **Arquivo**: `app/professor/page.tsx`
- **Descrição**: Área completa do professor
- **Componente**: `ProfessorDashboard`
- **Funcionalidades**:
  - Criar tarefas
  - Ver relatórios
  - Navegar para banco de itens
  - Estatísticas
- **Proteção**: Requer autenticação
- **Header**: Inclui navegação e ações específicas do professor

#### `/professor/banco-itens` - Banco de Itens
- **Arquivo**: `app/professor/banco-itens/page.tsx`
- **Descrição**: Página dedicada ao banco de questões
- **Componente**: `BancoItens`
- **Funcionalidades**:
  - Buscar questões
  - Filtrar por status, conteúdo e matrizes
  - Selecionar questões
  - Criar coleções
  - Ver detalhes de questões
- **Proteção**: Requer autenticação
- **Navegação**: Pode ir para `/professor/colecoes`

#### `/professor/colecoes` - Coleções de Questões
- **Arquivo**: `app/professor/colecoes/page.tsx`
- **Descrição**: Página para gerenciar coleções de questões
- **Componente**: `ColecoesPage`
- **Funcionalidades**:
  - Listar coleções criadas
  - Ver questões de cada coleção
  - Editar coleções
  - Deletar coleções
  - Remover questões de coleções
- **Proteção**: Requer autenticação
- **Navegação**: Volta para `/professor/banco-itens`

## 🔐 Sistema de Autenticação

### Middleware
- **Arquivo**: `middleware.ts`
- **Função**: Processa rotas antes do carregamento
- **Rotas Públicas**: `/auth`
- **Rotas Protegidas**: `/perfil`, `/aluno`, `/professor`

### Proteção de Rotas (Client-Side)
Cada página protegida verifica autenticação via `useAuth()`:

```typescript
useEffect(() => {
  if (!currentUser) {
    router.push("/auth")
  }
}, [currentUser, router])
```

## 🔄 Fluxo de Navegação

```
┌─────────────────────────────────────────────────┐
│                    Usuário                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
          ┌───────────────┐
          │   / (Home)    │  ◄── Redirecionamento automático
          └───────┬───────┘
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
  ┌──────────────┐  ┌─────────────┐
  │   /auth      │  │   /perfil   │
  │  (Login)     │  │  (Seleção)  │
  └──────┬───────┘  └──────┬──────┘
         │                 │
         │ Após login      │
         └────────►────────┘
                   │
           ┌───────┴────────┐
           │                │
           ▼                ▼
    ┌──────────┐     ┌──────────────┐
    │  /aluno  │     │  /professor  │
    │(Dashboard)│     │ (Dashboard)  │
    └──────────┘     └───────┬───────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
        ┌──────────────────┐  ┌─────────────┐
        │ /professor/      │  │ /professor/ │
        │ banco-itens      │◄─┤  colecoes   │
        │                  │──►│             │
        └──────────────────┘  └─────────────┘
```

## 🎨 Componentes Principais por Rota

### `/auth`
- `AuthScreen`
- `LoginForm`
- `SignupForm`

### `/perfil`
- `ProfileSelector`

### `/aluno`
- `AlunoDashboard`
- `TarefaCard`
- `RealizarTarefa`
- `RealizarAvaliacao`
- `GamificationDialog`
- `DiagnosticoDialog`

### `/professor`
- `ProfessorDashboard`
- `CriarTarefaDialog`
- `BookingDetalhes`
- `EstatisticasDialog`

### `/professor/banco-itens`
- `BancoItens`
- `HtmlRenderer`
- `TarefaCard` (para preview de questões)

### `/professor/colecoes`
- `ColecoesPage`
- `HtmlRenderer`

## 🚀 Navegação Programática

### Usando `useRouter` do Next.js

```typescript
import { useRouter } from "next/navigation"

const router = useRouter()

// Navegar para outra rota
router.push("/aluno")

// Voltar
router.back()

// Redirecionar (substitui histórico)
router.replace("/auth")
```

### Botões de Navegação

Cada área tem botões específicos:
- **Trocar Perfil**: Volta para `/perfil`
- **Sair**: Faz logout e redireciona para `/auth`

## 📝 Benefícios da Nova Estrutura

1. ✅ **URLs Significativas**: Cada tela tem sua própria URL
2. ✅ **Histórico do Navegador**: Botão voltar funciona corretamente
3. ✅ **Deep Linking**: Pode compartilhar links diretos
4. ✅ **SEO Friendly**: Melhor indexação (quando necessário)
5. ✅ **Code Splitting**: Carregamento otimizado por rota
6. ✅ **Organização**: Código separado por responsabilidade
7. ✅ **Proteção**: Rotas protegidas com redirecionamento automático
8. ✅ **Manutenibilidade**: Fácil adicionar novas rotas

## 🔧 Como Adicionar Novas Rotas

1. Criar pasta em `app/` com nome da rota
2. Adicionar `page.tsx` dentro da pasta
3. Implementar lógica de proteção (se necessário)
4. Atualizar navegação nos componentes
5. Adicionar ao middleware se necessário

### Exemplo: Nova rota `/relatorios`

```
app/
└── relatorios/
    └── page.tsx
```

```typescript
// app/relatorios/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function RelatoriosPage() {
  const { currentUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
    }
  }, [currentUser, router])

  if (!currentUser) return null

  return (
    <div>
      {/* Seu conteúdo aqui */}
    </div>
  )
}
```

## 🗂️ Sub-rotas do Professor

As rotas do professor foram organizadas de forma hierárquica:

```
/professor
├── page.tsx (Dashboard principal)
├── banco-itens
│   └── page.tsx (Banco de questões)
└── colecoes
    └── page.tsx (Gerenciamento de coleções)
```

### Fluxo de Navegação Professor

1. Professor acessa `/professor` (Dashboard)
2. Clica em "Banco de Itens" → navega para `/professor/banco-itens`
3. No banco de itens, pode clicar em "Ver Coleções" → navega para `/professor/colecoes`
4. Em coleções, pode voltar → retorna para `/professor/banco-itens`
5. No banco de itens, pode voltar → retorna para `/professor`

### Benefícios das Sub-rotas

- ✅ **Organização hierárquica**: Reflete a estrutura lógica da aplicação
- ✅ **URLs semânticas**: `/professor/banco-itens` é autoexplicativo
- ✅ **Navegação intuitiva**: Botão voltar do navegador funciona corretamente
- ✅ **Compartilhamento**: Pode compartilhar link direto do banco de itens
- ✅ **Modularização**: Cada funcionalidade em sua própria página

## 🎯 Próximos Passos (Futuro)

- [ ] Rotas dinâmicas para tarefas: `/aluno/tarefa/[id]`
- [ ] Rotas para relatórios: `/professor/relatorio/[id]`
- [ ] Rotas para booking detalhes: `/professor/tarefa/[id]`
- [ ] Páginas de erro personalizadas (`error.tsx`, `not-found.tsx`)
- [ ] Loading states por rota (`loading.tsx`)
- [ ] Layouts compartilhados entre rotas
- [ ] Sub-rotas do aluno (se necessário)

