const ESQUEMAS_PERMITIDOS = new Set(['http:', 'https:', 'mailto:']);

export function hrefSeguro(bruto: string): string | null {
  try {
    const url = new URL(bruto.trim());
    return ESQUEMAS_PERMITIDOS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
