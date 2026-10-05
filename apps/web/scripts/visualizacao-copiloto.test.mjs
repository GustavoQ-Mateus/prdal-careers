import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consolidarStatusGeracao,
  localizarStatusGeracao,
  scoresAts,
  scoresNarracaoAts,
} from '../src/copiloto/visualizacao.ts';

const inicial = { score: 73, breakdown: {} };
const final = { score: 82, breakdown: {} };

test('analise ATS avulsa produz o score radial da Etapa 1', () => {
  assert.deepEqual(scoresAts('analisar_ats', inicial), [
    { etapa: 'Base', score: 73 },
  ]);
});

test('matriz de gráficos por ferramenta', () => {
  assert.deepEqual(scoresAts('status_geracao', { etapas: { analiseInicial: inicial }, analiseFinal: final }), [
    { etapa: 'Base', score: 73 },
  ]);
  assert.deepEqual(scoresAts('buscar_curriculo', { analiseInicial: inicial, analiseFinal: final }), [
    { etapa: 'Base', score: 73 },
    { etapa: 'Gerado', score: 82 },
  ]);
  assert.equal(scoresAts('buscar_curriculo', { analiseInicial: inicial }), null);
  assert.equal(scoresAts('listar_curriculos', { analiseInicial: inicial, analiseFinal: final }), null);
});

test('consultas repetidas do mesmo job localizam o mesmo passo', () => {
  const itens = [
    { tipo: 'passo', tool: 'status_geracao', args: { jobId: 'job-1' } },
    { tipo: 'passo', tool: 'buscar_curriculo', args: { curriculoId: 'cv-1' } },
  ];
  assert.equal(localizarStatusGeracao(itens, 'job-1'), 0);
  assert.equal(localizarStatusGeracao(itens, 'job-2'), -1);
});

test('narração da Etapa 1 isola o score inicial', () => {
  const itens = [
    {
      tipo: 'passo',
      tool: 'buscar_curriculo',
      status: 'ok',
      resultado: { analiseInicial: inicial, analiseFinal: final },
    },
  ];
  assert.deepEqual(scoresNarracaoAts(itens, 'Etapa 1 concluída'), [
    { etapa: 'Base', score: 73 },
  ]);
  assert.deepEqual(scoresNarracaoAts(itens, 'Etapa 3 concluída'), [
    { etapa: 'Base', score: 73 },
    { etapa: 'Gerado', score: 82 },
  ]);
});

test('comparação conserva ganho, igualdade e queda sem ponto artificial', () => {
  for (const gerado of [82, 73, 61]) {
    const scores = scoresAts('buscar_curriculo', { analiseInicial: inicial, analiseFinal: { score: gerado } });
    assert.deepEqual(scores, [{ etapa: 'Base', score: 73 }, { etapa: 'Gerado', score: gerado }]);
    assert.equal(scores[1].score - scores[0].score, gerado - 73);
  }
});

test('histórico mantém uma única leitura visual por job', () => {
  const itens = [
    { tipo: 'passo', tool: 'status_geracao', args: { jobId: 'job-1' }, resultado: { status: 'GERANDO' } },
    { tipo: 'passo', tool: 'status_geracao', args: { jobId: 'job-1' }, resultado: { status: 'CONCLUIDA' } },
  ];
  const consolidados = consolidarStatusGeracao(itens);
  assert.equal(consolidados.length, 1);
  assert.equal(consolidados[0].resultado.status, 'CONCLUIDA');
});
