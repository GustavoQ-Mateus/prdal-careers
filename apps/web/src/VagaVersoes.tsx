import { useEffect, useMemo, useState } from 'react';
import { listarCurriculos, type CurriculoResumo } from './api';
import { fmtData } from './ui';
import { ScoreDelta, ScoreMeter, ScoreNum } from './components/Score';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

function diffFaltando(base: string[], outro: string[]): string[] {
  const set = new Set(outro);
  return base.filter((k) => !set.has(k));
}

function Comparativo({ versoes }: { versoes: CurriculoResumo[] }) {
  const [baseId, setBaseId] = useState(versoes[1].id);
  const [alvoId, setAlvoId] = useState(versoes[0].id);

  const base = versoes.find((v) => v.id === baseId)!;
  const alvo = versoes.find((v) => v.id === alvoId)!;

  const cobertasAMais = diffFaltando(
    base.breakdown?.faltando ?? [],
    alvo.breakdown?.faltando ?? [],
  );
  const faltantesAMais = diffFaltando(
    alvo.breakdown?.faltando ?? [],
    base.breakdown?.faltando ?? [],
  );

  const delta =
    alvo.score !== null && base.score !== null ? alvo.score - base.score : null;

  return (
    <section className="border-t border-line pt-6">
      <h3 className="text-label uppercase text-muted">Comparar versoes</h3>
      <div className="mt-4 flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cmp-base">Base</Label>
            <NativeSelect id="cmp-base" value={baseId} onChange={(e) => setBaseId(e.target.value)}>
              {versoes.map((v) => (
                <option key={v.id} value={v.id}>{`${v.rotulo} · ${v.score ?? '--'}`}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cmp-alvo">Comparar com</Label>
            <NativeSelect id="cmp-alvo" value={alvoId} onChange={(e) => setAlvoId(e.target.value)}>
              {versoes.map((v) => (
                <option key={v.id} value={v.id}>{`${v.rotulo} · ${v.score ?? '--'}`}</option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] text-muted">{base.rotulo}</span>
            <div className="flex items-center gap-3">
              <ScoreNum valor={base.score} className="text-[22px]" />
              <div className="flex-1">
                <ScoreMeter valor={base.score} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-[13px] text-muted">
              {alvo.rotulo}
              <ScoreDelta valor={delta} />
            </span>
            <div className="flex items-center gap-3">
              <ScoreNum valor={alvo.score} className="text-[22px]" />
              <div className="flex-1">
                <ScoreMeter valor={alvo.score} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-label uppercase text-muted">
              Cobertas a mais em {alvo.rotulo} ({cobertasAMais.length})
            </span>
            {cobertasAMais.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {cobertasAMais.map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-score-good/50 px-2 py-0.5 text-[12px] text-score-good"
                  >
                    {k}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[13px] text-muted">nenhuma</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-label uppercase text-muted">
              Faltantes a mais em {alvo.rotulo} ({faltantesAMais.length})
            </span>
            {faltantesAMais.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {faltantesAMais.map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-score-warn/50 px-2 py-0.5 text-[12px] text-score-warn"
                  >
                    {k}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[13px] text-muted">nenhuma</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function VagaVersoes({
  vagaId,
  atualId,
  onAbrir,
}: {
  vagaId: string;
  atualId?: string;
  onAbrir: (curriculoId: string) => void;
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
    <section className="flex flex-col gap-5 border-t border-line pt-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-section text-ink">Versoes desta oportunidade</h3>
        {versoes && versoes.length > 0 && (
          <span className="text-[13px] text-faint">
            {versoes.length} {versoes.length === 1 ? 'versao' : 'versoes'}
          </span>
        )}
      </div>

      {erro && (
        <div
          className="rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad"
          role="alert"
        >
          {erro}
        </div>
      )}

      {!versoes && !erro && <p className="text-[14px] text-muted">Carregando...</p>}
      {versoes && versoes.length === 0 && (
        <p className="text-[14px] text-muted">Nenhum curriculo gerado para esta oportunidade ainda.</p>
      )}

      {versoes && versoes.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-line bg-ground">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                <th className="px-3 py-2.5 text-left text-label uppercase text-muted">Versao</th>
                <th className="px-3 py-2.5 text-left text-label uppercase text-muted">Score</th>
                <th className="px-3 py-2.5 text-right text-label uppercase text-muted">Faltantes</th>
                <th className="px-3 py-2.5 text-right text-label uppercase text-muted">Gerado</th>
                <th className="px-3 py-2.5 text-right text-label uppercase text-muted" />
              </tr>
            </thead>
            <tbody>
              {versoes.map((v) => (
                <tr
                  key={v.id}
                  className={cn(
                    'border-b border-line last:border-0 transition-colors hover:bg-canvas',
                    v.id === atualId && 'bg-accent-soft/40',
                  )}
                >
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-ink">{v.rotulo}</span>
                      {v.id === atualId && <Badge variant="accent">Em analise</Badge>}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <ScoreNum valor={v.score} />
                      <div className="w-40 max-w-full">
                        <ScoreMeter valor={v.score} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-ink-2">
                    {v.breakdown?.faltando.length ?? '--'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums text-faint">
                    {fmtData(v.geradoEm)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {v.id === atualId ? (
                      <span className="text-[13px] text-faint">Aberta</span>
                    ) : (
                      <button
                        onClick={() => onAbrir(v.id)}
                        className="rounded-control px-1 text-[13px] font-medium text-accent transition-colors hover:text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Abrir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {versoes && podeComparar && <Comparativo versoes={versoes} />}
    </section>
  );
}
