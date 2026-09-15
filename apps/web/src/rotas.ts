import { useEffect, useState } from 'react';

export type Aba = 'hoje' | 'oportunidades' | 'curriculos' | 'conhecimento' | 'perfil';

export type VisaoHub = 'lista' | 'board' | 'grafo';

export type FiltrosHub = {
  visao: VisaoHub;
  busca?: string;
  estado?: string;
  ordenarPor?: string;
  prioridade?: string;
};

export type Rota =
  | { tela: 'hoje' }
  | ({ tela: 'oportunidades' } & FiltrosHub)
  | { tela: 'workspace'; id: string }
  | { tela: 'curriculo'; oportunidadeId: string; curriculoId: string }
  | { tela: 'curriculos' }
  | { tela: 'conhecimento' }
  | { tela: 'perfil' };

const VISOES: VisaoHub[] = ['lista', 'board', 'grafo'];

function normalizarVisao(valor: string | null, fallback: VisaoHub = 'lista'): VisaoHub {
  return VISOES.includes(valor as VisaoHub) ? (valor as VisaoHub) : fallback;
}

function visaoDoModo(modo: string | null): VisaoHub {
  if (modo === 'grafo') return 'grafo';
  return 'board';
}

export function parseRota(
  pathname = window.location.pathname,
  search = window.location.search,
): Rota {
  const path = pathname.replace(/\/$/, '') || '/';
  const q = new URLSearchParams(search);
  if (path === '/' || path === '/hoje' || path === '/dashboard') return { tela: 'hoje' };

  if (path === '/vagas' || path === '/banco-vagas' || path === '/oportunidades') {
    return {
      tela: 'oportunidades',
      visao: normalizarVisao(q.get('visao')),
      busca: q.get('busca') ?? undefined,
      estado: q.get('estado') ?? (path === '/banco-vagas' ? 'entrada' : undefined),
      ordenarPor: q.get('ordenarPor') ?? undefined,
      prioridade: q.get('prioridade') ?? undefined,
    };
  }

  const ws = path.match(/^\/oportunidades\/([^/]+)$/);
  if (ws) return { tela: 'workspace', id: ws[1] };
  const cv = path.match(/^\/oportunidades\/([^/]+)\/curriculos\/([^/]+)$/);
  if (cv) return { tela: 'curriculo', oportunidadeId: cv[1], curriculoId: cv[2] };

  if (path === '/pipeline' || path === '/candidaturas') {
    return {
      tela: 'oportunidades',
      visao: visaoDoModo(q.get('modo')),
      busca: q.get('busca') ?? undefined,
      prioridade: q.get('prioridade') ?? undefined,
    };
  }

  if (path === '/curriculos') return { tela: 'curriculos' };
  if (path === '/conhecimento') return { tela: 'conhecimento' };
  if (path === '/perfil') return { tela: 'perfil' };
  return { tela: 'hoje' };
}

export function hrefRota(rota: Rota): string {
  switch (rota.tela) {
    case 'hoje':
      return '/hoje';
    case 'oportunidades': {
      const q = new URLSearchParams();
      q.set('visao', rota.visao);
      if (rota.busca) q.set('busca', rota.busca);
      if (rota.estado) q.set('estado', rota.estado);
      if (rota.ordenarPor) q.set('ordenarPor', rota.ordenarPor);
      if (rota.prioridade) q.set('prioridade', rota.prioridade);
      return `/oportunidades?${q.toString()}`;
    }
    case 'workspace':
      return `/oportunidades/${rota.id}`;
    case 'curriculo':
      return `/oportunidades/${rota.oportunidadeId}/curriculos/${rota.curriculoId}`;
    case 'curriculos':
      return '/curriculos';
    case 'conhecimento':
      return '/conhecimento';
    case 'perfil':
      return '/perfil';
  }
}

export function abaDaRota(rota: Rota): Aba | null {
  switch (rota.tela) {
    case 'hoje':
      return 'hoje';
    case 'oportunidades':
    case 'workspace':
      return 'oportunidades';
    case 'curriculos':
    case 'curriculo':
      return 'curriculos';
    case 'conhecimento':
      return 'conhecimento';
    case 'perfil':
      return 'perfil';
  }
}

export function useRota() {
  const [rota, setRota] = useState(() => parseRota());

  useEffect(() => {
    const atual = hrefRota(rota);
    if (`${window.location.pathname}${window.location.search}` !== atual) {
      window.history.replaceState(null, '', atual);
    }
    function onPop() {
      setRota(parseRota());
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function ir(proxima: Rota, replace = false) {
    const href = hrefRota(proxima);
    if (replace) window.history.replaceState(null, '', href);
    else window.history.pushState(null, '', href);
    setRota(proxima);
  }

  return { rota, ir };
}
