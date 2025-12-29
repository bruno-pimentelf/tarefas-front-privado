/**
 * Sistema de gamificação por níveis
 * Cada nível requer mais XP que o anterior
 */

export const SISTEMA_PONTOS = {
  pontosPorTarefa: 50,
  pontosPorQuestao: 10,
  pontosPorAcerto: 20,
} as const;

/**
 * Calcula o XP necessário para subir do nível atual para o próximo
 * Fórmula progressiva: XP = 100 * nível
 * Nível 1 -> 2: 100 XP
 * Nível 2 -> 3: 200 XP
 * Nível 3 -> 4: 300 XP
 * Nível 4 -> 5: 400 XP
 * Nível 5 -> 6: 500 XP
 * E assim por diante...
 */
export function calcularXPProximoNivel(nivel: number): number {
  return 100 * nivel;
}

/**
 * Calcula o XP total necessário para alcançar um nível
 * Nível 1: 0 XP
 * Nível 2: 100 XP (0 + 100)
 * Nível 3: 300 XP (100 + 200)
 * Nível 4: 600 XP (300 + 300)
 * Nível 5: 1000 XP (600 + 400)
 */
export function calcularXPTotalParaNivel(nivel: number): number {
  if (nivel <= 1) return 0;
  let total = 0;
  for (let i = 1; i < nivel; i++) {
    total += calcularXPProximoNivel(i);
  }
  return total;
}

/**
 * Calcula o nível atual baseado no XP total
 */
export function calcularNivelPorXP(xpTotal: number): number {
  let nivel = 1;
  let xpNecessario = 0;
  
  while (xpNecessario <= xpTotal) {
    nivel++;
    xpNecessario += calcularXPProximoNivel(nivel - 1);
    if (xpNecessario > xpTotal) {
      nivel--;
      break;
    }
  }
  
  return Math.max(1, nivel);
}

/**
 * Calcula o XP necessário para o próximo nível baseado no nível atual
 */
export function calcularXPProximoNivelAtual(nivel: number, xpAtual: number): number {
  const xpTotalParaNivel = calcularXPTotalParaNivel(nivel);
  const xpNecessarioProximoNivel = calcularXPProximoNivel(nivel);
  const xpRestante = xpTotalParaNivel + xpNecessarioProximoNivel - xpAtual;
  return Math.max(0, xpRestante);
}

