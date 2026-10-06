import type { apiPaths, apiComponents } from '@prdal/contracts';

type Resposta<P extends keyof apiPaths, M extends keyof apiPaths[P], S extends number> =
  apiPaths[P][M] extends { responses: infer R }
    ? S extends keyof R
      ? R[S] extends { content: { 'application/json': infer T } } ? T : never
      : never
    : never;

import { lerEventos } from './copiloto/sse';
import { urlBaseApi } from './lib/url-api';
import { lerCorpoResposta } from './lib/corpo-resposta';
import { criarCliente, ErroRespostaApi } from './sessao';
import { criarTelemetriaCopiloto } from './copiloto/telemetria';

export type Keyword = apiComponents['schemas']['Keyword'];

export type LoteItemStatus = LoteStatus['itens'][number];

export type LoteStatus = Resposta<'/v1/lotes/{id}', 'get', 200>;

export const STATUS_CANDIDATURA = [
  'RASCUNHO',
  'INSCRITA',
  'EM_PROCESSO',
  'ENTREVISTA',
  'OFERTA',
  'REJEITADA',
  'DESISTIU',
] as const satisfies readonly StatusCandidatura[];

export type StatusCandidatura = Candidatura['status'];

export type Candidatura = Resposta<'/v1/candidaturas/{id}', 'patch', 200>;

export type ItemImportacao = apiComponents['schemas']['ImportarOportunidadesDto']['itens'][number];

export type TipoLink = LinkPerfil['tipo'];

export type StatusFormacao = Exclude<FormacaoPerfil['status'], ''>;

export type MotivoRevisao = NonNullable<EmailPerfil['revisao']>[number];

export type EmailPerfil = PerfilMestre['emails'][number];

export type TelefonePerfil = PerfilMestre['telefones'][number];

export type LinkPerfil = PerfilMestre['links'][number];

export type LocalPerfil = Exclude<NonNullable<ExperienciaPerfil['local']>, string>;

export type EnderecoPerfil = Exclude<NonNullable<PerfilMestre['endereco']>, string>;

export type OutroContatoPerfil = PerfilMestre['outrosContatos'][number];

export type FormacaoPerfil = PerfilMestre['formacao'][number];

export type CertificacaoPerfil = PerfilMestre['certificacoes'][number];

export type ExperienciaPerfil = Omit<Resposta<'/v1/perfil-mestre', 'put', 200>['experiencias'][number], 'local'> & Pick<apiComponents['schemas']['ExperienciaPerfilDto'], 'local' | 'periodo'>;

export type PerfilMestre = Omit<Resposta<'/v1/perfil-mestre', 'put', 200>, 'id' | 'usuarioId' | 'atualizadoEm' | 'endereco' | 'experiencias'> & Pick<apiComponents['schemas']['PerfilMestreDto'], 'endereco'> & { experiencias: ExperienciaPerfil[] };

export type ScoreBreakdown = apiComponents['schemas']['ScoreBreakdown'];

export type AtsAnalysis = apiComponents['schemas']['AtsAnalysis'];

export type Curriculo = Resposta<'/v1/curriculos/{id}', 'get', 200>;

export type CurriculoResumo = Resposta<'/v1/oportunidades/{id}/curriculos', 'get', 200>[number];

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function sessaoExpirada() {
  sessionStorage.setItem('prdal-sessao-expirada', '1');
  window.location.assign('/?sessao=expirada');
}

const cliente = criarCliente(urlBaseApi(API_URL, import.meta.env.VITE_API_VERSAO), sessaoExpirada);

export type TelemetriaEvento = apiPaths['/v1/telemetria/eventos']['post']['requestBody']['content']['application/json'];
export type AcaoRapidaCopiloto = Extract<TelemetriaEvento, { evento: 'copiloto_acao_rapida' }>['acao'];

export const telemetriaCopiloto = criarTelemetriaCopiloto((evento) => cliente.chamar('/telemetria/eventos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(evento),
  signal: AbortSignal.timeout(5_000),
}, { expirar: false, renovar: false }));

async function falha(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw new ErroRespostaApi(body, res.status);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...(options.headers as Record<string, string>),
  };
  const res = await cliente.chamar(path, { ...options, headers });
  if (res.status === 401 && !path.startsWith('/auth/')) throw new Error('sessão expirada');
  if (!res.ok) await falha(res);
  return lerCorpoResposta<T>(res);
}

export function login(email: string, senha: string) {
  return cliente.entrar(email, senha);
}

export async function registrar(email: string, senha: string) {
  await request<Resposta<'/v1/auth/register', 'post', 201>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  await login(email, senha);
}

export function logout() {
  telemetriaCopiloto.limpar();
  return cliente.sair();
}

export function iniciarSessao(): Promise<boolean> {
  return cliente.iniciar();
}

export function trocarSenha(senhaAtual: string, novaSenha: string) {
  return request<void>('/auth/senha', {
    method: 'POST',
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
}

export function getPerfil() {
  return request<PerfilMestre | null>('/perfil-mestre');
}

export function salvarPerfil(perfil: PerfilMestre) {
  return request<PerfilMestre>('/perfil-mestre', {
    method: 'PUT',
    body: JSON.stringify(perfil),
  });
}

export function getCurriculo(id: string) {
  return request<Curriculo>(`/curriculos/${id}`);
}

export function editarCurriculo(id: string, dto: apiComponents['schemas']['EditarCurriculoDto']) {
  return request<Curriculo>(`/curriculos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export function listarCurriculos(vagaId: string) {
  return request<CurriculoResumo[]>(`/oportunidades/${vagaId}/curriculos`);
}

export function getLote(id: string) {
  return request<LoteStatus>(`/lotes/${id}`);
}

export function atualizarCandidatura(
  id: string,
  dto: apiComponents['schemas']['AtualizarCandidaturaDto'],
) {
  return request<Candidatura>(`/candidaturas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export type ContextoStatus = Resposta<'/v1/contexto/status', 'get', 200>;

export function getContextoStatus() {
  return request<ContextoStatus>('/contexto/status');
}

export function reindexarContexto() {
  return request<Resposta<'/v1/contexto/reindexar', 'post', 201>>('/contexto/reindexar', {
    method: 'POST',
  });
}

export async function uploadContexto(arquivos: File[]) {
  const form = new FormData();
  for (const a of arquivos) form.append('arquivos', a);
  const res = await cliente.chamar('/contexto/upload', { method: 'POST', body: form });
  if (!res.ok) await falha(res);
  return res.json() as Promise<Resposta<'/v1/contexto/upload', 'post', 201>>;
}

export type UrlDeDownload = Resposta<'/v1/curriculos/{id}/docx', 'get', 200>;

export async function baixarArquivo(url: string, nomeArquivo: string) {
  const { url: destino } = await request<UrlDeDownload>(url);
  const link = document.createElement('a');
  link.href = destino;
  link.download = nomeArquivo;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => link.remove(), 1000);
}

export type PrioridadeOportunidade = apiComponents['schemas']['AtualizarOportunidadeDto']['prioridade'] & string;
export type ApresentacaoOportunidade = WorkspaceOportunidade['oportunidade']['apresentacao'];
export type EtapaPipeline = WorkspaceOportunidade['oportunidade']['etapa'];
export type DestinoTransicao = apiComponents['schemas']['TransicaoDto']['destino'];
export type TipoAcaoOportunidade = apiComponents['schemas']['CriarAcaoDto']['tipo'];
export type StatusGeracaoCurriculo = GeracaoCurriculo['status'];
export type PipelineModo = 'kanban' | 'canvas' | 'grafo';

export type ProximoPasso = NonNullable<WorkspaceOportunidade['oportunidade']['proximoPasso']>;

export type OportunidadeItem = Resposta<'/v1/oportunidades', 'get', 200>['itens'][number];

export type EventoOportunidade = WorkspaceOportunidade['timeline'][number];

export type AcaoOportunidade = Resposta<'/v1/acoes/{id}', 'patch', 200>;

export type CandidaturaWorkspace = NonNullable<WorkspaceOportunidade['candidatura']>;

export type WorkspaceOportunidade = Resposta<'/v1/oportunidades/{id}/workspace', 'get', 200>;

export type HojeAcao = HojeResposta['hoje'][number];

export type HojeResposta = Resposta<'/v1/hoje', 'get', 200>;

export type PipelineItem = Resposta<'/v1/pipeline', 'get', 200>[number];

export type PipelineFiltros = NonNullable<apiPaths['/v1/pipeline']['get']['parameters']['query']>;

export type GrafoResposta = Resposta<'/v1/pipeline/grafo', 'get', 200>;

export type GeracaoCurriculo = Resposta<'/v1/geracoes-curriculo/{jobId}', 'get', 200>;

export type CurriculoGlobal = Resposta<'/v1/curriculos', 'get', 200>['itens'][number];

export type Pagina<T> = Omit<Resposta<'/v1/curriculos', 'get', 200>, 'itens'> & { itens: T[] };

export type Taxonomia = Resposta<'/v1/taxonomia', 'get', 200>;

export type PreferenciasUsuario = Resposta<'/v1/preferencias', 'get', 200>;

function query(params: object) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function getHoje(de?: string, ate?: string, periodo?: 7 | 30 | 90) {
  return request<HojeResposta>(`/hoje${query({ de, ate, periodo })}`);
}

export function getPreferencias() {
  return request<PreferenciasUsuario>('/preferencias');
}

export function patchPreferencias(dto: apiComponents['schemas']['PatchPreferenciasDto']) {
  return request<PreferenciasUsuario>('/preferencias', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export function getTaxonomia() {
  return request<Taxonomia>('/taxonomia');
}

export function listarOportunidades(params: NonNullable<apiPaths['/v1/oportunidades']['get']['parameters']['query']>) {
  return request<Pagina<OportunidadeItem>>(`/oportunidades${query(params)}`);
}

export function criarOportunidade(dto: apiComponents['schemas']['CriarOportunidadeDto']) {
  return request<Resposta<'/v1/oportunidades', 'post', 201>>('/oportunidades', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function importarOportunidades(itens: ItemImportacao[]) {
  return request<Resposta<'/v1/oportunidades/importar', 'post', 201>>('/oportunidades/importar', {
    method: 'POST',
    body: JSON.stringify({ itens }),
  });
}

export function ativarEntrada(id: string) {
  return request<Resposta<'/v1/oportunidades/entradas/{id}/ativar', 'post', 201>>(`/oportunidades/entradas/${id}/ativar`, {
    method: 'POST',
  });
}

export function getWorkspace(id: string) {
  return request<WorkspaceOportunidade>(`/oportunidades/${id}/workspace`);
}

export function patchOportunidade(
  id: string,
  dto: apiComponents['schemas']['AtualizarOportunidadeDto'],
) {
  return request<Resposta<'/v1/oportunidades/{id}', 'patch', 200>>(`/oportunidades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export function transicionarOportunidade(
  id: string,
  destino: DestinoTransicao,
  motivo?: string,
) {
  return request(`/oportunidades/${id}/transicoes`, {
    method: 'POST',
    body: JSON.stringify({ destino, motivo }),
  });
}

export function candidaturaPrincipal(id: string) {
  return request<Candidatura>(`/oportunidades/${id}/candidatura-principal`, {
    method: 'POST',
  });
}

export function listarAcoes(vagaId: string) {
  return request<AcaoOportunidade[]>(`/oportunidades/${vagaId}/acoes`);
}

export function criarAcao(
  vagaId: string,
  dto: apiComponents['schemas']['CriarAcaoDto'],
) {
  return request<AcaoOportunidade>(`/oportunidades/${vagaId}/acoes`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function patchAcao(
  id: string,
  dto: apiComponents['schemas']['AtualizarAcaoDto'],
) {
  return request<AcaoOportunidade>(`/acoes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export function concluirAcao(id: string) {
  return request<AcaoOportunidade>(`/acoes/${id}/concluir`, { method: 'POST' });
}

export function cancelarAcao(id: string) {
  return request<AcaoOportunidade>(`/acoes/${id}/cancelar`, { method: 'POST' });
}

export function getTimeline(vagaId: string, cursor?: string) {
  return request<Resposta<'/v1/oportunidades/{id}/timeline', 'get', 200>>(
    `/oportunidades/${vagaId}/timeline${query({ cursor })}`,
  );
}

export function postNotaTimeline(vagaId: string, descricao: string) {
  return request<EventoOportunidade>(`/oportunidades/${vagaId}/timeline/notas`, {
    method: 'POST',
    body: JSON.stringify({ descricao }),
  });
}

export function gerarCvOportunidade(id: string) {
  return request<Resposta<'/v1/oportunidades/{id}/gerar-cv', 'post', 202>>(`/oportunidades/${id}/gerar-cv`, {
    method: 'POST',
  });
}

export type ContaResposta = Resposta<'/v1/conta', 'get', 200>;

export type ExportacaoConta = Resposta<'/v1/conta/exportacoes/{jobId}', 'get', 200>;

export function getConta() {
  return request<ContaResposta>('/conta');
}

export function aceitarConsentimento() {
  return request<void>('/conta/consentimento', { method: 'POST' });
}

export function revogarConsentimento() {
  return request<void>('/conta/consentimento', { method: 'DELETE' });
}

export function iniciarExportacaoConta() {
  return request<Resposta<'/v1/conta/exportacoes', 'post', 202>>('/conta/exportacoes', { method: 'POST' });
}

export function getExportacaoConta(jobId: string) {
  return request<ExportacaoConta>(`/conta/exportacoes/${encodeURIComponent(jobId)}`);
}

export function agendarExclusaoConta(senha: string) {
  return request<Resposta<'/v1/conta/exclusao', 'post', 200>>('/conta/exclusao', {
    method: 'POST', body: JSON.stringify({ senha }),
  });
}

export function cancelarExclusaoConta() {
  return request<void>('/conta/exclusao', { method: 'DELETE' });
}

export function getGeracao(jobId: string) {
  return request<GeracaoCurriculo>(`/geracoes-curriculo/${jobId}`);
}

export function listarCurriculosGlobal(params: NonNullable<apiPaths['/v1/curriculos']['get']['parameters']['query']>) {
  return request<Pagina<CurriculoGlobal>>(`/curriculos${query(params)}`);
}

export function getPipeline(filtros: PipelineFiltros) {
  return request<PipelineItem[]>(`/pipeline${query(filtros)}`);
}

export function getPipelineGrafo(filtros: PipelineFiltros) {
  return request<GrafoResposta>(`/pipeline/grafo${query(filtros)}`);
}

export type ModoCopiloto = NonNullable<CopilotoChatBody['modo']>;

export type ConfirmacaoCopiloto = NonNullable<CopilotoChatBody['confirmacao']>;

export type CopilotoChatBody = apiComponents['schemas']['ChatDto'];

export type MensagemCopilotoPersistida = ConversaCopilotoDetalhe['mensagens'][number];

export type ConversaCopilotoResumo = Resposta<'/v1/copiloto/conversas', 'get', 200>[number];

export type ConversaCopilotoDetalhe = Resposta<'/v1/copiloto/conversas/{id}', 'get', 200>;

export function listarConversasCopiloto(oportunidadeId?: string) {
  return request<ConversaCopilotoResumo[]>(
    `/copiloto/conversas${query({ oportunidadeId })}`,
  );
}

export function buscarConversaCopiloto(id: string) {
  return request<ConversaCopilotoDetalhe>(`/copiloto/conversas/${id}`);
}

export type EfeitoTool = Extract<CopilotoEvento, { evento: 'tool_call' }>['data']['efeito'];

export type AvisoAcao = NonNullable<Extract<CopilotoEvento, { evento: 'entrega_externa' }>['data']['aviso']>;

export type CopilotoEvento = apiComponents['schemas']['CopilotoEvento'];

export async function streamCopiloto(
  body: CopilotoChatBody,
  onEvento: (ev: CopilotoEvento) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await cliente.chamar('/copiloto/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const b = await res.json().catch(() => ({}));
    throw new ErroRespostaApi(b, res.status);
  }
  await lerEventos(res.body, (frame) => onEvento(frame as CopilotoEvento));
}
