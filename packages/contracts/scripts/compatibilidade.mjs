import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const metodos = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];

function resolver(schema, documento, vistos = new Set()) {
  if (!schema) return {};
  if (schema.$ref) {
    if (vistos.has(schema.$ref)) return {};
    const referencia = schema.$ref;
    const proximo = new Set([...vistos, referencia]);
    const alvo = referencia.slice(2).split('/').reduce((valor, chave) => valor?.[chave.replace(/~1/g, '/').replace(/~0/g, '~')], documento);
    if (!alvo) throw new Error(`referencia ausente: ${referencia}`);
    return resolver({ ...alvo, ...Object.fromEntries(Object.entries(schema).filter(([chave]) => chave !== '$ref')) }, documento, proximo);
  }
  if (schema.allOf) {
    const partes = schema.allOf.map((parte) => resolver(parte, documento, vistos));
    return {
      ...schema,
      properties: Object.assign({}, ...partes.map((parte) => parte.properties), schema.properties),
      required: [...new Set([...partes.flatMap((parte) => parte.required ?? []), ...(schema.required ?? [])])],
      allOf: undefined,
    };
  }
  return schema;
}

function campos(antes, depois, antigo, novo, pedido, caminho, vistos = new Set()) {
  const chave = `${antes?.$ref ?? ''}|${depois?.$ref ?? ''}|${pedido}`;
  if ((antes?.$ref || depois?.$ref) && vistos.has(chave)) return [];
  const proximo = new Set(vistos);
  if (antes?.$ref || depois?.$ref) proximo.add(chave);
  const a = resolver(antes, antigo);
  const b = resolver(depois, novo);
  const alternativasA = a.oneOf ?? a.anyOf;
  const alternativasB = b.oneOf ?? b.anyOf;
  if (alternativasA || alternativasB) {
    const origem = pedido ? alternativasB ?? [b] : alternativasA ?? [a];
    const destino = pedido ? alternativasA ?? [a] : alternativasB ?? [b];
    return origem.flatMap((parte) => {
      const resultados = destino.map((outra) => pedido
        ? campos(outra, parte, antigo, novo, pedido, caminho, proximo)
        : campos(parte, outra, antigo, novo, pedido, caminho, proximo));
      return resultados.find((erros) => !erros.length) ?? resultados.sort((x, y) => x.length - y.length)[0];
    });
  }
  const erros = [];
  if (pedido) {
    for (const nome of b.required ?? []) {
      if (!(a.required ?? []).includes(nome)) erros.push(`${caminho}.${nome}: campo novo obrigatorio no pedido`);
    }
  } else {
    for (const nome of Object.keys(a.properties ?? {})) {
      if (!Object.hasOwn(b.properties ?? {}, nome)) erros.push(`${caminho}.${nome}: campo de resposta removido`);
    }
  }
  for (const nome of Object.keys(a.properties ?? {})) {
    if (b.properties?.[nome]) erros.push(...campos(a.properties[nome], b.properties[nome], antigo, novo, pedido, `${caminho}.${nome}`, proximo));
  }
  if (a.items && b.items) erros.push(...campos(a.items, b.items, antigo, novo, pedido, `${caminho}[]`, proximo));
  if (a.items && !b.items && !pedido) erros.push(`${caminho}[]: campos da resposta removidos`);
  if (typeof a.additionalProperties === 'object' && typeof b.additionalProperties === 'object') {
    erros.push(...campos(a.additionalProperties, b.additionalProperties, antigo, novo, pedido, `${caminho}.*`, proximo));
  }
  return erros;
}

export function quebras(antigo, novo) {
  const erros = [];
  for (const [rota, item] of Object.entries(antigo.paths ?? {})) {
    for (const metodo of metodos.filter((metodo) => item[metodo])) {
      const antes = item[metodo];
      const depois = novo.paths?.[rota]?.[metodo];
      const nome = `${metodo.toUpperCase()} ${rota}`;
      if (!depois) {
        erros.push(`${nome}: rota removida`);
        continue;
      }
      for (const [status, resposta] of Object.entries(antes.responses ?? {})) {
        const atual = depois.responses?.[status];
        if (!atual && Object.keys(resposta.content ?? {}).length) erros.push(`${nome} ${status}: resposta removida`);
        for (const [media, corpo] of Object.entries(resposta.content ?? {})) {
          const outro = atual?.content?.[media];
          if (!outro) erros.push(`${nome} ${status} ${media}: resposta removida`);
          else erros.push(...campos(corpo.schema, outro.schema, antigo, novo, false, `${nome} ${status}`));
        }
      }
      if (depois.requestBody?.required && !antes.requestBody?.required) erros.push(`${nome}: corpo novo obrigatorio no pedido`);
      for (const [media, corpo] of Object.entries(depois.requestBody?.content ?? {})) {
        erros.push(...campos(antes.requestBody?.content?.[media]?.schema, corpo.schema, antigo, novo, true, `${nome} pedido`));
      }
      const parametrosAntes = [...(item.parameters ?? []), ...(antes.parameters ?? [])];
      for (const parametro of [...(novo.paths[rota].parameters ?? []), ...(depois.parameters ?? [])]) {
        const anterior = parametrosAntes.find((outro) => outro.name === parametro.name && outro.in === parametro.in);
        if (parametro.required && !anterior?.required) erros.push(`${nome} ${parametro.name}: parametro novo obrigatorio no pedido`);
        if (anterior) erros.push(...campos(anterior.schema, parametro.schema, antigo, novo, true, `${nome} ${parametro.name}`));
      }
    }
  }
  return [...new Set(erros)];
}

export function conferirCompatibilidade(antigo, novo, versaoAnterior, versaoNova) {
  if (Number(versaoNova.split('.')[0]) > Number(versaoAnterior.split('.')[0])) return;
  const erros = quebras(antigo, novo);
  if (erros.length) throw new Error(`contrato incompativel; aumente a versao maior:\n${erros.join('\n')}`);
}

export async function versaoPublicada(raiz, anterior) {
  if (anterior) {
    const pacote = JSON.parse(await readFile(new URL('package.json', anterior), 'utf8'));
    const documentos = new Map();
    for (const nome of await readdir(new URL('openapi/', anterior))) {
      documentos.set(`openapi/${nome}`, await readFile(new URL(`openapi/${nome}`, anterior), 'utf8'));
    }
    return { versao: pacote.version, documentos };
  }
  function git(...args) {
    return execFileSync('git', args, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  }
  const prefixo = git('rev-parse', '--show-prefix');
  const tags = git('tag', '--list', 'v*', '--sort=-version:refname').split('\n').filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
  for (const tag of tags) {
    let pacote;
    try {
      pacote = JSON.parse(git('show', `${tag}:${prefixo}package.json`));
    } catch {
      continue;
    }
    if (pacote.name !== '@prdal/contracts') continue;
    const documentos = new Map();
    for (const nome of git('ls-tree', '--name-only', `${tag}:${prefixo}openapi`).split('\n').filter(Boolean)) {
      documentos.set(`openapi/${nome}`, git('show', `${tag}:${prefixo}openapi/${nome}`));
    }
    return { versao: pacote.version, documentos };
  }
  return null;
}
