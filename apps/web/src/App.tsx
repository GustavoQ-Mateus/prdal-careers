import { useState } from 'react';
import { AuthForm } from './AuthForm';
import { CurriculoView } from './CurriculoView';
import { Dashboard } from './Dashboard';
import { PerfilForm } from './PerfilForm';
import { VagaVersoes } from './VagaVersoes';
import { VagasPanel } from './VagasPanel';
import { estaAutenticado, logout } from './api';

type Rota =
  | { tela: 'dashboard' }
  | { tela: 'vagas' }
  | { tela: 'perfil' }
  | { tela: 'vaga'; vagaId: string; titulo: string }
  | { tela: 'curriculo'; id: string; voltar: Rota };

const ABAS: { tela: Rota['tela']; nome: string }[] = [
  { tela: 'dashboard', nome: 'Dashboard' },
  { tela: 'vagas', nome: 'Vagas' },
  { tela: 'perfil', nome: 'Perfil' },
];

export function App() {
  const [autenticado, setAutenticado] = useState(estaAutenticado());
  const [rota, setRota] = useState<Rota>({ tela: 'dashboard' });

  if (!autenticado) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <span className="brand">prdal<span className="brand-dot">.</span>careers</span>
        </header>
        <div className="content" style={{ maxWidth: 360 }}>
          <AuthForm onAuth={() => setAutenticado(true)} />
        </div>
      </div>
    );
  }

  const abaAtiva = rota.tela === 'dashboard' || rota.tela === 'vagas' || rota.tela === 'perfil'
    ? rota.tela
    : null;

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
