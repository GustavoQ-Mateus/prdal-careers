import { cn } from '@/lib/utils';

type Variante = 'marca' | 'lockup';
type Fundo = 'escuro' | 'claro';

const ARQUIVOS: Record<Variante, Record<Fundo, string>> = {
  marca: {
    escuro: '/brand/prdal-mark.png',
    claro: '/brand/prdal-mark-ink.png',
  },
  lockup: {
    escuro: '/brand/prdal-lockup.png',
    claro: '/brand/prdal-lockup-ink.png',
  },
};

export function Marca({
  variante,
  fundo,
  className,
}: {
  variante: Variante;
  fundo: Fundo;
  className?: string;
}) {
  return (
    <img
      className={cn('block select-none object-contain', className)}
      src={ARQUIVOS[variante][fundo]}
      alt="PRDAL Careers"
      draggable={false}
    />
  );
}
