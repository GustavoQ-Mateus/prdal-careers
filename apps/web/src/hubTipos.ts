import type { EtapaPipeline, PrioridadeOportunidade } from './api';

export type Selecao = {
  id: string;
  titulo: string;
  empresa?: string;
  etapa?: EtapaPipeline | null;
  prioridade?: PrioridadeOportunidade | null;
  score?: number | null;
  proximoPasso?: string | null;
  curriculo?: string | null;
  entrada?: boolean;
};
