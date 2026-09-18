# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.9.1 |
| **Status** | Aceita |
| **Data** | 2026-09-18 |
| **Base** | Patch de `spec-v1.9.0.md`, formalizado pela ADR 0022 |

## Correção de CA67

O backend mantém as chamadas reais e encadeadas a `status_geracao` até estado
terminal ou o orçamento do turno. A UI consolida consultas consecutivas do
mesmo job em um único item `passo`, exibindo o último `status` e um ícone animado
enquanto ele não for terminal. Quando terminar, esse mesmo item exibe o resultado
final. Não há promessa de acompanhamento além do turno.

Os demais requisitos e critérios de aceite da `spec-v1.9.0.md` permanecem
inalterados.
