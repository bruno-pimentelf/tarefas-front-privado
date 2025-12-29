# Plataforma de Tarefas Escolares

Sistema completo de gestão de tarefas escolares desenvolvido com Next.js e shadcn/ui, atendendo aos requisitos da POC do edital.

## 🚀 Funcionalidades Implementadas

### Para Alunos
- ✅ Dashboard com visualização de tarefas ativas, agendadas e concluídas
- ✅ Realização de tarefas com questões objetivas e dissertativas
- ✅ Feedback imediato após responder questões objetivas
- ✅ Sistema de gamificação com níveis, XP e conquistas
- ✅ Progresso visual durante a realização das tarefas
- ✅ Contador de tempo por questão

### Para Professores
- ✅ Dashboard com métricas e estatísticas
- ✅ Criação de tarefas com agendamento de data/hora
- ✅ Visualização de tarefas por status (ativas, agendadas, finalizadas)
- ✅ Relatórios pedagógicos detalhados com:
  - Taxa de conclusão
  - Desempenho médio
  - Desempenho por habilidade
  - Distribuição de desempenho dos alunos
  - Tempo médio por questão

### Requisitos da POC Atendidos

#### Especificações Pedagógicas (3.2 a 3.16)
- ✅ Gestão de tarefas escolares (armazenamento, distribuição, acompanhamento)
- ✅ Criação e edição de tarefas via interface administrativa
- ✅ Devolutivas pedagógicas contínuas e individualizadas
- ✅ Feedback formativo em linguagem adequada à faixa etária
- ✅ Suporte para correção automatizada de respostas dissertativas por IA (mockado)
- ✅ Relatórios diagnósticos e analíticos
- ✅ Detalhamento por habilidade e competência (BNCC)
- ✅ Métricas de tempo médio por questão

#### Especificações Técnicas (3.17 a 3.26)
- ✅ Interface moderna e responsiva
- ✅ Design intuitivo com excelente UX
- ✅ Componentes reutilizáveis e modulares
- ✅ Sistema de gamificação pedagógica
- ✅ Feedback visual e narrativo

## 🛠️ Tecnologias

- **Next.js 16** - Framework React
- **TypeScript** - Tipagem estática
- **shadcn/ui** - Componentes UI modernos
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Executar produção
pnpm start
```

## 🎨 Estrutura do Projeto

```
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página inicial com seletor de perfil
│   └── globals.css         # Estilos globais
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   ├── aluno-dashboard.tsx # Dashboard do aluno
│   ├── professor-dashboard.tsx # Dashboard do professor
│   ├── realizar-tarefa.tsx # Componente de realização de tarefas
│   ├── questao-objetiva.tsx # Questões de múltipla escolha
│   ├── questao-dissertativa.tsx # Questões dissertativas
│   ├── feedback-dialog.tsx # Feedback imediato
│   ├── gamification.tsx    # Sistema de gamificação
│   ├── relatorio-pedagogico.tsx # Relatórios
│   └── ...
└── lib/
    ├── types.ts            # Tipos TypeScript
    └── mock-data.ts        # Dados mockados
```

## 🎯 Como Usar

1. **Seleção de Perfil**: Ao acessar a aplicação, escolha entre "Aluno" ou "Professor"

2. **Como Aluno**:
   - Visualize tarefas ativas, agendadas e concluídas
   - Clique em "Iniciar Tarefa" para começar
   - Responda questões objetivas (múltipla escolha) e dissertativas
   - Receba feedback imediato após questões objetivas
   - Acompanhe seu progresso e gamificação

3. **Como Professor**:
   - Visualize métricas e estatísticas
   - Crie novas tarefas com o botão "Nova Tarefa"
   - Configure data/hora de início e término
   - Visualize relatórios pedagógicos detalhados
   - Acompanhe desempenho por habilidade

## 📝 Dados Mockados

O projeto utiliza dados mockados para demonstração:
- 2 tarefas (Matemática e Língua Portuguesa)
- 6 questões objetivas e 6 dissertativas
- Sistema de gamificação com conquistas
- Relatórios pedagógicos de exemplo

## 🎨 Design e UX

- Interface moderna e limpa
- Cores diferenciadas por componente curricular
- Feedback visual imediato
- Animações suaves
- Design responsivo (mobile-first)
- Acessibilidade considerada

## 📋 Próximos Passos

Para produção, seria necessário:
- Integração com backend/API
- Autenticação real (SSO/OAuth2)
- Correção real de dissertativas por IA
- Persistência de dados
- Integração com sistemas da SEDUC
- Exportação de relatórios (PDF, XLSX, CSV)

## 📄 Licença

Este projeto foi desenvolvido para atender aos requisitos da POC do edital.
