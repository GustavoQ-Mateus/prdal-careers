import { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, ExternalLink, History, Plus } from 'lucide-react';
import {
  buscarConversaCopiloto,
  getHoje,
  getPerfil,
  getWorkspace,
  listarConversasCopiloto,
  type ConversaCopilotoResumo,
  type HojeResposta,
  type PerfilMestre,
} from './api';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './components/ThemeToggle';
import { InicioCopiloto } from './copiloto/InicioCopiloto';
import { montarInicioCopiloto } from './copiloto/inicio';
import { useCopiloto } from './copiloto/useCopiloto';
import {
  BarraEstado,
  CartaoConfirmacao,
  CartaoEntrega,
  CartaoErro,
  CartaoPreviewCurriculo,
  Composer,
  MensagemAgente,
  MensagemUsuario,
  ModoToggle,
  OperacaoCorrente,
  PensandoIndicador,
  PassoTrilha,
} from './copiloto/componentes';
import type { Item } from './copiloto/tipos';

function AvisoParadoExterno() {
  return (
    <div className="flex items-start gap-2 rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-[13px] text-accent-ink motion-safe:animate-in motion-safe:fade-in">
      <ExternalLink className="mt-0.5 size-4 shrink-0" />
      <p>
        O copiloto parou aqui. Ele preparou o conteúdo e a próxima ação é sua, fora do produto.
        Quando agir, volte e registre o resultado para o loop seguir.
      </p>
    </div>
  );
}

export function Copiloto({ oportunidadeId, acaoInicial, onAbrirHoje, onAbrirWorkspace, onAbrirCurriculo, onAbrirPerfil, onAbrirConta, onImportarLote, onAcao }: {
  oportunidadeId?: string;
  acaoInicial?: { id: string; mensagem: string };
  onAbrirHoje: () => void;
  onAbrirWorkspace: (id: string) => void;
  onAbrirCurriculo: (oportunidadeId: string, curriculoId: string) => void;
  onAbrirPerfil: () => void;
  onAbrirConta: () => void;
  onImportarLote: () => void;
  onAcao: (oportunidadeId: string, mensagem: string) => void;
}) {
  const c = useCopiloto(oportunidadeId);
  const bloqueado = c.streaming || c.estado === 'aguardando_confirmacao';
  const [ancora, setAncora] = useState<{ titulo: string; empresa: string } | null>(null);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [conversas, setConversas] = useState<ConversaCopilotoResumo[]>([]);
  const [hoje, setHoje] = useState<HojeResposta | undefined>();
  const [perfil, setPerfil] = useState<PerfilMestre | null | undefined>();
  const entradaRef = useRef<HTMLTextAreaElement>(null);
  const modelo = useMemo(() => montarInicioCopiloto(hoje, conversas, perfil, new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone), [hoje, conversas, perfil]);

  useEffect(() => {
    if (oportunidadeId) return;
    let ativo = true;
    getHoje().then((dados) => { if (ativo) setHoje(dados); }).catch(() => { if (ativo) setHoje(undefined); });
    getPerfil().then((dados) => { if (ativo) setPerfil(dados); }).catch(() => { if (ativo) setPerfil(undefined); });
    return () => { ativo = false; };
  }, [oportunidadeId]);

  useEffect(() => {
    if (!acaoInicial) return;
    const chave = `copiloto:acao:${acaoInicial.id}`;
    if (sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, '1');
    c.enviarNovaConversa(acaoInicial.mensagem);
  }, [acaoInicial?.id]);

  useEffect(() => {
    setAncora(null);
    if (!oportunidadeId) return;
    let ativo = true;
    getWorkspace(oportunidadeId)
      .then((w) => ativo && setAncora({ titulo: w.oportunidade.titulo, empresa: w.oportunidade.empresa }))
      .catch(() => {
        /* segue sem o rotulo da ancora */
      });
    return () => {
      ativo = false;
    };
  }, [oportunidadeId]);

  useEffect(() => {
    let ativo = true;
    listarConversasCopiloto(oportunidadeId)
      .then((itens) => ativo && setConversas(itens))
      .catch(() => ativo && setConversas([]));
    return () => {
      ativo = false;
    };
  }, [oportunidadeId, c.conversaId, c.streaming]);

  async function abrirConversa(id: string) {
    const conversa = await buscarConversaCopiloto(id);
    c.abrirHistorico(conversa);
    setHistoricoAberto(false);
  }

  const vazio = c.itens.length === 0;
  const esperandoPrimeiroToken =
    c.streaming &&
    !c.itens.some((it) => it.tipo === 'agente' && it.vivo) &&
    c.estado !== 'executando_leitura' &&
    c.estado !== 'executando_escrita';

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[760px] flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas py-3">
        <div className="flex items-center gap-2">
          <ModoToggle modo={c.modo} onTrocar={c.trocarModo} />
          {ancora && (
            <span className="hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12px] text-muted sm:inline-flex">
              <Compass className="size-3.5 text-accent" />
              <span className="max-w-[220px] truncate">
                {ancora.titulo}
                <span className="text-faint"> · {ancora.empresa}</span>
              </span>
            </span>
          )}
        </div>
        <div className="relative flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoricoAberto((aberto) => !aberto)}
            disabled={c.streaming}
          >
            <History />
            Conversas
          </Button>
          <Button variant="ghost" size="sm" onClick={c.novaConversa} disabled={vazio && !c.streaming}>
            <Plus />
            Nova conversa
          </Button>
          {historicoAberto && (
            <div className="absolute right-0 top-10 z-20 w-[min(22rem,calc(100vw-2rem))] rounded-card border border-line bg-ground p-2 shadow-float">
              {conversas.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-muted">Nenhuma conversa antiga encontrada.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {conversas.map((conversa) => (
                    <button
                      key={conversa.id}
                      type="button"
                      onClick={() => void abrirConversa(conversa.id)}
                      className="w-full rounded-control px-3 py-2 text-left text-[13px] hover:bg-accent-soft"
                    >
                      <span className="block truncate font-medium text-ink">{conversa.titulo}</span>
                      <span className="mt-0.5 block truncate text-[12px] text-muted">
                        {new Date(conversa.atualizadoEm).toLocaleString()} · {conversa.totalMensagens} mensagens
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 py-6">
        {vazio ? (
          oportunidadeId ? (
            <div className="flex flex-1 flex-col justify-center py-14">
              <h1 className="text-page text-ink">Conduza esta oportunidade em conversa</h1>
              <p className="mt-2 max-w-xl text-muted">Cole a descrição da vaga ou peça o próximo passo.</p>
            </div>
          ) : (
            <InicioCopiloto
              modelo={modelo}
              onConversa={(id) => void abrirConversa(id)}
              onHoje={onAbrirHoje}
              onWorkspace={onAbrirWorkspace}
              onCurriculo={onAbrirCurriculo}
              onPerfil={onAbrirPerfil}
              onAcao={onAcao}
            />
          )
        ) : (
          c.itens.map((item, i) => (
            <ItemRender
              key={item.id}
              item={item}
              anterior={c.itens[i - 1]}
              proximo={c.itens[i + 1]}
              onConfirmar={c.confirmar}
              onRecusar={c.recusar}
              onRepetir={c.repetir}
              onAbrirConta={onAbrirConta}
              bloqueado={c.streaming}
            />
          ))
        )}
        {esperandoPrimeiroToken && <PensandoIndicador />}
        {c.estado === 'autopiloto_parado_externo' && <AvisoParadoExterno />}
      </div>

      <div className="sticky bottom-0 z-10 flex flex-col gap-2 bg-canvas pb-4 pt-2">
        {vazio && !oportunidadeId && !modelo.semPerfil && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={() => entradaRef.current?.focus()}>Colar uma vaga nova</Button>
            <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={() => c.enviar('Qual vaga priorizo hoje?')}>Qual vaga priorizo hoje?</Button>
            <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={onImportarLote}>Importar vagas em lote</Button>
          </div>
        )}
        <BarraEstado estado={c.estado} streaming={c.streaming} />
        <Composer
          entradaRef={entradaRef}
          placeholder={vazio && modelo.semPerfil && !oportunidadeId ? 'Ou me diga em uma frase o que você faz' : undefined}
          textoRestaurado={c.rascunhoPendente}
          onEnviar={c.enviar}
          onParar={c.parar}
          streaming={c.streaming}
          bloqueado={bloqueado}
          autopiloto={c.modo === 'autopiloto'}
        />
      </div>
    </div>
  );
}

function ItemRender({
  item,
  anterior,
  proximo,
  onConfirmar,
  onRecusar,
  onRepetir,
  onAbrirConta,
  bloqueado,
}: {
  item: Item;
  anterior?: Item;
  proximo?: Item;
  onConfirmar: (callId: string, ajustes?: Record<string, unknown>) => void;
  onRecusar: (callId: string) => void;
  onRepetir: () => void;
  onAbrirConta: () => void;
  bloqueado: boolean;
}) {
  switch (item.tipo) {
    case 'usuario':
      return <MensagemUsuario texto={item.texto} />;
    case 'agente':
      return <MensagemAgente texto={item.texto} vivo={item.vivo} scoresAts={item.scoresAts} />;
    case 'passo':
      return (
        <PassoTrilha item={item} ligado={anterior?.tipo === 'passo' || proximo?.tipo === 'passo'} />
      );
    case 'operacao':
      return <OperacaoCorrente item={item} />;
    case 'preview_curriculo':
      return <CartaoPreviewCurriculo item={item} />;
    case 'confirmacao':
      return (
        <CartaoConfirmacao
          item={item}
          onConfirmar={onConfirmar}
          onRecusar={onRecusar}
          bloqueado={bloqueado}
        />
      );
    case 'entrega':
      return <CartaoEntrega item={item} />;
    case 'erro':
      return <CartaoErro item={item} onRepetir={onRepetir} bloqueado={bloqueado} onAbrirConta={onAbrirConta} />;
  }
}
