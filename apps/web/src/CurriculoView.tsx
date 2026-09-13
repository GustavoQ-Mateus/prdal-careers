import { useEffect, useState } from 'react';
import { baixarArquivo, editarCurriculo, getCurriculo, type Curriculo } from './api';
import { Breakdown, fmtData, Meter, Score } from './ui';

export function CurriculoView({ id, onVoltar }: { id: string; onVoltar: () => void }) {
  const [curriculo, setCurriculo] = useState<Curriculo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [rotulo, setRotulo] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getCurriculo(id)
      .then((c) => {
        setCurriculo(c);
        setMarkdown(c.markdown);
        setRotulo(c.rotulo);
      })
      .catch((err) => setErro((err as Error).message));
  }, [id]);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await editarCurriculo(id, { markdown, rotulo });
      setCurriculo(atualizado);
      setMarkdown(atualizado.markdown);
      setRotulo(atualizado.rotulo);
      setEditando(false);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  if (erro && !curriculo) return <div className="error">{erro}</div>;
  if (!curriculo) return <div className="notice">Carregando currículo...</div>;

  return (
    <div className="stack">
      <div className="spread">
        <div>
          <button className="ghost" onClick={onVoltar}>&larr; Versões</button>
          <h1 style={{ marginTop: 8 }}>{curriculo.rotulo}</h1>
          <span className="faint" style={{ fontSize: 12 }}>Gerado {fmtData(curriculo.geradoEm)}</span>
        </div>
        {!editando && (
          <button className="primary" onClick={() => setEditando(true)}>Editar markdown</button>
        )}
      </div>

      {erro && <div className="error">{erro}</div>}

      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h2>Score ATS</h2>
          </div>
          <div className="panel-body stack">
            <div className="row" style={{ gap: 16 }}>
              <Score valor={curriculo.score} hero />
              <span className="label">/ 100</span>
            </div>
            <Meter valor={curriculo.score} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Downloads</h2>
          </div>
          <div className="panel-body stack">
            {curriculo.downloadDocxUrl ? (
              <button onClick={() => baixarArquivo(curriculo.downloadDocxUrl!, `${curriculo.rotulo}.docx`)}>
                Baixar .docx
              </button>
            ) : (
              <span className="notice">Download .docx indisponível</span>
            )}
            {curriculo.downloadPdfUrl ? (
              <button onClick={() => baixarArquivo(curriculo.downloadPdfUrl!, `${curriculo.rotulo}.pdf`)}>
                Baixar .pdf
              </button>
            ) : (
              <span className="notice">Download .pdf indisponível</span>
            )}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Breakdown do score</h2>
        </div>
        <div className="panel-body">
          <Breakdown breakdown={curriculo.breakdown} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Markdown</h2>
          {editando && (
            <div className="row">
              <button onClick={() => { setEditando(false); setMarkdown(curriculo.markdown); setRotulo(curriculo.rotulo); }} disabled={salvando}>
                Cancelar
              </button>
              <button className="primary" onClick={salvar} disabled={salvando}>
                {salvando ? 'Recalculando...' : 'Salvar e recalcular'}
              </button>
            </div>
          )}
        </div>
        <div className="panel-body stack">
          {editando ? (
            <>
              <div className="field">
                <span className="label">Rótulo da versão</span>
                <input value={rotulo} onChange={(e) => setRotulo(e.target.value)} />
              </div>
              <div className="field">
                <span className="label">Markdown</span>
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  rows={22}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6 }}
                />
              </div>
            </>
          ) : (
            <pre className="md-view">{curriculo.markdown}</pre>
          )}
        </div>
      </section>
    </div>
  );
}
