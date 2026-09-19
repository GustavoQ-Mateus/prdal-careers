export interface Keyword {
  termo: string;
  peso: number;
}

export interface Vaga {
  id: string;
  titulo: string;
  empresa: string;
  descricao: string;
  fonte: string | null;
  keywords: Keyword[];
  categoria: string | null;
  nivel: string | null;
  criadoEm: string;
}

export interface BancoVaga {
  id: string;
  titulo: string;
  empresa: string;
  fonte: string | null;
  categoria: string | null;
  nivel: string | null;
  keywords: Keyword[] | null;
  status: 'CRUA' | 'ATIVADA';
  criadoEm: string;
}

export interface LoteItemStatus {
  id: string;
  bancoVagaId: string;
  status: string;
  erro: string | null;
}

export interface LoteStatus {
  id: string;
  tipo: string;
  status: string;
  total: number;
  processados: number;
  itens: LoteItemStatus[];
}

export const STATUS_CANDIDATURA = [
  'RASCUNHO',
  'INSCRITA',
  'EM_PROCESSO',
  'ENTREVISTA',
  'OFERTA',
  'REJEITADA',
  'DESISTIU',
] as const;

export type StatusCandidatura = (typeof STATUS_CANDIDATURA)[number];

export interface Candidatura {
  id: string;
  vagaId: string;
  tituloVaga: string;
  empresa: string;
  curriculoId: string | null;
  status: StatusCandidatura;
  notas: string;
  atualizadoEm: string;
}

export interface ItemImportacao {
  titulo: string;
  empresa: string;
  fonte?: string;
  descricao: string;
}

export type TipoContatoPerfil =
  | 'email'
  | 'telefone'
  | 'linkedin'
  | 'github'
  | 'site'
  | 'localizacao'
  | 'outro';

export interface ContatoPerfil {
  id: string;
  tipo: TipoContatoPerfil;
  valor: string;
  rotulo?: string;
}

export interface ExperienciaPerfil {
  id: string;
  cargo: string;
  empresa: string;
  periodo: string;
  local?: string;
  descricao: string;
  tecnologias?: string[];
}

export interface PerfilMestre {
  nome: string;
  contato: ContatoPerfil[];
  resumo: string;
  experiencias: ExperienciaPerfil[];
  formacao: string[];
  certificacoes: string[];
  idiomas: string[];
  skills: string[];
}

export interface ScoreBreakdown {
  keywordMatch: number;
  densidade: number;
  secoes: number;
  faltando: string[];
}

export interface AtsAnalysis {
  score: number;
  keywordsEncontradas: string[];
  keywordsCriticasAusentes: string[];
  pontosEliminatorios: string[];
  veredicto: string;
  breakdown: ScoreBreakdown;
}

export interface Curriculo {
  id: string;
  vagaId: string;
  rotulo: string;
  markdown: string;
  score: number | null;
  breakdown: ScoreBreakdown | null;
  analiseInicial: AtsAnalysis | null;
  analiseFinal: AtsAnalysis | null;
  degradacao: string | null;
  geradoEm: string;
  downloadDocxUrl: string | null;
  downloadPdfUrl: string | null;
}

export interface CurriculoResumo {
  id: string;
  rotulo: string;
  score: number | null;
  breakdown: ScoreBreakdown | null;
  analiseInicial: AtsAnalysis | null;
  analiseFinal: AtsAnalysis | null;
  degradacao: string | null;
  geradoEm: string;
}

export interface DashboardItem {
  vagaId: string;
  titulo: string;
  empresa: string;
  melhorScore: number | null;
  versoes: number;
  ultimaGeracao: string | null;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function token(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...(options.headers as Record<string, string>),
  };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(email: string, senha: string) {
  const data = await request<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  localStorage.setItem('token', data.accessToken);
}

export async function registrar(email: string, senha: string) {
  const data = await request<{ accessToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  localStorage.setItem('token', data.accessToken);
}

export function logout() {
  localStorage.removeItem('token');
}

export function estaAutenticado(): boolean {
  return !!token();
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

export function listarVagas() {
  return request<Vaga[]>('/vagas');
}

export function criarVaga(dto: {
  titulo: string;
  empresa: string;
  descricao: string;
  fonte?: string;
}) {
  return request<Vaga>('/vagas', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function gerarCv(vagaId: string) {
  return request<{ jobId: string }>(`/vagas/${vagaId}/gerar-cv`, {
    method: 'POST',
  });
}

export function getCurriculo(id: string) {
  return request<Curriculo>(`/curriculos/${id}`);
}

export function editarCurriculo(id: string, dto: { markdown: string; rotulo?: string }) {
  return request<Curriculo>(`/curriculos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export function listarCurriculos(vagaId: string) {
  return request<CurriculoResumo[]>(`/vagas/${vagaId}/curriculos`);
}

export function getDashboard() {
  return request<DashboardItem[]>('/dashboard');
}

export function importarBancoVagas(itens: ItemImportacao[]) {
  return request<{ loteId: string; total: number }>('/banco-vagas/import', {
    method: 'POST',
    body: JSON.stringify({ itens }),
  });
}

export function listarBancoVagas() {
  return request<BancoVaga[]>('/banco-vagas');
}

export function ativarBancoVaga(id: string) {
  return request<Vaga>(`/banco-vagas/${id}/ativar`, { method: 'POST' });
}

export function getLote(id: string) {
  return request<LoteStatus>(`/lotes/${id}`);
}

export function criarCandidatura(vagaId: string, curriculoId?: string) {
  return request<Candidatura>('/candidaturas', {
    method: 'POST',
    body: JSON.stringify({ vagaId, curriculoId }),
  });
}

export function listarCandidaturas() {
  return request<Candidatura[]>('/candidaturas');
}

export function atualizarCandidatura(
  id: string,
  dto: { status?: StatusCandidatura; notas?: string; curriculoId?: string | null },
) {
  return request<Candidatura>(`/candidaturas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export interface ContextoStatus {
  documentos: number;
  ultimaIndexacao: string | null;
  porOrigem?: { perfil: number; candidatura: number; nota: number };
  disponivel?: boolean;
}

export function getContextoStatus() {
  return request<ContextoStatus>('/contexto/status');
}

export function reindexarContexto() {
  return request<{ loteId: string; total: number }>('/contexto/reindexar', {
    method: 'POST',
  });
}

export async function uploadContexto(arquivos: File[]) {
  const form = new FormData();
  for (const a of arquivos) form.append('arquivos', a);
  const t = token();
  const res = await fetch(`${API_URL}/contexto/upload`, {
    method: 'POST',
    headers: t ? { Authorization: `Bearer ${t}` } : {},
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `erro ${res.status}`);
  }
  return res.json() as Promise<{ loteId: string; total: number }>;
}

export async function baixarArquivo(url: string, nomeArquivo: string) {
  const t = token();
  const res = await fetch(`${API_URL}${url}`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  if (!res.ok) throw new Error(`erro ${res.status}`);
  const blob = await res.blob();
  if (blob.size === 0) throw new Error('o arquivo baixado está vazio');
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = nomeArquivo;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

export type PrioridadeOportunidade = 'BAIXA' | 'MEDIA' | 'ALTA';
export type ApresentacaoOportunidade = 'ENTRADA' | 'ATIVA' | 'ENCERRADA';
export type EtapaPipeline =
  | 'PREPARACAO'
  | 'INSCRITA'
  | 'EM_PROCESSO'
  | 'ENTREVISTA'
  | 'OFERTA'
  | 'ENCERRADAS';
export type DestinoTransicao =
  | 'PREPARACAO'
  | 'INSCRITA'
  | 'EM_PROCESSO'
  | 'ENTREVISTA'
  | 'OFERTA'
  | 'REJEITADA'
  | 'DESISTIU'
  | 'ARQUIVADA'
  | 'REABRIR';
export type TipoAcaoOportunidade =
  | 'REVISAR_VAGA'
  | 'GERAR_CURRICULO'
  | 'ENVIAR_CANDIDATURA'
  | 'FAZER_FOLLOW_UP'
  | 'PREPARAR_ENTREVISTA'
  | 'PARTICIPAR_ENTREVISTA'
  | 'ENVIAR_MATERIAL'
  | 'OUTRO';
export type StatusGeracaoCurriculo =
  | 'PENDENTE'
  | 'ANALISANDO'
  | 'GERANDO'
  | 'VALIDANDO'
  | 'CONCLUIDA'
  | 'ERRO';
export type PipelineModo = 'kanban' | 'canvas' | 'grafo';

export interface ProximoPasso {
  id: string;
  titulo: string;
  tipo?: TipoAcaoOportunidade | string;
  principal?: boolean;
  venceEm: string | null;
  lembrarEm?: string | null;
}

export interface OportunidadeItem {
  tipo: 'ENTRADA' | 'OPORTUNIDADE';
  id: string;
  titulo: string;
  empresa: string;
  categoria: string | null;
  nivel: string | null;
  prioridade: PrioridadeOportunidade | null;
  etapa: EtapaPipeline | null;
  apresentacao: ApresentacaoOportunidade;
  curriculoVinculado: { id: string; rotulo: string; score: number | null } | null;
  score: number | null;
  proximoPasso: ProximoPasso | null;
  ultimaAtividade: string;
  origem: string;
  keywords: Keyword[];
  descricao?: string;
  fonte?: string | null;
  statusCandidatura?: StatusCandidatura | null;
  arquivadaEm?: string | null;
}

export interface EventoOportunidade {
  id: string;
  vagaId: string;
  tipo: string;
  origem: string;
  descricao: string;
  dados: Record<string, unknown>;
  ocorridoEm: string;
}

export interface AcaoOportunidade extends ProximoPasso {
  vagaId?: string;
  candidaturaId?: string | null;
  concluidaEm?: string | null;
  canceladaEm?: string | null;
}

export interface CandidaturaWorkspace {
  id: string;
  status: StatusCandidatura;
  notas: string;
  principal: boolean;
  enviadaEm: string | null;
  encerradaEm: string | null;
  motivoEncerramento: string | null;
  curriculoId: string | null;
  vinculo: {
    curriculoId: string | null;
    rotulo?: string;
    score?: number | null;
    situacao: string;
  };
}

export interface WorkspaceOportunidade {
  oportunidade: OportunidadeItem;
  candidatura: CandidaturaWorkspace | null;
  curriculos: { id: string; rotulo: string; score: number | null; geradoEm: string }[];
  acaoPrincipal: AcaoOportunidade | null;
  acoes: AcaoOportunidade[];
  timeline: EventoOportunidade[];
}

export interface HojeAcao {
  id: string;
  vagaId: string;
  titulo: string;
  tipo: string;
  principal: boolean;
  venceEm: string | null;
  lembrarEm: string | null;
  quando: string;
  oportunidade: { id: string; titulo: string; empresa: string };
}

export interface HojeResposta {
  fusoHorario: string;
  inicioDia: string;
  fimDia: string;
  atrasadas: HojeAcao[];
  hoje: HojeAcao[];
  proximosDias: HojeAcao[];
  semProximoPasso: { id: string; titulo: string; empresa: string }[];
  atividadeRecente: {
    id: string;
    vagaId: string;
    titulo: string;
    empresa: string;
    tipo: string;
    descricao: string;
    ocorridoEm: string;
  }[];
  resumoAts: { curriculos: number; comScore: number; media: number | null };
  serieTemporal: {
    inicio: string;
    fim: string;
    periodoDias: 7 | 30 | 90;
    pontos: {
      data: string;
      oportunidadesCriadas: number;
      acoesConcluidas: number;
      curriculosGerados: number;
      scoreMedio: number | null;
    }[];
  };
}

export interface PipelineItem {
  id: string;
  titulo: string;
  empresa: string;
  categoria: string | null;
  nivel: string | null;
  prioridade: PrioridadeOportunidade;
  apresentacao: ApresentacaoOportunidade;
  etapa: EtapaPipeline;
  statusCandidatura: StatusCandidatura | null;
  arquivadaEm: string | null;
  score: number | null;
  curriculo: { id: string; rotulo: string; score: number | null } | null;
  proximoPasso: ProximoPasso | null;
  ultimaAtividade: string;
  keywords: Keyword[];
}

export interface PipelineFiltros {
  busca?: string;
  apresentacao?: string;
  statusCandidatura?: string;
  categoria?: string;
  nivel?: string;
  empresa?: string;
  prioridade?: string;
  comCurriculo?: string;
  scoreMinimo?: string;
  prazo?: string;
  atividadeDesde?: string;
  ordenarPor?: string;
}

export interface CanvasLayout {
  revisao: number;
  viewport: { x: number; y: number; zoom: number };
  posicoes: { vagaId: string; x: number; y: number }[];
}

export interface GrafoResposta {
  schemaVersion: string;
  nodes: { id: string; tipo: string; rotulo: string }[];
  edges: { id: string; origem: string; destino: string; tipo: string }[];
  facets: {
    empresas: string[];
    categorias: string[];
    niveis: string[];
    skills: string[];
  };
}

export interface GeracaoCurriculo {
  id: string;
  vagaId: string;
  status: StatusGeracaoCurriculo;
  erro: string | null;
  curriculoId: string | null;
  etapas?: {
    analiseInicial: AtsAnalysis | null;
    reescrita: boolean;
    analiseFinal: AtsAnalysis | null;
    degradacao: string | null;
  };
}

export interface CurriculoGlobal {
  id: string;
  rotulo: string;
  score: number | null;
  breakdown: ScoreBreakdown | null;
  analiseInicial: AtsAnalysis | null;
  analiseFinal: AtsAnalysis | null;
  degradacao: string | null;
  geradoEm: string;
  vagaId: string;
  categoria: string | null;
  nivel: string | null;
  oportunidade: { id: string; titulo: string; empresa: string };
  vinculo: { candidaturaId: string; principal: boolean; status: string } | null;
  downloadDocxUrl: string | null;
  downloadPdfUrl: string | null;
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  limit: number | null;
  offset: number;
}

export interface Taxonomia {
  categorias: string[];
  niveis: string[];
}

export interface PreferenciasUsuario {
  usuarioId: string;
  fusoHorario: string;
  canvasX: number;
  canvasY: number;
  canvasZoom: number;
  canvasRevisao: number;
}

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

export function patchPreferencias(dto: { fusoHorario?: string }) {
  return request<PreferenciasUsuario>('/preferencias', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export function getTaxonomia() {
  return request<Taxonomia>('/taxonomia');
}

export function listarOportunidades(params: {
  visao?: string;
  busca?: string;
  categoria?: string;
  nivel?: string;
  prioridade?: string;
  ordenarPor?: string;
  limit?: number;
  offset?: number;
}) {
  return request<Pagina<OportunidadeItem>>(`/oportunidades${query(params)}`);
}

export function criarOportunidade(dto: {
  titulo: string;
  empresa: string;
  descricao: string;
  fonte?: string;
}) {
  return request<OportunidadeItem>('/oportunidades', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function importarOportunidades(itens: ItemImportacao[]) {
  return request<{ loteId: string; total: number }>('/oportunidades/importar', {
    method: 'POST',
    body: JSON.stringify({ itens }),
  });
}

export function ativarEntrada(id: string) {
  return request<OportunidadeItem>(`/oportunidades/entradas/${id}/ativar`, {
    method: 'POST',
  });
}

export function getWorkspace(id: string) {
  return request<WorkspaceOportunidade>(`/oportunidades/${id}/workspace`);
}

export function patchOportunidade(
  id: string,
  dto: { prioridade?: PrioridadeOportunidade; arquivar?: boolean },
) {
  return request<OportunidadeItem>(`/oportunidades/${id}`, {
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
  dto: {
    titulo: string;
    tipo: TipoAcaoOportunidade;
    principal?: boolean;
    venceEm?: string;
    lembrarEm?: string;
  },
) {
  return request<AcaoOportunidade>(`/oportunidades/${vagaId}/acoes`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function patchAcao(
  id: string,
  dto: { venceEm?: string | null; lembrarEm?: string | null; principal?: boolean; titulo?: string },
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
  return request<{ itens: EventoOportunidade[]; proximoCursor: string | null }>(
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
  return request<{ jobId: string }>(`/oportunidades/${id}/gerar-cv`, {
    method: 'POST',
  });
}

export function getGeracao(jobId: string) {
  return request<GeracaoCurriculo>(`/geracoes-curriculo/${jobId}`);
}

export function listarCurriculosGlobal(params: {
  vagaId?: string;
  scoreMinimo?: string;
  vinculado?: string;
  categoria?: string;
  nivel?: string;
  ordenarPor?: string;
  de?: string;
  ate?: string;
  limit?: number;
  offset?: number;
}) {
  return request<Pagina<CurriculoGlobal>>(`/curriculos${query(params)}`);
}

export function getPipeline(filtros: PipelineFiltros) {
  return request<PipelineItem[]>(`/pipeline${query(filtros)}`);
}

export function getPipelineCanvas() {
  return request<CanvasLayout>('/pipeline/canvas');
}

export function putPipelineCanvas(dto: {
  revisaoBase: number;
  viewport: { x: number; y: number; zoom: number };
  posicoes: { vagaId: string; x: number; y: number }[];
}) {
  return request<CanvasLayout>('/pipeline/canvas', {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export function getPipelineGrafo(filtros: PipelineFiltros) {
  return request<GrafoResposta>(`/pipeline/grafo${query(filtros)}`);
}

export function gerarCvAlias(vagaId: string) {
  return request<{ jobId: string }>(`/vagas/${vagaId}/gerar-cv`, { method: 'POST' });
}

export type ModoCopiloto = 'assistido' | 'autopiloto';

export interface ConfirmacaoCopiloto {
  callId: string;
  decisao: 'confirmar' | 'recusar';
  ajustes?: Record<string, unknown>;
}

export interface CopilotoChatBody {
  conversaId?: string;
  modo?: ModoCopiloto;
  oportunidadeId?: string;
  mensagem?: string;
  confirmacao?: ConfirmacaoCopiloto;
}

export interface MensagemCopilotoPersistida {
  papel: 'user' | 'assistant' | 'tool' | 'evento';
  conteudo: string;
  tool?: string | null;
  dados?: {
    callId?: string;
    efeito?: 'leitura' | 'escrita' | 'entrega_externa';
    args?: Record<string, unknown>;
    ok?: boolean;
    resultado?: unknown;
    erro?: string;
    entrega?: { tipo: string; titulo: string; texto: string; destino?: string };
    evento?: 'erro';
    escopo?: string;
  };
}

export interface ConversaCopilotoResumo {
  id: string;
  modo: ModoCopiloto;
  oportunidadeId: string | null;
  titulo: string;
  ultimaMensagem: string;
  totalMensagens: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ConversaCopilotoDetalhe {
  id: string;
  modo: ModoCopiloto;
  oportunidadeId: string | null;
  mensagens: MensagemCopilotoPersistida[];
  pendencia: unknown | null;
  criadoEm: string;
  atualizadoEm: string;
}

export function listarConversasCopiloto(oportunidadeId?: string) {
  return request<ConversaCopilotoResumo[]>(
    `/copiloto/conversas${query({ oportunidadeId })}`,
  );
}

export function buscarConversaCopiloto(id: string) {
  return request<ConversaCopilotoDetalhe>(`/copiloto/conversas/${id}`);
}

export type EfeitoTool = 'leitura' | 'escrita';

export type CopilotoEvento =
  | { evento: 'token'; data: { delta: string } }
  | {
      evento: 'tool_call';
      data: {
        callId: string;
        tool: string;
        efeito: EfeitoTool;
        args: Record<string, unknown>;
        exigeConfirmacao: boolean;
      };
    }
  | {
      evento: 'confirmacao';
      data: { callId: string; tool: string; resumo: string; args: Record<string, unknown> };
    }
  | {
      evento: 'tool_resultado';
      data: {
        callId: string;
        tool: string;
        ok: boolean;
        resultado: unknown;
        erro: { mensagem: string; recuperavel: boolean } | null;
      };
    }
  | {
      evento: 'entrega_externa';
      data: { tipo: string; titulo: string; texto: string; destino?: string };
    }
  | { evento: 'erro'; data: { escopo: string; mensagem: string; recuperavel: boolean } }
  | { evento: 'fim_turno'; data: { motivo: string; conversaId: string } };

function parseFrameCopiloto(frame: string): CopilotoEvento | null {
  let evento = '';
  let data = '';
  for (const linha of frame.split('\n')) {
    const l = linha.replace(/\r$/, '');
    if (l.startsWith('event:')) evento = l.slice(6).trim();
    else if (l.startsWith('data:')) data += l.slice(5).trim();
  }
  if (!evento || !data) return null;
  try {
    return { evento, data: JSON.parse(data) } as CopilotoEvento;
  } catch {
    return null;
  }
}

export async function streamCopiloto(
  body: CopilotoChatBody,
  onEvento: (ev: CopilotoEvento) => void,
  signal?: AbortSignal,
): Promise<void> {
  const t = token();
  const res = await fetch(`${API_URL}/copiloto/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.message ?? `erro ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep = buffer.indexOf('\n\n');
    while (sep !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const ev = parseFrameCopiloto(frame);
      if (ev) onEvento(ev);
      sep = buffer.indexOf('\n\n');
    }
  }
}
