import assert from 'node:assert/strict';
import test from 'node:test';
import { criarCliente, ErroRespostaApi, mensagemDeErro } from '../src/sessao.ts';

test('le a mensagem do formato unico de erro e aceita o formato antigo', () => {
  assert.equal(mensagemDeErro({ erro: { codigo: 'turno_em_andamento', mensagem: 'Aguarde a resposta atual.', requestId: 'r1' } }, 409), 'Aguarde a resposta atual.');
  assert.equal(mensagemDeErro({ message: ['nome invalido', 'email invalido'] }, 400), 'nome invalido; email invalido');
  assert.equal(mensagemDeErro({ message: 'antigo' }, 400), 'antigo');
  assert.equal(mensagemDeErro(null, 502), 'erro 502');
});

test('login recusado mostra a mensagem do formato novo', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ erro: { codigo: 'nao_autenticado', mensagem: 'credenciais invalidas', requestId: 'r2' } }), { status: 401 });
  const cliente = criarCliente('http://api.teste/v1', () => {});
  await assert.rejects(cliente.entrar('u@teste.dev', 'errada'), (erro) => {
    assert.ok(erro instanceof ErroRespostaApi);
    assert.equal(erro.message, 'credenciais invalidas');
    assert.equal(erro.codigo, 'nao_autenticado');
    assert.equal(erro.status, 401);
    return true;
  });
});

test('erro estruturado preserva codigo, status e mensagem', () => {
  const erro = new ErroRespostaApi({ erro: { codigo: 'consentimento_pendente', mensagem: 'Aceite o envio.' } }, 403);
  assert.equal(erro.message, 'Aceite o envio.');
  assert.equal(erro.codigo, 'consentimento_pendente');
  assert.equal(erro.status, 403);
});
