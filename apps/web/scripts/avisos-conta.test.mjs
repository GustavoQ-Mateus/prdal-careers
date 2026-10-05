import assert from 'node:assert/strict';
import test from 'node:test';
import { destinoErroConta } from '../src/avisosConta.ts';
import { ErroRespostaApi } from '../src/sessao.ts';

test('erros de conta seguem para dialogo, aviso ou fluxo comum', () => {
  const senha = new ErroRespostaApi({ erro: { codigo: 'senha_incorreta', mensagem: 'Senha incorreta' } }, 403);
  const consentimento = new ErroRespostaApi({ erro: { codigo: 'consentimento_pendente', mensagem: 'Aceite' } }, 403);
  const outro = new ErroRespostaApi({ erro: { codigo: 'outro', mensagem: 'Falha' } }, 500);
  assert.equal(destinoErroConta(senha, 'exclusao'), 'dialogo');
  assert.equal(destinoErroConta(consentimento, 'copiloto'), 'consentimento');
  assert.equal(destinoErroConta(consentimento, 'geracao'), 'consentimento');
  assert.equal(destinoErroConta(outro, 'copiloto'), 'comum');
  assert.equal(destinoErroConta(new Error('falha'), 'geracao'), 'comum');
});
