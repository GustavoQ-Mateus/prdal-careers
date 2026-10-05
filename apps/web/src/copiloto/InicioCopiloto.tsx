import { FileUp, Info, MessageSquare, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreNum } from '../components/Score';
import type { ModeloInicio, PassoInicio } from './inicio';

function Contagem({ valor }: { valor: number }) {
  return <span className="ml-1 font-mono text-[12px] tabular-nums text-faint">{valor}</span>;
}

function momento(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function InicioCopiloto({
  modelo,
  onConversa,
  onHoje,
  onWorkspace,
  onCurriculo,
  onPerfil,
  onAcao,
}: {
  modelo: ModeloInicio;
  onConversa: (id: string) => void;
  onHoje: () => void;
  onWorkspace: (id: string) => void;
  onCurriculo: (oportunidadeId: string, curriculoId: string) => void;
  onPerfil: () => void;
  onAcao: (oportunidadeId: string, mensagem: string) => void;
}) {
  if (modelo.semPerfil) {
    return (
      <div className="flex-1 py-8 sm:py-10">
        <span className="font-mono text-[12px] text-faint">primeiro acesso</span>
        <h1 className="mt-1 text-page text-ink">Antes de tudo, preciso conhecer sua trajetória.</h1>
        <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-muted">
          Todo currículo que eu preparar sai do seu perfil, e só dele. Sem perfil não dá para gerar nada honesto.
          Leva uns 10 minutos, ou menos se você já tem um currículo pronto.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={onPerfil} className="flex min-h-44 flex-col items-start gap-2.5 rounded-card border border-line-strong bg-ground p-5 text-left shadow-rest transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span className="flex size-9 items-center justify-center rounded-control bg-primary text-primary-fg"><FileUp className="size-[18px]" /></span>
            <span className="text-[15px] font-semibold text-ink">Importar meu currículo</span>
            <span className="text-[13px] leading-relaxed text-muted">Abra seu perfil para começar com as informações que já tem e conferir cada seção.</span>
            <span className="mt-auto text-[13px] font-semibold text-accent-ink">Recomendado</span>
          </button>
          <button type="button" onClick={onPerfil} className="flex min-h-44 flex-col items-start gap-2.5 rounded-card border border-line bg-ground p-5 text-left transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span className="flex size-9 items-center justify-center rounded-control border border-line bg-canvas text-ink-2"><Pencil className="size-[18px]" /></span>
            <span className="text-[15px] font-semibold text-ink">Preencher do zero</span>
            <span className="text-[13px] leading-relaxed text-muted">Cadastre cada experiência numa tela de perfil, seção por seção.</span>
          </button>
        </div>
        <div className="mt-7 flex items-start gap-2.5 rounded-card border border-dashed border-line-strong px-4 py-3.5 text-[13px] text-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-faint" />
          <span>Você já pode colar vagas enquanto isso. Eu guardo em <strong className="font-semibold text-ink-2">Entrada</strong> e analiso depois que o perfil existir.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-6 pt-8">
      <span className="font-mono text-[12px] text-faint">{modelo.data}</span>
      <h1 className="mt-1 text-page text-ink">
        {modelo.saudacao}{modelo.nome ? `, ${modelo.nome}` : ''}.
        {modelo.passos && (modelo.atrasados || modelo.paraResolver ? (
          <>{' '}Hoje tem {modelo.atrasados > 0 && <><span className="text-score-warn">{modelo.atrasados} passo{modelo.atrasados === 1 ? '' : 's'} atrasado{modelo.atrasados === 1 ? '' : 's'}</span>{modelo.paraResolver > 0 ? ' e ' : '.'}</>}{modelo.paraResolver > 0 ? `${modelo.paraResolver} para resolver.` : ''}</>
        ) : <> Hoje não tem passos pendentes.</>)}
      </h1>
      <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-muted">
        Montei este resumo a partir das suas oportunidades. Nada aqui chamou a IA; ela só entra quando você mandar uma mensagem ou escolher uma ação.
      </p>

      {modelo.conversa && (
        <button type="button" onClick={() => onConversa(modelo.conversa!.id)} className="mt-5 flex w-full items-center gap-3.5 rounded-card border border-line bg-ground px-4 py-3.5 text-left shadow-rest transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent-ink"><MessageSquare className="size-[18px]" /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-ink">Continuar: {modelo.conversa.titulo}</span>
            <span className="block truncate text-[13px] text-muted">{modelo.conversa.ultimaMensagem} · {momento(modelo.conversa.atualizadoEm)} · {modelo.conversa.totalMensagens} mensagens</span>
          </span>
          <span className="shrink-0 text-[13px] font-semibold text-accent-ink">Retomar</span>
        </button>
      )}

      {modelo.passos && (
        <section className="mt-8" aria-labelledby="inicio-passos">
          <div className="flex items-baseline justify-between gap-4 pb-2">
            <h2 id="inicio-passos" className="text-label uppercase text-muted">Próximos passos <Contagem valor={modelo.totalPassos} /></h2>
            <button type="button" onClick={onHoje} className="text-[13px] font-medium text-accent-ink hover:underline focus-visible:outline-none focus-visible:underline">Ver agenda</button>
          </div>
          {modelo.passos.length ? (
            <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-ground">
              {modelo.passos.map((passo: PassoInicio) => (
                <div key={passo.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                  <span className={`w-20 shrink-0 font-mono text-[12px] ${passo.atrasado ? 'text-score-warn' : 'text-ink-2'}`}>{passo.quando}</span>
                  <span className="min-w-[160px] flex-1 text-[14px]"><span className="font-medium text-ink">{passo.titulo}</span><span className="text-muted"> · {passo.empresa}</span></span>
                  <Button type="button" size="sm" variant={passo.mensagem ? 'secondary' : 'ghost'} onClick={() => passo.mensagem ? onAcao(passo.oportunidadeId, passo.mensagem) : onWorkspace(passo.oportunidadeId)}>{passo.botao}</Button>
                </div>
              ))}
            </div>
          ) : <p className="rounded-card border border-line bg-ground px-4 py-3 text-[13px] text-muted">Nenhum passo pendente. Você pode começar com uma vaga nova.</p>}
        </section>
      )}

      {(modelo.geracoes || modelo.entrada) && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {modelo.geracoes && <section aria-labelledby="inicio-geracoes">
            <h2 id="inicio-geracoes" className="pb-2 text-label uppercase text-muted">Gerações concluídas <Contagem valor={modelo.geracoes.length} /></h2>
            <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-ground">
              {modelo.geracoes.map((item) => <button key={item.curriculoId} type="button" onClick={() => onCurriculo(item.oportunidadeId, item.curriculoId)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
                <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink">{item.titulo} · {item.empresa}</span><span className="text-[12px] text-faint">{momento(item.concluidaEm)}</span></span>
                <ScoreNum valor={item.score} />
              </button>)}
            </div>
          </section>}
          {modelo.entrada && <section aria-labelledby="inicio-entrada">
            <h2 id="inicio-entrada" className="pb-2 text-label uppercase text-muted">Vagas em entrada <Contagem valor={modelo.entrada.length} /></h2>
            <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-ground">
              {modelo.entrada.map((item) => <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink">{item.titulo} · {item.empresa}</span><span className="text-[12px] text-faint">{momento(item.criadoEm)}</span></span>
                <Button type="button" size="sm" variant="secondary" onClick={() => onAcao(item.id, `Analisar a vaga ${item.titulo} na ${item.empresa}.`)}>Analisar</Button>
              </div>)}
            </div>
          </section>}
        </div>
      )}
    </div>
  );
}
