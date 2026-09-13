# ADR 0011, Classificação determinística de vagas

- **Status:** Aceita
- **Data:** 2026-09-13
- **Fase-alvo:** Fase 3
- **Contexto:** No banco de vagas o usuário importa em massa postagens que ele encontrou. Para triar e, no futuro, montar um mapa de vagas por área e nível, cada vaga precisa de uma classificação de tipo (backend, frontend, fullstack, ia, dados, entre outros) e de nível (estágio a sênior). Essa classificação deve ser confiável e reproduzível, e o projeto já tem a regra de que o LLM gera texto e o algoritmo mede (ADR 0005).

## Decisão
Classificar cada vaga de forma **determinística**, sem LLM, por regras de vocabulário sobre título e descrição, no `ai-service`, via `POST /classify` que responde `{ categoria, nivel }`. A mesma dupla título/descrição sempre resulta na mesma classificação.

Taxonomia inicial:
- **categoria**: `backend`, `frontend`, `fullstack`, `mobile`, `dados`, `ia`, `devops`, `qa`, `design`, `produto`, `outro`.
- **nivel**: `estagio`, `junior`, `pleno`, `senior`, `indefinido`.

A regra pontua termos por categoria (por exemplo react e css para frontend; node, api e spring para backend; sinais fortes de front e back juntos para fullstack; ml, llm e nlp para ia; etl, spark e analytics para dados) e escolhe a de maior peso, com `outro` como padrão sem sinal. O nível vem de marcadores no texto (estágio, júnior, pleno, sênior), com `indefinido` como padrão.

## Justificativa
- Determinismo torna a classificação reproduzível e auditável, coerente com o score da ADR 0005.
- Regras de vocabulário são baratas, gratuitas e rápidas, servindo bem ao processamento em lote (ADR 0009) sem gastar chamada de LLM.
- Colocar a rota no `ai-service` mantém toda a análise de texto num lugar só (ADR 0001), consumida pela `api`.
- Capturar categoria e nível agora habilita, sem custo adicional de dados, o mapa de vagas em grafo previsto como escopo futuro.

## Consequências
- Surge uma taxonomia fixa a manter; refino dela é evolução compatível, não quebra contrato.
- A classificação por regras erra em casos ambíguos; aceitável nesta fase, e o usuário pode corrigir a categoria da vaga manualmente se necessário.
- `POST /classify` é determinístico e não depende do provedor de IA nem de rede.
