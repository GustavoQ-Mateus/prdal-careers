import assert from 'node:assert/strict';
import test from 'node:test';
import { lerCorpoResposta } from '../src/lib/corpo-resposta.ts';

test('200 com corpo vazio representa null', async () => {
  assert.equal(await lerCorpoResposta(new Response('', { status: 200 })), null);
});

test('204 representa resposta sem valor', async () => {
  assert.equal(await lerCorpoResposta(new Response(null, { status: 204 })), undefined);
});

test('corpo JSON normal é interpretado', async () => {
  assert.deepEqual(await lerCorpoResposta(new Response('{"nome":"Ana"}', { status: 200 })), { nome: 'Ana' });
});
