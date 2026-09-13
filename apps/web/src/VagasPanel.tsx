import { useEffect, useState } from 'react';
import { criarVaga, gerarCv, listarVagas, type Vaga } from './api';

export function VagasPanel({ onCurriculo }: { onCurriculo: (id: string) => void }) {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [titulo, setTitulo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [gerandoId, setGerandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function carregar() {
    listarVagas()
      .then(setVagas)
      .catch((err) => setErro((err as Error).message));
  }

  useEffect(carregar, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await criarVaga({ titulo, empresa, descricao });
      setTitulo('');
      setEmpresa('');
      setDescricao('');
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function gerar(vagaId: string) {
    setGerandoId(vagaId);
    setErro(null);
    try {
      const { jobId } = await gerarCv(vagaId);
      onCurriculo(jobId);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setGerandoId(null);
    }
  }

  return (
    <section style={{ maxWidth: 640 }}>
      <h2>Vagas</h2>
      <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <input placeholder="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        <input placeholder="empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required />
        <textarea
          placeholder="cole a descricao da vaga"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={6}
          required
        />
        <button type="submit">Cadastrar vaga</button>
      </form>
      {erro && <p style={{ color: 'crimson' }}>{erro}</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {vagas.map((vaga) => (
          <li key={vaga.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <strong>{vaga.titulo}</strong> @ {vaga.empresa}
            <div style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>
              {vaga.keywords.slice(0, 8).map((k) => k.termo).join(', ')}
            </div>
            <button onClick={() => gerar(vaga.id)} disabled={gerandoId === vaga.id}>
              {gerandoId === vaga.id ? 'Gerando...' : 'Gerar CV'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
