import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';

export interface EventoLembrete {
  acaoId: string;
  email: string;
  titulo: string;
  oportunidade: string;
  data: string;
}

export interface Remetente {
  enviar(destino: string, assunto: string, texto: string): Promise<void>;
}

export class RemetenteSes implements Remetente {
  constructor(private readonly cliente = new SESv2Client({ region: process.env.AWS_REGION || 'us-east-1' }), private readonly origem = process.env.SES_ORIGEM || '') {
    if (!origem) throw new Error('SES_ORIGEM obrigatorio');
  }

  async enviar(destino: string, assunto: string, texto: string): Promise<void> {
    await this.cliente.send(new SendEmailCommand({
      FromEmailAddress: this.origem,
      Destination: { ToAddresses: [destino] },
      Content: { Simple: { Subject: { Data: assunto, Charset: 'UTF-8' }, Body: { Text: { Data: texto, Charset: 'UTF-8' } } } },
    }));
  }
}

export class RemetenteLog implements Remetente {
  async enviar(_destino: string, _assunto: string, _texto: string): Promise<void> {
    process.stdout.write(`${JSON.stringify({ evento: 'lembrete_enviado' })}\n`);
  }
}

export function validarEvento(valor: unknown): EventoLembrete {
  if (!valor || typeof valor !== 'object') throw new Error('evento de lembrete invalido');
  const evento = valor as Record<string, unknown>;
  for (const campo of ['acaoId', 'email', 'titulo', 'oportunidade', 'data']) {
    if (typeof evento[campo] !== 'string' || !evento[campo].trim()) throw new Error(`campo ${campo} invalido`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(evento.email as string) || Number.isNaN(Date.parse(evento.data as string))) throw new Error('destino ou data invalida');
  return evento as unknown as EventoLembrete;
}

export async function enviarLembrete(entrada: unknown, remetente: Remetente): Promise<void> {
  const evento = validarEvento(entrada);
  await remetente.enviar(evento.email, `Lembrete: ${evento.titulo}`, `Acao: ${evento.titulo}\nOportunidade: ${evento.oportunidade}\nData: ${evento.data}`);
}

export async function handler(evento: unknown): Promise<void> {
  await enviarLembrete(evento, process.env.REMETENTE_MODO === 'log' ? new RemetenteLog() : new RemetenteSes());
}
