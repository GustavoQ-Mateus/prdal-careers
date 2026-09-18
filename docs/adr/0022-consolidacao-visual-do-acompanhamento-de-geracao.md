# ADR 0022, Consolidação visual do acompanhamento de geração

- **Status:** Aceita
- **Data:** 2026-09-18
- **Fase-alvo:** P10-correção

## Contexto

A implementação inicial de CA67 emitiu um `passo` por consulta a
`status_geracao`. Embora as chamadas fossem reais, o chat acumulava dezenas de
linhas idênticas e escondia o estado relevante.

## Decisão

As chamadas continuam encadeadas no mesmo turno e continuam sendo registradas
individualmente no backend. No cliente, consultas consecutivas de
`status_geracao` do mesmo job são consolidadas em um único `passo`: ele mostra o
último status e permanece com ícone animado enquanto o status for não terminal.
Ao receber `CONCLUIDA` ou `ERRO`, o mesmo passo passa ao estado final.

## Consequências

O acompanhamento continua real, sem promessa autônoma e sem alterar o contrato
SSE. A trilha deixa de expor tentativas repetidas como itens visuais separados.
