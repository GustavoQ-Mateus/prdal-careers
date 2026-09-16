import type { EfeitoTool } from '../api';

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

export type Item =
  | { tipo: 'usuario'; id: string; texto: string }
  | { tipo: 'agente'; id: string; texto: string; vivo: boolean }
  | {
      tipo: 'passo';
      id: string;
      callId: string;
      tool: string;
      efeito: EfeitoTool;
      args: Record<string, unknown>;
      status: 'executando' | 'ok' | 'erro';
      resultado?: unknown;
      erro?: string;
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
  ler_timeline: 'Ler historico',
  listar_acoes: 'Listar proximos passos',
  ler_perfil: 'Ler perfil',
  listar_curriculos: 'Listar curriculos',
  buscar_curriculo: 'Abrir curriculo',
  status_geracao: 'Ver status da geracao',
  listar_banco_vagas: 'Listar banco de vagas',
  ler_agenda: 'Ler agenda',
  registrar_oportunidade: 'Registrar oportunidade',
  ativar_entrada: 'Ativar entrada',
  ativar_banco_vaga: 'Ativar vaga do banco',
  gerar_curriculo: 'Gerar curriculo',
  editar_curriculo: 'Editar curriculo',
  definir_proximo_passo: 'Definir proximo passo',
  concluir_passo: 'Concluir passo',
  mover_estagio: 'Mover de estagio',
  registrar_candidatura: 'Registrar candidatura',
  atualizar_candidatura: 'Atualizar candidatura',
  registrar_nota: 'Registrar nota',
  redigir_mensagem_recrutador: 'Redigir mensagem ao recrutador',
  redigir_respostas_formulario: 'Redigir respostas de formulario',
};

export function rotuloTool(tool: string): string {
  return ROTULO_TOOL[tool] ?? tool.replace(/_/g, ' ');
}

const ROTULO_ENTREGA: Record<string, string> = {
  mensagem_recrutador: 'Mensagem ao recrutador',
  resposta_formulario: 'Respostas de formulario',
};

export function rotuloEntrega(kind: string): string {
  return ROTULO_ENTREGA[kind] ?? 'Texto pronto';
}

function contagem(valor: unknown): number | null {
  return Array.isArray(valor) ? valor.length : null;
}

export function resumirResultado(tool: string, resultado: unknown): string {
  if (resultado == null) return 'Sem retorno';
  const n = contagem(resultado);
  if (n !== null) {
    const plural = n === 1 ? '' : 's';
    if (tool === 'listar_oportunidades') return `${n} oportunidade${plural}`;
    if (tool === 'listar_curriculos') return `${n} curriculo${plural}`;
    if (tool === 'listar_banco_vagas') return `${n} vaga${plural} no banco`;
    if (tool === 'listar_acoes') return `${n} proximo${plural} passo${plural}`;
    return `${n} item${n === 1 ? '' : 's'}`;
  }
  if (typeof resultado === 'object') {
    const o = resultado as Record<string, unknown>;
    if (tool === 'status_geracao' && o.status) return `Status ${String(o.status)}`;
    if (tool === 'buscar_curriculo' && o.score != null) return `Score ${String(o.score)}`;
    if (tool === 'gerar_curriculo' && o.jobId) return 'Geracao iniciada';
    if (tool === 'ler_perfil') return o.nome ? `Perfil de ${String(o.nome)}` : 'Perfil carregado';
    if (tool === 'registrar_nota') return 'Nota registrada no historico';
    const alvo = o.oportunidade as Record<string, unknown> | undefined;
    if (alvo?.titulo) return String(alvo.titulo);
    if (o.titulo) return String(o.titulo);
    if (o.status) return `Status ${String(o.status)}`;
  }
  return 'Concluido';
}

export const ESTADO_META: Record<EstadoCopiloto, { rotulo: string; ajuda: string }> = {
  ocioso: { rotulo: 'Pronto', ajuda: 'Descreva uma vaga ou peca o proximo passo' },
  pensando: { rotulo: 'Raciocinando', ajuda: 'O copiloto esta pensando' },
  executando_leitura: { rotulo: 'Consultando', ajuda: 'Lendo dados do seu processo' },
  aguardando_confirmacao: {
    rotulo: 'Aguardando confirmacao',
    ajuda: 'Nada foi gravado ate voce confirmar',
  },
  executando_escrita: { rotulo: 'Gravando', ajuda: 'Aplicando a alteracao confirmada' },
  entrega_externa: { rotulo: 'Texto pronto', ajuda: 'Revise e use quando quiser' },
  autopiloto_em_curso: { rotulo: 'Autopiloto em curso', ajuda: 'Encadeando os passos do loop' },
  autopiloto_parado_externo: {
    rotulo: 'Parado para sua acao',
    ajuda: 'O envio e seu, fora do produto',
  },
  erro_turno: { rotulo: 'Falha no turno', ajuda: 'A conversa foi preservada' },
};
