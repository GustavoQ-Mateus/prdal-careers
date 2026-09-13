import { useState } from 'react';
import { AuthForm } from './AuthForm';
import { BancoVagas } from './BancoVagas';
import { CurriculoView } from './CurriculoView';
import { Dashboard } from './Dashboard';
import { Kanban } from './Kanban';
import { PerfilForm } from './PerfilForm';
import { VagaVersoes } from './VagaVersoes';
import { VagasPanel } from './VagasPanel';
import { estaAutenticado, logout } from './api';

type Aba = 'dashboard' | 'vagas' | 'banco' | 'candidaturas' | 'perfil';

type Rota =
  | { tela: Aba }
  | { tela: 'vaga'; vagaId: string; titulo: string }
  | { tela: 'curriculo'; id: string; voltar: Rota };

const ABAS: { tela: Aba; nome: string }[] = [
  { tela: 'dashboard', nome: 'Dashboard' },
  { tela: 'vagas', nome: 'Vagas' },
  { tela: 'banco', nome: 'Banco de vagas' },
  { tela: 'candidaturas', nome: 'Candidaturas' },
  { tela: 'perfil', nome: 'Perfil' },
];

export function App() {
  const [autenticado, setAutenticado] = useState(estaAutenticado());
  const [rota, setRota] = useState<Rota>({ tela: 'dashboard' });

  if (!autenticado) {
    return (
      <div className="auth-split">
        <div className="auth-form-pane">
          <span className="brand">prdal<span className="brand-dot">.</span>careers</span>
          <AuthForm onAuth={() => setAutenticado(true)} />
          <span className="auth-foot">© 2026 PRDAL Careers</span>
        </div>
        <aside className="auth-hero">
          <div className="auth-hero-mark">
            <div className="auth-hero-accent" />
            <h2 className="auth-hero-title">PRDAL Careers</h2>
          </div>
        </aside>
      </div>
    );
  }

  const abaAtiva = ABAS.some((a) => a.tela === rota.tela) ? rota.tela : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand">prdal<span className="brand-dot">.</span>careers</span>
        <nav className="nav">
          {ABAS.map((aba) => (
            <button
              key={aba.tela}
              className={abaAtiva === aba.tela ? 'active' : ''}
              onClick={() => setRota({ tela: aba.tela } as Rota)}
            >
              {aba.nome}
            </button>
          ))}
        </nav>
        <button
          className="ghost"
          onClick={() => {
            logout();
            setAutenticado(false);
            setRota({ tela: 'dashboard' });
          }}
        >
          Sair
        </button>
      </header>

      <div className="content">
        {rota.tela === 'dashboard' && (
          <Dashboard
            onAbrirVaga={(vagaId, titulo) => setRota({ tela: 'vaga', vagaId, titulo })}
          />
        )}
        {rota.tela === 'vagas' && (
          <VagasPanel
            onCurriculo={(id) => setRota({ tela: 'curriculo', id, voltar: { tela: 'vagas' } })}
          />
        )}
        {rota.tela === 'banco' && <BancoVagas />}
        {rota.tela === 'candidaturas' && <Kanban />}
        {rota.tela === 'perfil' && <PerfilForm />}
        {rota.tela === 'vaga' && (
          <VagaVersoes
            vagaId={rota.vagaId}
            titulo={rota.titulo}
            onAbrir={(id) => setRota({ tela: 'curriculo', id, voltar: rota })}
            onVoltar={() => setRota({ tela: 'dashboard' })}
          />
        )}
        {rota.tela === 'curriculo' && (
          <CurriculoView id={rota.id} onVoltar={() => setRota(rota.voltar)} />
        )}
      </div>
    </div>
  );
}
