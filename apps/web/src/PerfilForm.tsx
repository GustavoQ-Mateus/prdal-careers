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
        experiencias: experienciasTexto.split('\n').map((l) => l.trim()).filter(Boolean),
        formacao: formacaoTexto.split('\n').map((l) => l.trim()).filter(Boolean),
        skills: skillsTexto.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const salvo = await salvarPerfil(dto);
      setPerfil(salvo);
      setMensagem('Perfil salvo.');
    } catch (err) {
      setMensagem((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Perfil-mestre</h2>
        <span className="label">fonte da verdade do currículo</span>
      </div>
      <form onSubmit={salvar} className="panel-body form-grid">
        <div className="field">
          <span className="label">Nome</span>
          <input value={perfil.nome} onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} required />
        </div>
        <div className="two-col">
          <div className="field">
            <span className="label">E-mail de contato</span>
            <input
              value={perfil.contato.email ?? ''}
              onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, email: e.target.value } })}
            />
          </div>
          <div className="field">
            <span className="label">Telefone</span>
            <input
              value={perfil.contato.telefone ?? ''}
              onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, telefone: e.target.value } })}
            />
          </div>
        </div>
        <div className="field">
          <span className="label">LinkedIn</span>
          <input
            value={perfil.contato.linkedin ?? ''}
            onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, linkedin: e.target.value } })}
          />
        </div>
        <div className="field">
          <span className="label">Resumo</span>
          <textarea value={perfil.resumo} onChange={(e) => setPerfil({ ...perfil, resumo: e.target.value })} rows={3} />
        </div>
        <div className="field">
          <span className="label">Experiências (uma por linha)</span>
          <textarea value={experienciasTexto} onChange={(e) => setExperienciasTexto(e.target.value)} rows={5} />
        </div>
        <div className="field">
          <span className="label">Formação (uma por linha)</span>
          <textarea value={formacaoTexto} onChange={(e) => setFormacaoTexto(e.target.value)} rows={3} />
        </div>
        <div className="field">
          <span className="label">Skills (separadas por vírgula)</span>
          <input value={skillsTexto} onChange={(e) => setSkillsTexto(e.target.value)} />
        </div>
        <div className="row">
          <button type="submit" className="primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar perfil'}
          </button>
          {mensagem && <span className="notice">{mensagem}</span>}
        </div>
      </form>
    </section>
  );
}
