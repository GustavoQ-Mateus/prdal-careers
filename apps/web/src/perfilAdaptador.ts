import type {
  CertificacaoPerfil,
  EmailPerfil,
  EnderecoPerfil,
  ExperienciaPerfil,
  FormacaoPerfil,
  LinkPerfil,
  LocalPerfil,
  MotivoRevisao,
  OutroContatoPerfil,
  PerfilMestre,
  TelefonePerfil,
  TipoLink,
} from './api';

export type TipoContatoTela = 'email' | 'telefone' | 'linkedin' | 'github' | 'site' | 'localizacao' | 'outro';

export interface ContatoTela {
  id: string;
  tipo: TipoContatoTela;
  valor: string;
  rotulo?: string;
}

export interface ExperienciaTela {
  id: string;
  cargo: string;
  empresa: string;
  periodo: string;
  local?: string;
  descricao: string;
  tecnologias?: string[];
}

export interface PerfilTela {
  nome: string;
  contato: ContatoTela[];
  resumo: string;
  experiencias: ExperienciaTela[];
  formacao: string[];
  certificacoes: string[];
  idiomas: string[];
  skills: string[];
}

export const PERFIL_VAZIO: PerfilMestre = {
  nome: '',
  emails: [],
  telefones: [],
  links: [],
  endereco: null,
  outrosContatos: [],
  resumo: '',
  experiencias: [],
  formacao: [],
  certificacoes: [],
  idiomas: [],
  skills: [],
};

const ID_ENDERECO = 'endereco';
const PREFIXO_TECNOLOGIAS = 'Tecnologias: ';
const ROTULO_LOCALIZACAO = 'Localização';
const LINKS_COM_ROTULO: Partial<Record<TipoLink, string>> = { facebook: 'Facebook', instagram: 'Instagram' };
const LINKS_DA_TELA: TipoContatoTela[] = ['linkedin', 'github', 'site'];
const ROTULO_STATUS: Record<string, string> = { concluido: 'concluído', em_andamento: 'em andamento', trancado: 'trancado' };
const DDI_RE = /^\+\s*(\d{1,3})(?=[\s\-.(])/;

function novaChave(prefixo: string) {
  return `${prefixo}-${crypto.randomUUID()}`;
}

function semMotivo(revisao: MotivoRevisao[] | undefined, motivo: MotivoRevisao) {
  const restantes = (revisao ?? []).filter((item) => item !== motivo);
  return restantes.length ? { revisao: restantes } : {};
}

function mesAno(mes: number | null, ano: number | null) {
  if (ano === null) return '';
  return mes === null ? String(ano) : `${String(mes).padStart(2, '0')}/${ano}`;
}

function textoLocal(local: LocalPerfil | string | null | undefined) {
  if (!local) return '';
  if (typeof local === 'string') return local;
  return [local.cidade, local.estado].filter(Boolean).join(' - ') || local.pais;
}

function textoEndereco(endereco: EnderecoPerfil | string) {
  return typeof endereco === 'string' ? endereco : textoLocal(endereco) || endereco.legado || '';
}

function textoTelefone(telefone: TelefonePerfil) {
  return [telefone.ddi, telefone.numero].filter(Boolean).join(' ');
}

export function lerTelefone(valor: string): Pick<TelefonePerfil, 'ddi' | 'numero' | 'revisao'> {
  const achado = DDI_RE.exec(valor);
  const numero = achado ? valor.slice(achado[0].length).replace(/^[\s\-.]+/, '').trim() : '';
  if (achado && numero) return { ddi: `+${achado[1]}`, numero };
  return { ddi: '', numero: valor, revisao: ['ddi_ausente'] };
}

export function periodoTexto(experiencia: ExperienciaPerfil) {
  if (experiencia.periodoLegado) return experiencia.periodoLegado;
  const inicio = mesAno(experiencia.dataInicioMes, experiencia.dataInicioAno);
  const fim = experiencia.atual ? 'atual' : mesAno(experiencia.dataFimMes, experiencia.dataFimAno);
  return inicio && fim ? `${inicio} - ${fim}` : inicio || fim;
}

export function textoFormacao(formacao: FormacaoPerfil) {
  const titulo = formacao.grau && formacao.curso ? `${formacao.grau} em ${formacao.curso}` : formacao.grau || formacao.curso;
  const inicio = mesAno(formacao.inicioMes, formacao.inicioAno);
  const fim = mesAno(formacao.fimMes, formacao.fimAno);
  const periodo = inicio && fim ? `${inicio} - ${fim}` : inicio ? `${inicio} - atual` : fim;
  return [formacao.instituicao, titulo, periodo, ROTULO_STATUS[formacao.status] ?? formacao.status].filter(Boolean).join(' | ');
}

export function textoCertificacao(certificacao: CertificacaoPerfil) {
  return [certificacao.titulo, certificacao.descricao].filter(Boolean).join(', ');
}

function separarTecnologias(descricao: string) {
  const linhas = descricao.split(/\r?\n/);
  const ultima = linhas.length ? linhas[linhas.length - 1].trim() : '';
  if (!ultima.startsWith(PREFIXO_TECNOLOGIAS)) return { descricao, tecnologias: [] as string[] };
  return {
    descricao: linhas.slice(0, -1).join('\n').trim(),
    tecnologias: ultima.slice(PREFIXO_TECNOLOGIAS.length).split(',').map((item) => item.trim()).filter(Boolean),
  };
}

function juntarTecnologias(descricao: string, tecnologias: string[] = []) {
  const linha = tecnologias.length ? `${PREFIXO_TECNOLOGIAS}${tecnologias.join(', ')}` : '';
  return [descricao.trim(), linha].filter(Boolean).join('\n');
}

function experienciaParaTela(experiencia: ExperienciaPerfil): ExperienciaTela {
  const local = textoLocal(experiencia.local) || experiencia.localLegado || '';
  return {
    id: experiencia.id,
    cargo: experiencia.cargo,
    empresa: experiencia.empresa,
    periodo: periodoTexto(experiencia),
    ...(local ? { local } : {}),
    ...separarTecnologias(experiencia.descricao),
  };
}

function mesmaExperiencia(a: ExperienciaTela, b: ExperienciaTela) {
  return (
    a.cargo === b.cargo &&
    a.empresa === b.empresa &&
    a.periodo === b.periodo &&
    (a.local ?? '') === (b.local ?? '') &&
    a.descricao === b.descricao &&
    (a.tecnologias ?? []).join('\n') === (b.tecnologias ?? []).join('\n')
  );
}

export function paraTela(perfil: PerfilMestre): PerfilTela {
  const contato: ContatoTela[] = [
    ...perfil.emails.map((email): ContatoTela => ({ id: email.id, tipo: 'email', valor: email.valor })),
    ...perfil.telefones.map((telefone): ContatoTela => ({ id: telefone.id, tipo: 'telefone', valor: textoTelefone(telefone) })),
    ...perfil.links.map((link): ContatoTela => {
      const rotulo = LINKS_COM_ROTULO[link.tipo];
      return rotulo ? { id: link.id, tipo: 'outro', rotulo, valor: link.url } : { id: link.id, tipo: link.tipo as TipoContatoTela, valor: link.url };
    }),
    ...(perfil.endereco && textoEndereco(perfil.endereco)
      ? [{ id: ID_ENDERECO, tipo: 'localizacao' as const, valor: textoEndereco(perfil.endereco) }]
      : []),
    ...perfil.outrosContatos.map((outro): ContatoTela => ({ id: outro.id, tipo: 'outro', rotulo: outro.rotulo, valor: outro.valor })),
  ];
  return {
    nome: perfil.nome,
    contato,
    resumo: perfil.resumo,
    experiencias: perfil.experiencias.map(experienciaParaTela),
    formacao: perfil.formacao.map(textoFormacao).filter(Boolean),
    certificacoes: perfil.certificacoes.map(textoCertificacao).filter(Boolean),
    idiomas: perfil.idiomas,
    skills: perfil.skills,
  };
}

function porId<T extends { id: string }>(itens: T[]) {
  return new Map(itens.map((item) => [item.id, item]));
}

function contatoParaApi(tela: ContatoTela[], origem: PerfilMestre) {
  const emails = porId(origem.emails);
  const telefones = porId(origem.telefones);
  const links = porId(origem.links);
  const outros = porId(origem.outrosContatos);
  const resultado = {
    emails: [] as EmailPerfil[],
    telefones: [] as TelefonePerfil[],
    links: [] as LinkPerfil[],
    endereco: null as EnderecoPerfil | string | null,
    outrosContatos: [] as OutroContatoPerfil[],
  };
  for (const item of tela) {
    const valor = item.valor.trim();
    if (item.tipo === 'email') {
      const original = emails.get(item.id);
      resultado.emails.push(original?.valor === valor ? original : { id: item.id, valor, principal: original?.principal ?? false });
    } else if (item.tipo === 'telefone') {
      const original = telefones.get(item.id);
      resultado.telefones.push(
        original && textoTelefone(original) === valor
          ? original
          : { id: item.id, ...lerTelefone(valor), principal: original?.principal ?? false },
      );
    } else if (LINKS_DA_TELA.includes(item.tipo)) {
      const original = links.get(item.id);
      resultado.links.push(original?.tipo === item.tipo && original.url === valor ? original : { id: item.id, tipo: item.tipo as TipoLink, url: valor });
    } else if (item.tipo === 'localizacao' && resultado.endereco === null) {
      const original = item.id === ID_ENDERECO ? origem.endereco : null;
      resultado.endereco = original && textoEndereco(original) === valor ? original : valor;
    } else if (item.tipo === 'localizacao') {
      resultado.outrosContatos.push({ id: item.id, rotulo: ROTULO_LOCALIZACAO, valor, revisao: ['localizacao_texto'] });
    } else {
      const rotulo = item.rotulo?.trim() ?? '';
      const tipoLink = (Object.keys(LINKS_COM_ROTULO) as TipoLink[]).find(
        (tipo) => LINKS_COM_ROTULO[tipo]?.toLowerCase() === rotulo.toLowerCase(),
      );
      if (tipoLink) {
        const original = links.get(item.id);
        resultado.links.push(original?.tipo === tipoLink && original.url === valor ? original : { id: item.id, tipo: tipoLink, url: valor });
        continue;
      }
      const original = outros.get(item.id);
      resultado.outrosContatos.push(
        original && original.valor === valor && original.rotulo === rotulo
          ? original
          : { id: item.id, rotulo, valor, revisao: ['contato_sem_tipo'] },
      );
    }
  }
  return resultado;
}

function experienciaParaApi(tela: ExperienciaTela, original: ExperienciaPerfil | undefined): ExperienciaPerfil {
  const descricao = juntarTecnologias(tela.descricao, tela.tecnologias);
  if (!original) {
    return {
      id: tela.id,
      cargo: tela.cargo,
      empresa: tela.empresa,
      dataInicioMes: null,
      dataInicioAno: null,
      dataFimMes: null,
      dataFimAno: null,
      atual: false,
      local: tela.local?.trim() || null,
      periodo: tela.periodo,
      descricao,
    };
  }
  const anterior = experienciaParaTela(original);
  if (mesmaExperiencia(anterior, tela)) return original;
  let experiencia: ExperienciaPerfil = { ...original, cargo: tela.cargo, empresa: tela.empresa, descricao };
  if (tela.periodo !== anterior.periodo) {
    const { periodoLegado: _periodoLegado, revisao, ...resto } = experiencia;
    experiencia = {
      ...resto,
      ...semMotivo(revisao, 'periodo_texto'),
      dataInicioMes: null,
      dataInicioAno: null,
      dataFimMes: null,
      dataFimAno: null,
      atual: false,
      periodo: tela.periodo,
    };
  }
  if ((tela.local ?? '') !== (anterior.local ?? '')) {
    const { localLegado: _localLegado, revisao, ...resto } = experiencia;
    experiencia = { ...resto, ...semMotivo(revisao, 'local_texto'), local: tela.local?.trim() || null };
  }
  return experiencia;
}

function linhasParaApi<T extends { id: string }>(linhas: string[], originais: T[], texto: (item: T) => string, nova: (linha: string) => T): T[] {
  const fila = new Map<string, T[]>();
  for (const item of originais) fila.set(texto(item), [...(fila.get(texto(item)) ?? []), item]);
  return linhas.map((linha) => fila.get(linha)?.shift() ?? nova(linha));
}

export function paraApi(tela: PerfilTela, origem: PerfilMestre = PERFIL_VAZIO): PerfilMestre {
  const experiencias = porId(origem.experiencias);
  return {
    nome: tela.nome,
    ...contatoParaApi(tela.contato, origem),
    resumo: tela.resumo,
    experiencias: tela.experiencias.map((experiencia) => experienciaParaApi(experiencia, experiencias.get(experiencia.id))),
    formacao: linhasParaApi(tela.formacao, origem.formacao, textoFormacao, (linha) => ({
      id: novaChave('formacao'),
      grau: '',
      status: '',
      instituicao: '',
      curso: linha,
      inicioMes: null,
      inicioAno: null,
      fimMes: null,
      fimAno: null,
      revisao: ['formato_antigo'],
    })),
    certificacoes: linhasParaApi(tela.certificacoes, origem.certificacoes, textoCertificacao, (linha) => ({
      id: novaChave('certificacao'),
      titulo: linha,
      descricao: '',
      revisao: ['formato_antigo'],
    })),
    idiomas: tela.idiomas,
    skills: tela.skills,
  };
}
