import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
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
import { ScoreNum } from './components/Score';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';

type EstadoAcao = 'concluida' | 'cancelada';

function rotuloTipo(tipo: string): string {
  return ROTULO_ACAO[tipo as TipoAcaoOportunidade] ?? tipo;
}

function GrupoTitulo({ titulo, contagem }: { titulo: string; contagem?: number }) {
  return (
    <div className="flex items-baseline gap-2 pb-2">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">{titulo}</h2>
      {typeof contagem === 'number' && contagem > 0 && (
        <span className="font-mono text-[12px] tabular-nums text-faint">{contagem}</span>
      )}
    </div>
  );
}

const CONFIG_VOLUME = {
  oportunidadesCriadas: { label: 'Oportunidades criadas', color: 'var(--accent)' },
  acoesConcluidas: { label: 'Ações concluídas', color: 'var(--ink-2)' },
  curriculosGerados: { label: 'Currículos gerados', color: 'var(--score-warn)' },
};

const CONFIG_SCORE = {
  scoreMedio: { label: 'Score médio', color: 'var(--accent)' },
};

function rotuloData(data: string) {
  return data.slice(5).replace('-', '/');
}

function DashboardTemporal({
  serie,
  periodo,
  onPeriodo,
}: {
  serie: HojeResposta['serieTemporal'];
  periodo: 7 | 30 | 90;
  onPeriodo: (periodo: 7 | 30 | 90) => void;
}) {
  const temVolume = serie.pontos.some(
    (ponto) => ponto.oportunidadesCriadas || ponto.acoesConcluidas || ponto.curriculosGerados,
  );
  const temScore = serie.pontos.some((ponto) => ponto.scoreMedio !== null);
  return (
    <section className="border-y border-line py-6" aria-labelledby="dashboard-hoje">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="dashboard-hoje" className="text-section text-ink">Movimento do período</h2>
          <p className="mt-1 text-[13px] text-muted">Dados reais de {serie.inicio} a {serie.fim}, no fuso do seu perfil.</p>
        </div>
        <NativeSelect
          aria-label="Período do dashboard"
          className="w-28"
          value={periodo}
          onChange={(event) => onPeriodo(Number(event.target.value) as 7 | 30 | 90)}
        >
          <option value="7">7 dias</option>
          <option value="30">30 dias</option>
          <option value="90">90 dias</option>
        </NativeSelect>
      </div>

      {!temVolume && !temScore ? (
        <p className="mt-5 text-[14px] text-muted">
          Ainda não há movimentação registrada neste período. A série será preenchida conforme você organizar vagas,
          concluir ações ou gerar currículos.
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-[13px] font-medium text-ink-2">Volume de trabalho</h3>
                <span className="text-[12px] text-faint">por dia</span>
              </div>
              <div role="img" aria-label="Gráfico de oportunidades, ações e currículos por dia">
                <ChartContainer config={CONFIG_VOLUME}>
                  <BarChart data={serie.pontos} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 3" />
                    <XAxis dataKey="data" tickFormatter={rotuloData} tickLine={false} axisLine={false} minTickGap={24} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                    <ChartTooltip cursor={{ fill: 'var(--canvas)' }} />
                    <Bar dataKey="oportunidadesCriadas" fill="var(--color-oportunidadesCriadas)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="acoesConcluidas" fill="var(--color-acoesConcluidas)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="curriculosGerados" fill="var(--color-curriculosGerados)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted" aria-label="Legenda do gráfico de volume">
                {Object.entries(CONFIG_VOLUME).map(([key, item]) => (
                  <span key={key} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />{item.label}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-[13px] font-medium text-ink-2">Score médio gerado</h3>
                <span className="text-[12px] text-faint">de 0 a 100</span>
              </div>
              {temScore ? (
                <div role="img" aria-label="Gráfico de linha do score médio dos currículos gerados por dia">
                  <ChartContainer config={CONFIG_SCORE}>
                    <LineChart data={serie.pontos} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 3" />
                      <XAxis dataKey="data" tickFormatter={rotuloData} tickLine={false} axisLine={false} minTickGap={24} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                      <ChartTooltip cursor={{ stroke: 'var(--line-strong)' }} />
                      <Line type="monotone" dataKey="scoreMedio" connectNulls={false} stroke="var(--color-scoreMedio)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-scoreMedio)' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ChartContainer>
                </div>
              ) : (
                <p className="py-10 text-[14px] text-muted">Nenhum currículo com score foi gerado no período.</p>
              )}
            </div>
          </div>

          <details className="mt-5 border-t border-line pt-4">
            <summary className="cursor-pointer text-[13px] font-medium text-accent-ink">Ver dados do período</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-[12px]" aria-label="Dados temporais de Hoje">
                <thead><tr className="border-b border-line text-left text-label uppercase text-muted"><th className="px-2 py-2">Data</th><th className="px-2 py-2 text-right">Oportunidades</th><th className="px-2 py-2 text-right">Ações</th><th className="px-2 py-2 text-right">Currículos</th><th className="px-2 py-2 text-right">Score médio</th></tr></thead>
                <tbody>{serie.pontos.map((ponto) => <tr key={ponto.data} className="border-b border-line last:border-0"><td className="px-2 py-2 font-mono tabular-nums text-ink-2">{ponto.data}</td><td className="px-2 py-2 text-right font-mono tabular-nums text-ink-2">{ponto.oportunidadesCriadas}</td><td className="px-2 py-2 text-right font-mono tabular-nums text-ink-2">{ponto.acoesConcluidas}</td><td className="px-2 py-2 text-right font-mono tabular-nums text-ink-2">{ponto.curriculosGerados}</td><td className="px-2 py-2 text-right font-mono tabular-nums text-ink-2">{ponto.scoreMedio ?? '--'}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

export function Hoje({ onAbrir }: { onAbrir: (id: string) => void }) {
  const [dados, setDados] = useState<HojeResposta | null>(null);
  const [periodo, setPeriodo] = useState<7 | 30 | 90>(30);
  const [erro, setErro] = useState<string | null>(null);
  const [estados, setEstados] = useState<Record<string, EstadoAcao>>({});
  const [reagendandoId, setReagendandoId] = useState<string | null>(null);
  const [quando, setQuando] = useState('');
  const [passoId, setPassoId] = useState<string | null>(null);
  const [passoTitulo, setPassoTitulo] = useState('');
  const [passosDefinidos, setPassosDefinidos] = useState<Record<string, string>>({});

  function carregar() {
    getHoje(undefined, undefined, periodo)
      .then(setDados)
      .catch((err) => setErro((err as Error).message));
  }

  useEffect(carregar, [periodo]);

  async function concluir(id: string) {
    setErro(null);
    try {
      await concluirAcao(id);
      setEstados((prev) => ({ ...prev, [id]: 'concluida' }));
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function cancelar(id: string) {
    setErro(null);
    try {
      await cancelarAcao(id);
      setEstados((prev) => ({ ...prev, [id]: 'cancelada' }));
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function reagendar(id: string) {
    if (!quando) return;
    const iso = new Date(quando).toISOString();
    setErro(null);
    try {
      await patchAcao(id, { venceEm: iso });
      setDados((d) => {
        if (!d) return d;
        const aplicar = (arr: HojeAcao[]) => arr.map((a) => (a.id === id ? { ...a, venceEm: iso } : a));
        return {
          ...d,
          atrasadas: aplicar(d.atrasadas),
          hoje: aplicar(d.hoje),
          proximosDias: aplicar(d.proximosDias),
        };
      });
      setReagendandoId(null);
      setQuando('');
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function definirPasso(vagaId: string) {
    const titulo = passoTitulo.trim();
    if (passoId !== vagaId || !titulo) return;
    setErro(null);
    try {
      await criarAcao(vagaId, {
        titulo,
        tipo: 'OUTRO' as TipoAcaoOportunidade,
        principal: true,
      });
      setPassosDefinidos((prev) => ({ ...prev, [vagaId]: titulo }));
      setPassoId(null);
      setPassoTitulo('');
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  if (!dados && !erro) return <p className="py-10 text-[14px] text-muted">Carregando agenda...</p>;

  const semPasso = dados?.semProximoPasso ?? [];
  const atividade = dados?.atividadeRecente ?? [];
  const vazio =
    !!dados &&
    dados.atrasadas.length === 0 &&
    dados.hoje.length === 0 &&
    dados.proximosDias.length === 0 &&
    semPasso.length === 0;

  function renderAcao(item: HojeAcao, atraso?: boolean) {
    const estado = estados[item.id];
    const finalizada = estado === 'concluida' || estado === 'cancelada';
    const emReagendamento = reagendandoId === item.id;
    return (
      <li key={item.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3.5">
        <div className={cn('min-w-0', finalizada && 'opacity-55')}>
          <button
            onClick={() => onAbrir(item.vagaId)}
            className="rounded-control text-left text-[15px] font-medium text-ink transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
          >
            {item.oportunidade?.titulo ?? 'Oportunidade'}
          </button>
          <p className="text-[14px] text-ink-2">{item.titulo}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-faint">
            <span>{rotuloTipo(item.tipo)}</span>
            <span aria-hidden>·</span>
            <span>{item.oportunidade?.empresa ?? 'Empresa não informada'}</span>
            <span aria-hidden>·</span>
            <span className="font-mono tabular-nums">{fmtData(item.venceEm)}</span>
            {atraso && !finalizada && (
              <span className="ml-1 text-[11px] font-semibold uppercase tracking-wide text-score-bad">
                Atrasada
              </span>
            )}
          </p>
        </div>

        <div className="shrink-0">
          {estado === 'concluida' ? (
            <span className="text-[13px] text-muted">Concluída</span>
          ) : estado === 'cancelada' ? (
            <span className="text-[13px] text-muted">Cancelada</span>
          ) : emReagendamento ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="datetime-local"
                aria-label="Novo prazo"
                className="h-8 w-auto"
                value={quando}
                onChange={(e) => setQuando(e.target.value)}
              />
              <Button size="sm" onClick={() => void reagendar(item.id)}>
                Salvar prazo
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReagendandoId(null);
                  setQuando('');
                }}
              >
                Voltar
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => void concluir(item.id)}>
                Concluir
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReagendandoId(item.id);
                  setQuando('');
                }}
              >
                Reagendar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void cancelar(item.id)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </li>
    );
  }

  function renderGrupo(titulo: string, itens: HojeAcao[], vazioTexto: string, atraso?: boolean) {
    return (
      <section>
        <GrupoTitulo titulo={titulo} contagem={itens.length} />
        {itens.length === 0 ? (
          <p className="border-t border-line py-3.5 text-[14px] text-muted">{vazioTexto}</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {itens.map((item) => renderAcao(item, atraso))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {dados && (
        <div
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted"
          aria-label="Resumo ATS"
        >
          <span>
            <span className="font-mono tabular-nums text-ink">{dados.resumoAts.curriculos}</span>{' '}
            currículos
          </span>
          <span aria-hidden className="h-3.5 w-px bg-line" />
          <span>
            <span className="font-mono tabular-nums text-ink">{dados.resumoAts.comScore}</span> com
            score
          </span>
          <span aria-hidden className="h-3.5 w-px bg-line" />
          <span className="flex items-center gap-1.5">
            Score médio <ScoreNum valor={dados.resumoAts.media} />
          </span>
        </div>
      )}

      {erro && (
        <div
          className="rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad"
          role="alert"
        >
          {erro}
        </div>
      )}

      {dados?.serieTemporal && <DashboardTemporal serie={dados.serieTemporal} periodo={periodo} onPeriodo={setPeriodo} />}

      {vazio ? (
        <div className="py-6">
          <h2 className="text-section text-ink">Sem pendências na agenda</h2>
          <p className="mt-2 max-w-md text-[14px] text-muted">
            Nada com prazo por aqui. Abra Oportunidades para registrar uma vaga ou defina o próximo
            passo de uma candidatura ativa.
          </p>
        </div>
      ) : (
        dados && (
          <div className="flex flex-col gap-8">
            {dados.atrasadas.length > 0 && renderGrupo('Atrasados', dados.atrasadas, '', true)}
            {renderGrupo('Hoje', dados.hoje, 'Nada com prazo para hoje.')}
            {renderGrupo(
              'Próximos sete dias',
              dados.proximosDias,
              'Nenhum prazo nos próximos sete dias.',
            )}

            {semPasso.length > 0 && (
              <section>
                <GrupoTitulo titulo="Sem próximo passo" contagem={semPasso.length} />
                <ul className="divide-y divide-line border-t border-line">
                  {semPasso.map((item) => {
                    const definido = passosDefinidos[item.id];
                    const editando = passoId === item.id;
                    return (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3.5"
                      >
                        <div className="min-w-0">
                          <button
                            onClick={() => onAbrir(item.id)}
                            className="rounded-control text-left text-[15px] font-medium text-ink transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
                          >
                            {item.titulo}
                          </button>
                          <p className="text-[13px] text-faint">{item.empresa}</p>
                        </div>
                        <div className="shrink-0">
                          {definido ? (
                            <span className="text-[13px] text-muted">Próximo passo definido</span>
                          ) : editando ? (
                            <form
                              className="flex flex-wrap items-center gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                void definirPasso(item.id);
                              }}
                            >
                              <Input
                                aria-label="Próximo passo"
                                className="h-8 w-56"
                                placeholder="Ex: revisar vaga e gerar currículo"
                                value={passoTitulo}
                                onChange={(e) => setPassoTitulo(e.target.value)}
                                autoFocus
                                required
                              />
                              <Button size="sm" type="submit">
                                Definir
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                onClick={() => {
                                  setPassoId(null);
                                  setPassoTitulo('');
                                }}
                              >
                                Voltar
                              </Button>
                            </form>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setPassoId(item.id);
                                setPassoTitulo('');
                              }}
                            >
                              Definir próximo passo
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )
      )}

      <section>
        <GrupoTitulo titulo="Atividade recente" />
        {atividade.length === 0 ? (
          <p className="border-t border-line py-3.5 text-[14px] text-muted">
            Ainda não há histórico. As ações que você concluir aparecem aqui.
          </p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {atividade.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-3">
                <button
                  onClick={() => onAbrir(e.vagaId)}
                  className="rounded-control text-left text-[14px] font-medium text-ink transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
                >
                  {e.titulo}
                </button>
                <span className="text-[13px] text-faint">
                  {e.descricao}
                  {' · '}
                  <span className="font-mono tabular-nums">{fmtData(e.ocorridoEm)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
