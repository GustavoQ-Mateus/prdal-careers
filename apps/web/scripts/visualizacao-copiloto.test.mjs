import assert from 'node:assert/strict';
import test from 'node:test';
import { consolidarStatusGeracao, localizarStatusGeracao, scoresAts } from '../src/copiloto/visualizacao.ts';

const inicial = { score: 73, breakdown: {} };
const final = { score: 82, breakdown: {} };

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

test('histórico mantém uma única leitura visual por job', () => {
  const itens = [
    { tipo: 'passo', tool: 'status_geracao', args: { jobId: 'job-1' }, resultado: { status: 'GERANDO' } },
    { tipo: 'passo', tool: 'status_geracao', args: { jobId: 'job-1' }, resultado: { status: 'CONCLUIDA' } },
  ];
  const consolidados = consolidarStatusGeracao(itens);
  assert.equal(consolidados.length, 1);
  assert.equal(consolidados[0].resultado.status, 'CONCLUIDA');
});
