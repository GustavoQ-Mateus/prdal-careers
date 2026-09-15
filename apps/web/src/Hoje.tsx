import { useEffect, useState } from 'react';
import {
  cancelarAcao,
  concluirAcao,
  criarAcao,
  getHoje,
  patchAcao,
  type HojeAcao,
  type HojeResposta,
  type TipoAcaoOportunidade,
} from './api';
import { ROTULO_ACAO } from './rotulos';
import { fmtData } from './ui';

export function Hoje({ onAbrir }: { onAbrir: (id: string) => void }) {
  const [dados, setDados] = useState<HojeResposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [reagendando, setReagendando] = useState<string | null>(null);
  const [quando, setQuando] = useState('');
  const [passo, setPasso] = useState<{ id: string; titulo: string } | null>(null);

  function carregar() {
    getHoje()
      .then(setDados)
      .catch((err) => setErro((err as Error).message));
  }

  useEffect(carregar, []);

  async function concluir(id: string) {
    setErro(null);
    try {
      await concluirAcao(id);
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function cancelar(id: string) {
    setErro(null);
    try {
      await cancelarAcao(id);
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function reagendar(id: string) {
    if (!quando) return;
    setErro(null);
    try {
      await patchAcao(id, { venceEm: new Date(quando).toISOString() });
      setReagendando(null);
      setQuando('');
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function definirPasso(vagaId: string) {
    if (!passo || passo.id !== vagaId || !passo.titulo.trim()) return;
    setErro(null);
    try {
      await criarAcao(vagaId, {
        titulo: passo.titulo.trim(),
        tipo: 'OUTRO' as TipoAcaoOportunidade,
        principal: true,
      });
      setPasso(null);
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  if (!dados && !erro) return <div className="notice">Carregando agenda...</div>;

  const vazio =
    dados &&
    dados.atrasadas.length === 0 &&
    dados.hoje.length === 0 &&
    dados.proximosDias.length === 0 &&
    dados.semProximoPasso.length === 0;

  return (
    <div className="stack">
      {erro && <div className="error" role="alert">{erro}</div>}
      {dados && (
        <section className="operational-strip" aria-label="Contexto ATS">
          <div className="operational-metric">
            <span>Curriculos</span>
            <strong>{dados.resumoAts.curriculos}</strong>
          </div>
          <div className="operational-metric">
            <span>Com score</span>
            <strong>{dados.resumoAts.comScore}</strong>
          </div>
          <div className="operational-metric">
            <span>Score medio</span>
            <strong>{dados.resumoAts.media ?? '--'}</strong>
          </div>
        </section>
      )}

      {vazio && (
        <section className="panel">
          <div className="panel-body notice">
            Nenhuma pendencia hoje. Abra Oportunidades para registrar uma vaga ou definir o proximo passo.
          </div>
        </section>
      )}

      {dados && (
        <>
          <AgendaGrupo
            titulo="Atrasados"
            itens={dados.atrasadas}
            vazio="Nenhuma acao atrasada."
            atraso
            onAbrir={onAbrir}
            onConcluir={concluir}
            onCancelar={cancelar}
            onReagendar={(id) => setReagendando(id)}
            reagendando={reagendando}
            quando={quando}
            setQuando={setQuando}
            confirmarReagendar={reagendar}
          />
          <AgendaGrupo
            titulo="Hoje"
            itens={dados.hoje}
            vazio="Nada com prazo para hoje."
            onAbrir={onAbrir}
            onConcluir={concluir}
            onCancelar={cancelar}
            onReagendar={(id) => setReagendando(id)}
            reagendando={reagendando}
            quando={quando}
            setQuando={setQuando}
            confirmarReagendar={reagendar}
          />
          <AgendaGrupo
            titulo="Proximos sete dias"
            itens={dados.proximosDias}
            vazio="Nenhum prazo nos proximos dias."
            onAbrir={onAbrir}
            onConcluir={concluir}
            onCancelar={cancelar}
            onReagendar={(id) => setReagendando(id)}
            reagendando={reagendando}
            quando={quando}
            setQuando={setQuando}
            confirmarReagendar={reagendar}
          />

          <section className="panel">
            <div className="panel-head">
              <h2>Ativas sem proximo passo</h2>
              <span className="label num">{dados.semProximoPasso.length}</span>
            </div>
            {dados.semProximoPasso.length === 0 ? (
              <div className="panel-body notice">Todas as ativas tem um proximo passo.</div>
            ) : (
              <ul className="agenda-list">
                {dados.semProximoPasso.map((item) => (
                  <li key={item.id} className="agenda-item">
                    <div>
                      <button className="linkish" onClick={() => onAbrir(item.id)}>
                        {item.titulo}
                      </button>
                      <div className="faint">{item.empresa}</div>
                    </div>
                    {passo?.id === item.id ? (
                      <form
                        className="row"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void definirPasso(item.id);
                        }}
                      >
                        <input
                          aria-label="Proximo passo"
                          value={passo.titulo}
                          onChange={(e) => setPasso({ id: item.id, titulo: e.target.value })}
                          required
                        />
                        <button className="accent" type="submit">Definir</button>
                      </form>
                    ) : (
                      <button onClick={() => setPasso({ id: item.id, titulo: '' })}>
                        Definir proximo passo
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Atividade recente</h2>
            </div>
            {dados.atividadeRecente.length === 0 ? (
              <div className="panel-body notice">Ainda nao ha historico.</div>
            ) : (
              <ul className="timeline">
                {dados.atividadeRecente.map((e) => (
                  <li key={e.id}>
                    <button className="linkish" onClick={() => onAbrir(e.vagaId)}>
                      {e.titulo}
                    </button>
                    <span className="faint"> {e.descricao} · {fmtData(e.ocorridoEm)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function AgendaGrupo({
  titulo,
  itens,
  vazio,
  atraso,
  onAbrir,
  onConcluir,
  onCancelar,
  onReagendar,
  reagendando,
  quando,
  setQuando,
  confirmarReagendar,
}: {
  titulo: string;
  itens: HojeAcao[];
  vazio: string;
  atraso?: boolean;
  onAbrir: (id: string) => void;
  onConcluir: (id: string) => void;
  onCancelar: (id: string) => void;
  onReagendar: (id: string) => void;
  reagendando: string | null;
  quando: string;
  setQuando: (v: string) => void;
  confirmarReagendar: (id: string) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{titulo}</h2>
        <span className="label num">{itens.length}</span>
      </div>
      {itens.length === 0 ? (
        <div className="panel-body notice">{vazio}</div>
      ) : (
        <ul className="agenda-list">
          {itens.map((item) => (
            <li key={item.id} className="agenda-item">
              <div>
                <button className="linkish" onClick={() => onAbrir(item.vagaId)}>
                  {item.oportunidade.titulo}
                </button>
                <div>
                  {item.titulo}
                  {atraso && <span className="chip chip--missing">Atrasada</span>}
                </div>
                <div className="faint">
                  {ROTULO_ACAO[item.tipo as TipoAcaoOportunidade] ?? item.tipo}
                  {' · '}
                  {item.oportunidade.empresa}
                  {' · '}
                  {fmtData(item.venceEm)}
                </div>
              </div>
              <div className="row wrap">
                <button onClick={() => onConcluir(item.id)}>Concluir</button>
                {reagendando === item.id ? (
                  <>
                    <input
                      type="datetime-local"
                      aria-label="Novo prazo"
                      value={quando}
                      onChange={(e) => setQuando(e.target.value)}
                    />
                    <button className="accent" onClick={() => confirmarReagendar(item.id)}>
                      Salvar
                    </button>
                  </>
                ) : (
                  <button onClick={() => onReagendar(item.id)}>Reagendar</button>
                )}
                <button onClick={() => onCancelar(item.id)}>Cancelar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
