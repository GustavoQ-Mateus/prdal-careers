import assert from 'node:assert/strict';
import test from 'node:test';
import { ConexaoInterrompida, lerEventos, lerFrame, reidratarAposQueda } from '../src/copiloto/sse.ts';

function corpo(pedacos, { falharNoFim = false } = {}) {
  const codificador = new TextEncoder();
  const fila = [...pedacos];
  return new ReadableStream({
    pull(controle) {
      if (fila.length) controle.enqueue(codificador.encode(fila.shift()));
      else if (falharNoFim) controle.error(new TypeError('network error'));
      else controle.close();
    },
  });
}

const CONVERSA = 'event: conversa\ndata: {"conversaId":"c1"}\n\n';
const TOKEN = 'event: token\ndata: {"delta":"Ola"}\n\n';
const FIM = 'event: fim_turno\ndata: {"motivo":"completo","conversaId":"c1"}\n\n';

test('heartbeat e comentario sao ignorados e frames partidos entre pedacos sao montados', async () => {
  const recebidos = [];
  await lerEventos(corpo([CONVERSA, ': heartbeat\n\n', TOKEN.slice(0, 10), TOKEN.slice(10), ': heartbeat\n\n', FIM]), (f) => recebidos.push(f));
  assert.deepEqual(recebidos.map((f) => f.evento), ['conversa', 'token', 'fim_turno']);
  assert.equal(recebidos[1].data.delta, 'Ola');
  assert.equal(lerFrame(': heartbeat'), null);
});

test('conexao que cai no meio vira ConexaoInterrompida', async () => {
  const recebidos = [];
  await assert.rejects(lerEventos(corpo([CONVERSA, TOKEN], { falharNoFim: true }), (f) => recebidos.push(f)), ConexaoInterrompida);
  assert.deepEqual(recebidos.map((f) => f.evento), ['conversa', 'token']);
});

test('stream que termina sem fim_turno tambem e queda', async () => {
  await assert.rejects(lerEventos(corpo([CONVERSA, TOKEN, ': heartbeat\n\n']), () => {}), ConexaoInterrompida);
});

test('apos a queda a conversa e reidratada pelo historico persistido', async () => {
  const pedidos = [];
  const buscar = async (id) => {
    pedidos.push(id);
    return { id, mensagens: [{ papel: 'assistant', conteudo: 'Ola, tudo certo.' }] };
  };
  const conversa = await reidratarAposQueda(new ConexaoInterrompida('queda'), 'c1', buscar);
  assert.deepEqual(pedidos, ['c1']);
  assert.equal(conversa.mensagens[0].conteudo, 'Ola, tudo certo.');
});

test('sem queda, sem conversa conhecida ou com historico fora nao reidrata', async () => {
  const buscar = async () => ({ id: 'c1', mensagens: [] });
  assert.equal(await reidratarAposQueda(new Error('erro 409'), 'c1', buscar), null);
  assert.equal(await reidratarAposQueda(new ConexaoInterrompida('queda'), undefined, buscar), null);
  assert.equal(await reidratarAposQueda(new ConexaoInterrompida('queda'), 'c1', async () => { throw new Error('fora'); }), null);
});
