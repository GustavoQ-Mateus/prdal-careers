import { useEffect, useMemo, useState } from 'react';
import { listarCurriculos, type CurriculoResumo } from './api';
import { Delta, fmtData, Meter, Score } from './ui';

function diffFaltando(base: string[], outro: string[]): string[] {
  const set = new Set(outro);
  return base.filter((k) => !set.has(k));
}

function Comparativo({ versoes }: { versoes: CurriculoResumo[] }) {
  const [baseId, setBaseId] = useState(versoes[1].id);
  const [alvoId, setAlvoId] = useState(versoes[0].id);

  const base = versoes.find((v) => v.id === baseId)!;
  const alvo = versoes.find((v) => v.id === alvoId)!;

  const cobertasAMais = diffFaltando(base.breakdown.faltando, alvo.breakdown.faltando);
  const faltantesAMais = diffFaltando(alvo.breakdown.faltando, base.breakdown.faltando);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Comparativo entre versoes</h2>
      </div>
      <div className="panel-body stack">
        <div className="two-col">
          <div className="field">
            <span className="label">Base</span>
            <select value={baseId} onChange={(e) => setBaseId(e.target.value)}>
              {versoes.map((v) => (
                <option key={v.id} value={v.id}>{`${v.rotulo} (${v.score})`}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="label">Comparar com</span>
            <select value={alvoId} onChange={(e) => setAlvoId(e.target.value)}>
              {versoes.map((v) => (
                <option key={v.id} value={v.id}>{`${v.rotulo} (${v.score})`}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="two-col">
          <div className="field">
            <span className="label">{base.rotulo}</span>
            <div className="row" style={{ gap: 12 }}>
              <Score valor={base.score} hero />
              <div style={{ flex: 1 }}><Meter valor={base.score} /></div>
            </div>
          </div>
          <div className="field">
            <span className="label">{`${alvo.rotulo}  `}<Delta valor={alvo.score - base.score} /></span>
            <div className="row" style={{ gap: 12 }}>
              <Score valor={alvo.score} hero />
              <div style={{ flex: 1 }}><Meter valor={alvo.score} /></div>
            </div>
          </div>
        </div>

        <div className="two-col">
          <div className="field">
            <span className="label">Cobertas a mais em {alvo.rotulo} ({cobertasAMais.length})</span>
            {cobertasAMais.length > 0 ? (
              <div className="chip-set">
                {cobertasAMais.map((k) => <span key={k} className="chip">{k}</span>)}
              </div>
            ) : (
              <span className="notice">nenhuma</span>
            )}
          </div>
          <div className="field">
            <span className="label">Faltantes a mais em {alvo.rotulo} ({faltantesAMais.length})</span>
            {faltantesAMais.length > 0 ? (
              <div className="chip-set">
                {faltantesAMais.map((k) => <span key={k} className="chip chip--missing">{k}</span>)}
              </div>
            ) : (
              <span className="notice">nenhuma</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function VagaVersoes({
  vagaId,
  titulo,
  onAbrir,
  onVoltar,
}: {
  vagaId: string;
  titulo: string;
  onAbrir: (curriculoId: string) => void;
  onVoltar: () => void;
}) {
  const [versoes, setVersoes] = useState<CurriculoResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarCurriculos(vagaId)
      .then(setVersoes)
      .catch((err) => setErro((err as Error).message));
  }, [vagaId]);

  const podeComparar = useMemo(() => (versoes?.length ?? 0) >= 2, [versoes]);

  return (
    <div className="stack">
      <div className="spread">
        <div>
          <button className="ghost" onClick={onVoltar}>&larr; Dashboard</button>
          <h1 style={{ marginTop: 8 }}>{titulo}</h1>
        </div>
      </div>

      {erro && <div className="error">{erro}</div>}

      <section className="panel">
        <div className="panel-head">
          <h2>Versoes de curriculo</h2>
          <span className="label">{versoes ? `${versoes.length} versoes` : ''}</span>
        </div>
        {!versoes && !erro && <div className="panel-body notice">Carregando...</div>}
        {versoes && versoes.length === 0 && (
          <div className="panel-body notice">Nenhum curriculo gerado para esta vaga ainda.</div>
        )}
        {versoes && versoes.length > 0 && (
          <table className="grid-table">
            <thead>
              <tr>
                <th>Versao</th>
                <th style={{ width: 200 }}>Score</th>
                <th className="num-col" style={{ width: 90 }}>Faltantes</th>
                <th className="num-col" style={{ width: 130 }}>Gerado</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {versoes.map((v) => (
                <tr key={v.id}>
                  <td>{v.rotulo}</td>
                  <td>
                    <div className="row" style={{ gap: 12 }}>
                      <Score valor={v.score} />
                      <div style={{ flex: 1 }}><Meter valor={v.score} /></div>
                    </div>
                  </td>
                  <td className="num-col">{v.breakdown.faltando.length}</td>
                  <td className="num-col" style={{ fontSize: 12 }}>{fmtData(v.geradoEm)}</td>
                  <td>
                    <button className="ghost" onClick={() => onAbrir(v.id)}>abrir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {versoes && podeComparar && <Comparativo versoes={versoes} />}
    </div>
  );
}
