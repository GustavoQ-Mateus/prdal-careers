import { useEffect, useMemo, useState } from 'react';
import { baixarArquivo, listarCurriculosGlobal, type CurriculoGlobal } from './api';
import { fmtData } from './ui';
import { ScoreNum } from './components/Score';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

type Ordenacao = 'geracao' | 'score' | 'oportunidade';

const ORDENACOES: { id: Ordenacao; nome: string }[] = [
  { id: 'geracao', nome: 'Geracao recente' },
  { id: 'score', nome: 'Maior score' },
  { id: 'oportunidade', nome: 'Oportunidade' },
];

function ordenar(itens: CurriculoGlobal[], por: Ordenacao): CurriculoGlobal[] {
  const copia = [...itens];
  if (por === 'score') {
    copia.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  } else if (por === 'oportunidade') {
    copia.sort(
      (a, b) =>
        a.oportunidade.empresa.localeCompare(b.oportunidade.empresa) ||
        a.oportunidade.titulo.localeCompare(b.oportunidade.titulo) ||
        b.geradoEm.localeCompare(a.geradoEm),
    );
  } else {
    copia.sort((a, b) => b.geradoEm.localeCompare(a.geradoEm));
  }
  return copia;
}

type Grupo = {
  id: string;
  titulo: string;
  empresa: string;
  itens: CurriculoGlobal[];
  melhorScore: number | null;
};

function agrupar(itens: CurriculoGlobal[]): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const c of itens) {
    const chave = c.oportunidade.id;
    let grupo = mapa.get(chave);
    if (!grupo) {
      grupo = {
        id: chave,
        titulo: c.oportunidade.titulo,
        empresa: c.oportunidade.empresa,
        itens: [],
        melhorScore: null,
      };
      mapa.set(chave, grupo);
    }
    grupo.itens.push(c);
    if (c.score !== null) grupo.melhorScore = Math.max(grupo.melhorScore ?? 0, c.score);
  }
  return [...mapa.values()];
}

function Arquivos({ curriculo }: { curriculo: CurriculoGlobal }) {
  if (!curriculo.downloadDocxUrl && !curriculo.downloadPdfUrl) {
    return <span className="text-[13px] text-faint">--</span>;
  }
  return (
    <span className="flex items-center justify-end gap-1.5">
      {curriculo.downloadDocxUrl && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void baixarArquivo(curriculo.downloadDocxUrl!, `${curriculo.rotulo}.docx`)}
        >
          DOCX
        </Button>
      )}
      {curriculo.downloadPdfUrl && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void baixarArquivo(curriculo.downloadPdfUrl!, `${curriculo.rotulo}.pdf`)}
        >
          PDF
        </Button>
      )}
    </span>
  );
}

export function Curriculos({
  onAbrir,
}: {
  onAbrir: (oportunidadeId: string, curriculoId: string) => void;
}) {
  const [itens, setItens] = useState<CurriculoGlobal[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [vinculado, setVinculado] = useState('');
  const [scoreMinimo, setScoreMinimo] = useState('');
  const [ordenarPor, setOrdenarPor] = useState<Ordenacao>('geracao');
  const [agrupado, setAgrupado] = useState(false);

  useEffect(() => {
    setItens(null);
    setErro(null);
    listarCurriculosGlobal({
      vinculado: vinculado || undefined,
      scoreMinimo: scoreMinimo || undefined,
    })
      .then(setItens)
      .catch((err) => setErro((err as Error).message));
  }, [vinculado, scoreMinimo]);

  const ordenados = useMemo(() => (itens ? ordenar(itens, ordenarPor) : null), [itens, ordenarPor]);
  const grupos = useMemo(() => (ordenados ? agrupar(ordenados) : null), [ordenados]);

  const criterio = ORDENACOES.find((o) => o.id === ordenarPor)?.nome ?? '';

  function abrirRotulo(c: CurriculoGlobal) {
    return (
      <button
        onClick={() => onAbrir(c.oportunidade.id, c.id)}
        className="rounded-control text-left font-medium text-ink transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
      >
        {c.rotulo}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cv-vinculo">Vinculo</Label>
            <NativeSelect
              id="cv-vinculo"
              className="w-40"
              value={vinculado}
              onChange={(e) => setVinculado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Vinculados</option>
              <option value="false">Sem vinculo</option>
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cv-score">Score minimo</Label>
            <Input
              id="cv-score"
              className="w-28"
              type="number"
              min={0}
              max={100}
              value={scoreMinimo}
              onChange={(e) => setScoreMinimo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cv-ordenar">Ordenar por</Label>
            <NativeSelect
              id="cv-ordenar"
              className="w-48"
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value as Ordenacao)}
            >
              {ORDENACOES.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <div className="flex rounded-control border border-line-strong p-0.5" role="group" aria-label="Agrupamento">
          <button
            aria-pressed={!agrupado}
            onClick={() => setAgrupado(false)}
            className={cn(
              'h-8 rounded-[6px] px-3.5 text-[13px] font-medium transition-colors',
              !agrupado ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:text-ink',
            )}
          >
            Lista plana
          </button>
          <button
            aria-pressed={agrupado}
            onClick={() => setAgrupado(true)}
            className={cn(
              'h-8 rounded-[6px] px-3.5 text-[13px] font-medium transition-colors',
              agrupado ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:text-ink',
            )}
          >
            Por oportunidade
          </button>
        </div>
      </div>

      {!agrupado && (
        <p className="text-[13px] text-faint">Ordenado por: {criterio}. Nao ha ranking universal.</p>
      )}
      {agrupado && (
        <p className="text-[13px] text-faint">
          Agrupado por oportunidade. Cada grupo compara suas proprias versoes.
        </p>
      )}

      {erro && (
        <div
          className="rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad"
          role="alert"
        >
          {erro}
        </div>
      )}
      {!itens && !erro && <p className="py-8 text-[14px] text-muted">Carregando curriculos...</p>}
      {itens && itens.length === 0 && (
        <div className="rounded-card border border-line bg-ground p-8 text-center">
          <p className="text-[14px] text-muted">Nenhum curriculo nesta biblioteca ainda.</p>
        </div>
      )}

      {ordenados && ordenados.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-line bg-ground">
          <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky top-0 bg-canvas px-3 py-2.5 text-left text-label uppercase text-muted">
                  Rotulo
                </th>
                {!agrupado && (
                  <th className="sticky top-0 bg-canvas px-3 py-2.5 text-left text-label uppercase text-muted">
                    Oportunidade
                  </th>
                )}
                <th className="sticky top-0 bg-canvas px-3 py-2.5 text-right text-label uppercase text-muted">
                  Score
                </th>
                <th className="sticky top-0 bg-canvas px-3 py-2.5 text-right text-label uppercase text-muted">
                  Gerado
                </th>
                <th className="sticky top-0 bg-canvas px-3 py-2.5 text-right text-label uppercase text-muted">
                  Arquivos
                </th>
              </tr>
            </thead>
            {agrupado && grupos
              ? grupos.map((g) => (
                  <tbody key={g.id}>
                    <tr className="border-b border-line bg-canvas/60">
                      <td colSpan={4} className="px-3 py-2.5">
                        <span className="flex items-center justify-between gap-3">
                          <span className="min-w-0">
                            <span className="font-medium text-ink">{g.titulo}</span>
                            <span className="text-[13px] text-faint"> · {g.empresa}</span>
                            <span className="text-[13px] text-faint">
                              {' · '}
                              {g.itens.length} {g.itens.length === 1 ? 'versao' : 'versoes'}
                            </span>
                          </span>
                          {g.melhorScore !== null && (
                            <span className="shrink-0 text-[13px] text-muted">
                              melhor <ScoreNum valor={g.melhorScore} />
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                    {g.itens.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-line last:border-0 transition-colors hover:bg-canvas"
                      >
                        <td className="px-3 py-3 pl-6">
                          <span className="flex items-center gap-2">
                            {abrirRotulo(c)}
                            {c.vinculo && <Badge variant="accent">Vinculado</Badge>}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {c.score !== null ? <ScoreNum valor={c.score} /> : '--'}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums text-faint">
                          {fmtData(c.geradoEm)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Arquivos curriculo={c} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))
              : (
                <tbody>
                  {ordenados.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-line last:border-0 transition-colors hover:bg-canvas"
                    >
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          {abrirRotulo(c)}
                          {c.vinculo && <Badge variant="accent">Vinculado</Badge>}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-ink-2">{c.oportunidade.titulo}</span>
                        <div className="text-[13px] text-faint">{c.oportunidade.empresa}</div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {c.score !== null ? <ScoreNum valor={c.score} /> : '--'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums text-faint">
                        {fmtData(c.geradoEm)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Arquivos curriculo={c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
          </table>
        </div>
      )}
    </div>
  );
}
