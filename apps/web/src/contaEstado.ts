import type { ExportacaoConta } from './api';

export function estadoExportacao(status: ExportacaoConta['status']) {
  return {
    consultar: status === 'PENDENTE' || status === 'PROCESSANDO',
    baixar: status === 'CONCLUIDO',
    erro: status === 'ERRO',
  };
}

export async function urlAtualExportacao(
  jobId: string,
  consultar: (jobId: string) => Promise<ExportacaoConta>,
): Promise<string | null> {
  const resultado = await consultar(jobId);
  return resultado.status === 'CONCLUIDO' ? resultado.url ?? null : null;
}

export function textoPrazoExclusao(data: string | null): string | null {
  if (!data) return null;
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return null;
  return `Sua conta será excluída em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(valor)}.`;
}
