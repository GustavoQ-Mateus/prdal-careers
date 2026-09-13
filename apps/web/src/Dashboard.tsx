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

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Dashboard de score</h2>
        <span className="label">{itens ? `${itens.length} vagas` : ''}</span>
      </div>
      {erro && <div className="panel-body error">{erro}</div>}
      {!erro && !itens && <div className="panel-body notice">Carregando...</div>}
      {itens && itens.length === 0 && (
        <div className="panel-body notice">
          Nenhuma vaga ainda. Cadastre uma vaga em Vagas e gere um currículo.
        </div>
      )}
      {itens && itens.length > 0 && (
        <table className="grid-table">
          <thead>
            <tr>
              <th>Vaga</th>
              <th style={{ width: 200 }}>Melhor score</th>
              <th className="num-col" style={{ width: 90 }}>Versões</th>
              <th className="num-col" style={{ width: 130 }}>Última geração</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr
                key={item.vagaId}
                className="clickable"
                onClick={() => onAbrirVaga(item.vagaId, item.titulo)}
              >
                <td>
                  <div>{item.titulo}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{item.empresa}</div>
                </td>
                <td>
                  {item.melhorScore === null ? (
                    <span className="notice">sem currículo</span>
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
      )}
    </section>
  );
}
