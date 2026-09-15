import { useState } from 'react';
import { login, registrar } from './api';

export function AuthForm({ onAuth }: { onAuth: () => void }) {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      if (modo === 'login') await login(email, senha);
      else await registrar(email, senha);
      onAuth();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const login_ = modo === 'login';

  return (
    <div className="auth-center">
      <span className="auth-eyebrow">{login_ ? 'Acesso' : 'Nova conta'}</span>
      <h1 className="auth-title">{login_ ? 'Bem-vindo de volta.' : 'Crie sua conta.'}</h1>
      <p className="auth-sub">
        {login_
          ? 'Entre para gerar e analisar seus currículos por vaga.'
          : 'Comece a gerar currículos tailored e medir o score ATS.'}
      </p>
      <form onSubmit={enviar} className="auth-form">
        <label className="field">
          <span className="label">E-mail de acesso</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span className="label">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
          />
        </label>
        {erro && <span className="error" role="alert">{erro}</span>}
        <button type="submit" className="primary btn-block" disabled={enviando}>
          {enviando ? 'Aguarde...' : login_ ? 'Acessar' : 'Criar conta'}
        </button>
        <button type="button" className="link-btn" onClick={() => setModo(login_ ? 'registro' : 'login')}>
          {login_ ? 'Criar uma conta' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  );
}
