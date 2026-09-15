import { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  baixarArquivo,
  gerarCvOportunidade,
  getContextoStatus,
  getCurriculo,
  getGeracao,
  type ContextoStatus,
  type Curriculo,
  type Keyword,
  type StatusGeracaoCurriculo,
} from './api';
import { Breakdown, ScoreNum } from './components/Score';
import { Markdown } from './components/Markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PASSOS = [
  { titulo: 'Analisar', descricao: 'Vaga e contexto' },
  { titulo: 'Gerar', descricao: 'LLM, RAG, Perfil e notas' },
  { titulo: 'Revisar', descricao: 'Score e exportacao' },
] as const;

function passoDeStatus(status: StatusGeracaoCurriculo): number {
  if (status === 'GERANDO') return 1;
  if (status === 'VALIDANDO' || status === 'CONCLUIDA') return 2;
  return 0;
}

export function GeracaoWizard({
  open,
  onOpenChange,
  oportunidadeId,
  titulo,
  empresa,
  keywords,
  onConcluida,
  onAbrirCurriculo,
}: {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  oportunidadeId: string;
  titulo: string;
  empresa: string;
  keywords: Keyword[];
  onConcluida: () => void;
  onAbrirCurriculo: (curriculoId: string) => void;
}) {
  const [passo, setPasso] = useState(0);
  const [status, setStatus] = useState<StatusGeracaoCurriculo | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [curriculo, setCurriculo] = useState<Curriculo | null>(null);
  const [contexto, setContexto] = useState<ContextoStatus | null>(null);
  const [contextoErro, setContextoErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPasso(0);
    setStatus(null);
    setJobId(null);
    setErro(null);
    setCurriculo(null);
    setContexto(null);
    setContextoErro(null);
    getContextoStatus()
      .then(setContexto)
      .catch(() => setContextoErro('Contexto RAG indisponivel no momento.'));
  }, [open]);

  useEffect(() => {
    if (!jobId) return;
    const timer = setInterval(async () => {
      try {
        const g = await getGeracao(jobId);
        if (g.status !== 'ERRO') {
          setStatus(g.status);
          setPasso(passoDeStatus(g.status));
        }
        if (g.status === 'CONCLUIDA' && g.curriculoId) {
          clearInterval(timer);
          setJobId(null);
          try {
            const cv = await getCurriculo(g.curriculoId);
            setCurriculo(cv);
          } catch (err) {
            setErro((err as Error).message);
          }
          onConcluida();
        }
        if (g.status === 'ERRO') {
          clearInterval(timer);
          setJobId(null);
          setErro(g.erro ?? 'Falha na geracao do curriculo.');
        }
      } catch (err) {
        clearInterval(timer);
        setJobId(null);
        setErro((err as Error).message);
      }
    }, 1200);
    return () => clearInterval(timer);
  }, [jobId]);

  const gerando = !!jobId;

  async function iniciar() {
    setErro(null);
    try {
      const { jobId: novo } = await gerarCvOportunidade(oportunidadeId);
      setJobId(novo);
      setStatus('PENDENTE');
      setPasso(0);
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  const ragIndisponivel =
    !!contextoErro || contexto?.disponivel === false || (contexto?.documentos ?? 0) === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-5">
        <DialogHeader>
          <DialogTitle>Geracao de curriculo ATS</DialogTitle>
          <DialogDescription>
            {titulo} · {empresa}
          </DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2" aria-label="Progresso da geracao">
          {PASSOS.map((p, i) => {
            const estado: 'feito' | 'atual' | 'erro' | 'pendente' =
              !!erro && i === passo && !curriculo
                ? 'erro'
                : curriculo || i < passo
                  ? 'feito'
                  : i === passo
                    ? 'atual'
                    : 'pendente';
            const feito = estado === 'feito';
            return (
              <li key={p.titulo} className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold tabular-nums',
                      estado === 'erro'
                        ? 'border-score-bad text-score-bad'
                        : feito
                          ? 'border-accent bg-accent text-accent-fg'
                          : estado === 'atual'
                            ? 'border-accent text-accent'
                            : 'border-line-strong text-faint',
                    )}
                  >
                    {feito ? <Check className="size-4" /> : i + 1}
                  </span>
                  <div className="hidden sm:block">
                    <div
                      className={cn(
                        'text-[13px] font-medium',
                        estado === 'atual' || feito ? 'text-ink' : 'text-muted',
                      )}
                    >
                      {p.titulo}
                    </div>
                    <div className="text-[12px] text-faint">{p.descricao}</div>
                  </div>
                </div>
                {i < PASSOS.length - 1 && (
                  <div className={cn('h-px flex-1', feito ? 'bg-accent' : 'bg-line')} />
                )}
              </li>
            );
          })}
        </ol>

        <div className="max-h-[62vh] overflow-y-auto">
          {erro && (
            <div
              className="mb-4 rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad"
              role="alert"
            >
              {erro}
            </div>
          )}

          {!curriculo && passo === 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] text-ink-2">
                A geracao analisa a vaga, recupera o contexto do RAG e combina Perfil e notas para
                produzir a versao tailored e medir o score determinístico.
              </p>

              {keywords.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-label uppercase text-muted">Keywords da vaga</span>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.slice(0, 16).map((k) => (
                      <Badge key={k.termo} variant="neutral">
                        {k.termo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-label uppercase text-muted">Contexto de recuperacao</span>
                {ragIndisponivel ? (
                  <p className="rounded-control border border-score-warn/40 bg-ground px-3 py-2 text-[13px] text-score-warn">
                    {contextoErro ??
                      'Nenhum documento indexado. A geracao segue apenas com Perfil e notas.'}
                  </p>
                ) : (
                  <p className="text-[13px] text-muted">
                    {contexto?.documentos} documentos indexados disponíveis para recuperacao.
                  </p>
                )}
              </div>

              <div>
                <Button onClick={() => void iniciar()} disabled={gerando}>
                  {gerando ? (
                    <>
                      <Loader2 className="animate-spin" /> Analisando
                    </>
                  ) : (
                    'Iniciar geracao'
                  )}
                </Button>
              </div>
            </div>
          )}

          {!curriculo && passo === 1 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
              <Loader2 className="size-5 animate-spin text-accent" />
              <p className="text-[14px] text-ink-2">Gerando o curriculo com LLM, RAG, Perfil e notas...</p>
            </div>
          )}

          {!curriculo && passo === 2 && status === 'VALIDANDO' && (
            <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
              <Loader2 className="size-5 animate-spin text-accent" />
              <p className="text-[14px] text-ink-2">Validando o score ATS...</p>
            </div>
          )}

          {curriculo && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)]">
                <div className="flex flex-col gap-4 rounded-card border border-line bg-ground p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[40px] font-bold leading-none">
                      <ScoreNum valor={curriculo.score} />
                    </span>
                    <span className="text-label uppercase text-muted">/ 100</span>
                  </div>
                  <Breakdown breakdown={curriculo.breakdown} />
                </div>
                <div className="rounded-card border border-line bg-ground p-5">
                  <Markdown source={curriculo.markdown} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {curriculo.downloadDocxUrl ? (
                  <Button
                    variant="secondary"
                    onClick={() => void baixarArquivo(curriculo.downloadDocxUrl!, `${curriculo.rotulo}.docx`)}
                  >
                    Baixar .docx
                  </Button>
                ) : (
                  <span className="text-[13px] text-faint">.docx indisponível</span>
                )}
                {curriculo.downloadPdfUrl ? (
                  <Button
                    variant="secondary"
                    onClick={() => void baixarArquivo(curriculo.downloadPdfUrl!, `${curriculo.rotulo}.pdf`)}
                  >
                    Baixar .pdf
                  </Button>
                ) : (
                  <span className="text-[13px] text-faint">.pdf indisponível</span>
                )}
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" onClick={() => void iniciar()} disabled={gerando}>
                    Gerar nova versao
                  </Button>
                  <Button onClick={() => onAbrirCurriculo(curriculo.id)}>Abrir curriculo</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
