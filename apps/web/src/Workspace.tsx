import { useEffect, useState } from 'react';
import {
  atualizarCandidatura,
  cancelarAcao,
  candidaturaPrincipal,
  concluirAcao,
  criarAcao,
  gerarCvOportunidade,
  getGeracao,
  getWorkspace,
  patchOportunidade,
  postNotaTimeline,
  transicionarOportunidade,
  type DestinoTransicao,
  type PrioridadeOportunidade,
  type StatusGeracaoCurriculo,
  type TipoAcaoOportunidade,
  type WorkspaceOportunidade,
} from './api';
import {
  ROTULO_ACAO,
  ROTULO_ETAPA,
  ROTULO_GERACAO,
  ROTULO_PRIORIDADE,
  ROTULO_STATUS,
} from './rotulos';
import { fmtData } from './ui';

const TIPOS: TipoAcaoOportunidade[] = [
  'REVISAR_VAGA',
  'GERAR_CURRICULO',
  'ENVIAR_CANDIDATURA',
  'FAZER_FOLLOW_UP',
  'PREPARAR_ENTREVISTA',
  'PARTICIPAR_ENTREVISTA',
  'ENVIAR_MATERIAL',
  'OUTRO',
];

export function Workspace({
  id,
  onCurriculo,
}: {
  id: string;
  onCurriculo: (curriculoId: string) => void;
}) {
  const [ws, setWs] = useState<WorkspaceOportunidade | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusGeracao, setStatusGeracao] = useState<StatusGeracaoCurriculo | null>(null);
  const [tituloAcao, setTituloAcao] = useState('');
  const [tipoAcao, setTipoAcao] = useState<TipoAcaoOportunidade>('OUTRO');
  const [venceEm, setVenceEm] = useState('');
  const [nota, setNota] = useState('');
  const [motivo, setMotivo] = useState('');

  function carregar() {
    getWorkspace(id)
      .then(setWs)
      .catch((err) => setErro((err as Error).message));
  }

  useEffect(carregar, [id]);

  useEffect(() => {
    if (!jobId) return;
    const timer = setInterval(async () => {
      try {
        const g = await getGeracao(jobId);
        setStatusGeracao(g.status);
        if (g.status === 'CONCLUIDA' && g.curriculoId) {
          clearInterval(timer);
          setJobId(null);
          carregar();
          onCurriculo(g.curriculoId);
        }
        if (g.status === 'ERRO') {
          clearInterval(timer);
          setErro(g.erro ?? 'Falha na geracao');
        }
      } catch (err) {
        setErro((err as Error).message);
      }
    }, 1200);
    return () => clearInterval(timer);
  }, [jobId]);

  if (erro && !ws) return <div className="error">{erro}</div>;
  if (!ws) return <div className="notice">Carregando workspace...</div>;

  const o = ws.oportunidade;
  const etapa = o.etapa ?? 'PREPARACAO';
  const temCurriculo = ws.curriculos.length > 0;
  const cand = ws.candidatura;

  async function gerar() {
    setErro(null);
    try {
      const { jobId: novo } = await gerarCvOportunidade(id);
      setJobId(novo);
      setStatusGeracao('PENDENTE');
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function prioridade(valor: PrioridadeOportunidade) {
    await patchOportunidade(id, { prioridade: valor });
    carregar();
  }

  async function transicionar(destino: DestinoTransicao) {
    setErro(null);
    try {
      await transicionarOportunidade(id, destino, motivo || undefined);
      setMotivo('');
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function prepararCandidatura() {
    setErro(null);
    try {
      await candidaturaPrincipal(id);
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function registrarEnvio() {
    if (!cand) return;
    setErro(null);
    try {
      await transicionarOportunidade(id, 'INSCRITA');
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function vincular(curriculoId: string | '') {
    if (!cand) return;
    setErro(null);
    try {
      await atualizarCandidatura(cand.id, {
        curriculoId: curriculoId || undefined,
      });
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function criarProximo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await criarAcao(id, {
        titulo: tituloAcao,
        tipo: tipoAcao,
        principal: true,
        venceEm: venceEm ? new Date(venceEm).toISOString() : undefined,
      });
      setTituloAcao('');
      setVenceEm('');
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function adicionarNota(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await postNotaTimeline(id, nota);
      setNota('');
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  const acaoDominante = !temCurriculo
    ? { rotulo: 'Gerar curriculo', run: gerar }
    : !cand
      ? { rotulo: 'Preparar candidatura', run: prepararCandidatura }
      : cand.status === 'RASCUNHO'
        ? { rotulo: 'Registrar envio', run: registrarEnvio }
        : !ws.acaoPrincipal
          ? { rotulo: 'Definir proximo passo', run: () => document.getElementById('proxima-acao')?.scrollIntoView() }
          : { rotulo: 'Registrar atualizacao', run: () => document.getElementById('timeline')?.scrollIntoView() };

  return (
    <div className="workspace-split">
      <div className="stack">
        {erro && <div className="error" role="alert">{erro}</div>}
        <section className="page-strip">
          <div>
            <h2>{o.titulo}</h2>
            <p className="faint">
              {o.empresa}
              {o.categoria ? ` · ${o.categoria}` : ''}
              {o.nivel ? ` · ${o.nivel}` : ''}
              {' · '}
              {ROTULO_ETAPA[etapa]}
            </p>
          </div>
          <div className="row wrap">
            <label className="field field-inline">
              <span className="label">Prioridade</span>
              <select
                value={o.prioridade ?? 'MEDIA'}
                onChange={(e) => void prioridade(e.target.value as PrioridadeOportunidade)}
              >
                {Object.entries(ROTULO_PRIORIDADE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <button className="accent" onClick={() => void acaoDominante.run()}>
              {acaoDominante.rotulo}
            </button>
          </div>
        </section>

        <nav className="anchor-nav" aria-label="Regioes do workspace">
          <a href="#descricao">Descricao</a>
          <a href="#ats">Curriculo ATS</a>
          <a href="#candidatura">Candidatura</a>
          <a href="#proxima-acao">Proximos passos</a>
          <a href="#timeline">Timeline</a>
        </nav>

        <section id="descricao" className="region">
          <h3>Descricao e keywords</h3>
          <p className="prose">{o.descricao}</p>
          <div className="chip-set">
            {o.keywords.map((k) => (
              <span key={k.termo} className="chip">{k.termo}</span>
            ))}
          </div>
        </section>

        <section id="ats" className="region">
          <h3>Geracao ATS</h3>
          <ol className="steps">
            <li className={statusGeracao === 'ANALISANDO' ? 'is-current' : ''}>
              Analisar vaga e recuperar contexto
            </li>
            <li className={statusGeracao === 'GERANDO' ? 'is-current' : ''}>
              Gerar curriculo
            </li>
            <li className={statusGeracao === 'VALIDANDO' || statusGeracao === 'CONCLUIDA' ? 'is-current' : ''}>
              Validar, revisar e exportar
            </li>
          </ol>
          {statusGeracao && statusGeracao !== 'CONCLUIDA' && (
            <div className="notice" role="status">{ROTULO_GERACAO[statusGeracao]}</div>
          )}
          <div className="row">
            <button className="accent" onClick={() => void gerar()} disabled={!!jobId}>
              {jobId ? 'Gerando...' : 'Iniciar geracao'}
            </button>
          </div>
          <ul className="plain-list">
            {ws.curriculos.map((c) => (
              <li key={c.id}>
                <button className="linkish" onClick={() => onCurriculo(c.id)}>
                  {c.rotulo}
                </button>
                <span className="faint"> · score {c.score ?? '--'} · {fmtData(c.geradoEm)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="candidatura" className="region">
          <h3>Candidatura</h3>
          {!cand ? (
            <button onClick={() => void prepararCandidatura()}>Criar candidatura principal</button>
          ) : (
            <div className="stack">
              <p>
                Status: {ROTULO_STATUS[cand.status]}
                {cand.vinculo.situacao === 'VINCULADO' && cand.vinculo.rotulo
                  ? ` · vinculo ${cand.vinculo.rotulo} (${cand.vinculo.score ?? '--'})`
                  : ' · curriculo nao registrado'}
              </p>
              <label className="field">
                <span className="label">Curriculo vinculado</span>
                <select
                  value={cand.curriculoId ?? ''}
                  onChange={(e) => void vincular(e.target.value)}
                >
                  <option value="">Nao registrado</option>
                  {ws.curriculos.map((c) => (
                    <option key={c.id} value={c.id}>{c.rotulo}</option>
                  ))}
                </select>
              </label>
              <div className="row wrap">
                <select
                  aria-label="Transicao de etapa"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) void transicionar(e.target.value as DestinoTransicao);
                    e.target.value = '';
                  }}
                >
                  <option value="">Mover etapa...</option>
                  <option value="PREPARACAO">Preparacao</option>
                  <option value="INSCRITA">Inscrita</option>
                  <option value="EM_PROCESSO">Em processo</option>
                  <option value="ENTREVISTA">Entrevista</option>
                  <option value="OFERTA">Oferta</option>
                  <option value="REJEITADA">Rejeitada</option>
                  <option value="DESISTIU">Desistiu</option>
                  <option value="ARQUIVADA">Arquivar</option>
                  <option value="REABRIR">Reabrir</option>
                </select>
                <input
                  placeholder="Motivo opcional"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        <section id="proxima-acao" className="region">
          <h3>Proximos passos</h3>
          <form onSubmit={criarProximo} className="form-grid">
            <label className="field">
              <span className="label">Titulo</span>
              <input value={tituloAcao} onChange={(e) => setTituloAcao(e.target.value)} required />
            </label>
            <div className="two-col">
              <label className="field">
                <span className="label">Tipo</span>
                <select value={tipoAcao} onChange={(e) => setTipoAcao(e.target.value as TipoAcaoOportunidade)}>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{ROTULO_ACAO[t]}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Prazo</span>
                <input type="datetime-local" value={venceEm} onChange={(e) => setVenceEm(e.target.value)} />
              </label>
            </div>
            <button className="accent" type="submit">Definir proximo passo</button>
          </form>
          <ul className="plain-list">
            {ws.acoes.map((a) => (
              <li key={a.id} className="spread">
                <span>
                  {a.principal ? 'Principal · ' : ''}
                  {a.titulo}
                  <span className="faint"> · {fmtData(a.venceEm)}</span>
                </span>
                {!a.concluidaEm && !a.canceladaEm && (
                  <span className="row">
                    <button onClick={() => concluirAcao(a.id).then(carregar)}>Concluir</button>
                    <button onClick={() => cancelarAcao(a.id).then(carregar)}>Cancelar</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section id="timeline" className="region">
          <h3>Timeline</h3>
          <form onSubmit={adicionarNota} className="row">
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota imutavel"
              required
            />
            <button type="submit">Registrar</button>
          </form>
          <ul className="timeline">
            {ws.timeline.map((e) => (
              <li key={e.id}>
                <strong>{e.descricao}</strong>
                <span className="faint"> · {fmtData(e.ocorridoEm)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="inspector">
        <h3>Inspetor</h3>
        <p>
          <span className="label">Etapa</span>
          <div>{ROTULO_ETAPA[etapa]}</div>
        </p>
        <p>
          <span className="label">Proximo passo</span>
          <div>{ws.acaoPrincipal?.titulo ?? 'Nenhum'}</div>
        </p>
        <p>
          <span className="label">Ultima atividade</span>
          <div>{fmtData(ws.timeline[0]?.ocorridoEm ?? o.ultimaAtividade)}</div>
        </p>
      </aside>
    </div>
  );
}
