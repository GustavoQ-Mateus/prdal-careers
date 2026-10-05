const assert = require('node:assert/strict');
const test = require('node:test');
const { enviarLembrete } = require('../dist/lembrete');

test('evento valido envia pelo remetente', async () => {
  const enviados = [];
  await enviarLembrete({ acaoId: 'a1', email: 'a@exemplo.com', titulo: 'Responder', oportunidade: 'Vaga', data: '2026-10-06T12:00:00.000Z' }, { enviar: async (...argumentos) => enviados.push(argumentos) });
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0][0], 'a@exemplo.com');
});

test('evento invalido recusa sem envio', async () => {
  let enviados = 0;
  await assert.rejects(enviarLembrete({ email: 'invalido' }, { enviar: async () => { enviados += 1; } }));
  assert.equal(enviados, 0);
});
