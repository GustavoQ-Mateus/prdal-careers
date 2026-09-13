import { useEffect, useState } from 'react';
import type { HelloResponse } from '@prdal/shared-types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function App() {
  const [hello, setHello] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/hello`)
      .then((res) => {
        if (!res.ok) throw new Error(`api respondeu ${res.status}`);
        return res.json() as Promise<HelloResponse>;
      })
      .then(setHello)
      .catch((err: Error) => setError(err.message));
  }, []);

  const chain: HelloResponse['chain'] = hello
    ? [{ service: 'web', message: 'hello from web' }, ...hello.chain]
    : [];

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32, maxWidth: 640 }}>
      <h1>PRDAL Careers</h1>
      <p>Fase 0 — hello-world atravessando os quatro serviços.</p>
      {error && <p style={{ color: 'crimson' }}>Erro: {error}</p>}
      {!hello && !error && <p>Chamando a api...</p>}
      {chain.length > 0 && (
        <ol>
          {chain.map((hop) => (
            <li key={hop.service}>
              <strong>{hop.service}</strong>: {hop.message}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
