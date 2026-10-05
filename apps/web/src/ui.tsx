export function fmtData(iso: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function faixaScore(score: number): 'bad' | 'mid' | 'good' {
  if (score < 50) return 'bad';
  if (score < 75) return 'mid';
  return 'good';
}

