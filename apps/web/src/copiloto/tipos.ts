import type { EfeitoTool } from '../api';
import type { ScoreAts } from './visualizacao';

export type EstadoCopiloto =
  | 'ocioso'
  | 'pensando'
  | 'executando_leitura'
  | 'aguardando_confirmacao'
  | 'executando_escrita'
  | 'entrega_externa'
  | 'autopiloto_em_curso'
  | 'autopiloto_parado_externo'
  | 'erro_turno';

export type PassoOperacao = {
  callId: string;
  tool: string;
  efeito: EfeitoTool;
  args: Record<string, unknown>;
  status: 'executando' | 'ok' | 'erro';
  resultado?: unknown;
  erro?: string;
};

export type Item =
  | { tipo: 'usuario'; id: string; texto: string }
  | { tipo: 'agente'; id: string; texto: string; vivo: boolean; scoresAts?: ScoreAts[] }
  | ({
      tipo: 'passo';
      id: string;
    } & PassoOperacao)
  | {
      tipo: 'operacao';
      id: string;
      passos: PassoOperacao[];
      etapa: 'etapa1' | 'aguardando_etapa2' | 'etapa2' | 'etapa3' | 'concluida' | 'erro';
      jobId?: string;
      aguardandoCurriculo?: boolean;
    }
  | {
      tipo: 'preview_curriculo';
      id: string;
      curriculoId: string;
      rotulo: string;
      score: number | null;
    }
  | {
      tipo: 'confirmacao';
      id: string;
      callId: string;
      tool: string;
      resumo: string;
      args: Record<string, unknown>;
      decisao?: 'confirmar' | 'recusar';
    }
  | {
      tipo: 'entrega';
      id: string;
      kind: string;
      titulo: string;
      texto: string;
      destino?: string;
    }
  | { tipo: 'erro'; id: string; escopo: string; mensagem: string };

export const ROTULO_TOOL: Record<string, string> = {
  listar_oportunidades: 'Listar oportunidades',
  buscar_oportunidade: 'Abrir oportunidade',
  abrir_workspace: 'Abrir workspace',
  ler_timeline: 'Ler histórico',
  listar_acoes: 'Listar próximos passos',
  ler_perfil: 'Ler perfil',
  listar_curriculos: 'Listar currículos',
  buscar_curriculo: 'Abrir currículo',
  status_geracao: 'Ver status da geração',
  listar_banco_vagas: 'Listar banco de vagas',
  ler_agenda: 'Ler agenda',
  registrar_oportunidade: 'Registrar oportunidade',
  ativar_entrada: 'Ativar entrada',
  ativar_banco_vaga: 'Ativar vaga do banco',
  gerar_curriculo: 'Gerar currículo',
  editar_curriculo: 'Editar currículo',
  definir_proximo_passo: 'Definir próximo passo',
  concluir_passo: 'Concluir passo',
  mover_estagio: 'Mover de estágio',
  registrar_candidatura: 'Registrar candidatura',
  atualizar_candidatura: 'Atualizar candidatura',
  registrar_nota: 'Registrar nota',
  redigir_mensagem_recrutador: 'Redigir mensagem ao recrutador',
  redigir_respostas_formulario: 'Redigir respostas de formulário',
};

export function rotuloTool(tool: string): string {
  if (tool === 'analisar_ats') return 'Etapa 1 - Análise ATS';
  return ROTULO_TOOL[tool] ?? tool.replace(/_/g, ' ');
}

const ROTULO_ENTREGA: Record<string, string> = {
  mensagem_recrutador: 'Mensagem ao recrutador',
  resposta_formulario: 'Respostas de formulário',
};

export function rotuloEntrega(kind: string): string {
  return ROTULO_ENTREGA[kind] ?? 'Texto pronto';
}

function contagem(valor: unknown): number | null {
  return Array.isArray(valor) ? valor.length : null;
}

export function degradacaoResultado(resultado: unknown): string | null {
  if (resultado === null || typeof resultado !== 'object') return null;
  const o = resultado as Record<string, unknown>;
  const direta = typeof o.degradacao === 'string' ? o.degradacao : '';
  const etapas = o.etapas && typeof o.etapas === 'object'
    ? (o.etapas as Record<string, unknown>)
    : null;
  const porEtapa = typeof etapas?.degradacao === 'string' ? etapas.degradacao : '';
  return direta || porEtapa || null;
}

export function resumirResultado(tool: string, resultado: unknown): string {
  if (resultado == null) return 'Sem retorno';
  const n = contagem(resultado);
  if (n !== null) {
    const plural = n === 1 ? '' : 's';
    if (tool === 'listar_oportunidades') return `${n} oportunidade${plural}`;
    if (tool === 'listar_curriculos') return `${n} currículo${plural}`;
    if (tool === 'listar_banco_vagas') return `${n} vaga${plural} no banco`;
    if (tool === 'listar_acoes') return `${n} próximo${plural} passo${plural}`;
    return `${n} item${n === 1 ? '' : 's'}`;
  }
  if (typeof resultado === 'object') {
    const o = resultado as Record<string, unknown>;
    const degradacao = degradacaoResultado(resultado);
    if (degradacao && (tool === 'buscar_curriculo' || tool === 'status_geracao')) {
      return 'Concluído com degradação';
    }
    if (tool === 'gerar_curriculo' && o.status === 'CONCLUIDA') return 'Geração concluída';
    if (tool === 'gerar_curriculo' && o.status === 'ERRO') return 'Geração com erro recuperável';
    if (tool === 'registrar_oportunidade' && o.id) {
      return o.reaproveitada ? 'Oportunidade já registrada' : 'Oportunidade registrada';
    }
    if (tool === 'status_geracao' && o.status) return `Status ${String(o.status)}`;
    if (tool === 'buscar_curriculo' && o.score != null) return `Score ${String(o.score)}`;
    if (tool === 'analisar_ats' && typeof o.score === 'number') return `Score ${String(o.score)}`;
    if (tool === 'gerar_curriculo' && o.jobId) return 'Geração iniciada';
    if (tool === 'ler_perfil') return o.nome ? `Perfil de ${String(o.nome)}` : 'Perfil carregado';
    if (tool === 'registrar_nota') return 'Nota registrada no histórico';
    const alvo = o.oportunidade as Record<string, unknown> | undefined;
    if (alvo?.titulo) return String(alvo.titulo);
    if (o.titulo) return String(o.titulo);
    if (o.status) return `Status ${String(o.status)}`;
  }
  return 'Concluído';
}

export const ESTADO_META: Record<EstadoCopiloto, { rotulo: string; ajuda: string }> = {
  ocioso: { rotulo: 'Pronto', ajuda: 'Descreva uma vaga ou peça o próximo passo' },
  pensando: { rotulo: 'Raciocinando', ajuda: 'O copiloto está pensando' },
  executando_leitura: { rotulo: 'Consultando', ajuda: 'Lendo dados do seu processo' },
  aguardando_confirmacao: {
    rotulo: 'Aguardando confirmação',
    ajuda: 'Nada foi gravado até você confirmar',
  },
  executando_escrita: { rotulo: 'Gravando', ajuda: 'Aplicando a alteração confirmada' },
  entrega_externa: { rotulo: 'Texto pronto', ajuda: 'Revise e use quando quiser' },
  autopiloto_em_curso: { rotulo: 'Copiloto em curso', ajuda: 'Encadeando os passos do loop' },
  autopiloto_parado_externo: {
    rotulo: 'Parado para sua ação',
    ajuda: 'O envio é seu, fora do produto',
  },
  erro_turno: { rotulo: 'Falha no turno', ajuda: 'A conversa foi preservada' },
};
