import { Menu } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { BaseConhecimento } from './BaseConhecimento';
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
  hoje: { titulo: 'Hoje', descricao: 'O que precisa da sua atencao neste momento' },
  oportunidades: {
    titulo: 'Oportunidades',
    descricao: 'Inventario e as visoes de lista, board e grafo no mesmo hub',
  },
  curriculos: { titulo: 'Curriculos', descricao: 'Biblioteca de versoes geradas para cada oportunidade' },
  conhecimento: { titulo: 'Conhecimento', descricao: 'Fontes usadas pelo RAG na geracao ATS' },
  perfil: { titulo: 'Perfil', descricao: 'Historico profissional canonico para os curriculos' },
};

export function App() {
  const [autenticado, setAutenticado] = useState(estaAutenticado());
  const { rota, ir } = useRota();
  const [mobileAberta, setMobileAberta] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/') ir({ tela: 'hoje' }, true);
  }, []);

  if (!autenticado) {
    return (
      <div className="auth-split">
        <div className="auth-form-pane">
          <Marca variante="lockup" fundo="claro" className="auth-brand-logo" />
          <AuthForm onAuth={() => {
            setAutenticado(true);
            ir({ tela: 'hoje' }, true);
          }} />
          <span className="auth-foot">© 2026 PRDAL Careers</span>
        </div>
        <aside className="auth-hero">
          <Marca variante="lockup" fundo="escuro" className="auth-hero-logo" />
          <div className="auth-hero-mark">
            <div className="auth-hero-accent" />
            <span className="auth-hero-kicker">Seu processo, sob controle.</span>
            <h2 className="auth-hero-title">Uma vaga.<br />O curriculo certo.</h2>
            <p className="auth-hero-copy">
              Organize oportunidades, acompanhe candidaturas e entenda cada ponto do seu score ATS.
            </p>
          </div>
        </aside>
      </div>
    );
  }

  const abaAtiva = abaDaRota(rota);
  const profunda = rota.tela === 'workspace' || rota.tela === 'curriculo';
  const workspaceScreen = rota.tela === 'workspace';
  const migrada =
    rota.tela === 'hoje' ||
    rota.tela === 'oportunidades' ||
    workspaceScreen ||
    rota.tela === 'curriculos' ||
    rota.tela === 'curriculo';
  const contexto = !profunda
    ? CONTEXTO[abaAtiva ?? 'hoje']
    : rota.tela === 'workspace'
      ? { titulo: 'Workspace', descricao: 'Curriculo, candidatura, acoes e historico desta oportunidade' }
      : { titulo: 'Curriculo', descricao: 'Analise, edicao e arquivos da versao' };

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
    <div className="app-root flex min-h-screen bg-canvas font-sans text-[15px] text-ink">
      <aside className="hidden w-[248px] shrink-0 border-r border-line bg-ground nav:block">
        <div className="sticky top-0 h-screen">
          <AppNav ativa={abaAtiva} onNavegar={navegar} onSair={sair} />
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
            aria-label="Abrir navegacao"
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

        <main className={cn('min-h-0 flex-1 bg-canvas', !migrada && 'legacy-surface')}>
          <ErrorBoundary resetKey={rota}>
          {migrada ? (
            <div className="px-6 pb-12 nav:px-8">
              {rota.tela === 'hoje' && <Hoje onAbrir={(id) => ir({ tela: 'workspace', id })} />}
              {rota.tela === 'oportunidades' && (
                <Oportunidades
                  visao={rota.visao}
                  busca={rota.busca ?? ''}
                  estado={rota.estado ?? 'ativas'}
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
                />
              )}
              {rota.tela === 'curriculos' && (
                <Curriculos
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
            </div>
          ) : (
            <div className="workspace">
              {rota.tela === 'conhecimento' && <BaseConhecimento />}
              {rota.tela === 'perfil' && <PerfilForm />}
            </div>
          )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
