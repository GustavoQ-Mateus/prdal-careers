import { useEffect, useRef, useState } from 'react';
import {
  ativarEntrada,
  criarOportunidade,
  getLote,
  importarOportunidades,
  patchOportunidade,
  type ItemImportacao,
  type LoteStatus,
  type PrioridadeOportunidade,
} from './api';
import { ROTULO_PRIORIDADE } from './rotulos';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const PRIORIDADES: PrioridadeOportunidade[] = ['ALTA', 'MEDIA', 'BAIXA'];

export function RegistrarDialog({
  open,
  onOpenChange,
  onCriada,
  onImportou,
}: {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  onCriada: (id: string) => void;
  onImportou: () => void;
}) {
  const [modo, setModo] = useState<'individual' | 'lote'>('individual');
  const [titulo, setTitulo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fonte, setFonte] = useState('');
  const [json, setJson] = useState('');
  const [lote, setLote] = useState<LoteStatus | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      setModo('individual');
      setTitulo('');
      setEmpresa('');
      setDescricao('');
      setFonte('');
      setJson('');
      setLote(null);
      setErro(null);
      setEnviando(false);
      if (timer.current) clearInterval(timer.current);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [open]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const criada = await criarOportunidade({ titulo, empresa, descricao, fonte: fonte || undefined });
      onOpenChange(false);
      onCriada(criada.id);
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  function acompanhar(loteId: string) {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      try {
        const st = await getLote(loteId);
        setLote(st);
        if (st.status === 'CONCLUIDO') {
          if (timer.current) clearInterval(timer.current);
          onImportou();
        }
      } catch (err) {
        setErro((err as Error).message);
        if (timer.current) clearInterval(timer.current);
      }
    }, 1000);
  }

  async function importar() {
    setErro(null);
    try {
      const itens = json.trim() ? (JSON.parse(json) as ItemImportacao[]) : [];
      if (!Array.isArray(itens) || itens.length === 0) {
        setErro('Informe um JSON com ao menos um item.');
        return;
      }
      setEnviando(true);
      const { loteId } = await importarOportunidades(itens);
      acompanhar(loteId);
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar oportunidade</DialogTitle>
          <DialogDescription>
            Capture uma vaga individual ou importe um lote a partir de JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-fit rounded-control border border-line-strong p-0.5" role="tablist" aria-label="Modo de captura">
          {(['individual', 'lote'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={modo === m}
              onClick={() => setModo(m)}
              className={cn(
                'h-8 rounded-[6px] px-3 text-[13px] font-medium transition-colors',
                modo === m ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:text-ink',
              )}
            >
              {m === 'individual' ? 'Individual' : 'Importar lote'}
            </button>
          ))}
        </div>

        {erro && <p className="text-[13px] text-score-bad" role="alert">{erro}</p>}

        {modo === 'individual' ? (
          <form onSubmit={criar} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="op-titulo">Título</Label>
                <Input id="op-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="op-empresa">Empresa</Label>
                <Input id="op-empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="op-descricao">Descrição</Label>
              <Textarea
                id="op-descricao"
                rows={5}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="op-fonte">Link da vaga</Label>
              <Input id="op-fonte" value={fonte} onChange={(e) => setFonte(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Registrando' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="op-json">JSON</Label>
              <Textarea
                id="op-json"
                rows={7}
                value={json}
                onChange={(e) => setJson(e.target.value)}
                className="font-mono text-[13px]"
                placeholder={'[{"titulo":"...","empresa":"...","descricao":"..."}]'}
              />
            </div>
            {lote && (
              <div className="rounded-control border border-line bg-canvas px-3 py-2 text-[13px] text-muted" role="status">
                Lote {lote.status}: {lote.processados} de {lote.total}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button type="button" onClick={() => void importar()} disabled={enviando && !lote}>
                {enviando ? 'Importando' : 'Importar lote'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function EditarDialog({
  open,
  onOpenChange,
  id,
  titulo,
  prioridadeAtual,
  entrada,
  onSalvo,
  onAbrir,
}: {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  id: string;
  titulo: string;
  prioridadeAtual: PrioridadeOportunidade | null;
  entrada: boolean;
  onSalvo: () => void;
  onAbrir: (id: string) => void;
}) {
  const [prioridade, setPrioridade] = useState<PrioridadeOportunidade>(prioridadeAtual ?? 'MEDIA');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setPrioridade(prioridadeAtual ?? 'MEDIA');
      setErro(null);
      setEnviando(false);
    }
  }, [open, prioridadeAtual]);

  async function salvar() {
    setErro(null);
    setEnviando(true);
    try {
      await patchOportunidade(id, { prioridade });
      onOpenChange(false);
      onSalvo();
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  async function arquivar() {
    setErro(null);
    setEnviando(true);
    try {
      await patchOportunidade(id, { arquivar: true });
      onOpenChange(false);
      onSalvo();
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  async function ativar() {
    setErro(null);
    setEnviando(true);
    try {
      const vaga = await ativarEntrada(id);
      onOpenChange(false);
      onAbrir(vaga.id);
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar oportunidade</DialogTitle>
          <DialogDescription>{titulo}</DialogDescription>
        </DialogHeader>

        {erro && <p className="text-[13px] text-score-bad" role="alert">{erro}</p>}

        {entrada ? (
          <p className="text-[14px] text-ink-2">
            Esta oportunidade está na entrada. Ative para trabalhar prioridade, etapa e candidatura.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="op-prioridade">Prioridade</Label>
            <NativeSelect
              id="op-prioridade"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as PrioridadeOportunidade)}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>{ROTULO_PRIORIDADE[p]}</option>
              ))}
            </NativeSelect>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          {entrada ? (
            <span />
          ) : (
            <Button type="button" variant="destructive" onClick={() => void arquivar()} disabled={enviando}>
              Arquivar
            </Button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {entrada ? (
              <Button type="button" onClick={() => void ativar()} disabled={enviando}>
                Ativar
              </Button>
            ) : (
              <Button type="button" onClick={() => void salvar()} disabled={enviando}>
                {enviando ? 'Salvando' : 'Salvar'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
