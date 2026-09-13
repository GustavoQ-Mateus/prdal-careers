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
    <form
      onSubmit={enviar}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}
    >
      <h2>{modo === 'login' ? 'Entrar' : 'Criar conta'}</h2>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
        minLength={6}
      />
      {erro && <p style={{ color: 'crimson' }}>{erro}</p>}
      <button type="submit">{modo === 'login' ? 'Entrar' : 'Criar conta'}</button>
      <button type="button" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? 'Criar uma conta' : 'Ja tenho conta'}
      </button>
    </form>
  );
}
