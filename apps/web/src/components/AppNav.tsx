import { BookOpen, CalendarCheck, Compass, FileText, LayoutGrid, LogOut, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Aba } from '../rotas';
import { cn } from '@/lib/utils';
import { Marca } from './Marca';

type Item = { tela: Aba; nome: string; icon: LucideIcon };
type Grupo = { titulo: string | null; itens: Item[] };

const GRUPOS: Grupo[] = [
  {
    titulo: null,
    itens: [
      { tela: 'hoje', nome: 'Hoje', icon: CalendarCheck },
      { tela: 'oportunidades', nome: 'Oportunidades', icon: LayoutGrid },
      { tela: 'copiloto', nome: 'Copiloto', icon: Compass },
      { tela: 'curriculos', nome: 'Curriculos', icon: FileText },
    ],
  },
  {
    titulo: 'Fundacao',
    itens: [
      { tela: 'perfil', nome: 'Perfil', icon: User },
      { tela: 'conhecimento', nome: 'Conhecimento', icon: BookOpen },
    ],
  },
];

export function AppNav({
  ativa,
  onNavegar,
  onSair,
}: {
  ativa: Aba | null;
  onNavegar: (tela: Aba) => void;
  onSair: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-5">
        <Marca variante="lockup" fundo="claro" className="h-6 w-auto dark:hidden" />
        <Marca variante="lockup" fundo="escuro" className="hidden h-6 w-auto dark:block" />
      </div>

      <nav className="flex flex-1 flex-col gap-6 px-3 py-4" aria-label="Navegacao principal">
        {GRUPOS.map((grupo, i) => (
          <div key={grupo.titulo ?? `grupo-${i}`} className="flex flex-col gap-1">
            {grupo.titulo && (
              <span className="px-3 pb-1 text-label uppercase text-faint">{grupo.titulo}</span>
            )}
            {grupo.itens.map((item) => {
              const Icon = item.icon;
              const ativo = ativa === item.tela;
              return (
                <button
                  key={item.tela}
                  onClick={() => onNavegar(item.tela)}
                  aria-current={ativo ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-3 rounded-control px-3 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    ativo
                      ? 'bg-accent-soft font-medium text-accent-ink'
                      : 'text-muted hover:bg-canvas hover:text-ink',
                  )}
                >
                  <Icon className={cn('size-[18px] shrink-0', ativo ? 'text-accent' : 'text-faint')} />
                  {item.nome}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          onClick={onSair}
          className="flex h-9 w-full items-center gap-3 rounded-control px-3 text-[14px] text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <LogOut className="size-[18px] shrink-0 text-faint" />
          Sair
        </button>
      </div>
    </div>
  );
}
