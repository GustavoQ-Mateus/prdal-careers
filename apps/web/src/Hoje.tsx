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
import { ScoreNum } from './components/Score';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

export function Hoje({ onAbrir }: { onAbrir: (id: string) => void }) {
  const [dados, setDados] = useState<HojeResposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [estados, setEstados] = useState<Record<string, EstadoAcao>>({});
  const [reagendandoId, setReagendandoId] = useState<string | null>(null);
  const [quando, setQuando] = useState('');
  const [passoId, setPassoId] = useState<string | null>(null);
  const [passoTitulo, setPassoTitulo] = useState('');
  const [passosDefinidos, setPassosDefinidos] = useState<Record<string, string>>({});

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
