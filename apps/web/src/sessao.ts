const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ROTAS_SEM_RENOVACAO = new Set(['/auth/login', '/auth/register', '/auth/refresh']);
const ROTAS_SEM_CSRF = ROTAS_SEM_RENOVACAO;
const TRAVA_REFRESH = 'prdal-refresh';

export interface ErroApi {
  erro?: { codigo?: string; mensagem?: string; requestId?: string | null };
  message?: string | string[];
}

export function mensagemDeErro(corpo: unknown, status: number): string {
  const dados = (corpo ?? {}) as ErroApi;
  const mensagem = dados.erro?.mensagem ?? dados.message;
  if (Array.isArray(mensagem)) return mensagem.join('; ');
  return mensagem || `erro ${status}`;
}

export class ErroRespostaApi extends Error {
  readonly codigo?: string;
  readonly status: number;

  constructor(corpo: unknown, status: number) {
    super(mensagemDeErro(corpo, status));
    this.name = 'ErroRespostaApi';
    this.codigo = (corpo as ErroApi | null)?.erro?.codigo;
    this.status = status;
  }
}

export function lerCookie(nome: string): string | null {
  if (typeof document === 'undefined') return null;
  for (const parte of document.cookie.split(';')) {
    const [chave, ...valor] = parte.trim().split('=');
    if (chave === nome) return decodeURIComponent(valor.join('='));
  }
  return null;
}

export function limparTokenLegado(): void {
  try {
    localStorage.removeItem('token');
  } catch {
    return;
  }
}

export function criarCliente(base: string, aoExpirar: () => void) {
  let csrf: string | null = null;
  let renovando: Promise<boolean> | null = null;
  let buscandoCsrf: Promise<void> | null = null;

  function lembrarCsrf(corpo: unknown) {
    const token = (corpo as { csrfToken?: unknown } | null)?.csrfToken;
    if (typeof token === 'string' && token) csrf = token;
  }

  function tokenCsrf(): string | null {
    return csrf ?? lerCookie('prdal_csrf');
  }

  function bruto(path: string, init: RequestInit): Promise<Response> {
    const metodo = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    const token = tokenCsrf();
    if (!METODOS_SEGUROS.has(metodo) && token) headers.set('X-CSRF-Token', token);
    return fetch(`${base}${path}`, { ...init, headers, credentials: 'include' });
  }

  async function pedirRefresh(): Promise<boolean> {
    const res = await bruto('/auth/refresh', { method: 'POST' });
    if (res.status === 409) {
      csrf = null;
      return true;
    }
    if (res.ok) lembrarCsrf(await res.json().catch(() => null));
    return res.ok;
  }

  async function refreshEntreAbas(): Promise<boolean> {
    const travas = typeof navigator === 'undefined' ? undefined : navigator.locks;
    return travas?.request ? await travas.request(TRAVA_REFRESH, pedirRefresh) : pedirRefresh();
  }

  function renovar(): Promise<boolean> {
    renovando ??= refreshEntreAbas()
      .catch(() => false)
      .finally(() => {
        renovando = null;
      });
    return renovando;
  }

  function garantirCsrf(): Promise<void> {
    buscandoCsrf ??= bruto('/auth/sessao', {})
      .then(async (res) => {
        if (res.ok) lembrarCsrf(await res.json().catch(() => null));
      })
      .catch(() => undefined)
      .finally(() => {
        buscandoCsrf = null;
      });
    return buscandoCsrf;
  }

  async function chamar(path: string, init: RequestInit = {}, opcoes: { expirar?: boolean } = {}): Promise<Response> {
    const metodo = (init.method ?? 'GET').toUpperCase();
    if (!METODOS_SEGUROS.has(metodo) && !ROTAS_SEM_CSRF.has(path) && !tokenCsrf()) await garantirCsrf();
    const res = await bruto(path, init);
    if (res.status !== 401 || ROTAS_SEM_RENOVACAO.has(path)) return res;
    if (await renovar()) {
      const repetida = await bruto(path, init);
      if (repetida.status !== 401) return repetida;
    }
    if (opcoes.expirar !== false) aoExpirar();
    return res;
  }

  async function iniciar(): Promise<boolean> {
    limparTokenLegado();
    const res = await chamar('/auth/sessao', {}, { expirar: false }).catch(() => null);
    if (!res?.ok) return false;
    lembrarCsrf(await res.json().catch(() => null));
    return true;
  }

  async function entrar(email: string, senha: string): Promise<void> {
    const res = await chamar('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    const corpo = await res.json().catch(() => ({}));
    if (!res.ok) throw new ErroRespostaApi(corpo, res.status);
    lembrarCsrf(corpo);
  }

  async function sair(): Promise<void> {
    await chamar('/auth/logout', { method: 'POST' }, { expirar: false }).catch(() => null);
    csrf = null;
  }

  return { chamar, iniciar, entrar, sair, renovar };
}
