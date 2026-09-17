import { Menu } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { BaseConhecimento } from './BaseConhecimento';
import { Copiloto } from './Copiloto';
import { AppNav } from './components/AppNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeToggle } from './components/ThemeToggle';
import { Marca } from './components/Marca';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CurriculoView } from './CurriculoView';
import { Curriculos } from './Curriculos';
import { Hoje } from './Hoje';
import { Oportunidades } from './Oportunidades';
import { PerfilForm } from './PerfilForm';
import { Workspace } from './Workspace';
import { estaAutenticado, logout } from './api';
import { abaDaRota, useRota, type Aba, type Rota } from './rotas';
import { useEffect, useState } from 'react';

const CONTEXTO: Record<Aba, { titulo: string; descricao: string }> = {
  hoje: { titulo: 'Hoje', descricao: 'O que precisa da sua atenção neste momento' },
  oportunidades: {
    titulo: 'Oportunidades',
    descricao: 'Inventário e as visões de lista, board e grafo no mesmo hub',
  },
  copiloto: {
    titulo: 'Copiloto',
    descricao: 'Conduza a candidatura em conversa, do currículo ao texto pronto',
  },
  curriculos: { titulo: 'Currículos', descricao: 'Biblioteca de versões geradas para cada oportunidade' },
  conhecimento: { titulo: 'Conhecimento', descricao: 'Fontes usadas pelo RAG na geração ATS' },
  perfil: { titulo: 'Perfil', descricao: 'Histórico profissional canônico para os currículos' },
};

export function App() {
  const [autenticado, setAutenticado] = useState(estaAutenticado());
  const { rota, ir } = useRota();
  const [mobileAberta, setMobileAberta] = useState(false);
  const [navColapsada, setNavColapsada] = useState(() => {
    try {
      return localStorage.getItem('nav-colapsada') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (window.location.pathname === '/') ir({ tela: 'hoje' }, true);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nav-colapsada', navColapsada ? '1' : '0');
    } catch {
      /* preferência não persistida */
    }
  }, [navColapsada]);

  if (!autenticado) {
    return (
      <div className="grid min-h-screen bg-ground font-sans text-ink lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="relative flex items-center justify-center px-6 py-20 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex justify-center">
              <Marca variante="lockup" fundo="claro" className="h-7 w-auto dark:hidden" />
              <Marca variante="lockup" fundo="escuro" className="hidden h-7 w-auto dark:block" />
            </div>
            <AuthForm
              onAuth={() => {
                setAutenticado(true);
                ir({ tela: 'hoje' }, true);
              }}
            />
          </div>
          <span className="absolute inset-x-6 bottom-6 text-center font-mono text-[11px] text-faint">
            © 2026 PRDAL Careers
          </span>
        </div>

        <aside className="dark relative hidden flex-col border-l border-line bg-canvas px-14 py-12 lg:flex xl:px-20 xl:py-16">
          <div className="flex flex-1 items-center">
            <div className="max-w-2xl">
              <span className="text-[13px] font-medium text-muted">Seu processo, sob controle</span>
              <h2 className="mt-5 text-[clamp(3.25rem,5.4vw,5rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink">
                Uma vaga.
                <br />
                O currículo certo.
              </h2>
              <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted">
                Organize oportunidades, acompanhe candidaturas e entenda cada ponto do seu score ATS.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 justify-center pt-10">
            <Marca variante="lockup" fundo="escuro" className="h-7 w-auto" />
          </div>
        </aside>
      </div>
    );
  }

  const abaAtiva = abaDaRota(rota);
  const profunda = rota.tela === 'workspace' || rota.tela === 'curriculo';
  const workspaceScreen = rota.tela === 'workspace';
  const contexto = !profunda
    ? CONTEXTO[abaAtiva ?? 'hoje']
    : rota.tela === 'workspace'
      ? { titulo: 'Workspace', descricao: 'Currículo, candidatura, ações e histórico desta oportunidade' }
      : { titulo: 'Currículo', descricao: 'Análise, edição e arquivos da versão' };

  function navegar(tela: Aba) {
    const dest: Rota = tela === 'oportunidades' ? { tela, visao: 'lista' } : { tela };
    ir(dest);
    setMobileAberta(false);
  }

  function sair() {
    logout();
    setAutenticado(false);
    ir({ tela: 'hoje' }, true);
  }

  function voltar() {
    if (rota.tela === 'workspace') ir({ tela: 'oportunidades', visao: 'lista' });
    if (rota.tela === 'curriculo') ir({ tela: 'workspace', id: rota.oportunidadeId });
  }

  return (
    <div className="app-root flex min-h-screen bg-canvas font-sans text-[14px] text-ink">
      <aside
        className={cn(
          'hidden shrink-0 border-r border-line bg-ground transition-[width] duration-200 nav:block',
          navColapsada ? 'w-[60px]' : 'w-[248px]',
        )}
      >
        <div className="sticky top-0 h-screen">
          <AppNav
            ativa={abaAtiva}
            onNavegar={navegar}
            onSair={sair}
            colapsada={navColapsada}
            onAlternarColapso={() => setNavColapsada((v) => !v)}
          />
        </div>
      </aside>

      <Sheet open={mobileAberta} onOpenChange={setMobileAberta}>
        <SheetContent side="left" className="w-[248px] gap-0 bg-ground p-0">
          <AppNav ativa={abaAtiva} onNavegar={navegar} onSair={sair} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line bg-ground px-4 nav:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir navegação"
            onClick={() => setMobileAberta(true)}
          >
            <Menu />
          </Button>
          <Marca variante="marca" fundo="claro" className="h-6 w-auto dark:hidden" />
          <Marca variante="marca" fundo="escuro" className="hidden h-6 w-auto dark:block" />
        </header>

        <header
          className={cn(
            'flex items-end justify-between gap-4 px-6 nav:px-8',
            workspaceScreen ? 'py-4' : 'pb-5 pt-7',
          )}
        >
          <div className="min-w-0">
            {profunda && (
              <button
                onClick={voltar}
                className="text-label uppercase text-accent transition-colors hover:text-accent-ink"
              >
                {rota.tela === 'workspace' ? 'Oportunidades' : 'Workspace'}
              </button>
            )}
            {!workspaceScreen && (
              <>
                <h1 className="text-page text-ink">{contexto.titulo}</h1>
                <p className="mt-1 text-[13px] text-muted">{contexto.descricao}</p>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="min-h-0 flex-1 bg-canvas">
          <ErrorBoundary resetKey={rota}>
            <div className="px-6 pb-12 nav:px-8">
              {rota.tela === 'hoje' && (
                <Hoje
                  onAbrir={(id) => ir({ tela: 'workspace', id })}
                  onRevisarOportunidades={() => ir({ tela: 'oportunidades', visao: 'lista' })}
                />
              )}
              {rota.tela === 'oportunidades' && (
                <Oportunidades
                  visao={rota.visao}
                  busca={rota.busca ?? ''}
                  estado={rota.estado ?? 'ativas'}
                  categoria={rota.categoria ?? ''}
                  nivel={rota.nivel ?? ''}
                  ordenarPor={rota.ordenarPor ?? 'atividade'}
                  prioridade={rota.prioridade ?? ''}
                  onRota={(prox) => ir({ tela: 'oportunidades', ...prox })}
                  onAbrir={(id) => ir({ tela: 'workspace', id })}
                />
              )}
              {rota.tela === 'workspace' && (
                <Workspace
                  id={rota.id}
                  onCurriculo={(curriculoId) =>
                    ir({ tela: 'curriculo', oportunidadeId: rota.id, curriculoId })
                  }
                  onCopiloto={() => ir({ tela: 'copiloto', oportunidadeId: rota.id })}
                />
              )}
              {rota.tela === 'copiloto' && <Copiloto oportunidadeId={rota.oportunidadeId} />}
              {rota.tela === 'curriculos' && (
                <Curriculos
                  modo={rota.modo ?? 'lista'}
                  categoria={rota.categoria ?? ''}
                  nivel={rota.nivel ?? ''}
                  vinculado={rota.vinculado ?? ''}
                  scoreMinimo={rota.scoreMinimo ?? ''}
                  ordenarPor={rota.ordenarPor ?? 'geracao'}
                  onRota={(filtros) => ir({ tela: 'curriculos', ...filtros })}
                  onAbrir={(oportunidadeId, curriculoId) =>
                    ir({ tela: 'curriculo', oportunidadeId, curriculoId })
                  }
                />
              )}
              {rota.tela === 'curriculo' && (
                <CurriculoView
                  id={rota.curriculoId}
                  onAbrirVersao={(curriculoId) =>
                    ir({ tela: 'curriculo', oportunidadeId: rota.oportunidadeId, curriculoId })
                  }
                />
              )}
              {rota.tela === 'conhecimento' && <BaseConhecimento />}
              {rota.tela === 'perfil' && <PerfilForm />}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
