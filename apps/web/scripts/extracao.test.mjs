import assert from 'node:assert/strict';
import test from 'node:test';
import { extracaoEmAndamento, textoExtracao } from '../src/lib/extracao.ts';

test('indicador acompanha o estado do job de extracao', () => {
  assert.equal(textoExtracao({ keywordsStatus: 'PENDENTE', keywordsExtracao: 'PENDENTE' }), 'Extração de keywords na fila');
  assert.equal(textoExtracao({ keywordsStatus: 'PENDENTE', keywordsExtracao: 'EXTRAINDO' }), 'Extraindo keywords');
  assert.equal(textoExtracao({ keywordsStatus: 'VALIDAS', keywordsExtracao: 'PRONTAS' }), null);
  assert.equal(
    textoExtracao({ keywordsStatus: 'PENDENTE', keywordsExtracao: 'ERRO', keywordsErro: 'ai-service respondeu 503' }),
    'A extração de keywords falhou: ai-service respondeu 503',
  );
  assert.equal(textoExtracao({ keywordsStatus: 'PENDENTE' }), 'Extração pendente');
});

test('so atualiza sozinho enquanto o job nao terminou', () => {
  assert.equal(extracaoEmAndamento({ keywordsStatus: 'PENDENTE', keywordsExtracao: 'PENDENTE' }), true);
  assert.equal(extracaoEmAndamento({ keywordsStatus: 'PENDENTE', keywordsExtracao: 'EXTRAINDO' }), true);
  assert.equal(extracaoEmAndamento({ keywordsStatus: 'PENDENTE', keywordsExtracao: 'ERRO' }), false);
  assert.equal(extracaoEmAndamento({ keywordsStatus: 'VALIDAS', keywordsExtracao: 'PRONTAS' }), false);
});
