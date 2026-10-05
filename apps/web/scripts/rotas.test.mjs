import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRota } from '../src/rotas.ts';

test('início e rotas desconhecidas abrem o copiloto', () => {
  for (const path of ['/', '/qualquer-rota', '/dashboard', '/vagas']) {
    assert.deepEqual(parseRota(path, ''), { tela: 'copiloto' });
  }
});

test('Hoje e deep links mantêm o destino', () => {
  assert.deepEqual(parseRota('/hoje', ''), { tela: 'hoje' });
  assert.deepEqual(parseRota('/copiloto', '?oportunidade=v1'), { tela: 'copiloto', oportunidadeId: 'v1' });
  assert.deepEqual(parseRota('/oportunidades/v1', ''), { tela: 'workspace', id: 'v1' });
  assert.deepEqual(parseRota('/oportunidades/v1/curriculos/c1', ''), {
    tela: 'curriculo', oportunidadeId: 'v1', curriculoId: 'c1',
  });
  assert.equal(parseRota('/pipeline', '').tela, 'oportunidades');
  assert.equal(parseRota('/candidaturas', '').tela, 'oportunidades');
  assert.equal(parseRota('/banco-vagas', '').tela, 'oportunidades');
});
