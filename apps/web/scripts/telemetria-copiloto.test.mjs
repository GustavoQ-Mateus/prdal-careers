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
