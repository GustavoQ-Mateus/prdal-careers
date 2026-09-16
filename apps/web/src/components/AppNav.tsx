import {
  BookOpen,
  CalendarCheck,
  Compass,
  FileText,
  LayoutGrid,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from 'lucide-react';
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
      { tela: 'curriculos', nome: 'Currículos', icon: FileText },
    ],
  },
  {
    titulo: 'Fundação',
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
  colapsada = false,
  onAlternarColapso,
}: {
  ativa: Aba | null;
  onNavegar: (tela: Aba) => void;
  onSair: () => void;
  colapsada?: boolean;
  onAlternarColapso?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 items-center', colapsada ? 'justify-center px-0' : 'px-5')}>
        {colapsada ? (
          <>
            <Marca variante="marca" fundo="claro" className="h-6 w-auto dark:hidden" />
            <Marca variante="marca" fundo="escuro" className="hidden h-6 w-auto dark:block" />
          </>
        ) : (
          <>
            <Marca variante="lockup" fundo="claro" className="h-6 w-auto dark:hidden" />
            <Marca variante="lockup" fundo="escuro" className="hidden h-6 w-auto dark:block" />
          </>
        )}
      </div>

      <nav
        className={cn('flex flex-1 flex-col gap-6 py-4', colapsada ? 'px-2' : 'px-3')}
        aria-label="Navegação principal"
      >
        {GRUPOS.map((grupo, i) => (
          <div key={grupo.titulo ?? `grupo-${i}`} className="flex flex-col gap-1">
            {grupo.titulo && !colapsada && (
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
                  title={colapsada ? item.nome : undefined}
                  aria-label={colapsada ? item.nome : undefined}
                  className={cn(
                    'flex h-9 items-center rounded-control text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    colapsada ? 'justify-center px-0' : 'gap-3 px-3',
                    ativo
                      ? 'bg-accent-soft font-medium text-accent-ink'
                      : 'text-muted hover:bg-canvas hover:text-ink',
                  )}
                >
                  <Icon className={cn('size-[18px] shrink-0', ativo ? 'text-accent' : 'text-faint')} />
                  {!colapsada && item.nome}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={cn('flex flex-col gap-1 border-t border-line py-3', colapsada ? 'px-2' : 'px-3')}>
        {onAlternarColapso && (
          <button
            onClick={onAlternarColapso}
            aria-expanded={!colapsada}
            aria-label={colapsada ? 'Expandir navegação' : 'Recolher navegação'}
            title={colapsada ? 'Expandir navegação' : 'Recolher navegação'}
            className={cn(
              'flex h-9 items-center rounded-control text-[14px] text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              colapsada ? 'justify-center px-0' : 'gap-3 px-3',
            )}
          >
            {colapsada ? (
              <PanelLeftOpen className="size-[18px] shrink-0 text-faint" />
            ) : (
              <PanelLeftClose className="size-[18px] shrink-0 text-faint" />
            )}
            {!colapsada && 'Recolher'}
          </button>
        )}
        <button
          onClick={onSair}
          aria-label={colapsada ? 'Sair' : undefined}
          title={colapsada ? 'Sair' : undefined}
          className={cn(
            'flex h-9 items-center rounded-control text-[14px] text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            colapsada ? 'w-full justify-center px-0' : 'w-full gap-3 px-3',
          )}
        >
          <LogOut className="size-[18px] shrink-0 text-faint" />
          {!colapsada && 'Sair'}
        </button>
      </div>
    </div>
  );
}
