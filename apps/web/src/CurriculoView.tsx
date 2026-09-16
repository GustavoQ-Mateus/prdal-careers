import { useEffect, useState } from 'react';
import { baixarArquivo, editarCurriculo, getCurriculo, type Curriculo } from './api';
import { fmtData } from './ui';
import { Breakdown, ScoreMeter, ScoreNum } from './components/Score';
import { Markdown } from './components/Markdown';
import { VagaVersoes } from './VagaVersoes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function CurriculoView({
  id,
  onAbrirVersao,
}: {
  id: string;
  onAbrirVersao: (curriculoId: string) => void;
}) {
  const [curriculo, setCurriculo] = useState<Curriculo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [rotulo, setRotulo] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setEditando(false);
    getCurriculo(id)
      .then((c) => {
        setCurriculo(c);
        setMarkdown(c.markdown);
        setRotulo(c.rotulo);
      })
      .catch((err) => setErro((err as Error).message));
  }, [id]);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await editarCurriculo(id, { markdown, rotulo });
      setCurriculo(atualizado);
      setMarkdown(atualizado.markdown);
      setRotulo(atualizado.rotulo);
      setEditando(false);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  function cancelar() {
    if (!curriculo) return;
    setEditando(false);
    setMarkdown(curriculo.markdown);
    setRotulo(curriculo.rotulo);
  }

  if (erro && !curriculo) {
    return (
      <div
        className="rounded-card border border-score-bad/40 bg-ground px-4 py-3 text-[14px] text-score-bad"
        role="alert"
      >
        {erro}
      </div>
    );
  }
  if (!curriculo) return <p className="py-10 text-[14px] text-muted">Carregando currículo...</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div className="min-w-0">
          <h2 className="truncate text-page text-ink">{curriculo.rotulo}</h2>
          <p className="mt-1 text-[13px] text-muted">Gerado {fmtData(curriculo.geradoEm)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {editando ? (
            <>
              <Button variant="ghost" onClick={cancelar} disabled={salvando}>
                Cancelar
              </Button>
              <Button onClick={() => void salvar()} disabled={salvando}>
                {salvando ? 'Recalculando...' : 'Salvar e recalcular'}
              </Button>
            </>
          ) : (
            <>
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
              <Button variant="secondary" onClick={() => setEditando(true)}>
                Editar markdown
              </Button>
            </>
          )}
        </div>
      </div>

      {erro && (
        <div
          className="rounded-control border border-score-bad/40 bg-ground px-3 py-2 text-[13px] text-score-bad"
          role="alert"
        >
          {erro}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <section>
            <h3 className="text-label uppercase text-muted">Score ATS</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[44px] font-bold leading-none">
                <ScoreNum valor={curriculo.score} />
              </span>
              <span className="text-label uppercase text-muted">/ 100</span>
            </div>
            <div className="mt-3">
              <ScoreMeter valor={curriculo.score} />
            </div>
          </section>
          <section className="border-t border-line pt-6">
            <h3 className="text-label uppercase text-muted">Diagnóstico</h3>
            <div className="mt-3">
              <Breakdown breakdown={curriculo.breakdown} />
            </div>
          </section>
        </aside>

        <section className="min-w-0">
          {editando ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cv-rotulo">Rótulo da versão</Label>
                <Input id="cv-rotulo" value={rotulo} onChange={(e) => setRotulo(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cv-markdown">Markdown</Label>
                <Textarea
                  id="cv-markdown"
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  rows={28}
                  className="min-h-[560px] font-mono text-[13px] leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-card border border-line bg-ground p-6 nav:p-8">
              <Markdown source={curriculo.markdown} />
            </div>
          )}
        </section>
      </div>

      <VagaVersoes vagaId={curriculo.vagaId} atualId={curriculo.id} onAbrir={onAbrirVersao} />
    </div>
  );
}
