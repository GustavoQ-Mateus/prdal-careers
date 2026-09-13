# ADR 0010, SCSS como padrão de estilo do front

- **Status:** Aceita
- **Data:** 2026-09-13
- **Fase-alvo:** Fase 2 em diante
- **Contexto:** A ADR 0002 fixou a stack do front em React mais TypeScript mais Vite, sem definir a camada de estilo. A Fase 1 e o início da Fase 2 usaram estilo inline e depois um CSS global escrito à mão. Com o design system definido (ver `docs/design-system.md`) e a necessidade de tokens, nesting e organização, o CSS puro fica limitado. O projeto nunca usou Tailwind; a escolha aqui é entre CSS puro e um pré-processador.

## Decisão
Adotar **SCSS** como padrão único de estilo do `web`, via dependência de desenvolvimento `sass`. A folha principal é `apps/web/src/styles.scss`, importada uma vez em `main.tsx`. Os tokens de design permanecem como CSS custom properties em `:root`, porque são referenciados em runtime por componentes; o SCSS agrega nesting, variáveis de build e organização por cima disso.

Nada de Tailwind, CSS-in-JS ou biblioteca de componentes. Estilo inline fica restrito a ajustes pontuais de dimensão.

## Justificativa
- SCSS dá nesting e variáveis sem trocar de paradigma, mantendo o CSS legível e proporcional ao problema (KISS).
- Manter os tokens como custom properties preserva o uso em runtime e o tema único, enquanto o SCSS melhora a autoria.
- Uma folha única mais primitivas em `ui.tsx` evita drift visual e sustenta a coerência exigida pelo design system e pelo CA13 da `spec-v1.1.0`.
- Evitar Tailwind e bibliotecas de componentes afasta o projeto do visual genérico de AI slop, coerente com a regra de front-end do `CLAUDE.md`.

## Consequências
- Entra a dependência de desenvolvimento `sass` no `apps/web`; nenhuma dependência de runtime nova.
- O build do Vite passa a compilar SCSS; o `web` foi validado com build limpo após a migração.
- O antigo `index.css` foi removido; a fonte de estilo passa a ser `styles.scss`.
- Telas futuras devem seguir `docs/design-system.md` e reusar os tokens e primitivas, não criar estilo solto.
