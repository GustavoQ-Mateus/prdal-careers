import assert from 'node:assert/strict';
import test from 'node:test';
import { estadoExportacao, textoPrazoExclusao, urlAtualExportacao } from '../src/contaEstado.ts';

test('exportacao consulta ate concluir ou falhar', () => {
  assert.deepEqual(estadoExportacao('PENDENTE'), { consultar: true, baixar: false, erro: false });
  assert.deepEqual(estadoExportacao('PROCESSANDO'), { consultar: true, baixar: false, erro: false });
  assert.deepEqual(estadoExportacao('CONCLUIDO'), { consultar: false, baixar: true, erro: false });
  assert.deepEqual(estadoExportacao('ERRO'), { consultar: false, baixar: false, erro: true });
});

test('baixar consulta novamente a url temporaria', async () => {
  const chamadas = [];
  const url = await urlAtualExportacao('job-1', async (id) => {
    chamadas.push(id);
    return { status: 'CONCLUIDO', url: 'https://exemplo.test/novo' };
  });
  assert.equal(url, 'https://exemplo.test/novo');
  assert.deepEqual(chamadas, ['job-1']);
  assert.equal(await urlAtualExportacao('job-1', async () => ({ status: 'PROCESSANDO' })), null);
});

test('faixa de exclusao depende de data valida', () => {
  assert.equal(textoPrazoExclusao(null), null);
  assert.equal(textoPrazoExclusao('invalida'), null);
  assert.match(textoPrazoExclusao('2026-11-10T12:00:00.000Z'), /10 de novembro de 2026/);
});
