import { useState } from 'react';
import { login, registrar } from './api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function mensagemAmigavel(bruto: string, modo: 'login' | 'registro'): string {
  const t = bruto.toLowerCase();
  if (t.includes('econnrefused') || t.includes('failed to fetch') || t.includes('network') || t.includes('erro 5')) {
    return 'Não foi possível conectar ao servidor agora. Tente novamente em instantes.';
  }
  if (t.includes('409') || t.includes('existe') || t.includes('conflict')) {
    return 'Já existe uma conta com esse e-mail. Tente entrar.';
  }
  if (t.includes('401') || t.includes('credenc') || t.includes('inval') || t.includes('senha')) {
    return 'E-mail ou senha incorretos.';
  }
  return modo === 'login'
    ? 'Não foi possível entrar. Confira os dados e tente de novo.'
    : 'Não foi possível criar a conta. Tente de novo.';
}

export function AuthForm({ onAuth }: { onAuth: () => void }) {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const login_ = modo === 'login';

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      if (login_) await login(email, senha);
      else await registrar(email, senha);
      onAuth();
    } catch (err) {
      setErro(mensagemAmigavel((err as Error).message, modo));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="w-full">
      <span className="text-label uppercase text-muted">{login_ ? 'Acesso' : 'Nova conta'}</span>
      <h1 className="mt-2 text-[30px] font-bold leading-tight text-ink">
        {login_ ? 'Bem-vindo de volta.' : 'Crie sua conta.'}
      </h1>
      <p className="mt-2 text-[16px] text-muted">
        {login_
          ? 'Entre para gerar e analisar seus currículos por vaga.'
          : 'Comece a gerar currículos tailored e medir o score ATS.'}
      </p>

      <form onSubmit={enviar} className="mt-7 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-email">E-mail de acesso</Label>
          <Input className="h-12 text-[16px]"
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-senha">Senha</Label>
          <Input className="h-12 text-[16px]"
            id="auth-senha"
            type="password"
            autoComplete={login_ ? 'current-password' : 'new-password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {erro && (
          <div
            className="rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad"
            role="alert"
          >
            {erro}
          </div>
        )}

        <Button variant="accent" type="submit" className="mt-1 h-12 w-full text-[16px]" disabled={enviando}>
          {enviando ? 'Aguarde...' : login_ ? 'Acessar' : 'Criar conta'}
        </Button>
        <button
          type="button"
          onClick={() => {
            setModo(login_ ? 'registro' : 'login');
            setErro(null);
          }}
          className="rounded-control text-[13px] font-medium text-accent transition-colors hover:text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {login_ ? 'Criar uma conta' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  );
}
