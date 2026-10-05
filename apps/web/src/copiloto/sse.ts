export interface FrameSse {
  evento: string;
  data: unknown;
}

export class ConexaoInterrompida extends Error {
  constructor(motivo: string) {
    super(motivo);
    this.name = 'ConexaoInterrompida';
  }
}

export function lerFrame(frame: string): FrameSse | null {
  let evento = '';
  let data = '';
  for (const linha of frame.split('\n')) {
    const l = linha.replace(/\r$/, '');
    if (l.startsWith(':')) continue;
    if (l.startsWith('event:')) evento = l.slice(6).trim();
    else if (l.startsWith('data:')) data += l.slice(5).trim();
  }
  if (!evento || !data) return null;
  try {
    return { evento, data: JSON.parse(data) };
  } catch {
    return null;
  }
}

export async function lerEventos(
  corpo: ReadableStream<Uint8Array>,
  onFrame: (frame: FrameSse) => void,
  eventoFinal = 'fim_turno',
): Promise<void> {
  const reader = corpo.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let terminou = false;
  for (;;) {
    let parte: ReadableStreamReadResult<Uint8Array>;
    try {
      parte = await reader.read();
    } catch (err) {
      throw new ConexaoInterrompida((err as Error)?.message ?? 'conexao interrompida');
    }
    if (parte.done) break;
    buffer += decoder.decode(parte.value, { stream: true });
    let sep = buffer.indexOf('\n\n');
    while (sep !== -1) {
      const frame = lerFrame(buffer.slice(0, sep));
      buffer = buffer.slice(sep + 2);
      if (frame) {
        if (frame.evento === eventoFinal) terminou = true;
        onFrame(frame);
      }
      sep = buffer.indexOf('\n\n');
    }
  }
  if (!terminou) throw new ConexaoInterrompida('conexao encerrada antes do fim do turno');
}

export async function reidratarAposQueda<T>(
  erro: unknown,
  conversaId: string | undefined,
  buscar: (id: string) => Promise<T>,
): Promise<T | null> {
  if (!(erro instanceof ConexaoInterrompida) || !conversaId) return null;
  try {
    return await buscar(conversaId);
  } catch {
    return null;
  }
}
