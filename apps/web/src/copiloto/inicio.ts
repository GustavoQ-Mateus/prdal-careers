import type { AcaoRapidaCopiloto, ConversaCopilotoResumo, HojeAcao, HojeResposta, PerfilMestre } from '../api';

export type PassoInicio = {
  id: string;
  oportunidadeId: string;
  titulo: string;
  empresa: string;
  quando: string;
  atrasado: boolean;
  botao: string;
  acao: AcaoRapidaCopiloto;
  mensagem?: string;
};

export type ModeloInicio = {
  semPerfil: boolean;
  data: string;
  saudacao: string;
  nome?: string;
  atrasados: number;
  paraResolver: number;
  conversa?: ConversaCopilotoResumo;
  passos?: PassoInicio[];
  totalPassos: number;
  geracoes?: NonNullable<HojeResposta['geracoesConcluidas']>;
  entrada?: NonNullable<HojeResposta['entrada']>;
};

function partes(data: Date, fuso: string) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(data).map((parte) => [parte.type, parte.value]));
}

function chaveDia(data: Date, fuso: string) {
  const p = partes(data, fuso);
  return `${p.year}-${p.month}-${p.day}`;
}

function diferencaDias(data: Date, agora: Date, fuso: string) {
  const dia = Date.parse(`${chaveDia(data, fuso)}T00:00:00Z`);
  const atual = Date.parse(`${chaveDia(agora, fuso)}T00:00:00Z`);
  return Math.round((dia - atual) / 86_400_000);
}

function quandoRelativo(iso: string | null, agora: Date, fuso: string) {
  if (!iso) return 'sem data';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return 'sem data';
  const dias = diferencaDias(data, agora, fuso);
  if (dias < -1) return `há ${-dias} dias`;
  if (dias === -1) return 'ontem';
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: fuso, weekday: 'short' }).format(data).replace('.', '');
}

function acaoDoTipo(item: HojeAcao) {
  const botoes: Record<string, string> = {
    ENVIAR_CANDIDATURA: 'Preparar envio',
    FAZER_FOLLOW_UP: 'Redigir mensagem',
    ENVIAR_MATERIAL: 'Preparar envio',
    PREPARAR_ENTREVISTA: 'Preparar entrevista',
    GERAR_CURRICULO: 'Preparar currículo',
  };
  const botao = /responder|resposta|recrutad/i.test(item.titulo) ? 'Redigir resposta' : botoes[item.tipo] ?? 'Abrir';
  const acoes: Record<string, AcaoRapidaCopiloto> = {
    'Preparar envio': 'preparar_envio',
    'Redigir mensagem': 'redigir_mensagem',
    'Redigir resposta': 'redigir_resposta',
    'Preparar entrevista': 'preparar_entrevista',
    'Preparar currículo': 'preparar_curriculo',
    Abrir: 'abrir_oportunidade',
  };
  return {
    botao,
    acao: acoes[botao],
    mensagem: botao === 'Abrir' ? undefined : `${botao} para ${item.oportunidade.titulo} na ${item.oportunidade.empresa}. Próximo passo: ${item.titulo}.`,
  };
}

function perfilVazio(perfil: PerfilMestre | null) {
  if (!perfil) return true;
  const endereco = typeof perfil.endereco === 'string'
    ? perfil.endereco.trim()
    : perfil.endereco && Object.values(perfil.endereco).some((valor) => typeof valor === 'string' && valor.trim());
  return !(
    perfil.nome?.trim() || perfil.resumo?.trim() || perfil.emails?.length || perfil.telefones?.length ||
    perfil.links?.length || perfil.outrosContatos?.length || perfil.experiencias?.length ||
    perfil.formacao?.length || perfil.certificacoes?.length || perfil.idiomas?.length || perfil.skills?.length ||
    endereco
  );
}

export function montarInicioCopiloto(
  hoje: HojeResposta | undefined,
  conversas: ConversaCopilotoResumo[] | undefined,
  perfil: PerfilMestre | null | undefined,
  agora: Date,
  fuso: string,
): ModeloInicio {
  const zona = hoje?.fusoHorario || fuso;
  const hora = Number(partes(agora, zona).hour);
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const data = new Intl.DateTimeFormat('pt-BR', { timeZone: zona, weekday: 'long', day: 'numeric', month: 'long' }).format(agora);
  const semPerfil = perfil !== undefined && perfilVazio(perfil);
  const grupos = hoje ? [hoje.atrasadas, hoje.hoje, hoje.proximosDias] : [];
  const passos = hoje ? grupos.flatMap((grupo, indice) => [...grupo]
    .sort((a, b) => (a.venceEm ?? '').localeCompare(b.venceEm ?? ''))
    .map((item): PassoInicio => ({
      id: item.id,
      oportunidadeId: item.vagaId,
      titulo: item.titulo,
      empresa: item.oportunidade.empresa,
      quando: quandoRelativo(item.venceEm, agora, zona),
      atrasado: indice === 0,
      ...acaoDoTipo(item),
    }))).concat((hoje.semProximoPasso ?? []).map((item): PassoInicio => ({
      id: `sem-${item.id}`,
      oportunidadeId: item.id,
      titulo: 'Definir próximo passo',
      empresa: `${item.titulo} · ${item.empresa}`,
      quando: 'sem passo',
      atrasado: false,
      botao: 'Definir próximo passo',
      acao: 'definir_proximo_passo',
      mensagem: `Definir próximo passo para ${item.titulo} na ${item.empresa}.`,
    }))) : undefined;
  return {
    semPerfil,
    data,
    saudacao,
    nome: perfil && !semPerfil ? perfil.nome?.trim().split(/\s+/)[0] || undefined : undefined,
    atrasados: hoje?.atrasadas.length ?? 0,
    paraResolver: hoje?.hoje.length ?? 0,
    conversa: conversas?.length ? [...conversas].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))[0] : undefined,
    passos: passos?.slice(0, 5),
    totalPassos: passos?.length ?? 0,
    geracoes: hoje?.geracoesConcluidas?.length ? hoje.geracoesConcluidas : undefined,
    entrada: hoje?.entrada?.length ? hoje.entrada : undefined,
  };
}
