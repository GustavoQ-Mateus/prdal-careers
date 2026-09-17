export type ServiceName = 'web' | 'api' | 'ai-service' | 'doc-service';

export interface HealthResponse {
  service: ServiceName;
  status: 'ok';
}

export interface HelloHop {
  service: ServiceName;
  message: string;
}

export interface HelloResponse {
  service: ServiceName;
  message: string;
  chain: HelloHop[];
}

export type PrioridadeOportunidade = 'BAIXA' | 'MEDIA' | 'ALTA';
export type OrigemOportunidade = 'MANUAL' | 'IMPORTACAO';
export type ApresentacaoOportunidade = 'ENTRADA' | 'ATIVA' | 'ENCERRADA';
export type EtapaPipeline =
  | 'PREPARACAO'
  | 'INSCRITA'
  | 'EM_PROCESSO'
  | 'ENTREVISTA'
  | 'OFERTA'
  | 'ENCERRADAS';
export type DestinoTransicao =
  | 'PREPARACAO'
  | 'INSCRITA'
  | 'EM_PROCESSO'
  | 'ENTREVISTA'
  | 'OFERTA'
  | 'REJEITADA'
  | 'DESISTIU'
  | 'ARQUIVADA'
  | 'REABRIR';
export type TipoAcaoOportunidade =
  | 'REVISAR_VAGA'
  | 'GERAR_CURRICULO'
  | 'ENVIAR_CANDIDATURA'
  | 'FAZER_FOLLOW_UP'
  | 'PREPARAR_ENTREVISTA'
  | 'PARTICIPAR_ENTREVISTA'
  | 'ENVIAR_MATERIAL'
  | 'OUTRO';
export type StatusGeracaoCurriculo =
  | 'PENDENTE'
  | 'ANALISANDO'
  | 'GERANDO'
  | 'VALIDANDO'
  | 'CONCLUIDA'
  | 'ERRO';
export type PipelineModo = 'kanban' | 'canvas' | 'grafo';
export const GRAFO_SCHEMA_VERSION = '1';
