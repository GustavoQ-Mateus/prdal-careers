# ADR 0023, Score ATS por etapa no copiloto

- **Status:** Aceita
- **Data:** 2026-09-18
- **Fase-alvo:** P10-correção

## Decisão

O chat renderiza o gráfico assim que a Etapa 1 disponibilizar
`etapas.analiseInicial.score`, com o ponto `Base`. Ao concluir, o acompanhamento
chama `buscar_curriculo` automaticamente e o mesmo padrão de gráfico mostra
`Base` e `Gerado` com `analiseInicial.score` e `analiseFinal.score`.

## Consequência

O resultado visual não depende de a LLM decidir narrar ou reler a Etapa 3.
