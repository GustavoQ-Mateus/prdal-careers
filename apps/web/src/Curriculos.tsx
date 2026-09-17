import { useEffect, useMemo, useState } from 'react';
import { Layers3, List } from 'lucide-react';
import {
  baixarArquivo,
  listarCurriculosGlobal,
  type CurriculoGlobal,
  type Pagina,
} from './api';
import type { FiltrosCurriculos, ModoCurriculos } from './rotas';
import { rotuloTaxonomia } from './rotulos';
import { useTaxonomia } from './useTaxonomia';
import { fmtData } from './ui';
import { Paginacao } from './components/Paginacao';
import { ScoreNum } from './components/Score';
import { SegmentoIcones, type OpcaoSegmento } from './components/SegmentoIcones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';

type Ordenacao = 'geracao' | 'score' | 'oportunidade';

const LIMITE_LISTA = 20;

const ORDENACOES: { id: Ordenacao; nome: string }[] = [
  { id: 'geracao', nome: 'Geração recente' },
  { id: 'score', nome: 'Maior score' },
  { id: 'oportunidade', nome: 'Oportunidade' },
];

const MODOS: OpcaoSegmento<ModoCurriculos>[] = [
  { id: 'lista', nome: 'Lista plana', icon: List },
  { id: 'oportunidade', nome: 'Por oportunidade', icon: Layers3 },
];

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
  modo,
  categoria,
  nivel,
  vinculado,
  scoreMinimo,
  ordenarPor,
  onRota,
  onAbrir,
}: {
  modo: ModoCurriculos;
  categoria: string;
  nivel: string;
  vinculado: string;
  scoreMinimo: string;
  ordenarPor: string;
  onRota: (filtros: FiltrosCurriculos) => void;
  onAbrir: (oportunidadeId: string, curriculoId: string) => void;
}) {
  const [pagina, setPagina] = useState<Pagina<CurriculoGlobal> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const taxonomia = useTaxonomia();
  const agrupado = modo === 'oportunidade';
  const base: FiltrosCurriculos = {
    modo,
    categoria,
    nivel,
    vinculado,
    scoreMinimo,
    ordenarPor,
  };

  function aplicar(patch: Partial<FiltrosCurriculos>) {
    setOffset(0);
    onRota({ ...base, ...patch });
  }

  useEffect(() => {
    let ativo = true;
    setPagina(null);
    setErro(null);
    listarCurriculosGlobal({
      vinculado: vinculado || undefined,
      scoreMinimo: scoreMinimo || undefined,
      categoria: categoria || undefined,
      nivel: nivel || undefined,
      ordenarPor,
      limit: agrupado ? undefined : LIMITE_LISTA,
      offset: agrupado ? undefined : offset,
    })
      .then((resposta) => {
        if (ativo) setPagina(resposta);
      })
      .catch((err) => {
        if (ativo) setErro((err as Error).message);
      });
    return () => {
      ativo = false;
    };
  }, [agrupado, categoria, nivel, vinculado, scoreMinimo, ordenarPor, offset]);

  const itens = pagina?.itens ?? null;
  const grupos = useMemo(() => (itens ? agrupar(itens) : null), [itens]);

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
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="cv-categoria">Categoria</Label>
          <NativeSelect
            id="cv-categoria"
            className="w-32"
            value={categoria}
            onChange={(e) => aplicar({ categoria: e.target.value })}
          >
            <option value="">Todas</option>
            {taxonomia.categorias.map((valor) => (
              <option key={valor} value={valor}>{rotuloTaxonomia(valor)}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cv-nivel">Nível</Label>
          <NativeSelect
            id="cv-nivel"
            className="w-28"
            value={nivel}
            onChange={(e) => aplicar({ nivel: e.target.value })}
          >
            <option value="">Todos</option>
            {taxonomia.niveis.map((valor) => (
              <option key={valor} value={valor}>{rotuloTaxonomia(valor)}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cv-vinculo">Vínculo</Label>
          <NativeSelect
            id="cv-vinculo"
            className="w-32"
            value={vinculado}
            onChange={(e) => aplicar({ vinculado: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="true">Vinculados</option>
            <option value="false">Sem vínculo</option>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cv-score">Score mínimo</Label>
          <Input
            id="cv-score"
            className="w-24"
            type="number"
            min={0}
            max={100}
            value={scoreMinimo}
            onChange={(e) => aplicar({ scoreMinimo: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cv-ordenar">Ordenar por</Label>
          <NativeSelect
            id="cv-ordenar"
            className="w-40"
            value={ordenarPor}
            onChange={(e) => aplicar({ ordenarPor: e.target.value })}
          >
            {ORDENACOES.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </NativeSelect>
        </div>
        <SegmentoIcones
          opcoes={MODOS}
          valor={modo}
          onValor={(valor) => aplicar({ modo: valor })}
          aria="Organização dos currículos"
        />
      </div>

      {!agrupado && (
        <p className="text-[13px] text-faint">Ordenado por: {criterio}. Não há ranking universal.</p>
      )}
      {agrupado && (
        <p className="text-[13px] text-faint">
          Agrupado por oportunidade. Cada grupo compara suas próprias versões.
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
      {!itens && !erro && <p className="py-8 text-[14px] text-muted">Carregando currículos...</p>}
      {itens && itens.length === 0 && (
        <div className="rounded-card border border-line bg-ground p-8 text-center">
          <p className="text-[14px] text-muted">Nenhum currículo nesta biblioteca ainda.</p>
        </div>
      )}

      {itens && itens.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-line bg-ground">
          <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky top-0 bg-canvas px-3 py-2.5 text-left text-label uppercase text-muted">
                  Rótulo
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
                              {g.itens.length} {g.itens.length === 1 ? 'versão' : 'versões'}
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
                  {itens.map((c) => (
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

      {!agrupado && pagina && pagina.total > 0 && (
        <Paginacao
          total={pagina.total}
          limit={LIMITE_LISTA}
          offset={pagina.offset}
          onOffset={setOffset}
        />
      )}
    </div>
  );
}
