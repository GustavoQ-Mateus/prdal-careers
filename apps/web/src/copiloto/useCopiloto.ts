import { useEffect, useReducer, useRef } from 'react';
import {
  streamCopiloto,
  type CopilotoChatBody,
  type CopilotoEvento,
  type ModoCopiloto,
} from '../api';
import type { EstadoCopiloto, Item } from './tipos';

interface Estado {
  itens: Item[];
  estado: EstadoCopiloto;
  conversaId?: string;
  modo: ModoCopiloto;
  oportunidadeId?: string;
  streaming: boolean;
  ultimoEnvio?: CopilotoChatBody;
}

type Acao =
  | { t: 'restaurar'; payload: Partial<Estado> }
  | { t: 'inicioTurno'; envio: CopilotoChatBody }
  | { t: 'evento'; ev: CopilotoEvento }
  | { t: 'abortado' }
  | { t: 'modo'; modo: ModoCopiloto }
  | { t: 'nova' };

let contador = 0;
const novoId = () => `i${Date.now().toString(36)}${(contador++).toString(36)}`;

function estadoInicialTurno(modo: ModoCopiloto): EstadoCopiloto {
  return modo === 'autopiloto' ? 'autopiloto_em_curso' : 'pensando';
}

function aplicarEvento(estado: Estado, ev: CopilotoEvento): Estado {
  const itens = estado.itens;
  const autopiloto = estado.modo === 'autopiloto';

  switch (ev.evento) {
    case 'token': {
      const ultimo = itens[itens.length - 1];
      const proximoEstado: EstadoCopiloto = autopiloto ? 'autopiloto_em_curso' : 'pensando';
      if (ultimo && ultimo.tipo === 'agente' && ultimo.vivo) {
        const atualizado: Item = { ...ultimo, texto: ultimo.texto + ev.data.delta };
        return { ...estado, estado: proximoEstado, itens: [...itens.slice(0, -1), atualizado] };
      }
      const novo: Item = { tipo: 'agente', id: novoId(), texto: ev.data.delta, vivo: true };
      return { ...estado, estado: proximoEstado, itens: [...encerrarVivos(itens), novo] };
    }
    case 'tool_call': {
      const passo: Item = {
        tipo: 'passo',
        id: novoId(),
        callId: ev.data.callId,
        tool: ev.data.tool,
        efeito: ev.data.efeito,
        args: ev.data.args,
        status: 'executando',
      };
      const proximoEstado: EstadoCopiloto = autopiloto
        ? 'autopiloto_em_curso'
        : ev.data.efeito === 'escrita'
          ? 'executando_escrita'
          : 'executando_leitura';
      return { ...estado, estado: proximoEstado, itens: [...encerrarVivos(itens), passo] };
    }
    case 'confirmacao': {
      const cartao: Item = {
        tipo: 'confirmacao',
        id: novoId(),
        callId: ev.data.callId,
        tool: ev.data.tool,
        resumo: ev.data.resumo,
        args: ev.data.args,
      };
      return { ...estado, itens: [...encerrarVivos(itens), cartao] };
    }
    case 'tool_resultado': {
      const atualizados = itens.map((it): Item =>
        it.tipo === 'passo' && it.callId === ev.data.callId
          ? {
              ...it,
              status: ev.data.ok ? 'ok' : 'erro',
              resultado: ev.data.resultado,
              erro: ev.data.erro?.mensagem,
            }
          : it,
      );
      return { ...estado, itens: atualizados };
    }
    case 'entrega_externa': {
      const cartao: Item = {
        tipo: 'entrega',
        id: novoId(),
        kind: ev.data.tipo,
        titulo: ev.data.titulo,
        texto: ev.data.texto,
        destino: ev.data.destino,
      };
      return { ...estado, itens: [...encerrarVivos(itens), cartao] };
    }
    case 'erro': {
      const cartao: Item = {
        tipo: 'erro',
        id: novoId(),
        escopo: ev.data.escopo,
        mensagem: ev.data.mensagem,
      };
      return { ...estado, itens: [...encerrarVivos(itens), cartao] };
    }
    case 'fim_turno': {
      const motivo = ev.data.motivo;
      const proximo: EstadoCopiloto =
        motivo === 'aguardando_confirmacao'
          ? 'aguardando_confirmacao'
          : motivo === 'aguardando_acao_externa'
            ? autopiloto
              ? 'autopiloto_parado_externo'
              : 'entrega_externa'
            : motivo === 'erro'
              ? 'erro_turno'
              : 'ocioso';
      return {
        ...estado,
        estado: proximo,
        streaming: false,
        conversaId: ev.data.conversaId || estado.conversaId,
        itens: encerrarVivos(itens),
      };
    }
  }
}

function encerrarVivos(itens: Item[]): Item[] {
  return itens.map((it) => (it.tipo === 'agente' && it.vivo ? { ...it, vivo: false } : it));
}

function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.t) {
    case 'restaurar':
      return { ...estado, ...acao.payload };
    case 'inicioTurno': {
      const envio = acao.envio;
      let itens = encerrarVivos(estado.itens);
      if (envio.mensagem) {
        itens = [...itens, { tipo: 'usuario', id: novoId(), texto: envio.mensagem }];
      }
      if (envio.confirmacao) {
        const alvo = envio.confirmacao;
        itens = itens.map((it) =>
          it.tipo === 'confirmacao' && it.callId === alvo.callId
            ? { ...it, decisao: alvo.decisao }
            : it,
        );
      }
      return {
        ...estado,
        itens,
        streaming: true,
        estado: estadoInicialTurno(estado.modo),
        ultimoEnvio: envio,
      };
    }
    case 'evento':
      return aplicarEvento(estado, acao.ev);
    case 'abortado':
      return { ...estado, streaming: false, estado: 'ocioso', itens: encerrarVivos(estado.itens) };
    case 'modo':
      return { ...estado, modo: acao.modo };
    case 'nova':
      return {
        ...estado,
        itens: [],
        conversaId: undefined,
        estado: 'ocioso',
        streaming: false,
        ultimoEnvio: undefined,
      };
  }
}

const chave = (oportunidadeId?: string) => `copiloto:conversa:${oportunidadeId ?? '_global'}`;

function carregar(oportunidadeId?: string): Partial<Estado> {
  try {
    const bruto = localStorage.getItem(chave(oportunidadeId));
    if (!bruto) return {};
    const p = JSON.parse(bruto) as Partial<Estado>;
    return {
      itens: (p.itens ?? []).map((it) => (it.tipo === 'agente' ? { ...it, vivo: false } : it)),
      conversaId: p.conversaId,
      modo: p.modo ?? 'assistido',
      estado: p.estado === 'erro_turno' ? 'erro_turno' : reidratarEstado(p),
    };
  } catch {
    return {};
  }
}

function reidratarEstado(p: Partial<Estado>): EstadoCopiloto {
  const ultimo = p.itens?.[p.itens.length - 1];
  if (ultimo?.tipo === 'confirmacao' && !ultimo.decisao) return 'aguardando_confirmacao';
  if (ultimo?.tipo === 'entrega') return 'entrega_externa';
  return 'ocioso';
}

export function useCopiloto(oportunidadeId?: string) {
  const [estado, dispatch] = useReducer(reducer, undefined, (): Estado => ({
    itens: [],
    estado: 'ocioso',
    modo: 'assistido',
    streaming: false,
    oportunidadeId,
    ...carregar(oportunidadeId),
  }));

  const refEstado = useRef(estado);
  refEstado.current = estado;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    dispatch({
      t: 'restaurar',
      payload: { oportunidadeId, ...carregar(oportunidadeId) },
    });
  }, [oportunidadeId]);

  useEffect(() => {
    const payload = {
      itens: estado.itens,
      conversaId: estado.conversaId,
      modo: estado.modo,
      estado: estado.estado,
    };
    try {
      localStorage.setItem(chave(oportunidadeId), JSON.stringify(payload));
    } catch {
      /* storage cheio ou indisponivel */
    }
  }, [estado.itens, estado.conversaId, estado.modo, estado.estado, oportunidadeId]);

  async function correr(envio: CopilotoChatBody) {
    dispatch({ t: 'inicioTurno', envio });
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const corpo: CopilotoChatBody = {
      ...envio,
      modo: refEstado.current.modo,
      oportunidadeId,
      conversaId: refEstado.current.conversaId,
    };
    try {
      await streamCopiloto(corpo, (ev) => dispatch({ t: 'evento', ev }), ctrl.signal);
    } catch (err) {
      if (ctrl.signal.aborted) {
        dispatch({ t: 'abortado' });
      } else {
        dispatch({
          t: 'evento',
          ev: { evento: 'erro', data: { escopo: 'interno', mensagem: (err as Error).message, recuperavel: true } },
        });
        dispatch({
          t: 'evento',
          ev: { evento: 'fim_turno', data: { motivo: 'erro', conversaId: refEstado.current.conversaId ?? '' } },
        });
      }
    } finally {
      abortRef.current = null;
    }
  }

  return {
    ...estado,
    enviar: (mensagem: string) => {
      if (!mensagem.trim() || refEstado.current.streaming) return;
      void correr({ mensagem });
    },
    confirmar: (callId: string, ajustes?: Record<string, unknown>) => {
      if (refEstado.current.streaming) return;
      void correr({ confirmacao: { callId, decisao: 'confirmar', ajustes } });
    },
    recusar: (callId: string) => {
      if (refEstado.current.streaming) return;
      void correr({ confirmacao: { callId, decisao: 'recusar' } });
    },
    repetir: () => {
      const envio = refEstado.current.ultimoEnvio;
      if (envio && !refEstado.current.streaming) void correr(envio);
    },
    parar: () => abortRef.current?.abort(),
    trocarModo: (modo: ModoCopiloto) => dispatch({ t: 'modo', modo }),
    novaConversa: () => {
      abortRef.current?.abort();
      dispatch({ t: 'nova' });
    },
  };
}
