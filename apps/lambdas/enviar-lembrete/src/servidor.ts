import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { enviarLembrete, RemetenteLog, RemetenteSes } from './lembrete';

const token = process.env.SERVICE_TOKEN;
if (!token) throw new Error('SERVICE_TOKEN obrigatorio');
const remetente = process.env.REMETENTE_MODO === 'log' ? new RemetenteLog() : new RemetenteSes();

function autorizado(recebido: string | string[] | undefined): boolean {
  if (typeof recebido !== 'string') return false;
  const esperado = Buffer.from(token!);
  const valor = Buffer.from(recebido);
  return esperado.length === valor.length && timingSafeEqual(esperado, valor);
}

createServer(async (requisicao, resposta) => {
  if (requisicao.method !== 'POST' || requisicao.url !== '/enviar' || !autorizado(requisicao.headers['x-service-token'])) {
    resposta.writeHead(404).end();
    return;
  }
  try {
    let corpo = '';
    for await (const parte of requisicao) {
      corpo += parte;
      if (corpo.length > 16384) throw new Error('evento grande demais');
    }
    await enviarLembrete(JSON.parse(corpo), remetente);
    resposta.writeHead(204).end();
  } catch {
    resposta.writeHead(400).end('evento invalido');
  }
}).listen(Number(process.env.PORTA || 3002), '0.0.0.0');
