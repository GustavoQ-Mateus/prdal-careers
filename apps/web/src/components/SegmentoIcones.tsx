import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OpcaoSegmento<T extends string> = {
  id: T;
  nome: string;
  icon: LucideIcon;
};

export function SegmentoIcones<T extends string>({
  opcoes,
  valor,
  onValor,
  aria,
}: {
  opcoes: OpcaoSegmento<T>[];
  valor: T;
  onValor: (v: T) => void;
  aria: string;
}) {
  return (
    <div
      role="group"
      aria-label={aria}
      className="flex h-9 items-center rounded-control border border-line-strong p-0.5"
    >
      {opcoes.map((o) => {
        const Icon = o.icon;
        const ativo = valor === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={ativo}
            aria-label={o.nome}
            title={o.nome}
            onClick={() => onValor(o.id)}
            className={cn(
              'flex size-7 items-center justify-center rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              ativo ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:text-ink',
            )}
          >
            <Icon className="size-[17px]" />
          </button>
        );
      })}
    </div>
  );
}
