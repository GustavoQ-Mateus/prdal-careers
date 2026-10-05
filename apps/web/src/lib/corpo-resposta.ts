export async function lerCorpoResposta<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const texto = await res.text();
  return (texto.trim() ? JSON.parse(texto) : null) as T;
}
