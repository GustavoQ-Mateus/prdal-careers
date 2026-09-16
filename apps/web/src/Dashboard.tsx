import { useEffect, useState } from 'react';
import { getDashboard, type DashboardItem } from './api';
import { fmtData, Meter, Score } from './ui';

export function Dashboard({ onAbrirVaga }: { onAbrirVaga: (vagaId: string, titulo: string) => void }) {
  const [itens, setItens] = useState<DashboardItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setItens)
      .catch((err) => setErro((err as Error).message));
  }, []);

  const comCurriculo = itens?.filter((item) => item.melhorScore !== null) ?? [];
  const mediaScore = comCurriculo.length
    ? Math.round(
        comCurriculo.reduce((total, item) => total + (item.melhorScore ?? 0), 0)
        / comCurriculo.length,
      )
    : null;

  return (
    <div>
      {itens && (
        <section className="operational-strip" aria-label="Resumo das vagas">
          <div className="operational-metric">
            <span>Vagas em trabalho</span>
            <strong>{itens.length}</strong>
          </div>
          <div className="operational-metric">
            <span>Com currículo gerado</span>
            <strong>{comCurriculo.length}</strong>
          </div>
          <div className="operational-metric">
            <span>Score médio</span>
            <strong>{mediaScore ?? '--'}</strong>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Desempenho por vaga</h2>
          <span className="label">{itens ? `${itens.length} registros` : ''}</span>
        </div>
        {erro && <div className="panel-body error" role="alert">{erro}</div>}
        {!erro && !itens && <div className="panel-body notice">Carregando desempenho...</div>}
        {itens && itens.length === 0 && (
          <div className="panel-body notice">
            Nenhuma vaga ainda. Cadastre uma vaga e gere o primeiro currículo.
          </div>
        )}
        {itens && itens.length > 0 && (
          <div className="table-wrap">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Vaga</th>
                  <th style={{ width: 220 }}>Melhor score</th>
                  <th className="num-col" style={{ width: 90 }}>Versões</th>
                  <th className="num-col" style={{ width: 150 }}>Última geração</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr
                    key={item.vagaId}
                    className="clickable"
                    tabIndex={0}
                    onClick={() => onAbrirVaga(item.vagaId, item.titulo)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onAbrirVaga(item.vagaId, item.titulo);
                      }
                    }}
                  >
                    <td>
                      <div>{item.titulo}</div>
                      <div className="faint" style={{ fontSize: 12 }}>{item.empresa}</div>
                    </td>
                    <td>
                      {item.melhorScore === null ? (
                        <span className="notice">Sem currículo</span>
                      ) : (
                        <div className="row" style={{ gap: 12 }}>
                          <Score valor={item.melhorScore} />
                          <div style={{ flex: 1 }}>
                            <Meter valor={item.melhorScore} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="num-col">{item.versoes}</td>
                    <td className="num-col" style={{ fontSize: 12 }}>{fmtData(item.ultimaGeracao)}</td>
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
