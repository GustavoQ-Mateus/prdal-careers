# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.9.2 |
| **Status** | Aceita |
| **Data** | 2026-09-18 |
| **Base** | Patch de `spec-v1.9.1.md`, formalizado pela ADR 0023 |

## Correção de CA73

Ao receber a análise inicial no status da geração, o chat exibe o gráfico de
área com `Base`. Ao receber o currículo concluído, o turno consulta
automaticamente o currículo final e o gráfico passa a comparar `Base` e
`Gerado`. As demais regras de `spec-v1.9.0.md` e `spec-v1.9.1.md` permanecem.
