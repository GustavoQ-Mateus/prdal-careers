import { useEffect, useState } from 'react';
import {
  atualizarCandidatura,
  listarCandidaturas,
  STATUS_CANDIDATURA,
  type Candidatura,
  type StatusCandidatura,
} from './api';

const ROTULOS: Record<StatusCandidatura, string> = {
  RASCUNHO: 'Rascunho',
  INSCRITA: 'Inscrita',
  EM_PROCESSO: 'Em processo',
  ENTREVISTA: 'Entrevista',
  OFERTA: 'Oferta',
  REJEITADA: 'Rejeitada',
  DESISTIU: 'Desisti',
};

export function Kanban() {
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarCandidaturas()
      .then(setCandidaturas)
      .catch((err) => setErro((err as Error).message));
  }, []);

  function aplicar(id: string, patch: Partial<Candidatura>) {
    setCandidaturas((atual) => atual.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function mudarStatus(c: Candidatura, status: StatusCandidatura) {
    aplicar(c.id, { status });
    try {
      await atualizarCandidatura(c.id, { status });
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function salvarNotas(c: Candidatura, notas: string) {
    if (notas === c.notas) return;
    try {
      await atualizarCandidatura(c.id, { notas });
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Candidaturas</h2>
        <span className="label">{candidaturas.length} no total</span>
      </div>
      {erro && <div className="panel-body error">{erro}</div>}
      {candidaturas.length === 0 ? (
        <div className="panel-body notice">
          Nenhuma candidatura. Em Vagas, use acompanhar candidatura para começar.
        </div>
      ) : (
        <div className="kanban">
          {STATUS_CANDIDATURA.map((status) => {
            const coluna = candidaturas.filter((c) => c.status === status);
            return (
              <div key={status} className="kanban-col">
                <div className="kanban-col-head">
                  <span className="label">{ROTULOS[status]}</span>
                  <span className="num faint">{coluna.length}</span>
                </div>
                {coluna.map((c) => (
                  <div key={c.id} className="kanban-card">
                    <div className="kanban-card-title">{c.tituloVaga}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{c.empresa}</div>
                    <select
                      value={c.status}
                      onChange={(e) => mudarStatus(c, e.target.value as StatusCandidatura)}
                    >
                      {STATUS_CANDIDATURA.map((s) => (
                        <option key={s} value={s}>{ROTULOS[s]}</option>
                      ))}
                    </select>
                    <input
                      placeholder="notas"
                      defaultValue={c.notas}
                      onBlur={(e) => salvarNotas(c, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
