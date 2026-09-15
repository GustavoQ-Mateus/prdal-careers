import React from 'react';
import { cn } from '@/lib/utils';

function inline(text: string, base: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(
        <strong key={`${base}-b${i}`} className="font-semibold text-ink">
          {m[2]}
        </strong>,
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <code key={`${base}-c${i}`} className="rounded bg-canvas px-1 py-0.5 font-mono text-[13px] text-ink">
          {m[3]}
        </code>,
      );
    } else if (m[4] !== undefined) {
      nodes.push(
        <a
          key={`${base}-a${i}`}
          href={m[5]}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline underline-offset-2"
        >
          {m[4]}
        </a>,
      );
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const ESPECIAL = /^(#{1,6})\s|^\s*[-*]\s|^\s*\d+\.\s|^(-{3,}|\*{3,}|_{3,})\s*$/;

export function Markdown({ source, className }: { source: string; className?: string }) {
  const linhas = source.replace(/\r\n/g, '\n').split('\n');
  const blocos: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < linhas.length) {
    const linha = linhas[i];
    if (!linha.trim()) {
      i++;
      continue;
    }

    const h = linha.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const nivel = h[1].length;
      const cls =
        nivel === 1
          ? 'text-[22px] font-bold text-ink mt-6 first:mt-0'
          : nivel === 2
            ? 'text-[17px] font-semibold text-ink mt-5 border-b border-line pb-1'
            : 'text-[15px] font-semibold text-ink mt-4';
      blocos.push(
        React.createElement(`h${Math.min(nivel, 6)}`, { key: key++, className: cls }, inline(h[2], `h${key}`)),
      );
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(linha.trim())) {
      blocos.push(<hr key={key++} className="my-4 border-line" />);
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(linha)) {
      const itens: React.ReactNode[] = [];
      while (i < linhas.length && /^\s*[-*]\s+/.test(linhas[i])) {
        const t = linhas[i].replace(/^\s*[-*]\s+/, '');
        itens.push(
          <li key={itens.length} className="list-disc marker:text-faint">
            {inline(t, `li${key}-${itens.length}`)}
          </li>,
        );
        i++;
      }
      blocos.push(
        <ul key={key++} className="ml-5 flex flex-col gap-1 text-ink-2">
          {itens}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(linha)) {
      const itens: React.ReactNode[] = [];
      while (i < linhas.length && /^\s*\d+\.\s+/.test(linhas[i])) {
        const t = linhas[i].replace(/^\s*\d+\.\s+/, '');
        itens.push(
          <li key={itens.length} className="list-decimal marker:text-faint">
            {inline(t, `ol${key}-${itens.length}`)}
          </li>,
        );
        i++;
      }
      blocos.push(
        <ol key={key++} className="ml-6 flex flex-col gap-1 text-ink-2">
          {itens}
        </ol>,
      );
      continue;
    }

    const paragrafo: string[] = [];
    while (i < linhas.length && linhas[i].trim() && !ESPECIAL.test(linhas[i])) {
      paragrafo.push(linhas[i]);
      i++;
    }
    blocos.push(
      <p key={key++} className="leading-relaxed text-ink-2">
        {inline(paragrafo.join(' '), `p${key}`)}
      </p>,
    );
  }

  return <div className={cn('flex flex-col gap-2', className)}>{blocos}</div>;
}
