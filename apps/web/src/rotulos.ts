import type {
  DestinoTransicao,
  EtapaPipeline,
  PrioridadeOportunidade,
  StatusCandidatura,
  StatusGeracaoCurriculo,
  TipoAcaoOportunidade,
} from './api';

export const ROTULO_PRIORIDADE: Record<PrioridadeOportunidade, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

export const ROTULO_ETAPA: Record<EtapaPipeline, string> = {
  PREPARACAO: 'Preparacao',
  INSCRITA: 'Inscrita',
  EM_PROCESSO: 'Em processo',
  ENTREVISTA: 'Entrevista',
  OFERTA: 'Oferta',
  ENCERRADAS: 'Encerradas',
};

export const ROTULO_STATUS: Record<StatusCandidatura, string> = {
  RASCUNHO: 'Rascunho',
  INSCRITA: 'Inscrita',
  EM_PROCESSO: 'Em processo',
  ENTREVISTA: 'Entrevista',
  OFERTA: 'Oferta',
  REJEITADA: 'Rejeitada',
  DESISTIU: 'Desistiu',
};

export const ROTULO_ACAO: Record<TipoAcaoOportunidade, string> = {
  REVISAR_VAGA: 'Revisar vaga',
  GERAR_CURRICULO: 'Gerar curriculo',
  ENVIAR_CANDIDATURA: 'Enviar candidatura',
  FAZER_FOLLOW_UP: 'Follow-up',
  PREPARAR_ENTREVISTA: 'Preparar entrevista',
  PARTICIPAR_ENTREVISTA: 'Participar da entrevista',
  ENVIAR_MATERIAL: 'Enviar material',
  OUTRO: 'Outro',
};

export const ROTULO_GERACAO: Record<StatusGeracaoCurriculo, string> = {
  PENDENTE: 'Na fila',
  ANALISANDO: 'Analisando vaga e contexto',
  GERANDO: 'Gerando curriculo',
  VALIDANDO: 'Validando score ATS',
  CONCLUIDA: 'Concluida',
  ERRO: 'Erro',
};

export const COLUNAS_KANBAN: EtapaPipeline[] = [
  'PREPARACAO',
  'INSCRITA',
  'EM_PROCESSO',
  'ENTREVISTA',
  'OFERTA',
  'ENCERRADAS',
];

export function destinoDaEtapa(etapa: EtapaPipeline): DestinoTransicao | null {
  if (etapa === 'ENCERRADAS') return null;
  return etapa;
}
