import { useEffect, useState } from 'react';
import { criarCandidatura, criarVaga, gerarCv, listarVagas, type Vaga } from './api';

export function VagasPanel({ onCurriculo }: { onCurriculo: (id: string) => void }) {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [titulo, setTitulo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [gerandoId, setGerandoId] = useState<string | null>(null);
  const [acompanhandoId, setAcompanhandoId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
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

  async function acompanhar(vaga: Vaga) {
    setAcompanhandoId(vaga.id);
    setErro(null);
    setAviso(null);
    try {
      await criarCandidatura(vaga.id);
      setAviso(`${vaga.titulo} adicionada às candidaturas`);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setAcompanhandoId(null);
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head">
          <h2>Cadastrar vaga</h2>
        </div>
        <form onSubmit={criar} className="panel-body form-grid">
          <div className="two-col">
            <div className="field">
              <span className="label">Título</span>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            </div>
            <div className="field">
              <span className="label">Empresa</span>
              <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} required />
            </div>
          </div>
          <div className="field">
            <span className="label">Descrição da vaga</span>
            <textarea
              placeholder="cole a descrição completa da vaga"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={7}
              required
            />
          </div>
          {erro && <span className="error">{erro}</span>}
          <button type="submit" className="primary">Cadastrar e extrair keywords</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Vagas cadastradas</h2>
          <span className="label">{vagas.length} vagas</span>
        </div>
        {aviso && <div className="panel-body notice" style={{ paddingBottom: 0 }}>{aviso}</div>}
        {vagas.length === 0 ? (
          <div className="panel-body notice">Nenhuma vaga ainda.</div>
        ) : (
          <table className="grid-table">
            <thead>
              <tr>
                <th>Vaga</th>
                <th>Keywords</th>
                <th style={{ width: 220 }}></th>
              </tr>
            </thead>
            <tbody>
              {vagas.map((vaga) => (
                <tr key={vaga.id}>
                  <td>
                    <div>{vaga.titulo}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{vaga.empresa}</div>
                    {vaga.categoria && (
                      <div className="chip-set" style={{ marginTop: 6 }}>
                        <span className="chip">{vaga.categoria}</span>
                        {vaga.nivel && vaga.nivel !== 'indefinido' && (
                          <span className="chip">{vaga.nivel}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="chip-set">
                      {vaga.keywords.slice(0, 8).map((k) => (
                        <span key={k.termo} className="chip">{k.termo}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="row">
                      <button className="primary" onClick={() => gerar(vaga.id)} disabled={gerandoId === vaga.id}>
                        {gerandoId === vaga.id ? 'Gerando...' : 'Gerar CV'}
                      </button>
                      <button onClick={() => acompanhar(vaga)} disabled={acompanhandoId === vaga.id}>
                        {acompanhandoId === vaga.id ? '...' : 'Acompanhar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
