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
  criadoEm: string;
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
  markdown: string;
  score: number;
  breakdown: ScoreBreakdown;
  geradoEm: string;
  downloadDocxUrl: string | null;
  downloadPdfUrl: string | null;
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
