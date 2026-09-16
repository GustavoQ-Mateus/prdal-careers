import { useState } from 'react';
import {
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  CopyCheck,
  Eye,
  Loader2,
  PenLine,
  RotateCcw,
  Square,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ModoCopiloto } from '../api';
import {
  ESTADO_META,
  rotuloEntrega,
  rotuloTool,
  resumirResultado,
  type EstadoCopiloto,
  type Item,
} from './tipos';

export function ModoToggle({
  modo,
  onModo,
  disabled,
}: {
  modo: ModoCopiloto;
  onModo: (m: ModoCopiloto) => void;
  disabled?: boolean;
}) {
  const opcoes: { valor: ModoCopiloto; nome: string }[] = [
    { valor: 'assistido', nome: 'Assistido' },
    { valor: 'autopiloto', nome: 'Autopiloto' },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Modo do copiloto"
      className="inline-flex rounded-control border border-line-strong bg-ground p-0.5"
    >
      {opcoes.map((o) => {
        const ativo = modo === o.valor;
        return (
          <button
            key={o.valor}
            role="radio"
            aria-checked={ativo}
            disabled={disabled}
            onClick={() => onModo(o.valor)}
            className={cn(
              'h-7 rounded-[6px] px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50',
              ativo ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:text-ink',
            )}
          >
            {o.nome}
          </button>
        );
      })}
    </div>
  );
}

export function BarraEstado({ estado, streaming }: { estado: EstadoCopiloto; streaming: boolean }) {
  const meta = ESTADO_META[estado];
  const ativo = streaming || estado === 'aguardando_confirmacao';
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted" role="status" aria-live="polite">
      <span
        className={cn(
          'size-1.5 rounded-full',
          estado === 'erro_turno'
            ? 'bg-score-bad'
            : ativo
              ? 'bg-accent motion-safe:animate-pulse'
              : 'bg-faint',
        )}
      />
      <span className="font-medium text-ink-2">{meta.rotulo}</span>
      <span className="text-faint">{meta.ajuda}</span>
    </div>
  );
}

export function MensagemUsuario({ texto }: { texto: string }) {
  return (
    <div className="flex justify-end motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
      <div className="max-w-[85%] rounded-card rounded-tr-sm border border-line-strong bg-ground px-3.5 py-2 text-[14px] text-ink shadow-rest">
        <span className="mb-1 block text-label uppercase text-faint">Você</span>
        <p className="whitespace-pre-wrap leading-relaxed">{texto}</p>
      </div>
    </div>
  );
}

export function MensagemAgente({ texto, vivo }: { texto: string; vivo: boolean }) {
  return (
    <div className="max-w-[92%] text-[15px] leading-relaxed text-ink-2">
      <span className="whitespace-pre-wrap">{texto}</span>
      {vivo && (
        <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-accent motion-safe:animate-pulse" />
      )}
    </div>
  );
}

export function PensandoIndicador() {
  return (
    <div className="flex items-center gap-1 py-1 text-faint" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-faint motion-safe:animate-bounce"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function IconeEfeito({ efeito }: { efeito: 'leitura' | 'escrita' }) {
  const Icon = efeito === 'escrita' ? PenLine : Eye;
  return <Icon className="size-3.5" />;
}

export function PassoTrilha({ item, ligado }: { item: Extract<Item, { tipo: 'passo' }>; ligado: boolean }) {
  const [aberto, setAberto] = useState(false);
  const executando = item.status === 'executando';
  const falhou = item.status === 'erro';

  return (
    <div className="relative pl-9 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
      {ligado && <span className="absolute left-[15px] top-0 h-full w-px bg-line" aria-hidden />}
      <span
        className={cn(
          'absolute left-2 top-[3px] flex size-6 items-center justify-center rounded-full border bg-ground',
          falhou
            ? 'border-score-bad text-score-bad'
            : executando
              ? 'border-accent text-accent'
              : 'border-line-strong text-muted',
        )}
      >
        {executando ? <Loader2 className="size-3.5 animate-spin" /> : <IconeEfeito efeito={item.efeito} />}
      </span>

      <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[14px] font-medium text-ink">{rotuloTool(item.tool)}</span>
        <span
          className={cn(
            'rounded-full border px-1.5 py-px text-[11px] font-medium',
            item.efeito === 'escrita'
              ? 'border-line-strong text-muted'
              : 'border-line text-faint',
          )}
        >
          {item.efeito}
        </span>
        {item.status === 'ok' && (
          <span className="inline-flex items-center gap-1 text-[13px] text-muted">
            <Check className="size-3.5 text-score-good" />
            {resumirResultado(item.tool, item.resultado)}
          </span>
        )}
        {falhou && (
          <span className="inline-flex items-center gap-1 text-[13px] text-score-bad">
            <TriangleAlert className="size-3.5" />
            {item.erro ?? 'falha na execução'}
          </span>
        )}
      </div>

      {item.status === 'ok' && item.resultado != null && (
        <div className="mt-1">
          <button
            onClick={() => setAberto((v) => !v)}
            className="inline-flex items-center gap-1 text-[12px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronDown className={cn('size-3.5 transition-transform', aberto && 'rotate-180')} />
            {aberto ? 'Ocultar retorno' : 'Ver retorno'}
          </button>
          {aberto && (
            <pre className="mt-1.5 max-h-64 overflow-auto rounded-control border border-line bg-canvas p-3 font-mono text-[12px] leading-relaxed text-ink-2">
              {JSON.stringify(item.resultado, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function argsEditaveis(args: Record<string, unknown>): [string, string][] {
  return Object.entries(args).filter(([, v]) => typeof v === 'string') as [string, string][];
}

export function CartaoConfirmacao({
  item,
  onConfirmar,
  onRecusar,
  bloqueado,
}: {
  item: Extract<Item, { tipo: 'confirmacao' }>;
  onConfirmar: (callId: string, ajustes?: Record<string, unknown>) => void;
  onRecusar: (callId: string) => void;
  bloqueado: boolean;
}) {
  const editaveis = argsEditaveis(item.args);
  const [ajustando, setAjustando] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(editaveis),
  );
  const resolvido = item.decisao;

  function confirmar() {
    let ajustes: Record<string, unknown> | undefined;
    if (ajustando) {
      const mudados = editaveis.filter(([k, v]) => valores[k] !== v);
      if (mudados.length > 0) ajustes = Object.fromEntries(mudados.map(([k]) => [k, valores[k]]));
    }
    onConfirmar(item.callId, ajustes);
  }

  return (
    <div
      className={cn(
        'rounded-card border border-line-strong bg-ground shadow-rest motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1',
        !resolvido && 'border-l-2 border-l-accent',
      )}
    >
      <div className="flex flex-col gap-1 p-4">
        <span className="text-label uppercase text-accent-ink">Confirmação necessária</span>
        <p className="text-[15px] font-medium text-ink">{item.resumo}</p>
        <p className="text-[13px] text-muted">
          {rotuloTool(item.tool)}. Nada foi gravado até você confirmar.
        </p>
      </div>

      {editaveis.length > 0 && !resolvido && (
        <div className="border-t border-line px-4 py-3">
          <button
            onClick={() => setAjustando((v) => !v)}
            className="inline-flex items-center gap-1 text-[12px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronDown className={cn('size-3.5 transition-transform', ajustando && 'rotate-180')} />
            Ajustar antes de confirmar
          </button>
          {ajustando && (
            <div className="mt-3 flex flex-col gap-2.5">
              {editaveis.map(([k, v]) => (
                <label key={k} className="flex flex-col gap-1">
                  <span className="text-label uppercase text-faint">{k}</span>
                  <Input
                    value={valores[k] ?? v}
                    onChange={(e) => setValores((s) => ({ ...s, [k]: e.target.value }))}
                    className="h-8 text-[13px]"
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
        {resolvido ? (
          <span className="text-[13px] text-muted">
            {resolvido === 'confirmar' ? 'Confirmado' : 'Recusado, nada foi gravado'}
          </span>
        ) : (
          <>
            <Button variant="ghost" size="sm" disabled={bloqueado} onClick={() => onRecusar(item.callId)}>
              Recusar
            </Button>
            <Button size="sm" disabled={bloqueado} onClick={confirmar}>
              Confirmar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function CartaoEntrega({ item }: { item: Extract<Item, { tipo: 'entrega' }> }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(item.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponivel */
    }
  }

  return (
    <div className="rounded-card border border-line-strong bg-ground shadow-rest motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
      <div className="flex items-start justify-between gap-3 border-b border-line p-4">
        <div className="min-w-0">
          <span className="text-label uppercase text-muted">{rotuloEntrega(item.kind)}</span>
          <p className="mt-0.5 truncate text-[15px] font-medium text-ink">{item.titulo}</p>
          {item.destino && <p className="text-[12px] text-faint">Para {item.destino}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={copiar} className="shrink-0">
          {copiado ? <CopyCheck className="text-score-good" /> : <Copy />}
          {copiado ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      <div className="p-4">
        <p className="whitespace-pre-wrap rounded-control border border-line bg-canvas p-3 text-[14px] leading-relaxed text-ink-2">
          {item.texto}
        </p>
        <p className="mt-2.5 text-[12px] text-muted">
          O envio é seu. O copiloto prepara o texto e nunca envia por você.
        </p>
      </div>
    </div>
  );
}

export function CartaoErro({
  item,
  onRepetir,
  bloqueado,
}: {
  item: Extract<Item, { tipo: 'erro' }>;
  onRepetir: () => void;
  bloqueado: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-score-bad/40 bg-ground px-4 py-3 motion-safe:animate-in motion-safe:fade-in">
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-score-bad" />
        <div>
          <p className="text-[14px] text-ink">{item.mensagem}</p>
          <p className="text-[12px] text-muted">A conversa foi preservada. Você pode repetir o turno.</p>
        </div>
      </div>
      <Button variant="secondary" size="sm" disabled={bloqueado} onClick={onRepetir}>
        <RotateCcw />
        Repetir turno
      </Button>
    </div>
  );
}

export function Composer({
  onEnviar,
  onParar,
  streaming,
  bloqueado,
  autopiloto,
}: {
  onEnviar: (texto: string) => void;
  onParar: () => void;
  streaming: boolean;
  bloqueado: boolean;
  autopiloto: boolean;
}) {
  const [texto, setTexto] = useState('');

  function enviar() {
    if (!texto.trim() || bloqueado) return;
    onEnviar(texto);
    setTexto('');
  }

  return (
    <div className="rounded-card border border-line-strong bg-ground p-2 shadow-rest">
      <Textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviar();
          }
        }}
        disabled={bloqueado}
        rows={1}
        placeholder={
          bloqueado
            ? 'Responda à confirmação acima para seguir'
            : autopiloto
              ? 'Diga o objetivo e o copiloto encadeia o loop'
              : 'Cole uma vaga ou peça o próximo passo'
        }
        className="min-h-[44px] resize-none border-0 bg-transparent px-2 py-2 text-[15px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <span className="text-[11px] text-faint">Enter envia, Shift Enter quebra linha</span>
        {streaming ? (
          <Button variant="secondary" size="sm" onClick={onParar}>
            <Square className="size-3.5" />
            Parar
          </Button>
        ) : (
          <Button size="icon" aria-label="Enviar" disabled={bloqueado || !texto.trim()} onClick={enviar}>
            <ArrowUp />
          </Button>
        )}
      </div>
    </div>
  );
}
