import { useEffect, useState } from 'react';
import {
  getPerfil,
  getPreferencias,
  patchPreferencias,
  reindexarContexto,
  salvarPerfil,
  type PerfilMestre,
} from './api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const VAZIO: PerfilMestre = {
  nome: '',
  contato: { email: '', telefone: '', linkedin: '' },
  resumo: '',
  experiencias: [],
  formacao: [],
  skills: [],
};

type Secao = 'identidade' | 'contato' | 'resumo' | 'experiencias' | 'formacao' | 'skills' | 'fuso';

const TITULO: Record<Secao, string> = {
  identidade: 'Identidade',
  contato: 'Contato',
  resumo: 'Resumo',
  experiencias: 'Experiencias',
  formacao: 'Formacao',
  skills: 'Skills',
  fuso: 'Fuso horario',
};

function Regiao({
  titulo,
  onEditar,
  vazia,
  children,
}: {
  titulo: string;
  onEditar: () => void;
  vazia?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line pb-6 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-section text-ink">{titulo}</h3>
        <Button size="sm" variant="ghost" onClick={onEditar}>
          Editar
        </Button>
      </div>
      <div className="mt-3">
        {vazia ? <p className="text-[14px] text-muted">{vazia}</p> : children}
      </div>
    </section>
  );
}

export function PerfilForm() {
  const [perfil, setPerfil] = useState<PerfilMestre>(VAZIO);
  const [experienciasTexto, setExperienciasTexto] = useState('');
  const [formacaoTexto, setFormacaoTexto] = useState('');
  const [skillsTexto, setSkillsTexto] = useState('');
  const [fuso, setFuso] = useState('');
  const [editando, setEditando] = useState<Secao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [desatualizado, setDesatualizado] = useState(false);
  const [reindexando, setReindexando] = useState(false);

  const [snapshot, setSnapshot] = useState<{
    perfil: PerfilMestre;
    exp: string;
    form: string;
    skills: string;
    fuso: string;
  } | null>(null);

  useEffect(() => {
    getPerfil()
      .then((p) => {
        if (!p) return;
        setPerfil({ ...VAZIO, ...p, contato: { ...VAZIO.contato, ...p.contato } });
        setExperienciasTexto(p.experiencias.join('\n'));
        setFormacaoTexto(p.formacao.join('\n'));
        setSkillsTexto(p.skills.join(', '));
      })
      .catch((err) => setErro((err as Error).message));
    getPreferencias()
      .then((p) => setFuso(p.fusoHorario))
      .catch(() => {});
  }, []);

  function abrir(secao: Secao) {
    setSnapshot({ perfil, exp: experienciasTexto, form: formacaoTexto, skills: skillsTexto, fuso });
    setErro(null);
    setEditando(secao);
  }

  function fechar() {
    if (snapshot) {
      setPerfil(snapshot.perfil);
      setExperienciasTexto(snapshot.exp);
      setFormacaoTexto(snapshot.form);
      setSkillsTexto(snapshot.skills);
      setFuso(snapshot.fuso);
    }
    setEditando(null);
    setErro(null);
  }

  async function salvarSecao() {
    setSalvando(true);
    setErro(null);
    try {
      const dto: PerfilMestre = {
        ...perfil,
        experiencias: experienciasTexto.split('\n').map((l) => l.trim()).filter(Boolean),
        formacao: formacaoTexto.split('\n').map((l) => l.trim()).filter(Boolean),
        skills: skillsTexto.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const salvo = await salvarPerfil(dto);
      setPerfil({ ...VAZIO, ...salvo, contato: { ...VAZIO.contato, ...salvo.contato } });
      setExperienciasTexto(salvo.experiencias.join('\n'));
      setFormacaoTexto(salvo.formacao.join('\n'));
      setSkillsTexto(salvo.skills.join(', '));
      setEditando(null);
      setDesatualizado(true);
      setMensagem('Secao atualizada. O indice de conhecimento pode estar desatualizado.');
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function salvarFuso() {
    setSalvando(true);
    setErro(null);
    try {
      const pref = await patchPreferencias({ fusoHorario: fuso });
      setFuso(pref.fusoHorario);
      setEditando(null);
      setMensagem('Fuso horario atualizado.');
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function reindexar() {
    setReindexando(true);
    setErro(null);
    try {
      await reindexarContexto();
      setDesatualizado(false);
      setMensagem('Reindexacao iniciada.');
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setReindexando(false);
    }
  }

  const fusoAtual = fuso || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="flex flex-col gap-6">
      {desatualizado && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-score-warn/40 bg-ground px-4 py-3"
          role="status"
        >
          <p className="text-[14px] text-ink-2">
            O indice de conhecimento pode estar desatualizado apos a edicao do perfil.
          </p>
          <Button size="sm" variant="secondary" onClick={() => void reindexar()} disabled={reindexando}>
            {reindexando ? 'Reindexando...' : 'Reindexar agora'}
          </Button>
        </div>
      )}
      {mensagem && !desatualizado && (
        <p className="text-[13px] text-muted" role="status">
          {mensagem}
        </p>
      )}

      <div className="flex flex-col gap-6">
        <Regiao
          titulo="Identidade"
          onEditar={() => abrir('identidade')}
          vazia={perfil.nome ? undefined : 'Adicione seu nome. Ele encabeca todo curriculo gerado.'}
        >
          <p className="text-[15px] text-ink">{perfil.nome}</p>
        </Regiao>

        <Regiao
          titulo="Contato"
          onEditar={() => abrir('contato')}
          vazia={
            perfil.contato.email || perfil.contato.telefone || perfil.contato.linkedin
              ? undefined
              : 'Sem contato ainda. E-mail, telefone e LinkedIn entram no cabecalho do curriculo.'
          }
        >
          <div className="flex flex-col gap-1 text-[14px] text-ink-2">
            {perfil.contato.email && <span>{perfil.contato.email}</span>}
            {perfil.contato.telefone && <span>{perfil.contato.telefone}</span>}
            {perfil.contato.linkedin && <span>{perfil.contato.linkedin}</span>}
          </div>
        </Regiao>

        <Regiao
          titulo="Resumo"
          onEditar={() => abrir('resumo')}
          vazia={
            perfil.resumo
              ? undefined
              : 'Sem resumo. Um paragrafo de posicionamento ancora o topo do curriculo.'
          }
        >
          <p className="max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-ink-2">
            {perfil.resumo}
          </p>
        </Regiao>

        <Regiao
          titulo="Experiencias"
          onEditar={() => abrir('experiencias')}
          vazia={
            perfil.experiencias.length === 0
              ? 'Nenhuma experiencia. Elas sao a maior fonte de evidencia para o score ATS.'
              : undefined
          }
        >
          <ul className="flex max-w-2xl flex-col gap-1.5 text-[14px] text-ink-2">
            {perfil.experiencias.map((e) => (
              <li key={e} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-line-strong" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </Regiao>

        <Regiao
          titulo="Formacao"
          onEditar={() => abrir('formacao')}
          vazia={perfil.formacao.length === 0 ? 'Nenhuma formacao registrada.' : undefined}
        >
          <ul className="flex max-w-2xl flex-col gap-1.5 text-[14px] text-ink-2">
            {perfil.formacao.map((e) => (
              <li key={e} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-line-strong" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </Regiao>

        <Regiao
          titulo="Skills"
          onEditar={() => abrir('skills')}
          vazia={
            perfil.skills.length === 0
              ? 'Nenhuma skill. Elas alimentam a correspondencia de keywords da vaga.'
              : undefined
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {perfil.skills.map((s) => (
              <Badge key={s} variant="neutral">
                {s}
              </Badge>
            ))}
          </div>
        </Regiao>

        <Regiao titulo="Fuso horario" onEditar={() => abrir('fuso')}>
          <p className="font-mono text-[14px] text-ink-2">{fusoAtual}</p>
        </Regiao>
      </div>

      <Dialog open={editando !== null} onOpenChange={(aberto: boolean) => { if (!aberto) fechar(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? `Editar ${TITULO[editando].toLowerCase()}` : ''}</DialogTitle>
            <DialogDescription>
              Alteracoes valem para todos os curriculos gerados a partir do perfil.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {editando === 'identidade' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-nome">Nome</Label>
                <Input
                  id="p-nome"
                  value={perfil.nome}
                  onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                  autoFocus
                />
              </div>
            )}

            {editando === 'contato' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="p-email">E-mail</Label>
                  <Input
                    id="p-email"
                    value={perfil.contato.email ?? ''}
                    onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, email: e.target.value } })}
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="p-tel">Telefone</Label>
                  <Input
                    id="p-tel"
                    value={perfil.contato.telefone ?? ''}
                    onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, telefone: e.target.value } })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="p-linkedin">LinkedIn</Label>
                  <Input
                    id="p-linkedin"
                    value={perfil.contato.linkedin ?? ''}
                    onChange={(e) => setPerfil({ ...perfil, contato: { ...perfil.contato, linkedin: e.target.value } })}
                  />
                </div>
              </>
            )}

            {editando === 'resumo' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-resumo">Resumo</Label>
                <Textarea
                  id="p-resumo"
                  value={perfil.resumo}
                  onChange={(e) => setPerfil({ ...perfil, resumo: e.target.value })}
                  rows={6}
                  autoFocus
                />
              </div>
            )}

            {editando === 'experiencias' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-exp">Experiencias</Label>
                <Textarea
                  id="p-exp"
                  value={experienciasTexto}
                  onChange={(e) => setExperienciasTexto(e.target.value)}
                  rows={10}
                  autoFocus
                />
                <span className="text-[12px] text-faint">Uma experiencia por linha.</span>
              </div>
            )}

            {editando === 'formacao' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-form">Formacao</Label>
                <Textarea
                  id="p-form"
                  value={formacaoTexto}
                  onChange={(e) => setFormacaoTexto(e.target.value)}
                  rows={6}
                  autoFocus
                />
                <span className="text-[12px] text-faint">Uma formacao por linha.</span>
              </div>
            )}

            {editando === 'skills' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-skills">Skills</Label>
                <Input
                  id="p-skills"
                  value={skillsTexto}
                  onChange={(e) => setSkillsTexto(e.target.value)}
                  autoFocus
                />
                <span className="text-[12px] text-faint">Separe por virgula.</span>
              </div>
            )}

            {editando === 'fuso' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-fuso">Fuso horario IANA</Label>
                <Input
                  id="p-fuso"
                  value={fuso}
                  onChange={(e) => setFuso(e.target.value)}
                  placeholder="America/Sao_Paulo"
                  autoFocus
                />
              </div>
            )}

            {erro && (
              <div
                className="rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad"
                role="alert"
              >
                {erro}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={fechar} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              onClick={() => void (editando === 'fuso' ? salvarFuso() : salvarSecao())}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
