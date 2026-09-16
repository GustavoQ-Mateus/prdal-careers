import { useEffect, useRef, useState } from 'react';
import {
  getContextoStatus,
  getLote,
  reindexarContexto,
  uploadContexto,
  type ContextoStatus,
  type LoteStatus,
} from './api';
import { fmtData } from './ui';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-[14px] text-muted">{rotulo}</dt>
      <dd className="font-mono text-[14px] tabular-nums text-ink">{valor}</dd>
    </div>
  );
}

export function BaseConhecimento() {
  const [status, setStatus] = useState<ContextoStatus | null>(null);
  const [statusErro, setStatusErro] = useState<string | null>(null);
  const [lote, setLote] = useState<LoteStatus | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function carregar() {
    getContextoStatus()
      .then((s) => {
        setStatus(s);
        setStatusErro(null);
      })
      .catch(() => setStatusErro('Não foi possível consultar o índice agora.'));
  }

  useEffect(carregar, []);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function acompanhar(loteId: string) {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      try {
        const st = await getLote(loteId);
        setLote(st);
        if (st.status === 'CONCLUIDO') {
          if (timer.current) clearInterval(timer.current);
          carregar();
        }
      } catch (err) {
        if (timer.current) clearInterval(timer.current);
        setErro((err as Error).message);
      }
    }, 1000);
  }

  async function reindexar() {
    setErro(null);
    try {
      const { loteId } = await reindexarContexto();
      acompanhar(loteId);
    } catch {
      setErro('Não foi possível iniciar a reindexação agora. O serviço pode estar indisponível.');
    }
  }

  async function enviar(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return;
    setErro(null);
    try {
      const { loteId } = await uploadContexto(Array.from(arquivos));
      acompanhar(loteId);
    } catch {
      setErro('Não foi possível enviar as notas agora. O serviço pode estar indisponível.');
    }
  }

  const processando = !!lote && lote.status !== 'CONCLUIDO';
  const estadoServico = processando
    ? 'Indexando'
    : statusErro || status?.disponivel === false
      ? 'Indisponível'
      : status
        ? 'Disponível'
        : '--';

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-section text-ink">Estado do índice</h2>
        {statusErro && (
          <p
            className="mt-3 rounded-control border border-score-warn/40 bg-ground px-3 py-2 text-[13px] text-score-warn"
            role="status"
          >
            {statusErro} O que já foi indexado continua valendo para a geração.
          </p>
        )}
        <dl className="mt-3 divide-y divide-line border-t border-line">
          <Linha rotulo="Documentos indexados" valor={status?.documentos ?? '--'} />
          <Linha rotulo="Última indexação" valor={status ? fmtData(status.ultimaIndexacao) : '--'} />
          <Linha rotulo="Estado do serviço" valor={estadoServico} />
          {processando && lote && (
            <Linha rotulo="Lote atual" valor={`${lote.processados}/${lote.total}`} />
          )}
        </dl>
      </section>

      <section>
        <h2 className="text-section text-ink">Distribuição por origem</h2>
        <dl className="mt-3 divide-y divide-line border-t border-line">
          <Linha rotulo="Perfil" valor={status?.porOrigem?.perfil ?? '--'} />
          <Linha rotulo="Candidatura" valor={status?.porOrigem?.candidatura ?? '--'} />
          <Linha rotulo="Nota" valor={status?.porOrigem?.nota ?? '--'} />
        </dl>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-section text-ink">Atualizar contexto</h2>
          <Button variant="secondary" onClick={() => setAberto(true)}>
            Atualizar base
          </Button>
        </div>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
          A base usa seu histórico real, perfil, candidaturas e notas, para selecionar os trechos
          mais relevantes durante a geração de cada currículo. A geração continua disponível mesmo
          sem um índice.
        </p>
        {processando && (
          <p className="mt-3 text-[13px] text-muted" role="status">
            Indexando o lote {lote?.processados}/{lote?.total}. Você pode continuar usando o app.
          </p>
        )}
      </section>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar contexto</DialogTitle>
            <DialogDescription>
              Reindexe o histórico ou envie notas em Markdown para enriquecer a base.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-label uppercase text-muted">Reindexar histórico</span>
              <p className="text-[13px] text-muted">
                Recria o índice a partir de perfil, candidaturas e notas já registrados.
              </p>
              <div className="mt-1">
                <Button variant="secondary" onClick={() => void reindexar()} disabled={processando}>
                  {processando ? 'Indexando...' : 'Reindexar histórico'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-line pt-4">
              <span className="text-label uppercase text-muted">Enviar notas</span>
              <p className="text-[13px] text-muted">Arquivos .md com contexto adicional seu.</p>
              <div className="mt-1">
                <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={processando}>
                  Selecionar notas .md
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".md"
                  multiple
                  hidden
                  onChange={(e) => {
                    void enviar(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {processando && lote && (
              <p className="text-[13px] text-muted" role="status">
                Lote {lote.processados}/{lote.total} {lote.status.toLowerCase()}.
              </p>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
