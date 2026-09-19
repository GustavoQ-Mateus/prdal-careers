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

const PALETA_TIPO = ['#2563eb', '#0f766e', '#9333ea', '#c2410c', '#b45309', '#be185d'];

function corTipo(tipo: string, tipos: string[]) {
  return PALETA_TIPO[Math.max(0, tipos.indexOf(tipo)) % PALETA_TIPO.length];
}

function CarregarGrafo({ dados, layoutAtivo, tipos }: { dados: GrafoResposta; layoutAtivo: boolean; tipos: string[] }) {
  const loadGraph = useLoadGraph();
  const sigma = useSigma();
  const layout = useRef<FA2Layout | null>(null);

  useEffect(() => {
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
          color: corTipo(node.tipo, tipos),
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
  }, [dados, loadGraph, tipos]);

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

function TemaSigma({ versao, tipos }: { versao: number; tipos: string[] }) {
  const sigma = useSigma();
  useEffect(() => {
    sigma.setSetting('labelColor', { color: cor('--ink', '#0f1512') });
    sigma.setSetting('defaultEdgeColor', cor('--line-strong', '#d6dbd8'));
    for (const node of sigma.getGraph().nodes()) {
      const tipo = sigma.getGraph().getNodeAttribute(node, 'tipo') as string;
      sigma.getGraph().setNodeAttribute(node, 'color', corTipo(tipo, tipos));
    }
    sigma.refresh();
  }, [sigma, versao, tipos]);
  return null;
}

function EventosGrafo({ onSelecionar }: { onSelecionar: (sel: Selecao) => void }) {
  const register = useRegisterEvents();
  const sigma = useSigma();
  useEffect(() => {
    let arrastando: string | null = null;
    register({
      clickNode({ node }: { node: string }) {
        if (arrastando) return;
        if (!node.startsWith('oportunidade:')) return;
        const rotulo = sigma.getGraph().getNodeAttribute(node, 'label') as string;
        onSelecionar({ id: node.slice('oportunidade:'.length), titulo: rotulo });
      },
      downNode({ node, event }: { node: string; event: { preventSigmaDefault: () => void } }) {
        event.preventSigmaDefault();
        arrastando = node;
        sigma.getGraph().setNodeAttribute(node, 'fixed', true);
      },
      moveBody({ event }: { event: unknown }) {
        if (!arrastando) return;
        const evento = event as unknown as {
          preventSigmaDefault?: () => void;
          original?: { preventDefault?: () => void; stopPropagation?: () => void };
        };
        evento.preventSigmaDefault?.();
        evento.original?.preventDefault?.();
        evento.original?.stopPropagation?.();
        const posicao = sigma.viewportToGraph(event as never);
        sigma.getGraph().setNodeAttribute(arrastando, 'x', posicao.x);
        sigma.getGraph().setNodeAttribute(arrastando, 'y', posicao.y);
        sigma.refresh();
      },
      upNode() { arrastando = null; },
      upStage() { arrastando = null; },
    } as never);
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
  const [temaVersao, setTemaVersao] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setTemaVersao((versao) => versao + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

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
  const tipos = useMemo(() => dados ? [...new Set(dados.nodes.map((node) => node.tipo))] : [], [dados]);

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
        <dl className="flex flex-wrap items-center gap-4 text-[13px]">
          {tipos.map((tipo) => <div key={tipo} className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: corTipo(tipo, tipos) }} aria-hidden />
            <dt className="text-muted">{tipo}</dt>
          </div>)}
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
          <CarregarGrafo dados={dados} layoutAtivo={layoutAtivo} tipos={tipos} />
          <TemaSigma versao={temaVersao} tipos={tipos} />
          <EventosGrafo onSelecionar={onSelecionar} />
        </SigmaContainer>
      </div>

      <div>
        <p className="pb-2 text-label uppercase text-muted">Nós ({filtrados.length})</p>
        <ul className="divide-y divide-line rounded-card border border-line bg-ground">
          {filtrados.map((n) => (
            <li key={n.id} className="flex items-center gap-3 px-4 py-2.5 text-[14px]">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: corTipo(n.tipo, tipos) }}
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
