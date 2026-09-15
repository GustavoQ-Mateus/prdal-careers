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
    <div>
      <section className="operational-strip" aria-label="Estado da base de conhecimento">
        <div className="operational-metric">
          <span>Documentos indexados</span>
          <strong>{status?.documentos ?? '--'}</strong>
        </div>
        <div className="operational-metric">
          <span>Última indexação</span>
          <strong style={{ fontSize: 16 }}>{status ? fmtData(status.ultimaIndexacao) : '--'}</strong>
        </div>
        <div className="operational-metric">
          <span>Estado do Chroma</span>
          <strong style={{ fontSize: 16 }}>
            {processando ? 'Indexando' : status?.disponivel === false ? 'Indisponivel' : 'Disponivel'}
          </strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Distribuicao por origem</h2>
        </div>
        <div className="panel-body">
          <table className="grid-table">
            <tbody>
              <tr><th>Perfil</th><td className="num">{status?.porOrigem?.perfil ?? '--'}</td></tr>
              <tr><th>Candidatura</th><td className="num">{status?.porOrigem?.candidatura ?? '--'}</td></tr>
              <tr><th>Nota</th><td className="num">{status?.porOrigem?.nota ?? '--'}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Atualizar contexto</h2>
          <span className="label">Perfil, candidaturas e notas Markdown</span>
        </div>
        <div className="panel-body">
          <p className="section-intro">
            A base usa seu histórico real para selecionar os trechos mais relevantes durante a geração
            de cada currículo. A geração continua disponível mesmo sem um índice.
          </p>
          {erro && <p className="error" role="alert">{erro}</p>}
          <div className="row">
            <button className="accent" onClick={reindexar} disabled={!!processando}>
              {processando ? 'Indexando...' : 'Reindexar histórico'}
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
              <span className="notice num" role="status">
                lote {lote.processados}/{lote.total} {lote.status.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
