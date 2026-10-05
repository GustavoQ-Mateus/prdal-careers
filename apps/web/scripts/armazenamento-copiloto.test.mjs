import assert from 'node:assert/strict';
import test from 'node:test';
import { armazenamentoConversa, limparArmazenamentosCopiloto } from '../src/copiloto/armazenamento.ts';

function armazenamento() {
  const dados = new Map();
  return {
    get length() { return dados.size; },
    key(indice) { return [...dados.keys()][indice] ?? null; },
    getItem(chave) { return dados.get(chave) ?? null; },
    setItem(chave, valor) { dados.set(chave, valor); },
    removeItem(chave) { dados.delete(chave); },
  };
}

test('conversa geral usa a sessão da aba e conversa ancorada usa armazenamento local', () => {
  const local = armazenamento();
  const sessao = armazenamento();
  assert.equal(armazenamentoConversa(undefined, local, sessao), sessao);
  assert.equal(armazenamentoConversa('vaga-1', local, sessao), local);
  armazenamentoConversa(undefined, local, sessao).setItem('copiloto:conversa:_global', 'turno');
  assert.equal(sessao.getItem('copiloto:conversa:_global'), 'turno');
  assert.equal(local.getItem('copiloto:conversa:_global'), null);
});

test('logout limpa todas as chaves do copiloto nos dois armazenamentos', () => {
  const local = armazenamento();
  const sessao = armazenamento();
  local.setItem('copiloto:conversa:_global', 'legado');
  local.setItem('copiloto:conversa:vaga-1', 'ancorada');
  sessao.setItem('copiloto:conversa:_global', 'geral');
  sessao.setItem('copiloto:acao:123', '1');
  local.setItem('nav-colapsada', '1');
  sessao.setItem('outra-chave', 'preservar');
  limparArmazenamentosCopiloto(local, sessao);
  assert.equal(local.length, 1);
  assert.equal(sessao.length, 1);
  assert.equal(local.getItem('nav-colapsada'), '1');
  assert.equal(sessao.getItem('outra-chave'), 'preservar');
});
