import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  getPipeline,
  transicionarOportunidade,
  type EtapaPipeline,
  type PipelineFiltros,
  type PipelineItem,
} from './api';
import { COLUNAS_KANBAN, ROTULO_ETAPA, ROTULO_PRIORIDADE, destinoDaEtapa } from './rotulos';
import type { Selecao } from './hubTipos';
import { fmtData } from './ui';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

function selecaoDe(item: PipelineItem): Selecao {
  return {
    id: item.id,
    titulo: item.titulo,
    empresa: item.empresa,
    etapa: item.etapa,
    prioridade: item.prioridade,
    score: item.score,
    proximoPasso: item.proximoPasso?.titulo ?? null,
    curriculo: item.curriculo?.rotulo ?? null,
  };
}

export function OportunidadesBoard({
  filtros,
  selecionadaId,
  onSelecionar,
  onAbrir,
  onErro,
  onStatus,
}: {
  filtros: PipelineFiltros;
  selecionadaId: string | null;
  onSelecionar: (sel: Selecao) => void;
  onAbrir: (id: string) => void;
  onErro: (msg: string) => void;
  onStatus: (msg: string) => void;
}) {
  const [itens, setItens] = useState<PipelineItem[] | null>(null);
  const [ativo, setAtivo] = useState<PipelineItem | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function carregar() {
    getPipeline(filtros)
      .then(setItens)
      .catch((err) => onErro((err as Error).message));
  }

  useEffect(carregar, [JSON.stringify(filtros)]);

  const colunas = useMemo(
    () =>
      COLUNAS_KANBAN.map((col) => ({
        col,
        cards: (itens ?? []).filter((i) => i.etapa === col),
      })),
    [itens],
  );

  async function mover(item: PipelineItem, etapaDestino: EtapaPipeline) {
    if (item.etapa === etapaDestino) return;
    const destino = etapaDestino === 'ENCERRADAS' ? 'ARQUIVADA' : destinoDaEtapa(etapaDestino);
    if (!destino) return;
    setItens((atual) => atual?.map((i) => (i.id === item.id ? { ...i, etapa: etapaDestino } : i)) ?? atual);
    try {
      await transicionarOportunidade(item.id, destino);
      onStatus(`${item.titulo} movida para ${ROTULO_ETAPA[etapaDestino]}`);
      carregar();
    } catch (err) {
      onErro((err as Error).message);
      carregar();
    }
  }

  function onDragStart(e: DragStartEvent) {
    setAtivo((itens ?? []).find((i) => i.id === e.active.id) ?? null);
  }

  function onDragEnd(e: DragEndEvent) {
    setAtivo(null);
    const item = (itens ?? []).find((i) => i.id === e.active.id);
    if (!item || !e.over) return;
    void mover(item, e.over.id as EtapaPipeline);
  }

  if (!itens) return <p className="py-8 text-[14px] text-muted">Carregando board...</p>;

  if (itens.length === 0) {
    return (
      <div className="rounded-card border border-line bg-ground p-8 text-center">
        <p className="text-[14px] text-muted">
          {filtros.busca ? 'Nenhum resultado para estes filtros.' : 'Nenhuma oportunidade ativa no board ainda.'}
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="-mx-6 overflow-x-auto px-6 nav:-mx-8 nav:px-8">
        <div className="flex min-w-max gap-4 pb-2">
          {colunas.map(({ col, cards }) => (
            <Coluna key={col} etapa={col} total={cards.length}>
              {cards.map((c) => (
                <CartaoBoard
                  key={c.id}
                  item={c}
                  selecionado={selecionadaId === c.id}
                  onSelecionar={() => onSelecionar(selecaoDe(c))}
                  onAbrir={() => onAbrir(c.id)}
                  onMover={(etapa) => void mover(c, etapa)}
                />
              ))}
            </Coluna>
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {ativo && (
          <article className="w-64 rounded-card border border-accent bg-ground p-3 shadow-elevate">
            <div className="text-[14px] font-semibold text-ink">{ativo.titulo}</div>
            <div className="text-[13px] text-muted">{ativo.empresa}</div>
          </article>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Coluna({
  etapa,
  total,
  children,
}: {
  etapa: EtapaPipeline;
  total: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-label uppercase text-muted">{ROTULO_ETAPA[etapa]}</span>
        <span className="font-mono text-[12px] tabular-nums text-faint">{total}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[440px] flex-col gap-2 rounded-card border p-2 transition-colors',
          isOver ? 'border-accent bg-accent-soft/40' : 'border-line bg-canvas',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function CartaoBoard({
  item,
  selecionado,
  onSelecionar,
  onAbrir,
  onMover,
}: {
  item: PipelineItem;
  selecionado: boolean;
  onSelecionar: () => void;
  onAbrir: () => void;
  onMover: (etapa: EtapaPipeline) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <article
      ref={setNodeRef}
      aria-label={`${item.titulo}, ${item.empresa}, ${ROTULO_ETAPA[item.etapa]}`}
      className={cn(
        'rounded-card border bg-ground p-3 shadow-rest transition-colors',
        selecionado ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong',
        isDragging && 'opacity-40',
      )}
    >
      <div
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        onClick={onSelecionar}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelecionar();
          }
        }}
        className="cursor-grab touch-none active:cursor-grabbing"
      >
        <div className="text-[14px] font-semibold leading-snug text-ink">{item.titulo}</div>
        <div className="mt-0.5 text-[13px] text-muted">{item.empresa}</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-faint">
          <span>{ROTULO_PRIORIDADE[item.prioridade]}</span>
          <span aria-hidden>·</span>
          <span>{item.proximoPasso?.titulo ?? 'Sem próximo passo'}</span>
          {item.proximoPasso?.venceEm && <span className="font-mono tabular-nums">{fmtData(item.proximoPasso.venceEm)}</span>}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Mover {item.titulo}</span>
          <NativeSelect
            className="h-8 text-[13px]"
            value={item.etapa}
            onChange={(e) => onMover(e.target.value as EtapaPipeline)}
          >
            {COLUNAS_KANBAN.map((c) => (
              <option key={c} value={c}>{ROTULO_ETAPA[c]}</option>
            ))}
          </NativeSelect>
        </label>
        <button
          type="button"
          onClick={onAbrir}
          className="h-8 shrink-0 rounded-control px-2 text-[13px] font-medium text-accent transition-colors hover:text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Abrir
        </button>
      </div>
    </article>
  );
}
