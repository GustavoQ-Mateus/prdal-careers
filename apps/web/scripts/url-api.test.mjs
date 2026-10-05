import assert from 'node:assert/strict';
import test from 'node:test';
import { urlBaseApi } from '../src/lib/url-api.ts';

test('base da api com a versao do ambiente', () => {
  assert.equal(urlBaseApi('http://localhost:3000', 'v1'), 'http://localhost:3000/v1');
  assert.equal(urlBaseApi('http://localhost:3000', undefined), 'http://localhost:3000/v1');
  assert.equal(urlBaseApi('https://dominio/api', 'v2'), 'https://dominio/api/v2');
});

test('versao vazia tira o segmento', () => {
  assert.equal(urlBaseApi('http://localhost:3000', ''), 'http://localhost:3000');
  assert.equal(urlBaseApi('https://dominio/api/', '  '), 'https://dominio/api');
});

test('barra no fim da url e em volta da versao nao duplica', () => {
  assert.equal(urlBaseApi('https://dominio/api/', 'v1'), 'https://dominio/api/v1');
  assert.equal(urlBaseApi('https://dominio/api//', '/v1/'), 'https://dominio/api/v1');
});
