import { lazy, Suspense, useEffect, useState } from 'react';
import { Columns3, List, Network } from 'lucide-react';
import {
  ativarEntrada,
  listarOportunidades,
  type OportunidadeItem,
  type Pagina,
  type PipelineFiltros,
} from './api';
import { ROTULO_ETAPA, ROTULO_PRIORIDADE, rotuloTaxonomia } from './rotulos';
import type { FiltrosHub, VisaoHub } from './rotas';
import type { Selecao } from './hubTipos';
import { useTaxonomia } from './useTaxonomia';
import { fmtData } from './ui';
import { ScoreNum, ScoreMeter } from './components/Score';
import { Paginacao } from './components/Paginacao';
import { SegmentoIcones, type OpcaoSegmento } from './components/SegmentoIcones';
import { RegistrarDialog, EditarDialog } from './OportunidadeDialogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const OportunidadesBoard = lazy(() =>
  import('./OportunidadesBoard').then((m) => ({ default: m.OportunidadesBoard })),
);
const OportunidadesGrafo = lazy(() =>
  import('./OportunidadesGrafo').then((m) => ({ default: m.OportunidadesGrafo })),
);

const VISOES: OpcaoSegmento<VisaoHub>[] = [
  { id: 'lista', nome: 'Lista', icon: List },
  { id: 'board', nome: 'Board', icon: Columns3 },
  { id: 'grafo', nome: 'Grafo', icon: Network },
];

const LIMITE_LISTA = 20;

const ESTADOS = [
  { id: 'entrada', nome: 'Entrada' },
  { id: 'ativas', nome: 'Ativas' },
  { id: 'encerradas', nome: 'Encerradas' },
];

const ORDENACOES = [
  { id: 'atividade', nome: 'Atividade recente' },
  { id: 'prioridade', nome: 'Prioridade' },
  { id: 'score', nome: 'Score ATS' },
  { id: 'keywords', nome: 'Correspondência de keywords' },
  { id: 'etapa', nome: 'Etapa' },
  { id: 'prazo', nome: 'Prazo do próximo passo' },
];

function selecaoDe(item: OportunidadeItem): Selecao {
  return {
    id: item.id,
    titulo: item.titulo,
    empresa: item.empresa,
    etapa: item.etapa,
    prioridade: item.prioridade,
    score: item.score,
    proximoPasso: item.proximoPasso?.titulo ?? null,
    curriculo: item.curriculoVinculado?.rotulo ?? null,
    entrada: item.tipo === 'ENTRADA',
  };
}

export function Oportunidades({
  visao,
  busca,
  estado,
  categoria,
  nivel,
  ordenarPor,
  prioridade,
  onRota,
  onAbrir,
}: {
  visao: VisaoHub;
  busca: string;
  estado: string;
  categoria: string;
  nivel: string;
  ordenarPor: string;
  prioridade: string;
  onRota: (prox: FiltrosHub) => void;
  onAbrir: (id: string) => void;
}) {
  const [pagina, setPagina] = useState<Pagina<OportunidadeItem> | null>(null);
  const [offset, setOffset] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [selecionada, setSelecionada] = useState<Selecao | null>(null);
  const [registrarAberto, setRegistrarAberto] = useState(false);
  const [editarAberto, setEditarAberto] = useState(false);
  const taxonomia = useTaxonomia();

  const base = { busca, estado, categoria, nivel, ordenarPor, prioridade };
  function aplicar(patch: Partial<FiltrosHub>) {
    setOffset(0);
    onRota({ visao, ...base, ...patch });
  }

  const filtrosPipeline: PipelineFiltros = {
    busca: busca || undefined,
    categoria: categoria || undefined,
    nivel: nivel || undefined,
    prioridade: prioridade || undefined,
    apresentacao: estado === 'ativas' ? 'ATIVA' : estado === 'encerradas' ? 'ENCERRADA' : undefined,
  };

  function carregarLista() {
    setPagina(null);
    setErro(null);
    listarOportunidades({
      visao: estado,
      busca,
      categoria: categoria || undefined,
      nivel: nivel || undefined,
      ordenarPor,
      prioridade: prioridade || undefined,
      limit: LIMITE_LISTA,
      offset,
    })
      .then(setPagina)
      .catch((err) => setErro((err as Error).message));
  }

  useEffect(() => {
    if (visao !== 'lista') return;
    let ativo = true;
    setPagina(null);
    setErro(null);
    listarOportunidades({
      visao: estado,
      busca,
      categoria: categoria || undefined,
      nivel: nivel || undefined,
      ordenarPor,
      prioridade: prioridade || undefined,
      limit: LIMITE_LISTA,
      offset,
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
  }, [visao, estado, busca, categoria, nivel, ordenarPor, prioridade, offset]);

  async function ativar(id: string) {
    setErro(null);
    try {
      const vaga = await ativarEntrada(id);
      onAbrir(vaga.id);
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  function recarregar() {
    if (visao === 'lista') carregarLista();
  }

  const criterio = ORDENACOES.find((o) => o.id === ordenarPor)?.nome ?? 'Atividade recente';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="hub-busca">Busca</Label>
          <Input
            id="hub-busca"
            className="w-40"
            value={busca}
            onChange={(e) => aplicar({ busca: e.target.value })}
            placeholder="Título ou empresa"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="hub-estado">Estado</Label>
          <NativeSelect
            id="hub-estado"
            className="w-28"
            value={estado}
            onChange={(e) => aplicar({ estado: e.target.value })}
          >
            {ESTADOS.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="hub-categoria">Categoria</Label>
          <NativeSelect
            id="hub-categoria"
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
          <Label htmlFor="hub-nivel">Nível</Label>
          <NativeSelect
            id="hub-nivel"
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
          <Label htmlFor="hub-prioridade">Prioridade</Label>
          <NativeSelect
            id="hub-prioridade"
            className="w-28"
            value={prioridade}
            onChange={(e) => aplicar({ prioridade: e.target.value })}
          >
            <option value="">Todas</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Baixa</option>
          </NativeSelect>
        </div>
        {visao === 'lista' && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="hub-ordenar">Ordenar por</Label>
            <NativeSelect
              id="hub-ordenar"
            className="w-40"
              value={ordenarPor}
              onChange={(e) => aplicar({ ordenarPor: e.target.value })}
            >
              {ORDENACOES.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </NativeSelect>
          </div>
        )}
        <SegmentoIcones
          opcoes={VISOES}
          valor={visao}
          onValor={(valor) => onRota({ visao: valor, ...base })}
          aria="Visão das oportunidades"
        />
        <Button className="ml-auto" onClick={() => setRegistrarAberto(true)}>
          Registrar oportunidade
        </Button>
      </div>

      {visao === 'lista' && (
        <p className="text-[13px] text-faint">Critério de ordenação: {criterio}. Não há ranking universal.</p>
      )}
      {erro && (
        <div className="rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad" role="alert">
          {erro}
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite">{status}</div>

      {visao === 'lista' && (
        <ListaOportunidades
          itens={pagina?.itens ?? null}
          busca={busca}
          selecionadaId={selecionada?.id ?? null}
          onSelecionar={(item) => setSelecionada(selecaoDe(item))}
          onAtivar={(id) => void ativar(id)}
          onAbrir={onAbrir}
        />
      )}

      {visao === 'lista' && pagina && pagina.total > 0 && (
        <Paginacao
          total={pagina.total}
          limit={LIMITE_LISTA}
          offset={pagina.offset}
          onOffset={setOffset}
        />
      )}

      {visao !== 'lista' && (
        <Suspense fallback={<p className="py-8 text-[14px] text-muted">Carregando visualização...</p>}>
          {visao === 'board' && (
            <OportunidadesBoard
              filtros={filtrosPipeline}
              selecionadaId={selecionada?.id ?? null}
              onSelecionar={setSelecionada}
              onAbrir={onAbrir}
              onErro={setErro}
              onStatus={setStatus}
            />
          )}
          {visao === 'grafo' && (
            <OportunidadesGrafo filtros={filtrosPipeline} onSelecionar={setSelecionada} onErro={setErro} />
          )}
        </Suspense>
      )}

      <Sheet open={!!selecionada} onOpenChange={(aberto: boolean) => { if (!aberto) setSelecionada(null); }}>
        <SheetContent>
          {selecionada && (
            <>
              <SheetHeader>
                <SheetTitle>{selecionada.titulo}</SheetTitle>
                {selecionada.empresa && <SheetDescription>{selecionada.empresa}</SheetDescription>}
              </SheetHeader>

              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">
                  {selecionada.entrada ? 'Entrada' : selecionada.etapa ? ROTULO_ETAPA[selecionada.etapa] : 'Ativa'}
                </Badge>
                {selecionada.prioridade && (
                  <Badge variant="neutral">Prioridade {ROTULO_PRIORIDADE[selecionada.prioridade]}</Badge>
                )}
              </div>

              <dl className="flex flex-col gap-4 text-[14px]">
                {typeof selecionada.score === 'number' && (
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-label uppercase text-muted">Score ATS</dt>
                    <dd><ScoreMeter valor={selecionada.score} /></dd>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <dt className="text-label uppercase text-muted">Próximo passo</dt>
                  <dd className="text-ink-2">{selecionada.proximoPasso ?? 'Sem próximo passo definido'}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-label uppercase text-muted">Currículo vinculado</dt>
                  <dd className="text-ink-2">{selecionada.curriculo ?? 'Nenhum vínculo'}</dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-col gap-2">
                {selecionada.entrada ? (
                  <Button onClick={() => void ativar(selecionada.id)}>Ativar oportunidade</Button>
                ) : (
                  <Button onClick={() => onAbrir(selecionada.id)}>Abrir workspace</Button>
                )}
                <Button variant="secondary" onClick={() => setEditarAberto(true)}>
                  Editar
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <RegistrarDialog
        open={registrarAberto}
        onOpenChange={setRegistrarAberto}
        onCriada={onAbrir}
        onImportou={() => {
          setStatus('Lote importado');
          recarregar();
        }}
      />

      {selecionada && (
        <EditarDialog
          open={editarAberto}
          onOpenChange={setEditarAberto}
          id={selecionada.id}
          titulo={selecionada.titulo}
          prioridadeAtual={selecionada.prioridade ?? null}
          entrada={!!selecionada.entrada}
          onAbrir={onAbrir}
          onSalvo={() => {
            setStatus('Oportunidade atualizada');
            setSelecionada(null);
            recarregar();
          }}
        />
      )}
    </div>
  );
}

function ListaOportunidades({
  itens,
  busca,
  selecionadaId,
  onSelecionar,
  onAtivar,
  onAbrir,
}: {
  itens: OportunidadeItem[] | null;
  busca: string;
  selecionadaId: string | null;
  onSelecionar: (item: OportunidadeItem) => void;
  onAtivar: (id: string) => void;
  onAbrir: (id: string) => void;
}) {
  if (!itens) return <p className="py-8 text-[14px] text-muted">Carregando...</p>;

  if (itens.length === 0) {
    return (
      <div className="rounded-card border border-line bg-ground p-8 text-center">
        <p className="text-[14px] text-muted">
          {busca ? 'Nenhum resultado para este filtro.' : 'Nada nesta visão ainda.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-line bg-ground">
      <table className="w-full min-w-[900px] border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-line">
            {['Oportunidade', 'Setor', 'Prioridade', 'Etapa', 'Currículo', 'Score', 'Próximo passo', 'Atividade', ''].map(
              (h, i) => (
                <th
                  key={h || `acao-${i}`}
                  className={cn(
                    'sticky top-0 bg-canvas px-3 py-2.5 text-left text-label uppercase text-muted',
                    (h === 'Score' || h === 'Atividade') && 'text-right',
                  )}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr
              key={item.id}
              className={cn(
                'border-b border-line last:border-0 transition-colors hover:bg-canvas',
                selecionadaId === item.id && 'bg-accent-soft/40',
              )}
            >
              <td className="px-3 py-3">
                <button
                  onClick={() => onSelecionar(item)}
                  className="text-left font-medium text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:text-accent"
                >
                  {item.titulo}
                </button>
                <div className="text-[13px] text-faint">{item.empresa}</div>
              </td>
              <td className="px-3 py-3 text-ink-2">
                {item.categoria ? rotuloTaxonomia(item.categoria) : '--'}
                {item.nivel ? ` · ${rotuloTaxonomia(item.nivel)}` : ''}
              </td>
              <td className="px-3 py-3 text-ink-2">
                {item.prioridade ? ROTULO_PRIORIDADE[item.prioridade] : '--'}
              </td>
              <td className="px-3 py-3 text-ink-2">
                {item.tipo === 'ENTRADA' ? 'Entrada' : item.etapa ? ROTULO_ETAPA[item.etapa] : '--'}
              </td>
              <td className="px-3 py-3 text-ink-2">{item.curriculoVinculado?.rotulo ?? '--'}</td>
              <td className="px-3 py-3 text-right">
                {typeof item.score === 'number' ? <ScoreNum valor={item.score} /> : '--'}
              </td>
              <td className="px-3 py-3 text-ink-2">{item.proximoPasso?.titulo ?? '--'}</td>
              <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums text-faint">
                {fmtData(item.ultimaAtividade)}
              </td>
              <td className="px-3 py-3 text-right">
                {item.tipo === 'ENTRADA' ? (
                  <Button size="sm" variant="secondary" onClick={() => onAtivar(item.id)}>
                    Ativar
                  </Button>
                ) : (
                  <button
                    onClick={() => onAbrir(item.id)}
                    className="text-[13px] font-medium text-accent transition-colors hover:text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-control px-1"
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
  );
}
