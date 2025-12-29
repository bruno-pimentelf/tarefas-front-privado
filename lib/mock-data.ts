import {
  User,
  Tarefa,
  Questao,
  TarefaRealizada,
  RelatorioPedagogico,
  Gamificacao,
  Conquista,
} from "./types";

// Usuários mockados
export const mockUsers: User[] = [
  {
    id: "prof-1",
    nome: "Prof. Maria Silva",
    role: "professor",
    email: "maria.silva@escola.sp.gov.br",
    turma: "7º A",
    serie: "7º ano",
    escola: "EE João da Silva",
  },
  {
    id: "aluno-1",
    nome: "João Pedro Santos",
    role: "aluno",
    email: "joao.santos@escola.sp.gov.br",
    turma: "7º A",
    serie: "7º ano",
    escola: "EE João da Silva",
  },
];

// Questões mockadas
export const mockQuestoesMatematicaObjetiva: Questao[] = [
  {
    id: "mat-obj-1",
    enunciado: "Qual é o resultado da expressão 2 + 3 × 4?",
    tipo: "objetiva",
    componente: "Matemática",
    alternativas: ["14", "20", "24", "26"],
    respostaCorreta: "14",
    habilidade: "EF07MA03",
    competencia: "Resolução de problemas",
  },
  {
    id: "mat-obj-2",
    enunciado: "Em uma sala há 30 alunos. Se 60% são meninas, quantas meninas há na sala?",
    tipo: "objetiva",
    componente: "Matemática",
    alternativas: ["12", "18", "20", "24"],
    respostaCorreta: "18",
    habilidade: "EF07MA05",
    competencia: "Porcentagem",
  },
  {
    id: "mat-obj-3",
    enunciado: "Qual é a área de um retângulo com 5 cm de largura e 8 cm de comprimento?",
    tipo: "objetiva",
    componente: "Matemática",
    alternativas: ["13 cm²", "26 cm²", "40 cm²", "45 cm²"],
    respostaCorreta: "40 cm²",
    habilidade: "EF07MA32",
    competencia: "Geometria",
  },
];

export const mockQuestoesMatematicaDissertativa: Questao[] = [
  {
    id: "mat-diss-1",
    enunciado: "Explique como você resolveria o problema: 'Ana tem R$ 50,00 e quer comprar 3 cadernos que custam R$ 12,00 cada. Ela terá dinheiro suficiente? Justifique sua resposta.'",
    tipo: "dissertativa",
    componente: "Matemática",
    modeloReferencia: "O aluno deve calcular 3 × 12 = 36. Como 36 < 50, Ana terá dinheiro suficiente. Deve explicar o raciocínio utilizado.",
    habilidade: "EF07MA05",
    competencia: "Resolução de problemas",
  },
  {
    id: "mat-diss-2",
    enunciado: "Descreva a diferença entre um número primo e um número composto, dando exemplos de cada um.",
    tipo: "dissertativa",
    componente: "Matemática",
    modeloReferencia: "Número primo tem apenas dois divisores (1 e ele mesmo), como 2, 3, 5, 7. Número composto tem mais de dois divisores, como 4, 6, 8, 9.",
    habilidade: "EF07MA01",
    competencia: "Números e operações",
  },
  {
    id: "mat-diss-3",
    enunciado: "Um terreno retangular tem 20 metros de largura e 30 metros de comprimento. Calcule a área e o perímetro deste terreno, explicando cada passo do seu cálculo.",
    tipo: "dissertativa",
    componente: "Matemática",
    modeloReferencia: "Área = 20 × 30 = 600 m². Perímetro = 2 × (20 + 30) = 2 × 50 = 100 m. Deve mostrar os cálculos passo a passo.",
    habilidade: "EF07MA32",
    competencia: "Geometria",
  },
];

export const mockQuestoesPortuguesObjetiva: Questao[] = [
  {
    id: "port-obj-1",
    enunciado: "Assinale a alternativa em que todas as palavras estão grafadas corretamente:",
    tipo: "objetiva",
    componente: "Língua Portuguesa",
    alternativas: [
      "exceção, excessão, exceção",
      "exceção, exceção, exceção",
      "excessão, excessão, excessão",
      "exceção, exceção, excessão",
    ],
    respostaCorreta: "exceção, exceção, exceção",
    habilidade: "EF07LP01",
    competencia: "Ortografia",
  },
  {
    id: "port-obj-2",
    enunciado: "Qual é a função sintática do termo destacado na frase: 'O livro que comprei é interessante.'?",
    tipo: "objetiva",
    componente: "Língua Portuguesa",
    alternativas: ["Sujeito", "Objeto direto", "Predicativo", "Adjunto adnominal"],
    respostaCorreta: "Objeto direto",
    habilidade: "EF07LP15",
    competencia: "Análise sintática",
  },
  {
    id: "port-obj-3",
    enunciado: "Em qual alternativa o verbo está no pretérito perfeito do indicativo?",
    tipo: "objetiva",
    componente: "Língua Portuguesa",
    alternativas: ["Eu estudava", "Eu estudei", "Eu estudarei", "Eu estudaria"],
    respostaCorreta: "Eu estudei",
    habilidade: "EF07LP09",
    competencia: "Morfologia",
  },
];

export const mockQuestoesPortuguesDissertativa: Questao[] = [
  {
    id: "port-diss-1",
    enunciado: "Escreva um parágrafo de 5 a 7 linhas sobre a importância da leitura na formação do indivíduo.",
    tipo: "dissertativa",
    componente: "Língua Portuguesa",
    modeloReferencia: "O texto deve abordar aspectos como desenvolvimento do vocabulário, conhecimento, formação crítica, entretenimento. Deve ter coerência, coesão e argumentação adequada.",
    habilidade: "EF07LP26",
    competencia: "Produção textual",
  },
  {
    id: "port-diss-2",
    enunciado: "Explique a diferença entre texto narrativo e texto dissertativo, dando um exemplo de cada tipo.",
    tipo: "dissertativa",
    componente: "Língua Portuguesa",
    modeloReferencia: "Texto narrativo conta uma história com personagens, tempo e espaço (ex: contos, romances). Texto dissertativo defende uma opinião com argumentos (ex: artigos de opinião).",
    habilidade: "EF07LP20",
    competencia: "Gêneros textuais",
  },
  {
    id: "port-diss-3",
    enunciado: "Reescreva a frase 'Os alunos estudaram muito para a prova' na voz passiva, mantendo o sentido original.",
    tipo: "dissertativa",
    componente: "Língua Portuguesa",
    modeloReferencia: "A prova foi estudada muito pelos alunos. Ou: Muito foi estudado pelos alunos para a prova.",
    habilidade: "EF07LP15",
    competencia: "Sintaxe",
  },
];

// Tarefas mockadas
export const mockTarefas: Tarefa[] = [
  {
    id: "tarefa-1",
    titulo: "Operações Básicas e Porcentagem",
    descricao: "Tarefa sobre operações matemáticas fundamentais e cálculo de porcentagens",
    componente: "Matemática",
    questoes: [...mockQuestoesMatematicaObjetiva, ...mockQuestoesMatematicaDissertativa],
    professorId: "prof-1",
    professorNome: "Prof. Maria Silva",
    turmaId: "turma-7a",
    turmaNome: "7º A",
    dataInicio: new Date("2024-01-15T08:00:00"),
    dataFim: new Date("2024-01-20T23:59:59"),
    status: "ativa",
  },
  {
    id: "tarefa-2",
    titulo: "Ortografia e Análise Sintática",
    descricao: "Exercícios sobre ortografia, análise sintática e morfologia",
    componente: "Língua Portuguesa",
    questoes: [...mockQuestoesPortuguesObjetiva, ...mockQuestoesPortuguesDissertativa],
    professorId: "prof-1",
    professorNome: "Prof. Maria Silva",
    turmaId: "turma-7a",
    turmaNome: "7º A",
    dataInicio: new Date("2024-01-18T08:00:00"),
    dataFim: new Date("2024-01-25T23:59:59"),
    status: "ativa",
  },
];

// Gamificação mockada
export const mockGamificacao: Gamificacao = {
  nivel: 5,
  xp: 1250,
  xpProximoNivel: 2000,
  conquistas: [
    {
      id: "conq-1",
      titulo: "Primeiros Passos",
      descricao: "Complete sua primeira tarefa",
      icone: "",
      desbloqueada: true,
      dataDesbloqueio: new Date("2024-01-10"),
    },
    {
      id: "conq-2",
      titulo: "Estudante Dedicado",
      descricao: "Complete 10 tarefas",
      icone: "",
      desbloqueada: true,
      dataDesbloqueio: new Date("2024-01-12"),
    },
    {
      id: "conq-3",
      titulo: "Mestre da Matemática",
      descricao: "Acerte todas as questões de matemática em uma tarefa",
      icone: "",
      desbloqueada: false,
    },
    {
      id: "conq-4",
      titulo: "Escritor em Formação",
      descricao: "Complete 5 tarefas de Língua Portuguesa",
      icone: "",
      desbloqueada: false,
    },
  ],
  progresso: {
    tarefasCompletas: 8,
    sequenciaDias: 3,
    melhorSequencia: 5,
  },
};

// Relatórios mockados
export const mockRelatorios: RelatorioPedagogico[] = [
  {
    tarefaId: "tarefa-1",
    tarefaTitulo: "Operações Básicas e Porcentagem",
    componente: "Matemática",
    totalAlunos: 30,
    alunosCompletaram: 25,
    taxaConclusao: 83.3,
    desempenhoMedio: 72.5,
    desempenhoPorHabilidade: [
      {
        habilidade: "EF07MA03",
        acertos: 20,
        total: 25,
        percentual: 80,
      },
      {
        habilidade: "EF07MA05",
        acertos: 18,
        total: 25,
        percentual: 72,
      },
      {
        habilidade: "EF07MA32",
        acertos: 22,
        total: 25,
        percentual: 88,
      },
    ],
    tempoMedioPorQuestao: 120,
    tempoTotalMedio: 720,
    alunosPorDesempenho: {
      excelente: 8,
      bom: 10,
      regular: 5,
      precisaMelhorar: 2,
    },
  },
];

