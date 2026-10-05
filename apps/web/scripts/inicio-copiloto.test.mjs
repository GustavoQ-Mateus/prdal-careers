import assert from 'node:assert/strict';
import test from 'node:test';
import { montarInicioCopiloto } from '../src/copiloto/inicio.ts';

const agora = new Date('2026-10-05T13:00:00Z');
const fuso = 'America/Fortaleza';
const perfil = {
  nome: 'Gustavo Silva', resumo: 'Desenvolvedor', emails: [], telefones: [], links: [],
  outrosContatos: [], experiencias: [], formacao: [], certificacoes: [], idiomas: [], skills: [], endereco: null,
};
const acao = (id, venceEm, tipo = 'FAZER_FOLLOW_UP') => ({
  id, vagaId: `vaga-${id}`, titulo: `Ação ${id}`, tipo, venceEm,
  oportunidade: { id: `vaga-${id}`, titulo: `Vaga ${id}`, empresa: 'Empresa' },
});
const dados = (campos = {}) => ({
  fusoHorario: fuso, atrasadas: [], hoje: [], proximosDias: [], semProximoPasso: [], ...campos,
});

test('primeiro acesso sem perfil substitui o resumo', () => {
  assert.equal(montarInicioCopiloto(dados(), [], null, agora, fuso).semPerfil, true);
  assert.equal(montarInicioCopiloto(dados(), [], { ...perfil, nome: '', resumo: '' }, agora, fuso).semPerfil, true);
  assert.equal(montarInicioCopiloto(dados(), [], { ...perfil, nome: '', resumo: '', endereco: { pais: '', estado: '', cidade: '' } }, agora, fuso).semPerfil, true);
});

test('saudação usa fuso, nome e contagem de atrasados', () => {
  const modelo = montarInicioCopiloto(dados({
    atrasadas: [acao('a', '2026-10-03T12:00:00Z')],
    hoje: [acao('b', '2026-10-05T15:00:00Z')],
  }), [], perfil, agora, fuso);
  assert.equal(modelo.saudacao, 'Bom dia');
  assert.equal(modelo.nome, 'Gustavo');
  assert.equal(modelo.atrasados, 1);
  assert.equal(modelo.paraResolver, 1);
  assert.equal(modelo.passos[0].quando, 'há 2 dias');
  assert.equal(modelo.passos[1].quando, 'hoje');
  assert.equal(montarInicioCopiloto(dados(), [], perfil, agora, 'Pacific/Honolulu').atrasados, 0);
});

test('limita a cinco e ordena atrasadas, hoje, próximos dias e sem passo', () => {
  const modelo = montarInicioCopiloto(dados({
    atrasadas: [acao('b', '2026-10-04T12:00:00Z'), acao('a', '2026-10-03T12:00:00Z')],
    hoje: [acao('d', '2026-10-05T16:00:00Z'), acao('c', '2026-10-05T14:00:00Z')],
    proximosDias: [acao('e', '2026-10-08T12:00:00Z')],
    semProximoPasso: [{ id: 'f', titulo: 'Vaga F', empresa: 'Empresa' }],
  }), [], perfil, agora, fuso);
  assert.deepEqual(modelo.passos.map((item) => item.id), ['a', 'b', 'c', 'd', 'e']);
  assert.equal(modelo.totalPassos, 6);
  const sem = montarInicioCopiloto(dados({ semProximoPasso: [{ id: 'f', titulo: 'Vaga F', empresa: 'Empresa' }] }), [], perfil, agora, fuso);
  assert.equal(sem.passos[0].botao, 'Definir próximo passo');
  assert.equal(sem.passos[0].oportunidadeId, 'f');
});

test('fontes opcionais ausentes não produzem seções vazias nem vocativo', () => {
  const modelo = montarInicioCopiloto(dados(), [], { ...perfil, nome: '' }, agora, fuso);
  assert.equal(modelo.conversa, undefined);
  assert.equal(modelo.geracoes, undefined);
  assert.equal(modelo.entrada, undefined);
  assert.equal(modelo.nome, undefined);
  const semHoje = montarInicioCopiloto(undefined, undefined, undefined, agora, fuso);
  assert.equal(semHoje.passos, undefined);
  assert.equal(semHoje.semPerfil, false);
});

test('conversa mais recente e seções opcionais entram no modelo', () => {
  const conversas = [
    { id: 'antiga', atualizadoEm: '2026-10-03T10:00:00Z' },
    { id: 'recente', atualizadoEm: '2026-10-05T10:00:00Z' },
  ];
  const modelo = montarInicioCopiloto(dados({
    geracoesConcluidas: [{ curriculoId: 'c1' }], entrada: [{ id: 'v1' }],
  }), conversas, perfil, agora, fuso);
  assert.equal(modelo.conversa.id, 'recente');
  assert.equal(modelo.geracoes.length, 1);
  assert.equal(modelo.entrada.length, 1);
});
