import { useState } from 'react';
import { AuthForm } from './AuthForm';
import { CurriculoView } from './CurriculoView';
import { PerfilForm } from './PerfilForm';
import { VagasPanel } from './VagasPanel';
import { estaAutenticado, logout } from './api';

export function App() {
  const [autenticado, setAutenticado] = useState(estaAutenticado());
  const [curriculoId, setCurriculoId] = useState<string | null>(null);

  if (!autenticado) {
    return (
      <main style={{ fontFamily: 'system-ui', padding: 32 }}>
        <h1>PRDAL Careers</h1>
        <AuthForm onAuth={() => setAutenticado(true)} />
      </main>
    );
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>PRDAL Careers</h1>
        <button
          onClick={() => {
            logout();
            setAutenticado(false);
          }}
        >
          Sair
        </button>
      </header>
      {curriculoId ? (
        <CurriculoView id={curriculoId} onFechar={() => setCurriculoId(null)} />
      ) : (
        <>
          <PerfilForm />
          <VagasPanel onCurriculo={setCurriculoId} />
        </>
      )}
    </main>
  );
}
