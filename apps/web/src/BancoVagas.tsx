import { useEffect, useRef, useState } from 'react';
import {
  ativarBancoVaga,
  getLote,
  importarBancoVagas,
  listarBancoVagas,
  type BancoVaga,
  type ItemImportacao,
  type LoteStatus,
} from './api';
import { fmtData } from './ui';

const ENTRADA_VAZIA: ItemImportacao = { titulo: '', empresa: '', fonte: '', descricao: '' };

export function BancoVagas() {
  const [entradas, setEntradas] = useState<ItemImportacao[]>([{ ...ENTRADA_VAZIA }]);
  const [json, setJson] = useState('');
  const [lista, setLista] = useState<BancoVaga[]>([]);
  const [lote, setLote] = useState<LoteStatus | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function carregar() {
    listarBancoVagas()
      .then(setLista)
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

  function setEntrada(i: number, campo: keyof ItemImportacao, valor: string) {
    setEntradas((atual) => atual.map((e, idx) => (idx === i ? { ...e, [campo]: valor } : e)));
  }

  async function importar() {
    setErro(null);
    let itens = entradas.filter((e) => e.titulo && e.empresa && e.descricao);
    if (json.trim()) {
      try {
        const parsed = JSON.parse(json) as ItemImportacao[];
        itens = [...itens, ...parsed];
      } catch {
        setErro('JSON inválido');
        return;
      }
    }
    if (itens.length === 0) {
      setErro('Preencha ao menos uma vaga com título, empresa e descrição');
      return;
    }
    try {
      const { loteId } = await importarBancoVagas(itens);
      setEntradas([{ ...ENTRADA_VAZIA }]);
      setJson('');
      acompanhar(loteId);
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function ativar(id: string) {
    setErro(null);
    try {
      await ativarBancoVaga(id);
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  const processando = lote && lote.status !== 'CONCLUIDO';

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head">
          <h2>Importar vagas</h2>
          <span className="label">Entrada manual ou JSON</span>
        </div>
        <div className="panel-body stack">
          <p className="section-intro">
            Adicione as oportunidades encontradas em outras plataformas para classificar e triar.
          </p>
          {entradas.map((e, i) => (
            <div key={i} className="import-row">
              <input aria-label={`Título da vaga ${i + 1}`} placeholder="Título" value={e.titulo} onChange={(ev) => setEntrada(i, 'titulo', ev.target.value)} />
              <input aria-label={`Empresa da vaga ${i + 1}`} placeholder="Empresa" value={e.empresa} onChange={(ev) => setEntrada(i, 'empresa', ev.target.value)} />
              <input aria-label={`Link da vaga ${i + 1}`} placeholder="Link, opcional" value={e.fonte ?? ''} onChange={(ev) => setEntrada(i, 'fonte', ev.target.value)} />
              <textarea aria-label={`Descrição da vaga ${i + 1}`} placeholder="Descrição completa" rows={2} value={e.descricao} onChange={(ev) => setEntrada(i, 'descricao', ev.target.value)} />
              {entradas.length > 1 && (
                <button type="button" className="ghost" onClick={() => setEntradas((a) => a.filter((_, idx) => idx !== i))}>Remover</button>
              )}
            </div>
          ))}
          <div className="row">
            <button type="button" onClick={() => setEntradas((a) => [...a, { ...ENTRADA_VAZIA }])}>Adicionar entrada</button>
          </div>
          <details>
            <summary className="label">Colar JSON avançado</summary>
            <textarea
              className="mono"
              style={{ marginTop: 8 }}
              rows={4}
              aria-label="Lista de vagas em JSON"
              placeholder='[{"titulo":"...","empresa":"...","fonte":"...","descricao":"..."}]'
              value={json}
              onChange={(ev) => setJson(ev.target.value)}
            />
          </details>
          {erro && <span className="error" role="alert">{erro}</span>}
          <div className="row">
            <button className="accent" onClick={importar} disabled={!!processando}>
              {processando ? 'Processando...' : 'Importar e classificar'}
            </button>
            {lote && (
              <span className="notice num" role="status">
                lote {lote.processados}/{lote.total} {lote.status.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Banco de vagas</h2>
          <span className="label">{lista.length} postagens</span>
        </div>
        {lista.length === 0 ? (
          <div className="panel-body notice">Nenhuma postagem importada ainda.</div>
        ) : (
          <div className="table-wrap">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Vaga</th>
                  <th style={{ width: 170 }}>Classificação</th>
                  <th className="num-col" style={{ width: 90 }}>Keywords</th>
                  <th style={{ width: 140 }}>Importada</th>
                  <th style={{ width: 100 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div>{b.titulo}</div>
                      <div className="faint" style={{ fontSize: 12 }}>
                        {b.empresa}
                        {b.fonte && (
                          <>
                            {' · '}
                            <a href={b.fonte} target="_blank" rel="noreferrer">Abrir fonte</a>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      {b.categoria ? (
                        <div className="chip-set">
                          <span className="chip">{b.categoria}</span>
                          {b.nivel && b.nivel !== 'indefinido' && <span className="chip">{b.nivel}</span>}
                        </div>
                      ) : (
                        <span className="notice">Classificando...</span>
                      )}
                    </td>
                    <td className="num-col">{b.keywords?.length ?? 0}</td>
                    <td className="num-col" style={{ fontSize: 12 }}>{fmtData(b.criadoEm)}</td>
                    <td>
                      {b.status === 'ATIVADA' ? (
                        <span className="chip">Ativada</span>
                      ) : (
                        <button onClick={() => ativar(b.id)}>Ativar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
