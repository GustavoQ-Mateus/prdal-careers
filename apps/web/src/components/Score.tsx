import { faixaScore } from '../ui';
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
