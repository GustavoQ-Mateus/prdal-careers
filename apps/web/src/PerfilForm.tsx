import { useEffect, useState } from 'react';
import {
  getPerfil,
  getPreferencias,
  patchPreferencias,
  reindexarContexto,
  salvarPerfil,
  type PerfilMestre,
} from './api';

const VAZIO: PerfilMestre = {
  nome: '',
  contato: { email: '', telefone: '', linkedin: '' },
  resumo: '',
  experiencias: [],
  formacao: [],
  skills: [],
};

type Secao = 'identidade' | 'contato' | 'resumo' | 'experiencias' | 'formacao' | 'skills' | 'fuso' | null;

export function PerfilForm() {
  const [perfil, setPerfil] = useState<PerfilMestre>(VAZIO);
  const [experienciasTexto, setExperienciasTexto] = useState('');
  const [formacaoTexto, setFormacaoTexto] = useState('');
  const [skillsTexto, setSkillsTexto] = useState('');
  const [fuso, setFuso] = useState('');
  const [editando, setEditando] = useState<Secao>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [desatualizado, setDesatualizado] = useState(false);

  useEffect(() => {
    getPerfil().then((p) => {
      if (!p) return;
      setPerfil(p);
      setExperienciasTexto(p.experiencias.join('\n'));
      setFormacaoTexto(p.formacao.join('\n'));
      setSkillsTexto(p.skills.join(', '));
    });
    getPreferencias().then((p) => setFuso(p.fusoHorario));
  }, []);

  async function salvarSecao() {
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
      setEditando(null);
      setDesatualizado(true);
      setMensagem('Secao atualizada. O indice pode estar desatualizado.');
    } catch (err) {
      setMensagem((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function salvarFuso() {
    setSalvando(true);
    try {
      const pref = await patchPreferencias({ fusoHorario: fuso });
      setFuso(pref.fusoHorario);
      setEditando(null);
      setMensagem('Fuso atualizado.');
    } catch (err) {
      setMensagem((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="stack">
      {desatualizado && (
        <div className="notice" role="status">
          O indice de conhecimento pode estar desatualizado.
          <button className="accent" onClick={() => reindexarContexto().then(() => setDesatualizado(false))}>
            Reindexar
          </button>
        </div>
      )}
      {mensagem && <div className="notice" role="status">{mensagem}</div>}

      <SecaoLeitura
        titulo="Identidade"
        editando={editando === 'identidade'}
        onEditar={() => setEditando('identidade')}
        onCancelar={() => setEditando(null)}
        onSalvar={salvarSecao}
        salvando={salvando}
      >
        {editando === 'identidade' ? (
          <label className="field">
            <span className="label">Nome</span>
            <input value={perfil.nome} onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} />
          </label>
        ) : (
          <p>{perfil.nome || 'Nao informado'}</p>
        )}
      </SecaoLeitura>

      <SecaoLeitura
        titulo="Contato"
        editando={editando === 'contato'}
        onEditar={() => setEditando('contato')}
        onCancelar={() => setEditando(null)}
        onSalvar={salvarSecao}
        salvando={salvando}
      >
        {editando === 'contato' ? (
          <div className="form-grid">
            <label className="field">
              <span className="label">E-mail</span>
              <input
                value={perfil.contato.email ?? ''}
                onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, email: e.target.value } })}
              />
            </label>
            <label className="field">
              <span className="label">Telefone</span>
              <input
                value={perfil.contato.telefone ?? ''}
                onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, telefone: e.target.value } })}
              />
            </label>
            <label className="field">
              <span className="label">LinkedIn</span>
              <input
                value={perfil.contato.linkedin ?? ''}
                onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, linkedin: e.target.value } })}
              />
            </label>
          </div>
        ) : (
          <p>{perfil.contato.email || perfil.contato.telefone || 'Nao informado'}</p>
        )}
      </SecaoLeitura>

      <SecaoLeitura
        titulo="Resumo"
        editando={editando === 'resumo'}
        onEditar={() => setEditando('resumo')}
        onCancelar={() => setEditando(null)}
        onSalvar={salvarSecao}
        salvando={salvando}
      >
        {editando === 'resumo' ? (
          <textarea value={perfil.resumo} onChange={(e) => setPerfil({ ...perfil, resumo: e.target.value })} rows={5} />
        ) : (
          <p className="prose">{perfil.resumo || 'Nao informado'}</p>
        )}
      </SecaoLeitura>

      <SecaoLeitura
        titulo="Experiencias"
        editando={editando === 'experiencias'}
        onEditar={() => setEditando('experiencias')}
        onCancelar={() => setEditando(null)}
        onSalvar={salvarSecao}
        salvando={salvando}
      >
        {editando === 'experiencias' ? (
          <textarea value={experienciasTexto} onChange={(e) => setExperienciasTexto(e.target.value)} rows={8} />
        ) : (
          <ul>{perfil.experiencias.map((e) => <li key={e}>{e}</li>)}</ul>
        )}
      </SecaoLeitura>

      <SecaoLeitura
        titulo="Formacao"
        editando={editando === 'formacao'}
        onEditar={() => setEditando('formacao')}
        onCancelar={() => setEditando(null)}
        onSalvar={salvarSecao}
        salvando={salvando}
      >
        {editando === 'formacao' ? (
          <textarea value={formacaoTexto} onChange={(e) => setFormacaoTexto(e.target.value)} rows={5} />
        ) : (
          <ul>{perfil.formacao.map((e) => <li key={e}>{e}</li>)}</ul>
        )}
      </SecaoLeitura>

      <SecaoLeitura
        titulo="Skills"
        editando={editando === 'skills'}
        onEditar={() => setEditando('skills')}
        onCancelar={() => setEditando(null)}
        onSalvar={salvarSecao}
        salvando={salvando}
      >
        {editando === 'skills' ? (
          <input value={skillsTexto} onChange={(e) => setSkillsTexto(e.target.value)} />
        ) : (
          <div className="chip-set">{perfil.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
        )}
      </SecaoLeitura>

      <SecaoLeitura
        titulo="Fuso horario"
        editando={editando === 'fuso'}
        onEditar={() => setEditando('fuso')}
        onCancelar={() => setEditando(null)}
        onSalvar={salvarFuso}
        salvando={salvando}
      >
        {editando === 'fuso' ? (
          <label className="field">
            <span className="label">IANA</span>
            <input value={fuso} onChange={(e) => setFuso(e.target.value)} />
          </label>
        ) : (
          <p>{fuso || Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        )}
      </SecaoLeitura>
    </div>
  );
}

function SecaoLeitura({
  titulo,
  editando,
  onEditar,
  onCancelar,
  onSalvar,
  salvando,
  children,
}: {
  titulo: string;
  editando: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  onSalvar: () => void;
  salvando: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="region">
      <div className="spread">
        <h3>{titulo}</h3>
        {editando ? (
          <div className="row">
            <button type="button" onClick={onCancelar}>Cancelar</button>
            <button type="button" className="accent" onClick={onSalvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar secao'}
            </button>
          </div>
        ) : (
          <button type="button" onClick={onEditar}>Editar</button>
        )}
      </div>
      {children}
    </section>
  );
}
