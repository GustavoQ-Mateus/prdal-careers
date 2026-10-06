import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import openapiTS from 'openapi-typescript';
import ts from 'typescript';
import { conferirCompatibilidade, versaoPublicada } from './compatibilidade.mjs';

export const raizPacote = fileURLToPath(new URL('../', import.meta.url));

export async function gerarTipos(documento) {
  const nos = await openapiTS(JSON.parse(documento));
  const arquivo = ts.createSourceFile('tipos.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const printer = ts.createPrinter({ removeComments: true });
  return nos.map((no) => printer.printNode(ts.EmitHint.Unspecified, no, arquivo)).join('\n') + '\n';
}

export async function reunir(raiz = raizPacote, apps, conferir = false) {
  const arquivos = new Map();
  const nomesOrigem = apps ? await readdir(apps) : (await readdir(path.join(raiz, 'openapi'))).map((nome) => path.basename(nome, '.json'));
  for (const nome of nomesOrigem.sort()) {
    const origem = apps ? path.join(apps, nome, 'contrato/openapi.json') : path.join(raiz, 'openapi', `${nome}.json`);
    let documento;
    try {
      documento = (await readFile(origem, 'utf8')).replace(/\r\n/g, '\n');
    } catch (erro) {
      if (erro.code === 'ENOENT') continue;
      throw erro;
    }
    arquivos.set(`openapi/${nome}.json`, documento);
    arquivos.set(`src/${nome}.ts`, await gerarTipos(documento));
  }
  for (const nome of ['api', 'ai-service']) {
    if (!arquivos.has(`openapi/${nome}.json`)) throw new Error(`contrato ausente: ${nome}`);
  }
  const schema = apps ? path.join(apps, 'api/prisma/schema.prisma') : path.join(raiz, 'prisma/schema.prisma');
  arquivos.set('prisma/schema.prisma', (await readFile(schema, 'utf8')).replace(/\r\n/g, '\n'));
  const nomes = [...arquivos.keys()].filter((nome) => nome.startsWith('src/')).map((nome) => path.basename(nome, '.ts'));
  arquivos.set('src/index.ts', nomes.map((nome) => `export type { paths as ${nome.replace(/-([a-z])/g, (_, letra) => letra.toUpperCase())}Paths, components as ${nome.replace(/-([a-z])/g, (_, letra) => letra.toUpperCase())}Components } from './${nome}.js';`).join('\n') + "\nexport type HealthResponse = import('./api.js').components['schemas']['HealthResponseDto'];\n");
  const divergentes = [];
  for (const [nome, conteudo] of arquivos) {
    const destino = path.join(raiz, nome);
    if (conferir) {
      const atual = await readFile(destino, 'utf8').catch((erro) => {
        if (erro.code === 'ENOENT') return null;
        throw erro;
      });
      if (atual?.replace(/\r\n/g, '\n') !== conteudo) divergentes.push(nome);
    } else {
      await mkdir(path.dirname(destino), { recursive: true });
      await writeFile(destino, conteudo);
    }
  }
  for (const pasta of ['openapi', 'src']) {
    for (const nome of await readdir(path.join(raiz, pasta)).catch(() => [])) {
      if (!arquivos.has(`${pasta}/${nome}`)) divergentes.push(`${pasta}/${nome} excedente`);
    }
  }
  if (divergentes.length) throw new Error(`pacote desatualizado: ${divergentes.join(', ')}`);
  return arquivos;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const conferir = process.argv.includes('--conferir');
    const indiceApps = process.argv.indexOf('--apps');
    const apps = indiceApps === -1 ? undefined : path.resolve(process.argv[indiceApps + 1]);
    const arquivos = await reunir(raizPacote, apps, conferir);
    if (conferir) {
      const indice = process.argv.indexOf('--anterior');
      const anterior = indice === -1 ? undefined : pathToFileURL(path.resolve(process.argv[indice + 1]) + path.sep);
      const publicada = await versaoPublicada(raizPacote, anterior);
      const pacote = JSON.parse(await readFile(path.join(raizPacote, 'package.json'), 'utf8'));
      if (publicada) {
        for (const [nome, documento] of publicada.documentos) {
          conferirCompatibilidade(JSON.parse(documento), JSON.parse(arquivos.get(nome) ?? '{"paths":{}}'), publicada.versao, pacote.version);
        }
      }
    }
  } catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
  }
}
