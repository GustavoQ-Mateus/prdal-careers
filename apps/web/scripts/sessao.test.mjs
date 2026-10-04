import assert from 'node:assert/strict';
import test from 'node:test';
import { criarCliente } from '../src/sessao.ts';

function servidorFalso({ acessoValido = () => true, refreshOk = true, refresh } = {}) {
  const chamadas = [];
  let sessaoValida = true;
  let refreshEmCurso = 0;
  const estado = { maxRefreshSimultaneos: 0 };
  globalThis.fetch = async (url, init) => {
    const caminho = new URL(url).pathname;
    const headers = new Headers(init.headers);
    chamadas.push({ caminho, metodo: init.method ?? 'GET', credentials: init.credentials, csrf: headers.get('X-CSRF-Token'), authorization: headers.get('Authorization') });
    await new Promise((r) => setTimeout(r, 5));
    const json = (status, corpo) => new Response(corpo === undefined ? null : JSON.stringify(corpo), { status });
    if (caminho === '/auth/login') return json(201, { usuario: { id: 'u', email: 'u@teste.dev' }, csrfToken: 'csrf-do-login' });
    if (caminho === '/auth/refresh') {
      refreshEmCurso++;
      estado.maxRefreshSimultaneos = Math.max(estado.maxRefreshSimultaneos, refreshEmCurso);
      await new Promise((r) => setTimeout(r, 10));
      refreshEmCurso--;
      if (refresh) {
        const [status, corpo, valida] = refresh();
        if (valida !== undefined) sessaoValida = valida;
        return json(status, corpo);
      }
      if (!refreshOk) return json(401, { message: 'sessao expirada' });
      sessaoValida = true;
      return json(200, { csrfToken: 'csrf-renovado' });
    }
    if (caminho === '/auth/sessao') return sessaoValida && acessoValido() ? json(200, { usuario: {}, csrfToken: 'csrf-da-sessao' }) : json(401, {});
    if (!sessaoValida || !acessoValido()) return json(401, { message: 'Unauthorized' });
    return json(200, { ok: true });
  };
  return {
    chamadas,
    estado,
    expirarAcesso() {
      sessaoValida = false;
    },
  };
}

test('toda chamada vai com credentials include e nunca com Authorization', async () => {
  const srv = servidorFalso();
  const cliente = criarCliente('http://api.teste', () => {});
  await cliente.entrar('u@teste.dev', 'senha-forte-123');
  await cliente.chamar('/oportunidades');
  await cliente.chamar('/oportunidades', { method: 'POST', body: '{}' });
  assert.ok(srv.chamadas.every((c) => c.credentials === 'include'));
  assert.ok(srv.chamadas.every((c) => c.authorization === null));
});

test('escritas levam X-CSRF-Token e leituras nao', async () => {
  const srv = servidorFalso();
  const cliente = criarCliente('http://api.teste', () => {});
  await cliente.entrar('u@teste.dev', 'senha-forte-123');
  await cliente.chamar('/oportunidades');
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) await cliente.chamar('/oportunidades/1', { method });
  const [, leitura, ...escritas] = srv.chamadas;
  assert.equal(leitura.csrf, null);
  assert.ok(escritas.every((c) => c.csrf === 'csrf-do-login'));
});

test('sem csrf em memoria, a escrita busca a sessao antes', async () => {
  const srv = servidorFalso();
  const cliente = criarCliente('http://api.teste', () => {});
  await cliente.chamar('/contexto/upload', { method: 'POST' });
  assert.deepEqual(srv.chamadas.map((c) => c.caminho), ['/auth/sessao', '/contexto/upload']);
  assert.equal(srv.chamadas[1].csrf, 'csrf-da-sessao');
});

test('401 dispara um unico refresh mesmo com chamadas simultaneas e repete a chamada', async () => {
  const srv = servidorFalso();
  let expirou = 0;
  const cliente = criarCliente('http://api.teste', () => expirou++);
  await cliente.entrar('u@teste.dev', 'senha-forte-123');
  srv.expirarAcesso();
  const respostas = await Promise.all([cliente.chamar('/a'), cliente.chamar('/b'), cliente.chamar('/c')]);
  assert.deepEqual(respostas.map((r) => r.status), [200, 200, 200]);
  assert.equal(srv.chamadas.filter((c) => c.caminho === '/auth/refresh').length, 1);
  assert.equal(expirou, 0);
  await cliente.chamar('/d', { method: 'POST' });
  assert.equal(srv.chamadas.at(-1).csrf, 'csrf-renovado');
});

test('refresh recusado leva ao fluxo de sessao expirada', async () => {
  const srv = servidorFalso({ refreshOk: false });
  let expirou = 0;
  const cliente = criarCliente('http://api.teste', () => expirou++);
  await cliente.entrar('u@teste.dev', 'senha-forte-123');
  srv.expirarAcesso();
  const res = await cliente.chamar('/oportunidades');
  assert.equal(res.status, 401);
  assert.equal(expirou, 1);
});

test('iniciar apaga o token legado do localStorage', async () => {
  const guardado = new Map([['token', 'jwt-antigo'], ['nav-colapsada', '1']]);
  globalThis.localStorage = { removeItem: (k) => guardado.delete(k), getItem: (k) => guardado.get(k) ?? null };
  servidorFalso();
  const cliente = criarCliente('http://api.teste', () => {});
  assert.equal(await cliente.iniciar(), true);
  assert.equal(guardado.has('token'), false);
  assert.equal(guardado.get('nav-colapsada'), '1');
  delete globalThis.localStorage;
});

function semWebLocks(t) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
  t.after(() => Object.defineProperty(globalThis, 'navigator', original));
}

const OUTRA_ABA_RENOVOU = () => [409, { message: 'sessao renovada em outra aba' }, true];

test('409 no refresh repete a chamada original uma vez e nao expira a sessao', async () => {
  const srv = servidorFalso({ refresh: OUTRA_ABA_RENOVOU });
  let expirou = 0;
  const cliente = criarCliente('http://api.teste', () => expirou++);
  await cliente.entrar('u@teste.dev', 'senha-forte-123');
  srv.expirarAcesso();
  const res = await cliente.chamar('/oportunidades');
  assert.equal(res.status, 200);
  assert.deepEqual(srv.chamadas.slice(1).map((c) => c.caminho), ['/oportunidades', '/auth/refresh', '/oportunidades']);
  assert.equal(expirou, 0);
});

test('409 no refresh sem Web Locks tambem repete a chamada original', async (t) => {
  semWebLocks(t);
  assert.equal(globalThis.navigator.locks, undefined);
  const srv = servidorFalso({ refresh: OUTRA_ABA_RENOVOU });
  let expirou = 0;
  const cliente = criarCliente('http://api.teste', () => expirou++);
  await cliente.entrar('u@teste.dev', 'senha-forte-123');
  srv.expirarAcesso();
  assert.equal((await cliente.chamar('/oportunidades')).status, 200);
  assert.equal(expirou, 0);
});

test('409 no refresh seguido de 401 na repeticao leva ao fluxo de sessao expirada', async () => {
  const srv = servidorFalso({ refresh: () => [409, { message: 'sessao renovada em outra aba' }] });
  let expirou = 0;
  const cliente = criarCliente('http://api.teste', () => expirou++);
  await cliente.entrar('u@teste.dev', 'senha-forte-123');
  srv.expirarAcesso();
  const res = await cliente.chamar('/oportunidades');
  assert.equal(res.status, 401);
  assert.equal(srv.chamadas.filter((c) => c.caminho === '/oportunidades').length, 2);
  assert.equal(expirou, 1);
});

test('duas abas renovando ao mesmo tempo passam pelo refresh uma de cada vez', async () => {
  const srv = servidorFalso();
  const abaA = criarCliente('http://api.teste', () => {});
  const abaB = criarCliente('http://api.teste', () => {});
  await abaA.entrar('u@teste.dev', 'senha-forte-123');
  srv.expirarAcesso();
  const respostas = await Promise.all([abaA.chamar('/a'), abaB.chamar('/b')]);
  assert.deepEqual(respostas.map((r) => r.status), [200, 200]);
  assert.equal(srv.estado.maxRefreshSimultaneos, 1);
});
