import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'esbuild';
import { criarTelemetriaCopiloto } from '../src/copiloto/telemetria.ts';
import { montarInicioCopiloto } from '../src/copiloto/inicio.ts';

function armazenamento() {
  const dados = new Map();
  return { getItem: (chave) => dados.get(chave) ?? null, setItem: (chave, valor) => dados.set(chave, valor) };
}

test('conta uma vez por conversa, aba e recarga, sem duplicar ao receber conversaId', () => {
  const eventos = [];
  const sessao = armazenamento();
  const enviar = async (evento) => { eventos.push(evento); };
  const telemetria = criarTelemetriaCopiloto(enviar, () => sessao);
  const aba = telemetria.primeiraMensagem();
  telemetria.primeiraMensagem();
  telemetria.vincularConversa('conversa-1', aba);
  telemetria.primeiraMensagem('conversa-1');
  const recarregada = criarTelemetriaCopiloto(enviar, () => sessao);
  recarregada.primeiraMensagem('conversa-1');
  recarregada.primeiraMensagem();
  recarregada.primeiraMensagem('conversa-2');
  assert.deepEqual(eventos, [
    { evento: 'copiloto_primeira_mensagem', sessaoId: aba },
    { evento: 'copiloto_primeira_mensagem', sessaoId: 'conversa-2' },
  ]);
  assert.match(aba, /^[A-Za-z0-9_-]{1,64}$/);
  const outraAba = criarTelemetriaCopiloto(enviar, () => armazenamento());
  outraAba.primeiraMensagem('conversa-1');
  assert.equal(eventos.length, 3);
  recarregada.novaSessao();
  assert.notEqual(recarregada.primeiraMensagem(), aba);
  assert.equal(eventos.length, 4);
});

const require = createRequire(import.meta.url);
const pluginApi = { name: 'api-falsa', setup(plugin) {
  plugin.onResolve({ filter: /^\.\.\/api$/ }, () => ({ path: 'api-falsa', external: true }));
} };
const hookBundle = await build({ entryPoints: ['src/copiloto/useCopiloto.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], plugins: [pluginApi] });
const inicioBundle = await build({ entryPoints: ['src/copiloto/InicioCopiloto.tsx'], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react', 'react/jsx-runtime', 'lucide-react'], plugins: [pluginApi, {
  name: 'botao-falso', setup(plugin) {
    plugin.onResolve({ filter: /^@\/components\/ui\/button$/ }, () => ({ path: 'botao-falso', external: true }));
  },
}] });

function carregar(bundle, api, react) {
  const modulo = { exports: {} };
  const importar = (nome) => nome === 'api-falsa' ? api : nome === 'react' && react ? react : nome === 'botao-falso' ? { Button: 'button' } : require(nome);
  new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(importar, modulo, modulo.exports);
  return modulo.exports;
}

function montarHook(api) {
  const slots = [];
  let indice = 0;
  let atual;
  const react = {
    useEffect: () => {},
    useRef: (valor) => slots[indice++] ??= { current: valor },
    useReducer: (reducer, argumento, inicializar) => {
      const posicao = indice++;
      slots[posicao] ??= inicializar(argumento);
      return [slots[posicao], (acao) => { slots[posicao] = reducer(slots[posicao], acao); renderizar(); }];
    },
  };
  const { useCopiloto } = carregar(hookBundle, api, react);
  function renderizar() {
    indice = 0;
    atual = useCopiloto();
  }
  renderizar();
  return () => atual;
}

function semSnapshot(t) {
  const anterior = globalThis.sessionStorage;
  globalThis.sessionStorage = armazenamento();
  t.after(() => {
    if (anterior === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = anterior;
  });
}

test('hook registra envio, associa SSE, ignora confirmacao e conta nova conversa', async (t) => {
  semSnapshot(t);
  const eventos = [];
  const chamadas = [];
  const sessao = armazenamento();
  const api = {
    telemetriaCopiloto: criarTelemetriaCopiloto(async (evento) => { eventos.push(evento); }, () => sessao),
    streamCopiloto: async (corpo, aoEvento) => {
      chamadas.push(corpo);
      aoEvento({ evento: 'conversa', data: { conversaId: corpo.conversaId ?? `conversa-${chamadas.length}` } });
      aoEvento({ evento: 'fim_turno', data: { motivo: 'concluido', conversaId: corpo.conversaId ?? `conversa-${chamadas.length}` } });
    },
  };
  const hook = montarHook(api);
  hook().enviar('   ');
  assert.equal(eventos.length, 0);
  hook().enviar('primeira');
  await new Promise((resolver) => setImmediate(resolver));
  hook().enviar('segunda');
  await new Promise((resolver) => setImmediate(resolver));
  hook().confirmar('tool-1');
  await new Promise((resolver) => setImmediate(resolver));
  assert.equal(eventos.length, 1);
  assert.equal(chamadas[1].conversaId, 'conversa-1');
  assert.ok(chamadas[2].confirmacao);
  hook().novaConversa();
  hook().enviar('outra conversa');
  await new Promise((resolver) => setImmediate(resolver));
  assert.equal(eventos.length, 2);
  hook().enviarNovaConversa('acao inicial');
  await new Promise((resolver) => setImmediate(resolver));
  assert.equal(eventos.length, 3);
  assert.equal(chamadas.at(-1).conversaId, undefined);
  assert.doesNotMatch(JSON.stringify(eventos), /primeira"|segunda|acao inicial|tool-1/);
});

function botoes(elemento) {
  if (!elemento || typeof elemento !== 'object') return [];
  if (Array.isArray(elemento)) return elemento.flatMap(botoes);
  return [...(elemento.props?.onClick ? [elemento] : []), ...botoes(elemento.props?.children)];
}

function modelo(passos = []) {
  return { semPerfil: false, data: '', saudacao: '', atrasados: 0, paraResolver: 0, totalPassos: passos.length, passos,
    conversa: { id: 'conversa-1', titulo: 'Conversa', atualizadoEm: '2026-10-05T12:00:00Z' },
    geracoes: [{ oportunidadeId: 'vaga-1', curriculoId: 'cv-1', titulo: 'Vaga', empresa: 'Empresa', concluidaEm: '2026-10-05T12:00:00Z' }],
    entrada: [{ id: 'vaga-2', titulo: 'Vaga', empresa: 'Empresa', criadoEm: '2026-10-05T12:00:00Z' }],
  };
}

test('cliques em todos os botoes do inicio registram a acao correspondente e executam o destino', () => {
  const eventos = [];
  const destinos = [];
  const telemetria = criarTelemetriaCopiloto(async (evento) => { eventos.push(evento); }, () => armazenamento());
  const { InicioCopiloto } = carregar(inicioBundle, { telemetriaCopiloto: telemetria });
  const callbacks = Object.fromEntries(['onConversa', 'onHoje', 'onWorkspace', 'onCurriculo', 'onPerfil', 'onAcao'].map((nome) => [nome, (...args) => destinos.push([nome, ...args])]));
  const hoje = { atrasadas: [], hoje: [], proximosDias: [], semProximoPasso: [] };
  const acoes = [
    ['ENVIAR_CANDIDATURA', 'Enviar', 'preparar_envio'],
    ['ENVIAR_MATERIAL', 'Enviar', 'preparar_envio'],
    ['FAZER_FOLLOW_UP', 'Contato', 'redigir_mensagem'],
    ['OUTRO', 'Responder recrutador', 'redigir_resposta'],
    ['PREPARAR_ENTREVISTA', 'Entrevista', 'preparar_entrevista'],
    ['GERAR_CURRICULO', 'Curriculo', 'preparar_curriculo'],
    ['OUTRO', 'Outro', 'abrir_oportunidade'],
  ];
  for (const [tipo, titulo, esperada] of acoes) {
    const item = { id: 'passo-1', vagaId: 'vaga-1', tipo, titulo, venceEm: null, oportunidade: { titulo: 'Vaga', empresa: 'Empresa' } };
    const inicio = montarInicioCopiloto({ ...hoje, hoje: [item] }, [], undefined, new Date('2026-10-05T12:00:00Z'), 'UTC');
    const arvore = InicioCopiloto({ modelo: { ...modelo(inicio.passos), conversa: undefined, geracoes: undefined, entrada: undefined }, ...callbacks });
    botoes(arvore).at(-1).props.onClick();
    assert.equal(eventos.at(-1).acao, esperada);
    assert.equal(destinos.at(-1)[0], esperada === 'abrir_oportunidade' ? 'onWorkspace' : 'onAcao');
  }
  const semPasso = montarInicioCopiloto({ ...hoje, semProximoPasso: [{ id: 'vaga-3', titulo: 'Vaga', empresa: 'Empresa' }] }, [], undefined, new Date('2026-10-05T12:00:00Z'), 'UTC');
  const restantes = InicioCopiloto({ modelo: modelo(semPasso.passos), ...callbacks });
  const antes = eventos.length;
  for (const botao of botoes(restantes)) botao.props.onClick();
  assert.deepEqual(eventos.slice(antes).map((evento) => evento.acao), ['retomar_conversa', 'ver_agenda', 'definir_proximo_passo', 'abrir_curriculo', 'analisar_vaga']);
  const perfil = InicioCopiloto({ modelo: { ...modelo(), semPerfil: true }, ...callbacks });
  botoes(perfil)[0].props.onClick();
  assert.equal(eventos.at(-1).acao, 'montar_perfil');
  assert.equal(destinos.at(-1)[0], 'onPerfil');
  assert.ok(eventos.every((evento) => evento.evento === 'copiloto_acao_rapida' && /^[A-Za-z0-9_-]{1,64}$/.test(evento.sessaoId)));
  assert.ok(eventos.every((evento) => Object.keys(evento).sort().join(',') === 'acao,evento,sessaoId'));
});

test('falha sincrona, rejeicao e armazenamento negado nao impedem envio ou clique', async (t) => {
  semSnapshot(t);
  for (const enviar of [
    () => { throw new Error('falha sincrona'); },
    async () => { throw new Error('rede indisponivel'); },
    () => new Promise(() => {}),
  ]) {
    const armazenamentoNegado = () => { throw new Error('armazenamento negado'); };
    const telemetria = criarTelemetriaCopiloto(enviar, armazenamentoNegado);
    let chamadas = 0;
    const hook = montarHook({ telemetriaCopiloto: telemetria, streamCopiloto: async () => { chamadas++; } });
    assert.doesNotThrow(() => hook().enviar('mensagem enviada'));
    assert.equal(chamadas, 1);
    assert.equal(hook().itens.some((item) => item.tipo === 'erro'), false);
    const { InicioCopiloto } = carregar(inicioBundle, { telemetriaCopiloto: telemetria });
    let navegou = false;
    const perfil = InicioCopiloto({ modelo: { ...modelo(), semPerfil: true }, onPerfil: () => { navegou = true; } });
    assert.doesNotThrow(() => botoes(perfil)[0].props.onClick());
    assert.equal(navegou, true);
  }
  await new Promise((resolver) => setImmediate(resolver));
});

test('sem armazenamento, memoria impede repeticao e limpeza permite outra sessao', () => {
  const eventos = [];
  const telemetria = criarTelemetriaCopiloto(async (evento) => { eventos.push(evento); }, () => { throw new Error('negado'); });
  const id = telemetria.primeiraMensagem();
  assert.equal(telemetria.primeiraMensagem(), id);
  telemetria.vincularConversa('conversa-1', id);
  telemetria.primeiraMensagem('conversa-1');
  assert.equal(eventos.length, 1);
  telemetria.limpar();
  assert.notEqual(telemetria.primeiraMensagem(), id);
  assert.equal(eventos.length, 2);
});

const apiBundle = await build({ entryPoints: ['src/api.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, define: { 'import.meta.env': '{"VITE_API_URL":"http://api.teste"}' } });

test('transporte envia contrato autenticado com csrf, sem refresh, redirecionamento ou rejeicao', async (t) => {
  semSnapshot(t);
  const fetchAnterior = globalThis.fetch;
  const documentAnterior = globalThis.document;
  const windowAnterior = globalThis.window;
  t.after(() => {
    globalThis.fetch = fetchAnterior;
    if (documentAnterior === undefined) delete globalThis.document;
    else globalThis.document = documentAnterior;
    if (windowAnterior === undefined) delete globalThis.window;
    else globalThis.window = windowAnterior;
  });
  globalThis.document = { cookie: 'prdal_csrf=csrf-teste' };
  let redirecionamentos = 0;
  globalThis.window = { location: { assign: () => { redirecionamentos++; } } };
  const chamadas = [];
  const resultados = [204, 401, 429, 500, new Error('rede indisponivel'), new DOMException('prazo excedido', 'TimeoutError')];
  globalThis.fetch = async (url, init) => {
    chamadas.push({ url, ...init });
    const resultado = resultados.shift();
    if (resultado instanceof Error) throw resultado;
    return new Response(null, { status: resultado });
  };
  const { telemetriaCopiloto } = carregar(apiBundle, {});
  for (let i = 0; i < 6; i++) {
    assert.doesNotThrow(() => telemetriaCopiloto.acaoRapida('analisar_vaga'));
    await new Promise((resolver) => setImmediate(resolver));
  }
  assert.equal(chamadas.length, 6);
  for (const chamada of chamadas) {
    assert.equal(chamada.url, 'http://api.teste/v1/telemetria/eventos');
    assert.equal(chamada.method, 'POST');
    assert.equal(chamada.credentials, 'include');
    assert.equal(chamada.headers.get('X-CSRF-Token'), 'csrf-teste');
    assert.equal(chamada.headers.get('Content-Type'), 'application/json');
    assert.equal(chamada.headers.get('Authorization'), null);
    assert.ok(chamada.signal instanceof AbortSignal);
    const corpo = JSON.parse(chamada.body);
    assert.equal(corpo.evento, 'copiloto_acao_rapida');
    assert.equal(corpo.acao, 'analisar_vaga');
    assert.match(corpo.sessaoId, /^[A-Za-z0-9_-]{1,64}$/);
    assert.deepEqual(Object.keys(corpo).sort(), ['acao', 'evento', 'sessaoId']);
  }
  assert.equal(redirecionamentos, 0);
  assert.equal(globalThis.sessionStorage.getItem('prdal-sessao-expirada'), null);
});
