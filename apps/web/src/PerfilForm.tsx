import { useEffect, useState } from 'react';
import { getPerfil, salvarPerfil, type PerfilMestre } from './api';

const VAZIO: PerfilMestre = {
  nome: '',
  contato: { email: '', telefone: '', linkedin: '' },
  resumo: '',
  experiencias: [],
  formacao: [],
  skills: [],
};

export function PerfilForm() {
  const [perfil, setPerfil] = useState<PerfilMestre>(VAZIO);
  const [experienciasTexto, setExperienciasTexto] = useState('');
  const [formacaoTexto, setFormacaoTexto] = useState('');
  const [skillsTexto, setSkillsTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    getPerfil().then((p) => {
      if (!p) return;
      setPerfil(p);
      setExperienciasTexto(p.experiencias.join('\n'));
      setFormacaoTexto(p.formacao.join('\n'));
      setSkillsTexto(p.skills.join(', '));
    });
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    try {
      const dto: PerfilMestre = {
        ...perfil,
        experiencias: experienciasTexto
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        formacao: formacaoTexto
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        skills: skillsTexto
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const salvo = await salvarPerfil(dto);
      setPerfil(salvo);
      setMensagem('Perfil salvo');
    } catch (err) {
      setMensagem((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
      <h2>Perfil-mestre</h2>
      <input
        placeholder="nome"
        value={perfil.nome}
        onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
        required
      />
      <input
        placeholder="email de contato"
        value={perfil.contato.email ?? ''}
        onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, email: e.target.value } })}
      />
      <input
        placeholder="telefone"
        value={perfil.contato.telefone ?? ''}
        onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, telefone: e.target.value } })}
      />
      <input
        placeholder="linkedin"
        value={perfil.contato.linkedin ?? ''}
        onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, linkedin: e.target.value } })}
      />
      <textarea
        placeholder="resumo"
        value={perfil.resumo}
        onChange={(e) => setPerfil({ ...perfil, resumo: e.target.value })}
        rows={3}
      />
      <textarea
        placeholder="experiencias, uma por linha"
        value={experienciasTexto}
        onChange={(e) => setExperienciasTexto(e.target.value)}
        rows={4}
      />
      <textarea
        placeholder="formacao, uma por linha"
        value={formacaoTexto}
        onChange={(e) => setFormacaoTexto(e.target.value)}
        rows={2}
      />
      <input
        placeholder="skills, separadas por virgula"
        value={skillsTexto}
        onChange={(e) => setSkillsTexto(e.target.value)}
      />
      <button type="submit" disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar perfil'}
      </button>
      {mensagem && <p>{mensagem}</p>}
    </form>
  );
}
