import { useEffect, useReducer, useRef } from 'react';
import {
  getCurriculo,
  getGeracao,
  streamCopiloto,
  type CopilotoChatBody,
  type CopilotoEvento,
  type ConversaCopilotoDetalhe,
  type GeracaoCurriculo,
  type ModoCopiloto,
} from '../api';
import type { EstadoCopiloto, Item } from './tipos';
import {
  MARCADOR_NARRACAO_ATS_ETAPA_3,
  dividirNarracaoAts,
  scoresNarracaoAts,
} from './visualizacao';

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
  | { t: 'atualizarGeracao'; jobId: string; geracao: GeracaoCurriculo }
  | { t: 'previewCurriculo'; curriculo: { id: string; rotulo: string; score: number | null } }
  | { t: 'abortado' }
  | { t: 'modo'; modo: ModoCopiloto }
  | { t: 'abrirHistorico'; conversa: ConversaCopilotoDetalhe }
  | { t: 'nova' };

let contador = 0;
const novoId = () => `i${Date.now().toString(36)}${(contador++).toString(36)}`;

function estadoInicialTurno(modo: ModoCopiloto): EstadoCopiloto {
  return modo === 'autopiloto' ? 'autopiloto_em_curso' : 'pensando';
}

function passoDoEvento(ev: Extract<CopilotoEvento, { evento: 'tool_call' }>): import('./tipos').PassoOperacao {
  return {
    callId: ev.data.callId,
    tool: ev.data.tool,
    efeito: ev.data.efeito,
    args: ev.data.args,
    status: 'executando',
  };
}

function operacaoAtual(itens: Item[]): number {
  return itens.findLastIndex(
    (item) =>
      item.tipo === 'operacao' &&
      item.etapa !== 'erro' &&
      (item.etapa !== 'concluida' || item.aguardandoCurriculo),
  );
}

function proximoEstadoTool(autopiloto: boolean, efeito: 'leitura' | 'escrita'): EstadoCopiloto {
  if (autopiloto) return 'autopiloto_em_curso';
  return efeito === 'escrita' ? 'executando_escrita' : 'executando_leitura';
}

function aplicarEvento(estado: Estado, ev: CopilotoEvento): Estado {
  const itens = estado.itens;
  const autopiloto = estado.modo === 'autopiloto';

  switch (ev.evento) {
    case 'token': {
      const ultimo = itens[itens.length - 1];
      const proximoEstado: EstadoCopiloto = autopiloto ? 'autopiloto_em_curso' : 'pensando';
      if (ev.data.delta.trim() === MARCADOR_NARRACAO_ATS_ETAPA_3) {
        return { ...estado, estado: proximoEstado, itens: encerrarVivos(itens) };
      }
      if (ultimo && ultimo.tipo === 'agente' && ultimo.vivo) {
        const texto = ultimo.texto + ev.data.delta;
        const atualizado: Item = { ...ultimo, texto, scoresAts: scoresNarracaoAts(itens, texto) };
        return { ...estado, estado: proximoEstado, itens: [...itens.slice(0, -1), atualizado] };
      }
      const novo: Item = {
        tipo: 'agente',
        id: novoId(),
        texto: ev.data.delta,
        vivo: true,
        scoresAts: scoresNarracaoAts(itens, ev.data.delta),
      };
      return { ...estado, estado: proximoEstado, itens: [...encerrarVivos(itens), novo] };
    }
    case 'tool_call': {
      const passo = passoDoEvento(ev);
      const indiceOperacao = operacaoAtual(itens);
      const deveConsolidar =
        ev.data.tool === 'registrar_oportunidade' ||
        (indiceOperacao >= 0 &&
          ['gerar_curriculo', 'status_geracao', 'buscar_curriculo'].includes(ev.data.tool));

      if (deveConsolidar) {
        const operacao = ev.data.tool === 'registrar_oportunidade' || indiceOperacao < 0
          ? null
          : itens[indiceOperacao] as Extract<Item, { tipo: 'operacao' }>;
        const proximaEtapa = ev.data.tool === 'registrar_oportunidade'
          ? 'registrando'
          : ev.data.tool === 'gerar_curriculo'
            ? 'gerando'
            : ev.data.tool === 'status_geracao'
              ? 'acompanhando'
              : operacao?.etapa ?? 'concluida';
        const atualizados = [...encerrarVivos(itens)];
        if (operacao) {
          atualizados[indiceOperacao] = { ...operacao, etapa: proximaEtapa, passos: [...operacao.passos, passo] };
        } else {
          atualizados.push({ tipo: 'operacao', id: novoId(), etapa: proximaEtapa, passos: [passo] });
        }
        return { ...estado, estado: proximoEstadoTool(autopiloto, ev.data.efeito), itens: atualizados };
      }

      const item: Item = { tipo: 'passo', id: novoId(), ...passo };
      return {
        ...estado,
        estado: proximoEstadoTool(autopiloto, ev.data.efeito),
        itens: [...encerrarVivos(itens), item],
      };
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
      const atualizados = itens.map((it): Item => {
        if (it.tipo === 'passo' && it.callId === ev.data.callId) {
          return { ...it, status: statusPasso(it.tool, ev.data.ok, ev.data.resultado), resultado: ev.data.resultado, erro: ev.data.erro?.mensagem };
        }
        if (it.tipo !== 'operacao') return it;
        const passo = it.passos.find((candidato) => candidato.callId === ev.data.callId);
        if (!passo) return it;
        const passos = it.passos.map((candidato) =>
          candidato.callId === ev.data.callId
            ? { ...candidato, status: statusPasso(candidato.tool, ev.data.ok, ev.data.resultado), resultado: ev.data.resultado, erro: ev.data.erro?.mensagem }
            : candidato,
        );
        const resultado = ev.data.resultado as Record<string, unknown> | null;
        const status = String(resultado?.status ?? '');
        if (passo.tool === 'gerar_curriculo' && ev.data.ok && typeof resultado?.jobId === 'string') {
          return { ...it, passos, jobId: resultado.jobId, etapa: status === 'CONCLUIDA' ? 'concluida' : status === 'ERRO' ? 'erro' : 'acompanhando' };
        }
        if (passo.tool === 'status_geracao') {
          return { ...it, passos, etapa: status === 'ERRO' ? 'erro' : status === 'CONCLUIDA' ? 'concluida' : 'acompanhando', aguardandoCurriculo: status === 'CONCLUIDA' };
        }
        if (passo.tool === 'buscar_curriculo') return { ...it, passos, etapa: ev.data.ok ? 'concluida' : 'erro', aguardandoCurriculo: false };
        return { ...it, passos, etapa: ev.data.ok ? it.etapa : 'erro' };
      });
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

function statusPasso(tool: string, ok: boolean, resultado: unknown): 'executando' | 'ok' | 'erro' {
  if (!ok) return 'erro';
  if (tool !== 'status_geracao' || !resultado || typeof resultado !== 'object') return 'ok';
  const status = String((resultado as Record<string, unknown>).status ?? '');
  return status === 'CONCLUIDA' || status === 'ERRO' ? 'ok' : 'executando';
}

function encerrarVivos(itens: Item[]): Item[] {
  return itens.map((it) => (it.tipo === 'agente' && it.vivo ? { ...it, vivo: false } : it));
}

function itemToolHistorico(indice: number, tool: string | null | undefined, conteudo: string): Item {
  const falha = conteudo.startsWith('falha:');
  let resultado: unknown = conteudo;
  if (!falha) {
    try {
      resultado = JSON.parse(conteudo);
    } catch {
      resultado = conteudo;
    }
  }
  const args =
    tool === 'status_geracao' && resultado && typeof resultado === 'object' && 'id' in resultado
      ? { jobId: String((resultado as Record<string, unknown>).id) }
      : {};
  return {
    tipo: 'passo',
    id: `h${indice}`,
    callId: `historico-${indice}`,
    tool: tool ?? 'tool',
    efeito: 'leitura',
    args,
    status: falha ? 'erro' : 'ok',
    resultado: falha ? null : resultado,
    erro: falha ? conteudo.replace(/^falha:\s*/, '') : undefined,
  };
}

function itensDeHistorico(conversa: ConversaCopilotoDetalhe): Item[] {
  const itens = conversa.mensagens.flatMap((mensagem, indice): Item[] => {
    if (mensagem.papel === 'user') {
      return [{ tipo: 'usuario', id: `h${indice}`, texto: mensagem.conteudo }];
    }
    if (mensagem.papel === 'assistant') {
      return dividirNarracaoAts(mensagem.conteudo).map((texto, parte) => ({
        tipo: 'agente', id: `h${indice}-${parte}`, texto, vivo: false,
      }));
    }
    return [itemToolHistorico(indice, mensagem.tool, mensagem.conteudo)];
  });
  return itens.map((item, indice, todos) =>
    item.tipo === 'agente'
      ? { ...item, scoresAts: scoresNarracaoAts(todos.slice(0, indice), item.texto) }
      : item,
  );
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
    case 'atualizarGeracao': {
      const terminal = acao.geracao.status === 'CONCLUIDA' || acao.geracao.status === 'ERRO';
      return {
        ...estado,
        itens: estado.itens.map((item): Item => {
          if (item.tipo !== 'operacao' || item.jobId !== acao.jobId) return item;
          const indiceStatus = item.passos.findLastIndex((passo) => passo.tool === 'status_geracao');
          const status: import('./tipos').PassoOperacao = {
            callId: `geracao-${acao.jobId}`,
            tool: 'status_geracao',
            efeito: 'leitura',
            args: { jobId: acao.jobId },
            status: terminal ? 'ok' : 'executando',
            resultado: acao.geracao,
            erro: acao.geracao.erro ?? undefined,
          };
          const passos = indiceStatus >= 0
            ? item.passos.map((passo, indice) => indice === indiceStatus ? status : passo)
            : [...item.passos, status];
          return {
            ...item,
            passos,
            etapa: acao.geracao.status === 'ERRO' ? 'erro' : terminal ? 'concluida' : 'acompanhando',
            aguardandoCurriculo: acao.geracao.status === 'CONCLUIDA',
          };
        }),
      };
    }
    case 'previewCurriculo':
      return estado.itens.some((item) => item.tipo === 'preview_curriculo' && item.curriculoId === acao.curriculo.id)
        ? estado
        : {
            ...estado,
            itens: [
              ...estado.itens,
              { tipo: 'preview_curriculo', id: novoId(), curriculoId: acao.curriculo.id, rotulo: acao.curriculo.rotulo, score: acao.curriculo.score },
            ],
          };
    case 'abortado':
      return { ...estado, streaming: false, estado: 'ocioso', itens: encerrarVivos(estado.itens) };
    case 'modo':
      return { ...estado, modo: acao.modo };
    case 'abrirHistorico':
      return {
        ...estado,
        itens: itensDeHistorico(acao.conversa),
        conversaId: acao.conversa.id,
        modo: acao.conversa.modo,
        oportunidadeId: acao.conversa.oportunidadeId ?? undefined,
        estado: 'ocioso',
        streaming: false,
        ultimoEnvio: undefined,
      };
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
  const retomadas = useRef(new Set<string>());

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

  useEffect(() => {
    const jobIds = estado.itens
      .filter((item): item is Extract<Item, { tipo: 'operacao' }> => item.tipo === 'operacao' && item.etapa === 'acompanhando' && Boolean(item.jobId))
      .map((item) => item.jobId as string);
    if (jobIds.length === 0) return;

    let ativo = true;
    async function consultar() {
      for (const jobId of jobIds) {
        try {
          const geracao = await getGeracao(jobId);
          if (!ativo) return;
          dispatch({ t: 'atualizarGeracao', jobId, geracao });
          if ((geracao.status === 'CONCLUIDA' || geracao.status === 'ERRO') && !retomadas.current.has(jobId)) {
            retomadas.current.add(jobId);
            if (geracao.status === 'CONCLUIDA' && geracao.curriculoId) {
              try {
                const curriculo = await getCurriculo(geracao.curriculoId);
                if (ativo) dispatch({ t: 'previewCurriculo', curriculo });
              } catch {
                /* o próximo carregamento da conversa mantém a operação concluída */
              }
            }
            if (ativo && !refEstado.current.streaming) void correr({});
          }
        } catch {
          /* indisponibilidade transitória: tenta novamente no próximo intervalo */
        }
      }
    }

    void consultar();
    const intervalo = window.setInterval(() => void consultar(), 1_500);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [estado.itens]);

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
    abrirHistorico: (conversa: ConversaCopilotoDetalhe) => {
      abortRef.current?.abort();
      dispatch({ t: 'abrirHistorico', conversa });
    },
    novaConversa: () => {
      abortRef.current?.abort();
      dispatch({ t: 'nova' });
    },
  };
}
