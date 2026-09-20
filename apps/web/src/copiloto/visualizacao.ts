import type { Item } from './tipos';

export type ScoreAts = { etapa: string; score: number };

export const MARCADOR_NARRACAO_ATS_ETAPA_3 = '[[NARRACAO_ATS_ETAPA_3]]';

export function scoresAts(tool: string, resultado: unknown): ScoreAts[] | null {
  if (!resultado || typeof resultado !== 'object') return null;
  const valor = resultado as Record<string, unknown>;

  if (tool === 'analisar_ats') {
    return typeof valor.score === 'number' ? [{ etapa: 'Base', score: valor.score }] : null;
  }

  if (tool === 'status_geracao') {
    const etapas = valor.etapas as Record<string, unknown> | null;
    const inicial = (valor.analiseInicial ?? etapas?.analiseInicial) as Record<string, unknown> | null;
    return typeof inicial?.score === 'number' ? [{ etapa: 'Base', score: inicial.score }] : null;
  }

  if (tool !== 'buscar_curriculo') return null;
  const inicial = valor.analiseInicial as Record<string, unknown> | null;
  const final = valor.analiseFinal as Record<string, unknown> | null;
  if (typeof inicial?.score !== 'number' || typeof final?.score !== 'number') return null;
  return [
    { etapa: '', score: 0 },
    { etapa: 'Base', score: inicial.score },
    { etapa: 'Gerado', score: final.score },
  ];
}

function etapaNarradaAts(texto: string): 'inicial' | 'final' | null {
  const normalizado = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/\betapa\s*1\b/.test(normalizado)) return 'inicial';
  if (/\betapa\s*3\b/.test(normalizado)) return 'final';
  return null;
}

export function scoresNarracaoAts(itens: Item[], texto: string): ScoreAts[] | undefined {
  const etapa = etapaNarradaAts(texto);
  if (!etapa) return undefined;
  const curriculo = [...itens]
    .reverse()
    .flatMap((item) => item.tipo === 'operacao' ? item.passos : item.tipo === 'passo' ? [item] : [])
    .find((item) => item.tool === 'buscar_curriculo' && item.status === 'ok');
  const scores = curriculo ? scoresAts(curriculo.tool, curriculo.resultado) : null;
  if (!scores) return undefined;
  return etapa === 'inicial' ? scores.slice(1, 2) : scores;
}

export function dividirNarracaoAts(texto: string): string[] {
  return texto
    .split(MARCADOR_NARRACAO_ATS_ETAPA_3)
    .map((parte) => parte.trim())
    .filter(Boolean);
}

export function localizarStatusGeracao(itens: Item[], jobId: unknown): number {
  if (typeof jobId !== 'string' || !jobId) return -1;
  return itens.findLastIndex(
    (item) => item.tipo === 'passo' && item.tool === 'status_geracao' && item.args.jobId === jobId,
  );
}

export function consolidarStatusGeracao(itens: Item[]): Item[] {
  const vistos = new Set<string>();
  const resultado: Item[] = [];
  for (let indice = itens.length - 1; indice >= 0; indice -= 1) {
    const item = itens[indice];
    if (item.tipo === 'passo' && item.tool === 'status_geracao' && typeof item.args.jobId === 'string') {
      if (vistos.has(item.args.jobId)) continue;
      vistos.add(item.args.jobId);
    }
    resultado.push(item);
  }
  return resultado.reverse();
}
