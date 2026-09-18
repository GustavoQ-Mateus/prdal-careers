# ADR 0017, Linguagem de produto corporativa e migração para Tailwind mais shadcn/ui

- **Status:** Aceita
- **Data:** 2026-09-15
- **Fase-alvo:** Redesign v2, ver `spec-v1.6.0`
- **Contexto:** A doutrina de estilo anterior, fixada na ADR 0010 e no design system da v1, evitava AI slop ao ponto de evitar acabamento. O resultado foram formulários crus empilhados sobre listas, tabelas sem moldura, sobreposições proibidas por padrão e telas em que tudo tinha o mesmo peso visual. A ADR 0010 escolheu SCSS mais primitivas próprias e barrou Tailwind, CSS-in-JS e bibliotecas de componentes, justamente para fugir do genérico. Na prática, a proibição de modal em fluxo, card e sombra passou a impedir a linguagem madura de SaaS que o produto precisa. O usuário aprovou uma virada de direção em 2026-09-15.

## Decisão

Adotar a linguagem de produto corporativo limpo descrita em `docs/design-system.md` v2 e migrar a camada de estilo do `web` para Tailwind CSS mais shadcn/ui, com tokens em CSS variables como fonte única.

### Linguagem de interação

Modal, wizard, slide-over, card elevado e sombra sutil passam a ser padrões adotados com intenção, cada um com lugar definido no design system:

- modal para cadastro, edição focada e confirmação destrutiva curta;
- slide-over para detalhe lateral sem perder o contexto da lista ou do board;
- wizard para fluxos com etapas ordenadas, como a geração ATS;
- card elevado como unidade manipulável, com destaque no board;
- sombra sutil reservada ao que eleva de verdade.

Isto supersede a doutrina anterior que empurrava tudo para página e painel inline e proibia modal em fluxo, card por objeto e sombra como separação. A regra anti AI slop continua válida, mas revisada: barra o genérico, não o acabamento.

### Camada de estilo

SCSS sai. Entram Tailwind CSS e shadcn/ui como fonte de estilo do `web`. Os tokens de cor, tipografia, espaçamento, forma e elevação ficam declarados como CSS variables em `:root` e `.dark` e são consumidos pelo tema do Tailwind e pelas primitivas shadcn/ui. Os componentes shadcn/ui são copiados para o repositório e ajustados aos tokens, não usados como biblioteca opaca de terceiros. Isto supersede a ADR 0010.

### Bibliotecas adotadas

- Motion para transições e animação com propósito.
- dnd-kit para o arraste do board.
- TanStack Query para busca, cache e sincronização de dados no cliente.
- react-markdown para renderizar Markdown, incluindo o currículo, hoje exibido cru.
- lucide-react para ícones.
- Fonte Inter ou Geist self-hosted, mais uma mono tabular self-hosted.

## Justificativa

- A linguagem corporativa resolve o problema real de acabamento sem cair no genérico, porque o design system mantém intenção de design por tela e uma blocklist revisada.
- Tailwind mais shadcn/ui dá um sistema de utilitários e primitivas acessíveis alinhado a tokens, com acabamento consistente e menos estilo solto que o SCSS artesanal.
- Manter os componentes shadcn/ui no repositório preserva controle visual e afasta a aparência de template pronto.
- Tokens em CSS variables preservam tema claro e escuro em runtime e mantêm uma fonte única de verdade entre Tailwind, shadcn/ui e código.
- As bibliotecas adotadas cobrem necessidades concretas do redesign e da spec: board arrastável, dados no cliente, Markdown renderizado, ícones e tipografia própria.

## Consequências

- A ADR 0010 fica superseded por esta ADR.
- Sai a dependência de desenvolvimento `sass` e o `apps/web/src/styles.scss` deixa de ser a fonte de estilo. Entram Tailwind, sua toolchain e as dependências de runtime listadas.
- As primitivas próprias de `apps/web/src/ui.tsx` são substituídas por componentes shadcn/ui ajustados aos tokens.
- O design system v2 e a `spec-v1.6.0` passam a valer sobre a `spec-v1.5.0` no que toca navegação, sobreposições e estilo. O RNF de design das specs passa a apontar para o design system revisado.
- A migração é de front; contratos da API, domínio e serviços não mudam por causa desta ADR.
- Toda tela nova segue o design system v2 e reusa tokens e primitivas, sem estilo solto e sem reintroduzir SCSS.
