import { useEffect, useState } from 'react';
import {
  atualizarCandidatura,
  cancelarAcao,
  candidaturaPrincipal,
  concluirAcao,
  postNotaTimeline,
  getWorkspace,
  transicionarOportunidade,
  type DestinoTransicao,
  type WorkspaceOportunidade,
} from './api';
import { ROTULO_ACAO, ROTULO_ETAPA, ROTULO_PRIORIDADE, ROTULO_STATUS } from './rotulos';
import { fmtData } from './ui';
import { ScoreNum } from './components/Score';
import { Markdown } from './components/Markdown';
import { EditarDialog } from './OportunidadeDialogs';
import { AcaoDialog } from './WorkspaceDialogs';
import { GeracaoWizard } from './GeracaoWizard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const TRANSICOES: { valor: DestinoTransicao; nome: string }[] = [
  { valor: 'PREPARACAO', nome: 'Preparacao' },
  { valor: 'INSCRITA', nome: 'Inscrita' },
  { valor: 'EM_PROCESSO', nome: 'Em processo' },
  { valor: 'ENTREVISTA', nome: 'Entrevista' },
  { valor: 'OFERTA', nome: 'Oferta' },
  { valor: 'REJEITADA', nome: 'Rejeitada' },
  { valor: 'DESISTIU', nome: 'Desistiu' },
  { valor: 'ARQUIVADA', nome: 'Arquivar' },
  { valor: 'REABRIR', nome: 'Reabrir' },
];

function Regiao({
  id,
  titulo,
  acao,
  children,
}: {
  id: string;
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-card border border-line bg-ground p-5 nav:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-section text-ink">{titulo}</h3>
        {acao}
      </div>
      {children}
    </section>
  );
}

export function Workspace({
  id,
  onCurriculo,
}: {
  id: string;
  onCurriculo: (curriculoId: string) => void;
}) {
  const [ws, setWs] = useState<WorkspaceOportunidade | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [nota, setNota] = useState('');
  const [motivo, setMotivo] = useState('');
  const [editarAberto, setEditarAberto] = useState(false);
  const [acaoAberta, setAcaoAberta] = useState(false);
  const [wizardAberto, setWizardAberto] = useState(false);

  function carregar() {
    getWorkspace(id)
      .then(setWs)
      .catch((err) => setErro((err as Error).message));
  }

  useEffect(carregar, [id]);

  if (erro && !ws) {
    return (
      <div className="rounded-card border border-score-bad/40 bg-ground px-4 py-3 text-[14px] text-score-bad" role="alert">
        {erro}
      </div>
    );
  }
  if (!ws) return <p className="py-10 text-[14px] text-muted">Carregando workspace...</p>;

  const o = ws.oportunidade;
  const etapa = o.etapa ?? 'PREPARACAO';
  const prioridade = o.prioridade ?? 'MEDIA';
  const temCurriculo = ws.curriculos.length > 0;
  const cand = ws.candidatura;

  async function prepararCandidatura() {
    setErro(null);
    try {
      await candidaturaPrincipal(id);
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function transicionar(destino: DestinoTransicao) {
    setErro(null);
    try {
      await transicionarOportunidade(id, destino, motivo || undefined);
      setMotivo('');
      setStatus(`Etapa movida para ${destino}`);
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function registrarEnvio() {
    setErro(null);
    try {
      await transicionarOportunidade(id, 'INSCRITA');
      setStatus('Envio registrado');
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function vincular(curriculoId: string) {
    if (!cand) return;
    setErro(null);
    try {
      await atualizarCandidatura(cand.id, { curriculoId: curriculoId || undefined });
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function adicionarNota(e: React.FormEvent) {
    e.preventDefault();
    if (!nota.trim()) return;
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
    ? { rotulo: 'Gerar curriculo', run: () => setWizardAberto(true) }
    : !cand
      ? { rotulo: 'Preparar candidatura', run: () => void prepararCandidatura() }
      : cand.status === 'RASCUNHO'
        ? { rotulo: 'Registrar envio', run: () => void registrarEnvio() }
        : !ws.acaoPrincipal
          ? { rotulo: 'Definir proximo passo', run: () => setAcaoAberta(true) }
          : {
              rotulo: 'Registrar atualizacao',
              run: () => document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth' }),
            };

  return (
    <div className="flex flex-col gap-8">
      <header className="sticky top-0 z-20 -mx-6 border-b border-line bg-canvas px-6 py-4 nav:-mx-8 nav:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-page text-ink">{o.titulo}</h2>
            <p className="mt-1 text-[14px] text-muted">
              {o.empresa}
              {o.categoria ? ` · ${o.categoria}` : ''}
              {o.nivel ? ` · ${o.nivel}` : ''}
              {' · '}
              {ROTULO_ETAPA[etapa]}
              {' · Prioridade '}
              {ROTULO_PRIORIDADE[prioridade]}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" onClick={() => setEditarAberto(true)}>
              Editar
            </Button>
            <Button onClick={() => acaoDominante.run()}>{acaoDominante.rotulo}</Button>
          </div>
        </div>
      </header>

      {erro && (
        <div
          className="rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad"
          role="alert"
        >
          {erro}
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {status}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-8">
          <Regiao id="descricao" titulo="Resumo e descricao">
            <Markdown source={o.descricao ?? ''} className="text-[15px]" />
            {o.keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {o.keywords.map((k) => (
                  <Badge key={k.termo} variant="neutral">
                    {k.termo}
                  </Badge>
                ))}
              </div>
            )}
          </Regiao>

          <Regiao
            id="ats"
            titulo="Geracao de curriculo"
            acao={<Button size="sm" onClick={() => setWizardAberto(true)}>Gerar curriculo ATS</Button>}
          >
            {temCurriculo ? (
              <ul className="flex flex-col divide-y divide-line">
                {ws.curriculos.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                    <button
                      onClick={() => onCurriculo(c.id)}
                      className="text-left text-[14px] font-medium text-ink transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
                    >
                      {c.rotulo}
                    </button>
                    <span className="flex items-center gap-3 text-[13px] text-faint">
                      {typeof c.score === 'number' ? <ScoreNum valor={c.score} /> : '--'}
                      <span className="font-mono tabular-nums">{fmtData(c.geradoEm)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-muted">
                Nenhuma versao gerada. Inicie a geracao ATS para produzir o primeiro curriculo tailored.
              </p>
            )}
          </Regiao>

          <Regiao id="candidatura" titulo="Candidatura e curriculo vinculado">
            {!cand ? (
              <div className="flex flex-col gap-3">
                <p className="text-[14px] text-muted">
                  Nenhuma candidatura principal. Crie para registrar envio, vinculo e etapa.
                </p>
                <div>
                  <Button variant="secondary" onClick={() => void prepararCandidatura()}>
                    Preparar candidatura
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-[14px] text-ink-2">
                  Status {ROTULO_STATUS[cand.status]}
                  {cand.vinculo.situacao === 'VINCULADO' && cand.vinculo.rotulo
                    ? ` · vinculo ${cand.vinculo.rotulo} (${cand.vinculo.score ?? '--'})`
                    : ' · curriculo nao registrado'}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ws-curriculo">Curriculo vinculado</Label>
                    <NativeSelect
                      id="ws-curriculo"
                      value={cand.curriculoId ?? ''}
                      onChange={(e) => void vincular(e.target.value)}
                    >
                      <option value="">Nao registrado</option>
                      {ws.curriculos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.rotulo}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ws-etapa">Mover etapa</Label>
                    <NativeSelect
                      id="ws-etapa"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) void transicionar(e.target.value as DestinoTransicao);
                      }}
                    >
                      <option value="">Selecionar destino...</option>
                      {TRANSICOES.map((t) => (
                        <option key={t.valor} value={t.valor}>
                          {t.nome}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ws-motivo">Motivo da transicao</Label>
                  <Input
                    id="ws-motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            )}
          </Regiao>

          <Regiao
            id="proxima"
            titulo="Proximos passos"
            acao={<Button size="sm" variant="secondary" onClick={() => setAcaoAberta(true)}>Novo passo</Button>}
          >
            {ws.acoes.length === 0 ? (
              <p className="text-[14px] text-muted">Nenhum passo definido. Registre a proxima acao.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {ws.acoes.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {a.principal && <Badge variant="accent">Principal</Badge>}
                        <span className="truncate text-[14px] text-ink">{a.titulo}</span>
                      </div>
                      <span className="text-[13px] text-faint">
                        {a.tipo ? `${ROTULO_ACAO[a.tipo as keyof typeof ROTULO_ACAO] ?? a.tipo} · ` : ''}
                        {fmtData(a.venceEm)}
                      </span>
                    </div>
                    {!a.concluidaEm && !a.canceladaEm && (
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="ghost" onClick={() => concluirAcao(a.id).then(carregar)}>
                          Concluir
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => cancelarAcao(a.id).then(carregar)}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Regiao>

          <Regiao id="timeline" titulo="Timeline de eventos">
            <form onSubmit={adicionarNota} className="mb-4 flex gap-2">
              <Input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Nota imutavel"
                aria-label="Nova nota"
              />
              <Button type="submit" variant="secondary">
                Registrar
              </Button>
            </form>
            {ws.timeline.length === 0 ? (
              <p className="text-[14px] text-muted">Sem eventos registrados.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {ws.timeline.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[14px] text-ink-2">{e.descricao}</p>
                      <span className="font-mono text-[12px] tabular-nums text-faint">
                        {fmtData(e.ocorridoEm)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Regiao>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-5 rounded-card border border-line bg-ground p-5">
            <div>
              <span className="text-label uppercase text-muted">Proxima acao</span>
              <p className="mt-1 text-[14px] text-ink">{ws.acaoPrincipal?.titulo ?? 'Nenhuma definida'}</p>
              {ws.acaoPrincipal?.venceEm && (
                <span className="font-mono text-[12px] tabular-nums text-faint">
                  {fmtData(ws.acaoPrincipal.venceEm)}
                </span>
              )}
            </div>
            <div className="border-t border-line pt-4">
              <span className="text-label uppercase text-muted">Etapa</span>
              <p className="mt-1 text-[14px] text-ink">{ROTULO_ETAPA[etapa]}</p>
            </div>
            <div className="border-t border-line pt-4">
              <span className="text-label uppercase text-muted">Atividade recente</span>
              {ws.timeline.length === 0 ? (
                <p className="mt-1 text-[14px] text-muted">Sem atividade</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2.5">
                  {ws.timeline.slice(0, 4).map((e) => (
                    <li key={e.id} className="text-[13px]">
                      <p className={cn('text-ink-2')}>{e.descricao}</p>
                      <span className="font-mono text-[11px] tabular-nums text-faint">
                        {fmtData(e.ocorridoEm)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      <EditarDialog
        open={editarAberto}
        onOpenChange={setEditarAberto}
        id={id}
        titulo={o.titulo}
        prioridadeAtual={o.prioridade ?? null}
        entrada={false}
        onAbrir={() => {}}
        onSalvo={() => {
          setStatus('Oportunidade atualizada');
          carregar();
        }}
      />

      <AcaoDialog
        open={acaoAberta}
        onOpenChange={setAcaoAberta}
        oportunidadeId={id}
        onCriada={() => {
          setStatus('Proximo passo definido');
          carregar();
        }}
      />

      <GeracaoWizard
        open={wizardAberto}
        onOpenChange={setWizardAberto}
        oportunidadeId={id}
        titulo={o.titulo}
        empresa={o.empresa}
        keywords={o.keywords}
        onConcluida={() => {
          setStatus('Curriculo gerado');
          carregar();
        }}
        onAbrirCurriculo={(curriculoId) => {
          setWizardAberto(false);
          onCurriculo(curriculoId);
        }}
      />
    </div>
  );
}
