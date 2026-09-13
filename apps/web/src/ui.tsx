import type { ScoreBreakdown } from './api';

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

export function Score({ valor, hero }: { valor: number; hero?: boolean }) {
  return (
    <span className={`score score--${faixaScore(valor)}${hero ? ' score-hero' : ''}`}>
      {valor}
    </span>
  );
}

export function Meter({ valor }: { valor: number }) {
  return (
    <div className="meter">
      <div
        className={`meter-fill meter-fill--${faixaScore(valor)}`}
        style={{ width: `${Math.max(0, Math.min(100, valor))}%` }}
      />
    </div>
  );
}

function Barra({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="bar-row">
      <span className="label">{rotulo}</span>
      <Meter valor={valor} />
      <span className="num-col">{valor}</span>
    </div>
  );
}

export function Breakdown({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="stack">
      <Barra rotulo="Keyword match" valor={breakdown.keywordMatch} />
      <Barra rotulo="Densidade" valor={breakdown.densidade} />
      <Barra rotulo="Seções" valor={breakdown.secoes} />
      <div className="field">
        <span className="label">Keywords faltantes ({breakdown.faltando.length})</span>
        {breakdown.faltando.length > 0 ? (
          <div className="chip-set">
            {breakdown.faltando.map((k) => (
              <span key={k} className="chip chip--missing">
                {k}
              </span>
            ))}
          </div>
        ) : (
          <span className="notice">Nenhuma. Todas as keywords da vaga foram cobertas.</span>
        )}
      </div>
    </div>
  );
}

export function Delta({ valor }: { valor: number }) {
  const dir = valor > 0 ? 'up' : valor < 0 ? 'down' : 'flat';
  const sinal = valor > 0 ? '+' : '';
  return <span className={`delta delta--${dir}`}>{`${sinal}${valor}`}</span>;
}
