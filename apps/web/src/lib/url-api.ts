export const VERSAO_API_PADRAO = 'v1';

export function urlBaseApi(url: string, versao: string | undefined): string {
  const base = url.trim().replace(/\/+$/, '');
  const segmento = (versao ?? VERSAO_API_PADRAO).trim().replace(/^\/+|\/+$/g, '');
  return segmento ? `${base}/${segmento}` : base;
}
