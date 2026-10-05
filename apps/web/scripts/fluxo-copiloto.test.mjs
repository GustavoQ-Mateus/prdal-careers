import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'esbuild';

const bundle = await build({ entryPoints: ['src/copiloto/useCopiloto.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], define: { 'import.meta.env': '{}' } });
const modulo = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), modulo, modulo.exports);
const { reducer, normalizarSnapshot, itensDeHistorico } = modulo.exports;

const inicial = () => ({ itens: [], estado: 'ocioso', modo: 'assistido', streaming: false });
const evento = (estado, evento, data) => reducer(estado, { t: 'evento', ev: { evento, data } });
const call = (callId, tool, efeito = 'leitura', args = {}) => ({ callId, tool, efeito, args, exigeConfirmacao: false });
const retorno = (callId, tool, resultado, ok = true) => ({ callId, tool, resultado, ok, erro: ok ? null : { mensagem: 'falhou', recuperavel: true } });
const operacoes = (estado) => estado.itens.filter((item) => item.tipo === 'operacao');

test('análise, confirmação, reescrita imediata, pós-geração e conclusão preservam a ordem', () => {
  let estado = evento(inicial(), 'tool_call', call('a', 'analisar_ats'));
  estado = evento(estado, 'tool_resultado', retorno('a', 'analisar_ats', { score: 73, keywordsEncontradas: ['React'], keywordsCriticasAusentes: ['AWS'] }));
  estado = evento(estado, 'token', { delta: 'Etapa 1 concluída' });
  estado = evento(estado, 'confirmacao', { callId: 'g', tool: 'gerar_curriculo', resumo: 'Gerar', args: {} });
  estado = reducer(estado, { t: 'inicioTurno', envio: { confirmacao: { callId: 'g', decisao: 'confirmar' } } });
  assert.deepEqual(operacoes(estado).map((item) => item.fase), [1, 2]);
  assert.equal(operacoes(estado)[1].passos.length, 0);
  estado = evento(estado, 'tool_call', call('g', 'gerar_curriculo', 'escrita'));
  estado = evento(estado, 'tool_resultado', retorno('g', 'gerar_curriculo', { jobId: 'job-1', status: 'GERANDO' }));
  estado = evento(estado, 'token', { delta: 'Reescrita em curso' });
  estado = reducer(estado, { t: 'atualizarGeracao', jobId: 'job-1', geracao: { status: 'VALIDANDO', etapas: { analiseFinal: null } } });
  assert.deepEqual(operacoes(estado).map((item) => item.etapa), ['aguardando_etapa2', 'concluida', 'etapa3']);
  assert.deepEqual(estado.itens.map((item) => item.tipo), ['operacao', 'agente', 'confirmacao', 'operacao', 'agente', 'operacao']);
  estado = reducer(estado, { t: 'atualizarGeracao', jobId: 'job-1', geracao: { status: 'CONCLUIDA', curriculoId: 'cv-1' } });
  estado = reducer(estado, { t: 'previewCurriculo', jobId: 'job-1', curriculo: { id: 'cv-1', rotulo: 'Versão 1', score: 82, analiseInicial: { score: 73 }, analiseFinal: { score: 82 } } });
  assert.equal(operacoes(estado)[2].etapa, 'concluida');
  assert.equal(operacoes(estado)[2].curriculoId, 'cv-1');
  assert.equal(estado.itens.some((item) => item.tipo === 'preview_curriculo'), false);
});

test('recusa não cria reescrita e falha encerra apenas a etapa 2', () => {
  let estado = evento(inicial(), 'confirmacao', { callId: 'g', tool: 'gerar_curriculo', resumo: 'Gerar', args: {} });
  const recusado = reducer(estado, { t: 'inicioTurno', envio: { confirmacao: { callId: 'g', decisao: 'recusar' } } });
  assert.equal(operacoes(recusado).length, 0);
  estado = reducer(estado, { t: 'inicioTurno', envio: { confirmacao: { callId: 'g', decisao: 'confirmar' } } });
  estado = evento(estado, 'tool_call', call('g', 'gerar_curriculo', 'escrita'));
  estado = evento(estado, 'tool_resultado', retorno('g', 'gerar_curriculo', null, false));
  assert.equal(operacoes(estado)[0].etapa, 'erro');
  assert.equal(operacoes(estado).length, 1);
});

test('snapshot antigo permanece renderizável e reabertura recompõe cartões', () => {
  const antigo = normalizarSnapshot([{ tipo: 'operacao', id: 'antigo', etapa: 'concluida', passos: [{ callId: 'a', tool: 'analisar_ats', status: 'ok', resultado: { score: 73 } }, { callId: 'g', tool: 'gerar_curriculo', status: 'ok', resultado: { jobId: 'job-1' } }] }]);
  assert.equal(antigo[0].fase, undefined);
  assert.equal(antigo[0].passos.length, 2);
  const conversa = { id: 'conv-1', oportunidadeId: 'vaga-1', pendencia: null, mensagens: [
    { papel: 'tool', tool: 'analisar_ats', conteudo: JSON.stringify({ score: 73 }) },
    { papel: 'assistant', conteudo: 'Etapa 1 concluída' },
    { papel: 'tool', tool: 'gerar_curriculo', conteudo: JSON.stringify({ jobId: 'job-1', status: 'GERANDO' }) },
    { papel: 'tool', tool: 'status_geracao', conteudo: JSON.stringify({ id: 'job-1', status: 'VALIDANDO' }), dados: { args: { jobId: 'job-1' } } },
    { papel: 'tool', tool: 'buscar_curriculo', conteudo: JSON.stringify({ id: 'cv-1', rotulo: 'Versão 1', score: 82, analiseInicial: { score: 73 }, analiseFinal: { score: 82 } }) },
  ] };
  const itens = itensDeHistorico(conversa);
  assert.deepEqual(itens.filter((item) => item.tipo === 'operacao').map((item) => item.fase), [1, 2, 3]);
  assert.equal(itens.find((item) => item.tipo === 'operacao' && item.fase === 3).curriculoId, 'cv-1');
});

test('recarga durante o job retoma a etapa correta e falha na etapa 3', () => {
  let estado = { ...inicial(), itens: normalizarSnapshot([{ tipo: 'operacao', id: 'r', fase: 2, etapa: 'etapa2', jobId: 'job-1', passos: [] }]) };
  estado = reducer(estado, { t: 'atualizarGeracao', jobId: 'job-1', geracao: { status: 'VALIDANDO' } });
  assert.deepEqual(operacoes(estado).map((item) => item.fase), [2, 3]);
  estado = reducer(estado, { t: 'atualizarGeracao', jobId: 'job-1', geracao: { status: 'ERRO', erro: 'Falha ATS' } });
  assert.deepEqual(operacoes(estado).map((item) => item.etapa), ['concluida', 'erro']);
});
