import { useEffect, useState } from 'react';
import {
  getPerfil,
  getPreferencias,
  patchPreferencias,
  reindexarContexto,
  salvarPerfil,
  type ContatoPerfil,
  type ExperienciaPerfil,
  type PerfilMestre,
  type TipoContatoPerfil,
} from './api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const VAZIO: PerfilMestre = {
  nome: '',
  contato: [],
  resumo: '',
  experiencias: [],
  formacao: [],
  certificacoes: [],
  idiomas: [],
  skills: [],
};

const TIPOS_CONTATO: Array<{ valor: TipoContatoPerfil; rotulo: string }> = [
  { valor: 'email', rotulo: 'E-mail' },
  { valor: 'telefone', rotulo: 'Telefone' },
  { valor: 'linkedin', rotulo: 'LinkedIn' },
  { valor: 'github', rotulo: 'GitHub' },
  { valor: 'site', rotulo: 'Portfólio ou site' },
  { valor: 'localizacao', rotulo: 'Localização' },
  { valor: 'outro', rotulo: 'Outro' },
];

type Secao = 'identidade' | 'resumo' | 'formacao' | 'certificacoes' | 'idiomas' | 'skills' | 'fuso';
type Edicao = Secao | 'contato' | 'experiencia' | null;

function novaChave(prefixo: string) {
  return `${prefixo}-${crypto.randomUUID()}`;
}

function nomeContato(contato: ContatoPerfil) {
  return contato.tipo === 'outro' ? contato.rotulo || 'Outro' : TIPOS_CONTATO.find((tipo) => tipo.valor === contato.tipo)?.rotulo || 'Contato';
}

function tituloExperiencia(experiencia: ExperienciaPerfil) {
  if (experiencia.cargo && experiencia.empresa) return `${experiencia.cargo} · ${experiencia.empresa}`;
  return experiencia.cargo || experiencia.empresa || 'Experiência registrada';
}

function Regiao({
  titulo,
  acao,
  vazia,
  children,
}: {
  titulo: string;
  acao: React.ReactNode;
  vazia?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line py-6 first:pt-0 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-section text-ink">{titulo}</h3>
        {acao}
      </div>
      <div className="mt-3">{vazia ? <p className="text-[14px] text-muted">{vazia}</p> : children}</div>
    </section>
  );
}

export function PerfilForm() {
  const [perfil, setPerfil] = useState<PerfilMestre>(VAZIO);
  const [formacaoTexto, setFormacaoTexto] = useState('');
  const [certificacoesTexto, setCertificacoesTexto] = useState('');
  const [idiomasTexto, setIdiomasTexto] = useState('');
  const [skillsTexto, setSkillsTexto] = useState('');
  const [fuso, setFuso] = useState('');
  const [editando, setEditando] = useState<Edicao>(null);
  const [contatoRascunho, setContatoRascunho] = useState<ContatoPerfil | null>(null);
  const [experienciaRascunho, setExperienciaRascunho] = useState<ExperienciaPerfil | null>(null);
  const [tecnologiasTexto, setTecnologiasTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [desatualizado, setDesatualizado] = useState(false);
  const [reindexando, setReindexando] = useState(false);
  const [snapshot, setSnapshot] = useState<{ perfil: PerfilMestre; formacao: string; certificacoes: string; idiomas: string; skills: string; fuso: string } | null>(null);

  function aplicarPerfil(novoPerfil: PerfilMestre) {
    setPerfil({ ...VAZIO, ...novoPerfil, contato: novoPerfil.contato ?? [], experiencias: novoPerfil.experiencias ?? [] });
    setFormacaoTexto((novoPerfil.formacao ?? []).join('\n'));
    setCertificacoesTexto((novoPerfil.certificacoes ?? []).join('\n'));
    setIdiomasTexto((novoPerfil.idiomas ?? []).join('\n'));
    setSkillsTexto((novoPerfil.skills ?? []).join(', '));
  }

  useEffect(() => {
    getPerfil()
      .then((resultado) => {
        if (resultado) aplicarPerfil(resultado);
      })
      .catch((causa) => setErro((causa as Error).message));
    getPreferencias()
      .then((preferencias) => setFuso(preferencias.fusoHorario))
      .catch(() => {});
  }, []);

  function abrir(secao: Secao) {
    setSnapshot({ perfil, formacao: formacaoTexto, certificacoes: certificacoesTexto, idiomas: idiomasTexto, skills: skillsTexto, fuso });
    setErro(null);
    setEditando(secao);
  }

  function abrirContato(contato?: ContatoPerfil) {
    setErro(null);
    setContatoRascunho(contato ? { ...contato } : { id: novaChave('contato'), tipo: 'email', valor: '' });
    setEditando('contato');
  }

  function abrirExperiencia(experiencia?: ExperienciaPerfil) {
    setErro(null);
    const rascunho = experiencia
      ? { ...experiencia, tecnologias: experiencia.tecnologias ?? [] }
      : { id: novaChave('experiencia'), cargo: '', empresa: '', periodo: '', local: '', descricao: '', tecnologias: [] };
    setExperienciaRascunho(rascunho);
    setTecnologiasTexto((rascunho.tecnologias ?? []).join(', '));
    setEditando('experiencia');
  }

  function fechar() {
    if (snapshot) {
      setPerfil(snapshot.perfil);
      setFormacaoTexto(snapshot.formacao);
      setCertificacoesTexto(snapshot.certificacoes);
      setIdiomasTexto(snapshot.idiomas);
      setSkillsTexto(snapshot.skills);
      setFuso(snapshot.fuso);
    }
    setSnapshot(null);
    setContatoRascunho(null);
    setExperienciaRascunho(null);
    setEditando(null);
    setErro(null);
  }

  async function persistir(proximo: PerfilMestre, sucesso: string) {
    setSalvando(true);
    setErro(null);
    try {
      const salvo = await salvarPerfil(proximo);
      aplicarPerfil(salvo);
      setEditando(null);
      setSnapshot(null);
      setContatoRascunho(null);
      setExperienciaRascunho(null);
      setDesatualizado(true);
      setMensagem(`${sucesso} O índice de conhecimento pode estar desatualizado.`);
    } catch (causa) {
      setErro((causa as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function salvarSecao() {
    const proximo: PerfilMestre = {
      ...perfil,
      formacao: formacaoTexto.split('\n').map((linha) => linha.trim()).filter(Boolean),
      certificacoes: certificacoesTexto.split('\n').map((linha) => linha.trim()).filter(Boolean),
      idiomas: idiomasTexto.split('\n').map((linha) => linha.trim()).filter(Boolean),
      skills: skillsTexto.split(',').map((skill) => skill.trim()).filter(Boolean),
    };
    await persistir(proximo, 'Perfil atualizado.');
  }

  async function salvarContato() {
    if (!contatoRascunho) return;
    if (!contatoRascunho.valor.trim()) {
      setErro('Informe o valor do contato.');
      return;
    }
    if (contatoRascunho.tipo === 'outro' && !contatoRascunho.rotulo?.trim()) {
      setErro('Informe o rótulo deste contato.');
      return;
    }
    const contato = { ...contatoRascunho, valor: contatoRascunho.valor.trim(), rotulo: contatoRascunho.rotulo?.trim() };
    const jaExiste = perfil.contato.some((item) => item.id === contato.id);
    const contatos = jaExiste ? perfil.contato.map((item) => (item.id === contato.id ? contato : item)) : [...perfil.contato, contato];
    await persistir({ ...perfil, contato: contatos }, jaExiste ? 'Contato atualizado.' : 'Contato adicionado.');
  }

  async function salvarExperiencia() {
    if (!experienciaRascunho) return;
    const existente = perfil.experiencias.some((item) => item.id === experienciaRascunho.id);
    const legado = existente && (!experienciaRascunho.cargo || !experienciaRascunho.empresa || !experienciaRascunho.periodo);
    if (!legado && (!experienciaRascunho.cargo.trim() || !experienciaRascunho.empresa.trim() || !experienciaRascunho.periodo.trim())) {
      setErro('Informe cargo, empresa e período.');
      return;
    }
    if (!experienciaRascunho.descricao.trim()) {
      setErro('Descreva a experiência com fatos que possam entrar no currículo.');
      return;
    }
    const experiencia: ExperienciaPerfil = {
      ...experienciaRascunho,
      cargo: experienciaRascunho.cargo.trim(),
      empresa: experienciaRascunho.empresa.trim(),
      periodo: experienciaRascunho.periodo.trim(),
      local: experienciaRascunho.local?.trim() || undefined,
      descricao: experienciaRascunho.descricao.trim(),
      tecnologias: tecnologiasTexto.split(',').map((item) => item.trim()).filter(Boolean),
    };
    const experiencias = existente
      ? perfil.experiencias.map((item) => (item.id === experiencia.id ? experiencia : item))
      : [...perfil.experiencias, experiencia];
    await persistir({ ...perfil, experiencias }, existente ? 'Experiência atualizada.' : 'Experiência adicionada.');
  }

  async function removerEntrada(tipo: 'contato' | 'experiencia') {
    if (tipo === 'contato' && contatoRascunho) {
      await persistir({ ...perfil, contato: perfil.contato.filter((item) => item.id !== contatoRascunho.id) }, 'Contato removido.');
    }
    if (tipo === 'experiencia' && experienciaRascunho) {
      await persistir({ ...perfil, experiencias: perfil.experiencias.filter((item) => item.id !== experienciaRascunho.id) }, 'Experiência removida.');
    }
  }

  async function salvarFuso() {
    setSalvando(true);
    setErro(null);
    try {
      const preferencias = await patchPreferencias({ fusoHorario: fuso });
      setFuso(preferencias.fusoHorario);
      setEditando(null);
      setSnapshot(null);
      setMensagem('Fuso horário atualizado.');
    } catch (causa) {
      setErro((causa as Error).message);
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
      setMensagem('Reindexação iniciada.');
    } catch (causa) {
      setErro((causa as Error).message);
    } finally {
      setReindexando(false);
    }
  }

  const fusoAtual = fuso || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const podeRemoverContato = Boolean(contatoRascunho && perfil.contato.some((item) => item.id === contatoRascunho.id));
  const podeRemoverExperiencia = Boolean(experienciaRascunho && perfil.experiencias.some((item) => item.id === experienciaRascunho.id));
  const tituloDialog = editando === 'contato'
    ? `${podeRemoverContato ? 'Editar' : 'Adicionar'} contato`
    : editando === 'experiencia'
      ? `${podeRemoverExperiencia ? 'Editar' : 'Adicionar'} experiência`
      : editando === 'fuso'
        ? 'Editar fuso horário'
        : editando === 'identidade'
          ? 'Editar identidade'
          : editando === 'resumo'
            ? 'Editar resumo'
            : editando === 'formacao'
              ? 'Editar formação'
              : editando === 'certificacoes'
                ? 'Editar certificações'
                : editando === 'idiomas'
                  ? 'Editar idiomas'
                  : 'Editar skills';

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-2xl border-b border-line pb-6">
        <p className="text-[15px] leading-relaxed text-ink-2">
          Este é o seu perfil factual. Cada informação salva pode orientar a adaptação dos currículos às vagas.
        </p>
      </div>

      {desatualizado && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-score-warn/40 bg-ground px-4 py-3" role="status">
          <p className="text-[14px] text-ink-2">O índice de conhecimento pode estar desatualizado após a edição do perfil.</p>
          <Button size="sm" variant="secondary" onClick={() => void reindexar()} disabled={reindexando}>
            {reindexando ? 'Reindexando...' : 'Reindexar agora'}
          </Button>
        </div>
      )}
      {mensagem && !desatualizado && <p className="text-[13px] text-muted" role="status">{mensagem}</p>}

      <div>
        <Regiao titulo="Identidade" acao={<Button size="sm" variant="ghost" onClick={() => abrir('identidade')}>Editar</Button>} vazia={perfil.nome ? undefined : 'Adicione seu nome. Ele encabeça todo currículo gerado.'}>
          <p className="text-[15px] text-ink">{perfil.nome}</p>
        </Regiao>

        <Regiao titulo="Contato" acao={<Button size="sm" variant="ghost" onClick={() => abrirContato()}>Adicionar contato</Button>} vazia={perfil.contato.length ? undefined : 'Inclua os canais que você deseja disponibilizar no cabeçalho do currículo.'}>
          <ul className="divide-y divide-line">
            {perfil.contato.map((contato) => (
              <li key={contato.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-muted">{nomeContato(contato)}</p>
                  <p className="truncate text-[15px] text-ink">{contato.valor}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => abrirContato(contato)}>Editar</Button>
              </li>
            ))}
          </ul>
        </Regiao>

        <Regiao titulo="Resumo" acao={<Button size="sm" variant="ghost" onClick={() => abrir('resumo')}>Editar</Button>} vazia={perfil.resumo ? undefined : 'Um resumo breve apresenta seu posicionamento profissional.'}>
          <p className="max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{perfil.resumo}</p>
        </Regiao>

        <Regiao titulo="Experiências" acao={<Button size="sm" variant="ghost" onClick={() => abrirExperiencia()}>Adicionar experiência</Button>} vazia={perfil.experiencias.length ? undefined : 'Registre fatos das suas experiências para que os currículos possam ser adaptados com precisão.'}>
          <div className="divide-y divide-line">
            {perfil.experiencias.map((experiencia) => (
              <article key={experiencia.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-[16px] font-semibold text-ink">{tituloExperiencia(experiencia)}</h4>
                    {(experiencia.periodo || experiencia.local) && <p className="mt-1 text-[13px] text-muted">{[experiencia.periodo, experiencia.local].filter(Boolean).join(' · ')}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => abrirExperiencia(experiencia)}>Editar</Button>
                </div>
                <p className="mt-3 max-w-2xl whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{experiencia.descricao}</p>
                {!!experiencia.tecnologias?.length && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {experiencia.tecnologias.map((tecnologia) => <Badge key={tecnologia} variant="neutral">{tecnologia}</Badge>)}
                  </div>
                )}
              </article>
            ))}
          </div>
        </Regiao>

        <Regiao titulo="Formação" acao={<Button size="sm" variant="ghost" onClick={() => abrir('formacao')}>Editar</Button>} vazia={perfil.formacao.length ? undefined : 'Nenhuma formação registrada.'}>
          <ul className="flex max-w-2xl flex-col gap-1.5 text-[14px] text-ink-2">{perfil.formacao.map((item) => <li key={item}>{item}</li>)}</ul>
        </Regiao>

        <Regiao titulo="Certificações" acao={<Button size="sm" variant="ghost" onClick={() => abrir('certificacoes')}>Editar</Button>} vazia={perfil.certificacoes.length ? undefined : 'Nenhuma certificação registrada.'}>
          <ul className="flex max-w-2xl flex-col gap-1.5 text-[14px] text-ink-2">{perfil.certificacoes.map((item) => <li key={item}>{item}</li>)}</ul>
        </Regiao>

        <Regiao titulo="Idiomas" acao={<Button size="sm" variant="ghost" onClick={() => abrir('idiomas')}>Editar</Button>} vazia={perfil.idiomas.length ? undefined : 'Nenhum idioma registrado.'}>
          <ul className="flex max-w-2xl flex-col gap-1.5 text-[14px] text-ink-2">{perfil.idiomas.map((item) => <li key={item}>{item}</li>)}</ul>
        </Regiao>

        <Regiao titulo="Skills" acao={<Button size="sm" variant="ghost" onClick={() => abrir('skills')}>Editar</Button>} vazia={perfil.skills.length ? undefined : 'Inclua competências usadas para relacionar seu perfil às vagas.'}>
          <div className="flex flex-wrap gap-1.5">{perfil.skills.map((skill) => <Badge key={skill} variant="neutral">{skill}</Badge>)}</div>
        </Regiao>

        <Regiao titulo="Fuso horário" acao={<Button size="sm" variant="ghost" onClick={() => abrir('fuso')}>Editar</Button>}>
          <p className="font-mono text-[14px] text-ink-2">{fusoAtual}</p>
        </Regiao>
      </div>

      <Dialog open={editando !== null} onOpenChange={(aberto: boolean) => { if (!aberto) fechar(); }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tituloDialog}</DialogTitle>
            <DialogDescription>Salve apenas informações que você possa sustentar no currículo.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {editando === 'identidade' && <Campo texto="Nome" htmlFor="p-nome"><Input id="p-nome" value={perfil.nome} onChange={(evento) => setPerfil({ ...perfil, nome: evento.target.value })} autoFocus /></Campo>}
            {editando === 'resumo' && <Campo texto="Resumo" htmlFor="p-resumo"><Textarea id="p-resumo" value={perfil.resumo} onChange={(evento) => setPerfil({ ...perfil, resumo: evento.target.value })} rows={6} autoFocus /></Campo>}
            {editando === 'formacao' && <Campo texto="Formação" htmlFor="p-formacao"><Textarea id="p-formacao" value={formacaoTexto} onChange={(evento) => setFormacaoTexto(evento.target.value)} rows={6} autoFocus /><p className="text-[12px] text-faint">Uma formação por linha.</p></Campo>}
            {editando === 'certificacoes' && <Campo texto="Certificações" htmlFor="p-certificacoes"><Textarea id="p-certificacoes" value={certificacoesTexto} onChange={(evento) => setCertificacoesTexto(evento.target.value)} rows={6} autoFocus /><p className="text-[12px] text-faint">Uma certificação por linha.</p></Campo>}
            {editando === 'idiomas' && <Campo texto="Idiomas" htmlFor="p-idiomas"><Textarea id="p-idiomas" value={idiomasTexto} onChange={(evento) => setIdiomasTexto(evento.target.value)} rows={4} autoFocus /><p className="text-[12px] text-faint">Um idioma e nível por linha.</p></Campo>}
            {editando === 'skills' && <Campo texto="Skills" htmlFor="p-skills"><Input id="p-skills" value={skillsTexto} onChange={(evento) => setSkillsTexto(evento.target.value)} autoFocus /><p className="text-[12px] text-faint">Separe por vírgula.</p></Campo>}
            {editando === 'fuso' && <Campo texto="Fuso horário IANA" htmlFor="p-fuso"><Input id="p-fuso" value={fuso} onChange={(evento) => setFuso(evento.target.value)} placeholder="America/Sao_Paulo" autoFocus /></Campo>}

            {editando === 'contato' && contatoRascunho && (
              <>
                <Campo texto="Tipo" htmlFor="p-contato-tipo">
                  <select id="p-contato-tipo" className="h-10 w-full rounded-control border border-input bg-transparent px-3 text-[14px] text-ink" value={contatoRascunho.tipo} onChange={(evento) => setContatoRascunho({ ...contatoRascunho, tipo: evento.target.value as TipoContatoPerfil, rotulo: evento.target.value === 'outro' ? contatoRascunho.rotulo : undefined })}>
                    {TIPOS_CONTATO.map((tipo) => <option key={tipo.valor} value={tipo.valor}>{tipo.rotulo}</option>)}
                  </select>
                </Campo>
                {contatoRascunho.tipo === 'outro' && <Campo texto="Rótulo" htmlFor="p-contato-rotulo"><Input id="p-contato-rotulo" value={contatoRascunho.rotulo ?? ''} onChange={(evento) => setContatoRascunho({ ...contatoRascunho, rotulo: evento.target.value })} placeholder="Ex.: WhatsApp" /></Campo>}
                <Campo texto="Valor" htmlFor="p-contato-valor"><Input id="p-contato-valor" type={contatoRascunho.tipo === 'email' ? 'email' : 'text'} value={contatoRascunho.valor} onChange={(evento) => setContatoRascunho({ ...contatoRascunho, valor: evento.target.value })} autoFocus /></Campo>
              </>
            )}

            {editando === 'experiencia' && experienciaRascunho && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo texto="Cargo" htmlFor="p-cargo"><Input id="p-cargo" value={experienciaRascunho.cargo} onChange={(evento) => setExperienciaRascunho({ ...experienciaRascunho, cargo: evento.target.value })} autoFocus /></Campo>
                  <Campo texto="Empresa" htmlFor="p-empresa"><Input id="p-empresa" value={experienciaRascunho.empresa} onChange={(evento) => setExperienciaRascunho({ ...experienciaRascunho, empresa: evento.target.value })} /></Campo>
                  <Campo texto="Período" htmlFor="p-periodo"><Input id="p-periodo" value={experienciaRascunho.periodo} onChange={(evento) => setExperienciaRascunho({ ...experienciaRascunho, periodo: evento.target.value })} placeholder="Jan. 2024 a atual" /></Campo>
                  <Campo texto="Local" htmlFor="p-local"><Input id="p-local" value={experienciaRascunho.local ?? ''} onChange={(evento) => setExperienciaRascunho({ ...experienciaRascunho, local: evento.target.value })} /></Campo>
                </div>
                <Campo texto="Descrição" htmlFor="p-descricao"><Textarea id="p-descricao" value={experienciaRascunho.descricao} onChange={(evento) => setExperienciaRascunho({ ...experienciaRascunho, descricao: evento.target.value })} rows={6} /><p className="text-[12px] text-faint">Use fatos, escopo e resultados que você possa comprovar.</p></Campo>
                <Campo texto="Tecnologias ou competências" htmlFor="p-tecnologias"><Input id="p-tecnologias" value={tecnologiasTexto} onChange={(evento) => setTecnologiasTexto(evento.target.value)} /><p className="text-[12px] text-faint">Opcional. Separe por vírgula.</p></Campo>
              </>
            )}

            {erro && <div className="rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad" role="alert">{erro}</div>}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {podeRemoverContato && <Button variant="ghost" className="text-score-bad hover:text-score-bad" onClick={() => void removerEntrada('contato')} disabled={salvando}>Remover contato</Button>}
            {podeRemoverExperiencia && <Button variant="ghost" className="text-score-bad hover:text-score-bad" onClick={() => void removerEntrada('experiencia')} disabled={salvando}>Remover experiência</Button>}
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" onClick={fechar} disabled={salvando}>Cancelar</Button>
              <Button onClick={() => void (editando === 'fuso' ? salvarFuso() : editando === 'contato' ? salvarContato() : editando === 'experiencia' ? salvarExperiencia() : salvarSecao())} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Campo({ texto, htmlFor, children }: { texto: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><Label htmlFor={htmlFor}>{texto}</Label>{children}</div>;
}
