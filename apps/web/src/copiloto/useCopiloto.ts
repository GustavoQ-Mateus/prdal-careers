import { useEffect, useReducer, useRef } from 'react';
import {
  getCurriculo,
  getGeracao,
  buscarConversaCopiloto,
  streamCopiloto,
  type CopilotoChatBody,
  type CopilotoEvento,
  type ConversaCopilotoDetalhe,
  type Curriculo,
  type GeracaoCurriculo,
  type ModoCopiloto,
} from '../api';
import type { EstadoCopiloto, Item } from './tipos';
import {
  MARCADOR_NARRACAO_ATS_ETAPA_3,
  dividirNarracaoAts,
  scoresAts,
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
  | { t: 'previewCurriculo'; jobId: string; curriculo: Curriculo }
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
        ev.data.tool === 'analisar_ats' ||
        (indiceOperacao >= 0 &&
          ['gerar_curriculo', 'status_geracao', 'buscar_curriculo'].includes(ev.data.tool));

      if (deveConsolidar) {
        const operacao = ev.data.tool === 'analisar_ats' || indiceOperacao < 0
          ? null
          : itens[indiceOperacao] as Extract<Item, { tipo: 'operacao' }>;
        const proximaEtapa = ev.data.tool === 'analisar_ats'
          ? 'etapa1'
          : ev.data.tool === 'gerar_curriculo'
            ? 'etapa2'
            : ev.data.tool === 'status_geracao'
              ? 'etapa3'
              : operacao?.etapa ?? 'etapa3';
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
        if (passo.tool === 'analisar_ats') {
          return { ...it, passos, etapa: ev.data.ok ? 'aguardando_etapa2' : 'erro' };
        }
        if (passo.tool === 'gerar_curriculo' && ev.data.ok && typeof resultado?.jobId === 'string') {
          return { ...it, passos, jobId: resultado.jobId, etapa: status === 'ERRO' ? 'erro' : status === 'CONCLUIDA' ? 'etapa3' : 'etapa2' };
        }
        if (passo.tool === 'status_geracao') {
          return { ...it, passos, etapa: status === 'ERRO' ? 'erro' : 'etapa3', aguardandoCurriculo: status === 'CONCLUIDA' };
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

const TOOLS_OPERACAO = new Set([
  'analisar_ats',
  'gerar_curriculo',
  'status_geracao',
  'buscar_curriculo',
]);
const TOOLS_ESCRITA = new Set([
  'registrar_oportunidade',
  'gerar_curriculo',
  'editar_curriculo',
  'definir_proximo_passo',
  'concluir_passo',
  'mover_estagio',
  'registrar_candidatura',
  'atualizar_candidatura',
  'registrar_nota',
]);

type Operacao = Extract<Item, { tipo: 'operacao' }>;

function resultadoPersistido(
  tool: string | null | undefined,
  conteudo: string,
  dados?: ConversaCopilotoDetalhe['mensagens'][number]['dados'],
): { falha: boolean; resultado: unknown; erro?: string } {
  const falha = dados?.ok === false || conteudo.startsWith('falha:');
  if (falha) {
    return {
      falha: true,
      resultado: null,
      erro: dados?.erro ?? conteudo.replace(/^falha:\s*/, ''),
    };
  }
  if (dados && Object.prototype.hasOwnProperty.call(dados, 'resultado')) {
    return { falha: false, resultado: dados.resultado };
  }
  try {
    return { falha: false, resultado: JSON.parse(conteudo) };
  } catch {
    return { falha: false, resultado: conteudo };
  }
}

function itemToolHistorico(
  indice: number,
  tool: string | null | undefined,
  conteudo: string,
  dados?: ConversaCopilotoDetalhe['mensagens'][number]['dados'],
): Extract<Item, { tipo: 'passo' }> {
  const nome = tool ?? 'tool';
  const retorno = resultadoPersistido(nome, conteudo, dados);
  const valor = retorno.resultado as Record<string, unknown> | null;
  const jobId =
    typeof dados?.args?.jobId === 'string'
      ? dados.args.jobId
      : valor && typeof valor === 'object' && typeof (valor.jobId ?? valor.id) === 'string'
        ? String(valor.jobId ?? valor.id)
        : undefined;
  const args = dados?.args ?? (jobId ? { jobId } : {});
  const efeito = dados?.efeito === 'escrita' || TOOLS_ESCRITA.has(nome) ? 'escrita' : 'leitura';
  const status =
    retorno.falha
      ? 'erro'
      : nome === 'status_geracao' && valor && !['CONCLUIDA', 'ERRO'].includes(String(valor.status ?? ''))
        ? 'executando'
        : 'ok';
  return {
    tipo: 'passo',
    id: `h${indice}`,
    callId: dados?.callId ?? `historico-${indice}`,
    tool: nome,
    efeito,
    args,
    status,
    resultado: retorno.falha ? null : retorno.resultado,
    erro: retorno.erro,
  };
}

function operacaoAtiva(itens: Item[]): number {
  return itens.findLastIndex(
    (item) =>
      item.tipo === 'operacao' &&
      item.etapa !== 'erro' &&
      (item.etapa !== 'concluida' || item.aguardandoCurriculo),
  );
}

function atualizarOperacao(operacao: Operacao, passo: Extract<Item, { tipo: 'passo' }>): Operacao {
  const resultado = passo.resultado as Record<string, unknown> | null;
  const jobId =
    typeof passo.args.jobId === 'string'
      ? passo.args.jobId
      : resultado && typeof (resultado.jobId ?? resultado.id) === 'string'
        ? String(resultado.jobId ?? resultado.id)
        : undefined;
  const indiceStatus =
    passo.tool === 'status_geracao' && jobId
      ? operacao.passos.findLastIndex(
          (item) => item.tool === 'status_geracao' && item.args.jobId === jobId,
        )
      : -1;
  const passos = indiceStatus >= 0
    ? operacao.passos.map((item, indice) => indice === indiceStatus ? passo : item)
    : [...operacao.passos, passo];
  if (passo.tool === 'analisar_ats') {
    return { ...operacao, passos, etapa: passo.status === 'erro' ? 'erro' : 'aguardando_etapa2' };
  }
  if (passo.tool === 'gerar_curriculo') {
    const status = String(resultado?.status ?? '');
    return {
      ...operacao,
      passos,
      jobId: jobId ?? operacao.jobId,
      etapa: passo.status === 'erro' || status === 'ERRO' ? 'erro' : status === 'CONCLUIDA' ? 'etapa3' : 'etapa2',
      aguardandoCurriculo: status === 'CONCLUIDA' || Boolean(resultado?.curriculoId),
    };
  }
  if (passo.tool === 'status_geracao') {
    const status = String(resultado?.status ?? '');
    return {
      ...operacao,
      passos,
      jobId: jobId ?? operacao.jobId,
      etapa: status === 'ERRO' || passo.status === 'erro' ? 'erro' : 'etapa3',
      aguardandoCurriculo: status === 'CONCLUIDA',
    };
  }
  if (passo.tool === 'buscar_curriculo') {
    return { ...operacao, passos, etapa: passo.status === 'erro' ? 'erro' : 'concluida', aguardandoCurriculo: false };
  }
  return { ...operacao, passos };
}

function consolidarPasso(itens: Item[], passo: Extract<Item, { tipo: 'passo' }>): Item[] {
  if (!TOOLS_OPERACAO.has(passo.tool)) return [...itens, passo];
  let indice = operacaoAtiva(itens);
  if (indice < 0) {
    indice = itens.length;
    itens = [...itens, { tipo: 'operacao', id: `op-${passo.id}`, passos: [], etapa: 'etapa1' }];
  }
  const operacao = itens[indice] as Operacao;
  const atualizados = [...itens];
  atualizados[indice] = atualizarOperacao(operacao, passo);
  return atualizados;
}

function adicionarPreview(itens: Item[]): Item[] {
  const previews = new Set(
    itens.filter((item): item is Extract<Item, { tipo: 'preview_curriculo' }> => item.tipo === 'preview_curriculo')
      .map((item) => item.curriculoId),
  );
  const novos = [...itens];
  for (const item of itens) {
    if (item.tipo !== 'operacao') continue;
    const final = [...item.passos].reverse().find((passo) => passo.tool === 'buscar_curriculo' && passo.status === 'ok');
    const resultado = final?.resultado as Record<string, unknown> | null;
    const curriculoId = typeof resultado?.id === 'string' ? resultado.id : null;
    if (!resultado || !curriculoId || previews.has(curriculoId)) continue;
    previews.add(curriculoId);
    novos.push({
      tipo: 'preview_curriculo',
      id: `preview-${curriculoId}`,
      curriculoId,
      rotulo: typeof resultado.rotulo === 'string' ? resultado.rotulo : 'Currículo pronto',
      score: typeof resultado.score === 'number' ? resultado.score : null,
    });
  }
  return novos;
}

function itensDeHistorico(conversa: ConversaCopilotoDetalhe): Item[] {
  let itens: Item[] = [];
  conversa.mensagens.forEach((mensagem, indice) => {
    if (mensagem.papel === 'user') {
      itens.push({ tipo: 'usuario', id: `h${indice}`, texto: mensagem.conteudo });
      return;
    }
    if (mensagem.papel === 'assistant') {
      itens.push(...dividirNarracaoAts(mensagem.conteudo).map((texto, parte) => ({
        tipo: 'agente' as const, id: `h${indice}-${parte}`, texto, vivo: false,
      })));
      return;
    }
    if (mensagem.papel === 'evento' || mensagem.dados?.evento === 'erro') {
      itens.push({ tipo: 'erro', id: `h${indice}`, escopo: mensagem.dados?.escopo ?? 'interno', mensagem: mensagem.conteudo });
      return;
    }
    if (mensagem.dados?.entrega) {
      const entrega = mensagem.dados.entrega;
      itens.push({ tipo: 'entrega', id: `h${indice}-entrega`, kind: entrega.tipo, titulo: entrega.titulo, texto: entrega.texto, destino: entrega.destino });
      return;
    }
    itens = consolidarPasso(
      itens,
      itemToolHistorico(indice, mensagem.tool, mensagem.conteudo, mensagem.dados),
    );
  });
  itens = adicionarPreview(itens);
  const pendencia = conversa.pendencia as { callId?: string; tool?: string; args?: Record<string, unknown>; resumo?: string; executando?: boolean } | null;
  if (pendencia?.callId && pendencia.tool && pendencia.args) {
    itens.push({
      tipo: 'confirmacao',
      id: `pendencia-${pendencia.callId}`,
      callId: pendencia.callId,
      tool: pendencia.tool,
      resumo: pendencia.resumo ?? `Executar ${pendencia.tool}`,
      args: pendencia.args,
    });
  }
  return itens.map((item, indice, todos) =>
    item.tipo === 'agente'
      ? { ...item, scoresAts: scoresNarracaoAts(todos.slice(0, indice), item.texto) }
      : item,
  );
}

function normalizarSnapshot(itens: Item[]): Item[] {
  let normalizados: Item[] = [];
  for (const item of itens) {
    normalizados = item.tipo === 'passo' ? consolidarPasso(normalizados, item) : [...normalizados, item];
  }
  return adicionarPreview(normalizados);
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
            etapa: acao.geracao.status === 'ERRO' ? 'erro' : terminal ? 'etapa3' : 'etapa2',
            aguardandoCurriculo: acao.geracao.status === 'CONCLUIDA',
          };
        }),
      };
    }
    case 'previewCurriculo': {
      const passo: import('./tipos').PassoOperacao = {
        callId: `curriculo-${acao.curriculo.id}`,
        tool: 'buscar_curriculo',
        efeito: 'leitura',
        args: { curriculoId: acao.curriculo.id },
        status: 'ok',
        resultado: acao.curriculo,
      };
      const itens = estado.itens.map((item): Item => {
        if (item.tipo !== 'operacao' || item.jobId !== acao.jobId) return item;
        if (item.passos.some((candidato) => candidato.callId === passo.callId)) return item;
        return { ...item, passos: [...item.passos, passo], aguardandoCurriculo: false };
      });
      return itens.some((item) => item.tipo === 'preview_curriculo' && item.curriculoId === acao.curriculo.id)
        ? { ...estado, itens }
        : {
            ...estado,
            itens: [
              ...itens,
              { tipo: 'preview_curriculo', id: novoId(), curriculoId: acao.curriculo.id, rotulo: acao.curriculo.rotulo, score: acao.curriculo.score },
            ],
          };
    }
    case 'abortado':
      return { ...estado, streaming: false, estado: 'ocioso', itens: encerrarVivos(estado.itens) };
    case 'modo':
      return { ...estado, modo: acao.modo };
    case 'abrirHistorico': {
      const itens = itensDeHistorico(acao.conversa);
      const temPendencia = itens.some((item) => item.tipo === 'confirmacao' && !item.decisao);
      const temErro = itens.some((item) => item.tipo === 'erro');
      const temEntrega = itens.some((item) => item.tipo === 'entrega');
      return {
        ...estado,
        itens,
        conversaId: acao.conversa.id,
        modo: 'autopiloto',
        oportunidadeId: acao.conversa.oportunidadeId ?? undefined,
        estado: temPendencia ? 'aguardando_confirmacao' : temErro ? 'erro_turno' : temEntrega ? 'entrega_externa' : 'ocioso',
        streaming: false,
        ultimoEnvio: temErro ? {} : undefined,
      };
    }
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
      itens: normalizarSnapshot((p.itens ?? []).map((it) => (it.tipo === 'agente' ? { ...it, vivo: false } : it))),
      conversaId: p.conversaId,
      modo: 'autopiloto',
      oportunidadeId: p.oportunidadeId ?? oportunidadeId,
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
    modo: 'autopiloto',
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
      oportunidadeId: estado.oportunidadeId,
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
      oportunidadeId: refEstado.current.oportunidadeId ?? oportunidadeId,
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
      .filter((item): item is Extract<Item, { tipo: 'operacao' }> => item.tipo === 'operacao' && (item.etapa === 'etapa2' || item.etapa === 'etapa3' || item.aguardandoCurriculo === true) && Boolean(item.jobId))
      .map((item) => item.jobId as string);
    if (jobIds.length === 0) return;

    let ativo = true;
    async function consultar() {
      for (const jobId of jobIds) {
        try {
          const geracao = await getGeracao(jobId);
          if (!ativo) return;
          dispatch({ t: 'atualizarGeracao', jobId, geracao });
          if (geracao.status === 'CONCLUIDA' || geracao.status === 'ERRO') {
            if (geracao.status === 'CONCLUIDA' && geracao.curriculoId) {
              try {
                const curriculo = await getCurriculo(geracao.curriculoId);
                if (ativo) dispatch({ t: 'previewCurriculo', jobId, curriculo });
              } catch {
                /* o próximo carregamento da conversa mantém a operação concluída */
              }
            }
            if (ativo && !refEstado.current.streaming && !retomadas.current.has(jobId) && refEstado.current.conversaId) {
              try {
                const conversa = await buscarConversaCopiloto(refEstado.current.conversaId);
                const temNarracao = conversa.mensagens.some(
                  (mensagem) => mensagem.papel === 'assistant' && /etapa\s*[13]/i.test(mensagem.conteudo),
                );
                if (temNarracao && ativo) {
                  retomadas.current.add(jobId);
                  dispatch({ t: 'abrirHistorico', conversa });
                }
              } catch {
                /* a persistência assíncrona pode terminar no próximo intervalo */
              }
            }
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
      if (envio && !refEstado.current.streaming) {
        void correr(refEstado.current.estado === 'erro_turno' && refEstado.current.conversaId ? {} : envio);
      }
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
