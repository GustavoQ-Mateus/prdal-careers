import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

function Fallback({ erro, onTentar }: { erro: Error; onTentar: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center px-6 py-16 nav:px-8">
      <div className="w-full max-w-md">
        <h2 className="text-page text-ink">Esta área não pode ser exibida</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Algo falhou ao montar esta tela e o restante do aplicativo segue disponível. Suas
          informações estão seguras. Tente de novo ou use a navegação para abrir outra área.
        </p>
        <div className="mt-5">
          <Button onClick={onTentar}>Tentar de novo</Button>
        </div>
        <details className="mt-6">
          <summary className="cursor-pointer text-[12px] text-faint">Detalhe técnico</summary>
          <p className="mt-2 break-words font-mono text-[11px] text-faint">{erro.message}</p>
        </details>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  { children: ReactNode; resetKey?: unknown; onReset?: () => void },
  { erro: Error | null }
> {
  state: { erro: Error | null } = { erro: null };

  static getDerivedStateFromError(erro: Error) {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Falha nao tratada na interface', erro, info);
  }

  componentDidUpdate(prev: { resetKey?: unknown }) {
    if (this.state.erro && prev.resetKey !== this.props.resetKey) {
      this.setState({ erro: null });
    }
  }

  render() {
    if (this.state.erro) {
      return (
        <Fallback
          erro={this.state.erro}
          onTentar={() => {
            this.setState({ erro: null });
            this.props.onReset?.();
          }}
        />
      );
    }
    return this.props.children;
  }
}
