import {
  User,
  RelatorioPedagogico,
  Gamificacao,
  DiagnosticoAluno,
} from "./types";
import { TeacherClass, School } from "./api/bookings";

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

// Gamificação mockada
// Nível 3: precisa de 300 XP total (100 + 200)
// XP atual: 250 (faltam 50 para nível 4)
// Próximo nível (4): precisa de 300 XP adicionais
export const mockGamificacao: Gamificacao = {
  nivel: 3,
  xp: 250,
  xpProximoNivel: 300,
  xpTotal: 300,
  pontosPorTarefa: 50,
  pontosPorQuestao: 10,
  pontosPorAcerto: 20,
  progresso: {
    tarefasCompletas: 8,
    questoesRespondidas: 48,
    questoesAcertadas: 36,
    sequenciaDias: 3,
    melhorSequencia: 5,
  },
  historicoPontos: {
    tarefas: 400, // 8 tarefas * 50 pontos
    questoes: 480, // 48 questões * 10 pontos
    acertos: 720, // 36 acertos * 20 pontos
  },
};

// Diagnóstico mockado do aluno
export const mockDiagnosticoAluno: DiagnosticoAluno = {
  areasMelhoria: [
    {
      componente: "Matemática",
      habilidade: "Cálculo de porcentagens",
      percentual: 45,
    },
    {
      componente: "Língua Portuguesa",
      habilidade: "Análise sintática",
      percentual: 52,
    },
  ],
  pontosFortes: [
    {
      componente: "Matemática",
      habilidade: "Geometria e cálculo de áreas",
      percentual: 88,
    },
    {
      componente: "Língua Portuguesa",
      habilidade: "Produção textual",
      percentual: 82,
    },
  ],
  desempenhoGeral: [
    {
      componente: "Matemática",
      percentual: 68,
    },
    {
      componente: "Língua Portuguesa",
      percentual: 72,
    },
  ],
};

// Turmas mockadas
export const mockSchool: School = {
  id: 1,
  name: "Escola Estadual João da Silva"
};

export const mockTeacherClasses: TeacherClass[] = [
  {
    id: 1,
    schoolId: 1,
    name: "9° Ano A",
    grade: "9° Ano",
    school: mockSchool
  },
  {
    id: 2,
    schoolId: 1,
    name: "9° Ano B", 
    grade: "9° Ano",
    school: mockSchool
  }
];

// Relatórios mockados
// TODO: Integrar com API quando disponível
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
        habilidade: "Resolução de problemas com expressões numéricas",
        acertos: 20,
        total: 25,
        percentual: 80,
      },
      {
        habilidade: "Cálculo de porcentagens",
        acertos: 18,
        total: 25,
        percentual: 72,
      },
      {
        habilidade: "Geometria e cálculo de áreas",
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
  {
    tarefaId: "tarefa-2",
    tarefaTitulo: "Análise Sintática e Produção Textual",
    componente: "Língua Portuguesa",
    totalAlunos: 30,
    alunosCompletaram: 28,
    taxaConclusao: 93.3,
    desempenhoMedio: 78.2,
    desempenhoPorHabilidade: [
      {
        habilidade: "Ortografia e uso correto da língua",
        acertos: 24,
        total: 28,
        percentual: 86,
      },
      {
        habilidade: "Análise sintática",
        acertos: 20,
        total: 28,
        percentual: 71,
      },
      {
        habilidade: "Produção textual",
        acertos: 22,
        total: 28,
        percentual: 79,
      },
    ],
    tempoMedioPorQuestao: 180,
    tempoTotalMedio: 1080,
    alunosPorDesempenho: {
      excelente: 12,
      bom: 10,
      regular: 4,
      precisaMelhorar: 2,
    },
  },
];
