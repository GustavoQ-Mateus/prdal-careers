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

export interface PerfilMestre {
  nome: string;
  contato: Record<string, string>;
  resumo: string;
  experiencias: string[];
  formacao: string[];
  skills: string[];
}

export interface ScoreBreakdown {
  keywordMatch: number;
  densidade: number;
  secoes: number;
  faltando: string[];
}

export interface Curriculo {
  id: string;
  vagaId: string;
  rotulo: string;
  markdown: string;
  score: number;
  breakdown: ScoreBreakdown;
  geradoEm: string;
  downloadDocxUrl: string | null;
  downloadPdfUrl: string | null;
}

export interface CurriculoResumo {
  id: string;
  rotulo: string;
  score: number;
  breakdown: ScoreBreakdown;
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
  dto: { status?: StatusCandidatura; notas?: string },
) {
  return request<Candidatura>(`/candidaturas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function baixarArquivo(url: string, nomeArquivo: string) {
  const t = token();
  const res = await fetch(`${API_URL}${url}`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  if (!res.ok) throw new Error(`erro ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(objectUrl);
}
