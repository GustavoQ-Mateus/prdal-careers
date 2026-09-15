import { useEffect, useState } from 'react';
import { baixarArquivo, listarCurriculosGlobal, type CurriculoGlobal } from './api';
import { fmtData, Score } from './ui';

export function Curriculos({
  onAbrir,
}: {
  onAbrir: (oportunidadeId: string, curriculoId: string) => void;
}) {
  const [itens, setItens] = useState<CurriculoGlobal[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [vinculado, setVinculado] = useState('');
  const [scoreMinimo, setScoreMinimo] = useState('');

  useEffect(() => {
    listarCurriculosGlobal({
      vinculado: vinculado || undefined,
      scoreMinimo: scoreMinimo || undefined,
    })
      .then(setItens)
      .catch((err) => setErro((err as Error).message));
  }, [vinculado, scoreMinimo]);

  return (
    <div className="stack">
      <div className="toolbar">
        <label className="field field-inline">
          <span className="label">Vinculo</span>
          <select value={vinculado} onChange={(e) => setVinculado(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Vinculados</option>
            <option value="false">Sem vinculo</option>
          </select>
        </label>
        <label className="field field-inline">
          <span className="label">Score minimo</span>
          <input
            type="number"
            min={0}
            max={100}
            value={scoreMinimo}
            onChange={(e) => setScoreMinimo(e.target.value)}
          />
        </label>
      </div>
      {erro && <div className="error" role="alert">{erro}</div>}
      {!itens && <div className="notice">Carregando curriculos...</div>}
      {itens && itens.length === 0 && (
        <div className="notice">Nenhum curriculo nesta biblioteca ainda.</div>
      )}
      {itens && itens.length > 0 && (
        <section className="panel">
          <div className="table-wrap">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Rotulo</th>
                  <th>Oportunidade</th>
                  <th>Score</th>
                  <th>Gerado</th>
                  <th>Vinculo</th>
                  <th>Arquivos</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <button className="linkish" onClick={() => onAbrir(c.vagaId, c.id)}>
                        {c.rotulo}
                      </button>
                    </td>
                    <td>
                      {c.oportunidade.titulo}
                      <div className="faint">{c.oportunidade.empresa}</div>
                    </td>
                    <td>{c.score !== null ? <Score valor={c.score} /> : '--'}</td>
                    <td className="num">{fmtData(c.geradoEm)}</td>
                    <td>{c.vinculo ? c.vinculo.status : 'Sem vinculo'}</td>
                    <td className="row">
                      {c.downloadDocxUrl && (
                        <button onClick={() => baixarArquivo(c.downloadDocxUrl!, `${c.rotulo}.docx`)}>
                          DOCX
                        </button>
                      )}
                      {c.downloadPdfUrl && (
                        <button onClick={() => baixarArquivo(c.downloadPdfUrl!, `${c.rotulo}.pdf`)}>
                          PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
