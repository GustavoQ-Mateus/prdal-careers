export type EstadoExtracao = 'PENDENTE' | 'EXTRAINDO' | 'PRONTAS' | 'ERRO';

export const INTERVALO_EXTRACAO_MS = 3000;

export interface ComExtracao {
  keywordsStatus: 'VALIDAS' | 'PENDENTE';
  keywordsExtracao?: EstadoExtracao;
  keywordsErro?: string | null;
}

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
