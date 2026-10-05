import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { reunir, raizPacote } from '../scripts/reunir.mjs';
import { conferirCompatibilidade, quebras, versaoPublicada } from '../scripts/compatibilidade.mjs';

function documento() {
  return {
    openapi: '3.0.3', info: { title: 'exemplo', version: '1.0.0' },
    paths: { '/itens': { post: {
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Pedido' } } } },
      responses: { 200: { description: 'ok', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Resposta' } } } } } },
    } } },
    components: { schemas: {
      Pedido: { type: 'object', properties: { nome: { type: 'string' } }, required: ['nome'] },
      Resposta: { type: 'object', properties: { id: { type: 'string' }, detalhe: { allOf: [{ $ref: '#/components/schemas/Detalhe' }] } }, required: ['id'] },
      Detalhe: { type: 'object', properties: { valor: { type: 'string' } } },
      HealthResponseDto: { type: 'object', properties: { service: { type: 'string', enum: ['api'] }, status: { type: 'string', enum: ['ok'] } }, required: ['service', 'status'] },
    } },
  };
}

test('compatibilidade detecta rotas, respostas aninhadas e pedidos obrigatorios', () => {
  const antes = documento();
  for (const alterar of [
    (novo) => delete novo.paths['/itens'],
    (novo) => delete novo.paths['/itens'].post,
    (novo) => delete novo.components.schemas.Resposta.properties.id,
    (novo) => delete novo.components.schemas.Detalhe.properties.valor,
    (novo) => { novo.components.schemas.Pedido.properties.email = { type: 'string' }; novo.components.schemas.Pedido.required.push('email'); },
    (novo) => { novo.paths['/itens'].post.parameters = [{ name: 'chave', in: 'query', required: true, schema: { type: 'string' } }]; },
  ]) {
    const depois = structuredClone(antes);
    alterar(depois);
    assert.ok(quebras(antes, depois).length);
    assert.throws(() => conferirCompatibilidade(antes, depois, '1.0.0', '1.1.0'), /contrato incompativel/);
    assert.doesNotThrow(() => conferirCompatibilidade(antes, depois, '1.0.0', '2.0.0'));
  }
  const compativel = structuredClone(antes);
  compativel.components.schemas.Pedido.properties.email = { type: 'string' };
  compativel.components.schemas.Resposta.properties.novo = { type: 'string' };
  assert.deepEqual(quebras(antes, compativel), []);
});

test('reunir gera tipos e conferir detecta Prisma e tipos desatualizados', async (t) => {
  const raiz = await mkdtemp(path.join(os.tmpdir(), 'prdal-contratos-'));
  t.after(() => rm(raiz, { recursive: true, force: true }));
  const pacote = path.join(raiz, 'packages/contracts');
  const apps = path.join(raiz, 'apps');
  for (const nome of ['api', 'ai-service', 'doc-service']) {
    await mkdir(path.join(apps, nome, 'contrato'), { recursive: true });
    await writeFile(path.join(apps, nome, 'contrato/openapi.json'), JSON.stringify(documento()));
  }
  await mkdir(path.join(apps, 'api/prisma'));
  await writeFile(path.join(apps, 'api/prisma/schema.prisma'), 'schema atual');
  await reunir(pacote, apps);
  await reunir(pacote, apps, true);
  assert.ok((await readFile(path.join(pacote, 'src/api.ts'), 'utf8')).includes('export interface paths'));
  assert.ok((await readFile(path.join(pacote, 'src/index.ts'), 'utf8')).includes('docServicePaths'));
  await writeFile(path.join(pacote, 'prisma/schema.prisma'), 'schema antigo');
  await assert.rejects(reunir(pacote, apps, true), /prisma\/schema.prisma/);
  await reunir(pacote, apps);
  await writeFile(path.join(pacote, 'src/api.ts'), 'tipo alterado');
  await assert.rejects(reunir(pacote, apps, true), /src\/api.ts/);
  await reunir(pacote, apps);
  await writeFile(path.join(pacote, 'src/manual.ts'), 'tipo excedente');
  await assert.rejects(reunir(pacote, apps, true), /manual.ts excedente/);
});

test('conferir usa a versao anterior publicada e retorna erro no CLI', async (t) => {
  const raiz = await mkdtemp(path.join(os.tmpdir(), 'prdal-publicada-'));
  t.after(() => rm(raiz, { recursive: true, force: true }));
  await mkdir(path.join(raiz, 'openapi'));
  await writeFile(path.join(raiz, 'package.json'), JSON.stringify({ name: '@prdal/contracts', version: '1.0.0' }));
  const api = JSON.parse(await readFile(path.join(raizPacote, 'openapi/api.json'), 'utf8'));
  api.paths['/rota-da-versao-anterior'] = { get: { responses: { 200: { description: 'ok' } } } };
  await writeFile(path.join(raiz, 'openapi/api.json'), JSON.stringify(api));
  const publicada = await versaoPublicada(raizPacote, pathToFileURL(raiz + path.sep));
  assert.equal(publicada.versao, '1.0.0');
  const cli = spawnSync(process.execPath, [path.join(raizPacote, 'scripts/reunir.mjs'), '--conferir', '--anterior', raiz], { encoding: 'utf8' });
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /rota-da-versao-anterior.*rota removida/);
  function git(...args) {
    return execFileSync('git', args, { cwd: raiz, encoding: 'utf8' });
  }
  git('init');
  assert.equal(await versaoPublicada(raiz), null);
  git('add', 'package.json', 'openapi/api.json');
  git('-c', 'user.name=Teste', '-c', 'user.email=teste@exemplo.dev', 'commit', '-m', 'test: publique contrato de exemplo');
  git('tag', 'v1.0.0');
  assert.equal((await versaoPublicada(raiz)).versao, '1.0.0');
});
