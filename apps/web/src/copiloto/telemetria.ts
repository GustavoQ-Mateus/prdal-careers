import type { TelemetriaEvento, AcaoRapidaCopiloto } from '../api';

type Armazenamento = Pick<Storage, 'getItem' | 'setItem'>;

export function criarTelemetriaCopiloto(
  enviar: (evento: TelemetriaEvento) => Promise<unknown>,
  armazenamento: () => Armazenamento = () => sessionStorage,
) {
  const memoria = new Map<string, string>();
  const chaveAba = 'copiloto:telemetria:aba';
  const chaveMensagem = (id: string) => `copiloto:telemetria:mensagem:${id}`;

  function ler(chave: string) {
    try {
      return armazenamento().getItem(chave) ?? memoria.get(chave);
    } catch {
      return memoria.get(chave);
    }
  }

  function guardar(chave: string, valor: string) {
    memoria.set(chave, valor);
    try {
      armazenamento().setItem(chave, valor);
    } catch {
    }
  }

  function novaSessao() {
    const id = globalThis.crypto?.randomUUID?.() ?? `aba-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    guardar(chaveAba, id);
    return id;
  }

  function sessaoId(conversaId?: string) {
    return conversaId ?? ler(chaveAba) ?? novaSessao();
  }

  function registrar(evento: TelemetriaEvento) {
    try {
      void enviar(evento).catch(() => {});
    } catch {
    }
  }

  return {
    limpar: () => memoria.clear(),
    novaSessao,
    primeiraMensagem(conversaId?: string) {
      const id = sessaoId(conversaId);
      if (!ler(chaveMensagem(id))) {
        guardar(chaveMensagem(id), '1');
        registrar({ evento: 'copiloto_primeira_mensagem', sessaoId: id });
      }
      return id;
    },
    vincularConversa(conversaId: string, sessaoInicial?: string) {
      if (sessaoInicial && ler(chaveMensagem(sessaoInicial))) guardar(chaveMensagem(conversaId), '1');
    },
    acaoRapida(acao: AcaoRapidaCopiloto, conversaId?: string) {
      registrar({ evento: 'copiloto_acao_rapida', sessaoId: sessaoId(conversaId), acao });
    },
  };
}
