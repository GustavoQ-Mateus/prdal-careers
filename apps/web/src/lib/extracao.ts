import type { WorkspaceOportunidade } from '../api';

type Oportunidade = WorkspaceOportunidade['oportunidade'];
export type EstadoExtracao = Oportunidade['keywordsExtracao'];

export const INTERVALO_EXTRACAO_MS = 3000;

export type ComExtracao = Pick<Oportunidade, 'keywordsStatus'> & Partial<Pick<Oportunidade, 'keywordsExtracao' | 'keywordsErro'>>;

export function extracaoEmAndamento(item: ComExtracao): boolean {
  return item.keywordsExtracao === 'PENDENTE' || item.keywordsExtracao === 'EXTRAINDO';
}

export function textoExtracao(item: ComExtracao): string | null {
  switch (item.keywordsExtracao) {
    case 'PENDENTE':
      return 'Extração de keywords na fila';
    case 'EXTRAINDO':
      return 'Extraindo keywords';
    case 'ERRO':
      return item.keywordsErro ? `A extração de keywords falhou: ${item.keywordsErro}` : 'A extração de keywords falhou';
    case 'PRONTAS':
      return null;
    default:
      return item.keywordsStatus === 'PENDENTE' ? 'Extração pendente' : null;
  }
}
