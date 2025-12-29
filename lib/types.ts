export type UserRole = "aluno" | "professor" | "gestor";

export interface User {
  id: string;
  nome: string;
  role: UserRole;
  email: string;
  turma?: string;
  serie?: string;
  escola?: string;
}

export type TipoQuestao = "objetiva" | "dissertativa";
export type ComponenteCurricular = "Matemática" | "Língua Portuguesa";

export interface Questao {
  id: string;
  enunciado: string;
  tipo: TipoQuestao;
  componente: ComponenteCurricular;
  alternativas?: string[];
  respostaCorreta?: string;
  modeloReferencia?: string;
  habilidade?: string;
  competencia?: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  componente: ComponenteCurricular;
  questoes: Questao[];
  professorId: string;
  professorNome: string;
  turmaId: string;
  turmaNome: string;
  dataInicio: Date;
  dataFim: Date;
  status: "agendada" | "ativa" | "finalizada";
}

export interface Resposta {
  questaoId: string;
  resposta: string;
  correta: boolean;
  feedback?: string;
  tempoGasto?: number; // em segundos
}

export interface TarefaRealizada {
  id: string;
  tarefaId: string;
  alunoId: string;
  respostas: Resposta[];
  dataInicio: Date;
  dataFim?: Date;
  tempoTotal?: number; // em segundos
  pontuacao?: number;
  nivel?: number;
  xpGanho?: number;
}

export interface RelatorioPedagogico {
  tarefaId: string;
  tarefaTitulo: string;
  componente: ComponenteCurricular;
  totalAlunos: number;
  alunosCompletaram: number;
  taxaConclusao: number;
  desempenhoMedio: number;
  desempenhoPorHabilidade: {
    habilidade: string;
    acertos: number;
    total: number;
    percentual: number;
  }[];
  tempoMedioPorQuestao: number;
  tempoTotalMedio: number;
  alunosPorDesempenho: {
    excelente: number;
    bom: number;
    regular: number;
    precisaMelhorar: number;
  };
}

export interface Gamificacao {
  nivel: number;
  xp: number;
  xpProximoNivel: number;
  xpTotal: number;
  pontosPorTarefa: number;
  pontosPorQuestao: number;
  pontosPorAcerto: number;
  progresso: {
    tarefasCompletas: number;
    questoesRespondidas: number;
    questoesAcertadas: number;
    sequenciaDias: number;
    melhorSequencia: number;
  };
  historicoPontos: {
    tarefas: number;
    questoes: number;
    acertos: number;
  };
}

export interface SistemaPontos {
  pontosPorTarefa: number;
  pontosPorQuestao: number;
  pontosPorAcerto: number;
  calcularXPProximoNivel: (nivel: number) => number;
}

export interface DiagnosticoAluno {
  areasMelhoria: {
    componente: ComponenteCurricular;
    habilidade: string;
    percentual: number;
  }[];
  pontosFortes: {
    componente: ComponenteCurricular;
    habilidade: string;
    percentual: number;
  }[];
  desempenhoGeral: {
    componente: ComponenteCurricular;
    percentual: number;
  }[];
}
