import { useEffect, useRef, useState } from 'react';
import {
  getContextoStatus,
  getLote,
  reindexarContexto,
  uploadContexto,
  type ContextoStatus,
  type LoteStatus,
} from './api';
import { fmtData } from './ui';

export function BaseConhecimento() {
  const [status, setStatus] = useState<ContextoStatus | null>(null);
  const [lote, setLote] = useState<LoteStatus | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function carregar() {
    getContextoStatus()
      .then(setStatus)
      .catch((err) => setErro((err as Error).message));
  }

  useEffect(carregar, []);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function acompanhar(loteId: string) {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      try {
        const st = await getLote(loteId);
        setLote(st);
        if (st.status === 'CONCLUIDO') {
          if (timer.current) clearInterval(timer.current);
          carregar();
        }
      } catch (err) {
        setErro((err as Error).message);
      }
    }, 1000);
  }

  async function reindexar() {
    setErro(null);
    try {
      const { loteId } = await reindexarContexto();
      acompanhar(loteId);
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function enviar(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return;
    setErro(null);
    try {
      const { loteId } = await uploadContexto(Array.from(arquivos));
      acompanhar(loteId);
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  const processando = lote && lote.status !== 'CONCLUIDO';

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head">
          <h2>Base de conhecimento</h2>
          <span className="label">contexto que aterra a geração</span>
        </div>
        <div className="panel-body stack">
          <p className="notice" style={{ margin: 0 }}>
            A base indexa seu histórico (perfil-mestre e notas de candidatura) e alimenta a geração
            de currículo com os trechos mais relevantes para cada vaga. Você também pode enviar notas
            .md do seu Obsidian.
          </p>
          <div className="two-col">
            <div className="field">
              <span className="label">Documentos indexados</span>
              <span className="num" style={{ fontSize: 28 }}>{status?.documentos ?? '--'}</span>
            </div>
            <div className="field">
              <span className="label">Última indexação</span>
              <span className="num">{status ? fmtData(status.ultimaIndexacao) : '--'}</span>
            </div>
          </div>
          {erro && <span className="error">{erro}</span>}
          <div className="row">
            <button className="primary" onClick={reindexar} disabled={!!processando}>
              {processando ? 'Indexando...' : 'Reindexar do meu histórico'}
            </button>
            <label className="upload-btn">
              Enviar notas .md
              <input
                type="file"
                accept=".md"
                multiple
                hidden
                disabled={!!processando}
                onChange={(e) => enviar(e.target.files)}
              />
            </label>
            {lote && (
              <span className="notice num">
                lote {lote.processados}/{lote.total} {lote.status.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
