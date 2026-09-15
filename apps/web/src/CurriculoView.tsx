import { useEffect, useState } from 'react';
import { baixarArquivo, editarCurriculo, getCurriculo, type Curriculo } from './api';
import { Breakdown, fmtData, Meter, Score } from './ui';

export function CurriculoView({ id }: { id: string }) {
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
      <div className="document-toolbar">
        <div>
          <h2>{curriculo.rotulo}</h2>
          <span className="faint" style={{ fontSize: 12 }}>Gerado {fmtData(curriculo.geradoEm)}</span>
        </div>
        <div className="row">
          {curriculo.downloadDocxUrl ? (
            <button onClick={() => baixarArquivo(curriculo.downloadDocxUrl!, `${curriculo.rotulo}.docx`)}>
              Baixar .docx
            </button>
          ) : (
            <span className="notice">.docx indisponível</span>
          )}
          {curriculo.downloadPdfUrl ? (
            <button onClick={() => baixarArquivo(curriculo.downloadPdfUrl!, `${curriculo.rotulo}.pdf`)}>
              Baixar .pdf
            </button>
          ) : (
            <span className="notice">.pdf indisponível</span>
          )}
          {!editando && (
            <button className="accent" onClick={() => setEditando(true)}>Editar Markdown</button>
          )}
        </div>
      </div>

      {erro && <div className="error" role="alert">{erro}</div>}

      <div className="analysis-layout">
        <aside className="analysis-sidebar">
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
              <h2>Diagnóstico</h2>
            </div>
            <div className="panel-body">
              <Breakdown breakdown={curriculo.breakdown} />
            </div>
          </section>
        </aside>

        <section className="panel document-workspace">
          <div className="panel-head">
            <h2>Conteúdo do currículo</h2>
            {editando && (
              <div className="row">
                <button onClick={() => { setEditando(false); setMarkdown(curriculo.markdown); setRotulo(curriculo.rotulo); }} disabled={salvando}>
                  Cancelar
                </button>
                <button className="accent" onClick={salvar} disabled={salvando}>
                  {salvando ? 'Recalculando...' : 'Salvar e recalcular'}
                </button>
              </div>
            )}
          </div>
          <div className="panel-body stack">
            {editando ? (
              <>
                <label className="field">
                  <span className="label">Rótulo da versão</span>
                  <input value={rotulo} onChange={(e) => setRotulo(e.target.value)} />
                </label>
                <label className="field">
                  <span className="label">Markdown</span>
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    rows={28}
                    className="mono"
                  />
                </label>
              </>
            ) : (
              <pre className="md-view">{curriculo.markdown}</pre>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
