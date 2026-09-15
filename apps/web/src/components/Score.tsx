import { faixaScore } from '../ui';
import type { ScoreBreakdown } from '../api';
import { cn } from '@/lib/utils';

const COR_TEXTO = {
  bad: 'text-score-bad',
  mid: 'text-score-warn',
  good: 'text-score-good',
} as const;

const COR_BARRA = {
  bad: 'bg-score-bad',
  mid: 'bg-score-warn',
  good: 'bg-score-good',
} as const;

export function ScoreNum({ valor, className }: { valor: number; className?: string }) {
  return (
    <span className={cn('font-mono font-semibold tabular-nums', COR_TEXTO[faixaScore(valor)], className)}>
      {valor}
    </span>
  );
}

export function ScoreMeter({ valor }: { valor: number }) {
  const limitado = Math.max(0, Math.min(100, valor));
  const faixa = faixaScore(limitado);
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label={`Score ${limitado} de 100`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={limitado}
      >
        <div className={cn('h-full rounded-full', COR_BARRA[faixa])} style={{ width: `${limitado}%` }} />
      </div>
      <ScoreNum valor={limitado} />
    </div>
  );
}

function BarraScore({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-[13px] text-muted">{rotulo}</span>
      <div className="flex-1">
        <ScoreMeter valor={valor} />
      </div>
    </div>
  );
}

export function Breakdown({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="flex flex-col gap-3">
      <BarraScore rotulo="Keyword match" valor={breakdown.keywordMatch} />
      <BarraScore rotulo="Densidade" valor={breakdown.densidade} />
      <BarraScore rotulo="Secoes" valor={breakdown.secoes} />
      <div className="flex flex-col gap-1.5">
        <span className="text-label uppercase text-muted">
          Keywords faltantes ({breakdown.faltando.length})
        </span>
        {breakdown.faltando.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {breakdown.faltando.map((k) => (
              <span
                key={k}
                className="rounded-full border border-score-warn/50 px-2 py-0.5 text-[12px] text-score-warn"
              >
                {k}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[13px] text-muted">
            Nenhuma. Todas as keywords da vaga foram cobertas.
          </span>
        )}
      </div>
    </div>
  );
}
