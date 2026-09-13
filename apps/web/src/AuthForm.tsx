import { useState } from 'react';
import { login, registrar } from './api';

export function AuthForm({ onAuth }: { onAuth: () => void }) {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      if (modo === 'login') await login(email, senha);
      else await registrar(email, senha);
      onAuth();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{modo === 'login' ? 'Entrar' : 'Criar conta'}</h2>
      </div>
      <form onSubmit={enviar} className="panel-body form-grid">
        <div className="field">
          <span className="label">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <span className="label">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {erro && <span className="error">{erro}</span>}
        <button type="submit" className="primary">
          {modo === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
        <button type="button" className="ghost" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
          {modo === 'login' ? 'Criar uma conta' : 'Ja tenho conta'}
        </button>
      </form>
    </section>
  );
}
