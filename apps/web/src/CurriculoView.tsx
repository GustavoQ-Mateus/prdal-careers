import { useEffect, useState } from 'react';
import { baixarArquivo, getCurriculo, type Curriculo } from './api';

export function CurriculoView({ id, onFechar }: { id: string; onFechar: () => void }) {
  const [curriculo, setCurriculo] = useState<Curriculo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    getCurriculo(id)
      .then(setCurriculo)
      .catch((err) => setErro((err as Error).message));
  }, [id]);

  if (erro) return <p style={{ color: 'crimson' }}>{erro}</p>;
  if (!curriculo) return <p>Carregando curriculo...</p>;

  const { score, breakdown } = curriculo;

  return (
    <section style={{ maxWidth: 640 }}>
      <button onClick={onFechar}>Voltar</button>
      <h2>Curriculo gerado</h2>
      <p>
        Score ATS: <strong>{score}</strong> / 100
      </p>
      <ul>
        <li>Match de keywords: {breakdown.keywordMatch}</li>
        <li>Densidade: {breakdown.densidade}</li>
        <li>Secoes: {breakdown.secoes}</li>
        {breakdown.faltando.length > 0 && <li>Faltando: {breakdown.faltando.join(', ')}</li>}
      </ul>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {curriculo.downloadDocxUrl ? (
          <button onClick={() => baixarArquivo(curriculo.downloadDocxUrl!, 'curriculo.docx')}>
            Baixar .docx
          </button>
        ) : (
          <span style={{ color: '#a60' }}>Download .docx indisponivel</span>
        )}
        {curriculo.downloadPdfUrl ? (
          <button onClick={() => baixarArquivo(curriculo.downloadPdfUrl!, 'curriculo.pdf')}>
            Baixar .pdf
          </button>
        ) : (
          <span style={{ color: '#a60' }}>Download .pdf indisponivel</span>
        )}
      </div>
      <h3>Markdown</h3>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 12, borderRadius: 8 }}>
        {curriculo.markdown}
      </pre>
    </section>
  );
}
