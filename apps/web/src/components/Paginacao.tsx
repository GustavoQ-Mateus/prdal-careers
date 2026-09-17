import { Button } from '@/components/ui/button';

export function Paginacao({
  total,
  limit,
  offset,
  onOffset,
}: {
  total: number;
  limit: number;
  offset: number;
  onOffset: (offset: number) => void;
}) {
  const inicio = total === 0 ? 0 : offset + 1;
  const fim = Math.min(offset + limit, total);
  const temAnterior = offset > 0;
  const temProximo = offset + limit < total;

  return (
    <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
      <span className="tabular-nums">
        {inicio} a {fim} de {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!temAnterior}
          onClick={() => onOffset(Math.max(0, offset - limit))}
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!temProximo}
          onClick={() => onOffset(offset + limit)}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
