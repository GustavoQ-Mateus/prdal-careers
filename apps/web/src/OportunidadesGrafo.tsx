import { useEffect, useMemo, useRef, useState } from 'react';
import Graph from 'graphology';
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { getPipelineGrafo, type GrafoResposta, type PipelineFiltros } from './api';
import type { Selecao } from './hubTipos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function cor(nome: string, fallback: string) {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return valor || fallback;
}

function CarregarGrafo({ dados, layoutAtivo }: { dados: GrafoResposta; layoutAtivo: boolean }) {
  const loadGraph = useLoadGraph();
  const sigma = useSigma();
  const layout = useRef<FA2Layout | null>(null);

  useEffect(() => {
    const corOportunidade = cor('--accent', '#0c7d6e');
    const corEntidade = cor('--faint', '#949b97');
    const graph = new Graph({ type: 'undirected', multi: false });
    for (const node of dados.nodes) {
      if (!graph.hasNode(node.id)) {
        const oportunidade = node.tipo === 'oportunidade';
        graph.addNode(node.id, {
          label: node.rotulo,
          tipo: node.tipo,
          size: oportunidade ? 9 : 5,
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: oportunidade ? corOportunidade : corEntidade,
        });
      }
    }
    for (const edge of dados.edges) {
      if (
        graph.hasNode(edge.origem) &&
        graph.hasNode(edge.destino) &&
        !graph.hasEdge(edge.origem, edge.destino)
      ) {
        graph.addEdge(edge.origem, edge.destino, { tipo: edge.tipo });
      }
    }
    loadGraph(graph);
    return () => {
      layout.current?.kill();
      layout.current = null;
    };
  }, [dados, loadGraph]);

  useEffect(() => {
    const graph = sigma.getGraph();
    layout.current?.kill();
    if (!layoutAtivo || graph.order === 0) return;
    layout.current = new FA2Layout(graph, { settings: { slowDown: 8, gravity: 1 } });
    layout.current.start();
    return () => {
      layout.current?.kill();
      layout.current = null;
    };
  }, [layoutAtivo, sigma, dados]);

  return null;
}

function EventosGrafo({ onSelecionar }: { onSelecionar: (sel: Selecao) => void }) {
  const register = useRegisterEvents();
  const sigma = useSigma();
  useEffect(() => {
    register({
      clickNode({ node }) {
        if (!node.startsWith('oportunidade:')) return;
        const rotulo = sigma.getGraph().getNodeAttribute(node, 'label') as string;
        onSelecionar({ id: node.slice('oportunidade:'.length), titulo: rotulo });
      },
    });
  }, [register, sigma, onSelecionar]);
  return null;
}

export function OportunidadesGrafo({
  filtros,
  onSelecionar,
  onErro,
}: {
  filtros: PipelineFiltros;
  onSelecionar: (sel: Selecao) => void;
  onErro: (msg: string) => void;
}) {
  const [dados, setDados] = useState<GrafoResposta | null>(null);
  const [layoutAtivo, setLayoutAtivo] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [busca, setBusca] = useState('');

  useEffect(() => {
    getPipelineGrafo(filtros)
      .then(setDados)
      .catch((err) => onErro((err as Error).message));
  }, [JSON.stringify(filtros)]);

  const filtrados = useMemo(() => {
    if (!dados) return [];
    const q = busca.toLowerCase();
    return dados.nodes.filter((n) => n.rotulo.toLowerCase().includes(q));
  }, [dados, busca]);

  if (!dados) return <p className="py-8 text-[14px] text-muted">Carregando grafo...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grafo-busca">Buscar nós</Label>
            <Input
              id="grafo-busca"
              className="w-56"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Rótulo do nó"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setLayoutAtivo((v) => !v)}>
            {layoutAtivo ? 'Pausar layout' : 'Retomar layout'}
          </Button>
        </div>
        <dl className="flex items-center gap-4 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-accent" aria-hidden />
            <dt className="text-muted">Oportunidade</dt>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-faint" aria-hidden />
            <dt className="text-muted">Entidade relacionada</dt>
          </div>
        </dl>
      </div>

      <div
        className="h-[560px] overflow-hidden rounded-card border border-line bg-ground"
        role="application"
        aria-label="Grafo de oportunidades"
      >
        <SigmaContainer
          settings={{
            renderLabels: true,
            labelColor: { color: cor('--ink', '#0f1512') },
            labelFont: getComputedStyle(document.documentElement).getPropertyValue('--font-sans') || 'sans-serif',
            defaultEdgeColor: cor('--line-strong', '#d6dbd8'),
          }}
        >
          <CarregarGrafo dados={dados} layoutAtivo={layoutAtivo} />
          <EventosGrafo onSelecionar={onSelecionar} />
        </SigmaContainer>
      </div>

      <div>
        <p className="pb-2 text-label uppercase text-muted">Nós ({filtrados.length})</p>
        <ul className="divide-y divide-line rounded-card border border-line bg-ground">
          {filtrados.map((n) => (
            <li key={n.id} className="flex items-center gap-3 px-4 py-2.5 text-[14px]">
              <span
                className={n.tipo === 'oportunidade' ? 'size-2.5 rounded-full bg-accent' : 'size-2 rounded-full bg-faint'}
                aria-hidden
              />
              <span className="text-faint">{n.tipo}</span>
              <span className="text-ink">{n.rotulo}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
