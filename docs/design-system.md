# PRDAL Careers, Design System

Padrão visual do front. Referência única para toda tela nova. Não é spec de fase; é o guia de estilo que o código do `web` deve seguir. A fonte de implementação é `apps/web/src/styles.scss` (tokens em `:root` mais estilos) e as primitivas em `apps/web/src/ui.tsx`.

## Princípios

Personalidade: **console de instrumentação**, tema **papel técnico claro**. Produto denso em dados (análise ATS), então a interface prioriza hierarquia, alinhamento e leitura rápida, não enfeite.

Anti AI slop, regras duras:
- Sem acento roxo ou indigo, sem gradiente de fundo, sem glassmorphism, sem glow.
- Sem card centralizado sobre gradiente, sem hero genérico com três cards e ícone grande arredondado.
- Sem sombra difusa em superfície; separação por fio de 1px.
- A única cor cromática do produto é a semântica do score. O resto é tinta sobre papel.
- Motion só em momento com propósito, nunca decorativo.

## Tokens

Cor (CSS custom properties em `:root`):

Neutras no espírito Vercel/Geist: branco, off-white e quase-preto, com dois cinzas puros derivados para fio e texto secundário.

| Token | Valor | Uso |
| --- | --- | --- |
| `--base` | `#fafafa` | fundo da página |
| `--surf` | `#ffffff` | superfície de painel |
| `--surf-2` | `#f2f2f2` | superfície secundária, hover, trilho de medidor |
| `--line` | `#eaeaea` | fio de 1px entre blocos |
| `--line-strong` | `#d4d4d4` | borda de input e de chip |
| `--text` | `#171717` | texto principal |
| `--muted` | `#666666` | rótulo e texto secundário |
| `--faint` | `#999999` | texto terciário |
| `--ink` | `#171717` | acento de interação e painel escuro: botão primário, foco, link, hero |
| `--ink-soft` | `rgba(23,23,23,.1)` | anel de foco |
| `--bad` | `#d64550` | score abaixo de 50 |
| `--mid` | `#b8860b` | score de 50 a 74 |
| `--good` | `#2e8b57` | score 75 ou mais |

Regra de cor: as três neutras (`#ffffff`, `#fafafa`, `#171717`) formam a base; `--ink` é o único acento de interação e a cor do painel escuro. Vermelho, âmbar e verde são reservados ao score e nunca usados como decoração.

Tipografia:
- Sans de sistema (`--font-sans`), sem webfont, para evitar o tell do Inter e não adicionar dependência.
- Mono de sistema (`--font-mono`) para todo número: score, delta, contagem, data. Sempre `font-variant-numeric: tabular-nums` para alinhar em coluna.
- Escala: rótulo 11px caixa-alta com tracking `.08em`; corpo 13px; títulos de painel 14px; h1 15px; score herói 40px ou mais.

Espaçamento e forma:
- `--pad: 20px` (interior de painel), `--gap: 16px` (pilha), grade de 24px entre painéis.
- `--radius: 3px`. Cantos discretos, nunca `rounded-2xl`.

Motion:
- Uso pontual: preenchimento do medidor de score, transição numérica no recálculo, aparição do hero do login.
- Curva padrão `cubic-bezier(0.2, 0.7, 0.2, 1)`, duração 0.5s a 0.7s.
- Sempre respeitar `prefers-reduced-motion: reduce`.

## Componentes

- **Painel** (`.panel`, `.panel-head`, `.panel-body`): superfície branca com fio de 1px. Cabeçalho com título 14px e rótulo caixa-alta à direita.
- **Botão**: base neutra com borda; `.primary` em `--ink` com texto branco; `.ghost` sem borda para ação secundária; `.link-btn` como link sublinhado.
- **Campo** (`.field` mais `.label` mais `input`/`textarea`): rótulo caixa-alta acima do controle; foco com borda `--ink` e anel `--ink-soft`.
- **Tabela instrumento** (`.grid-table`): cabeçalho caixa-alta, células com fio inferior, coluna numérica alinhada à direita em mono; linha `.clickable` com hover.
- **Score** (`.score`, primitiva `Score`): número em mono colorido por faixa (`--bad`/`--mid`/`--good`). `.score-hero` para o número grande.
- **Medidor** (`.meter`, primitiva `Meter`): barra fina preenchida na cor da faixa, com transição de largura.
- **Breakdown** (primitiva `Breakdown`): barras horizontais por componente com o número em mono à direita, mais chips de keywords faltantes.
- **Chip** (`.chip`, `.chip--missing`): pílula mono discreta; variante faltante em vermelho suave.
- **Delta** (`.delta`, primitiva `Delta`): variação em mono, verde para cima, vermelho para baixo.
- **Barra superior** (`.topbar`, `.nav`): marca mono `prdal.careers` à esquerda, navegação caixa-alta, sair à direita.
- **Login split** (`.auth-split`): coluna de formulário estreita (34%) à esquerda em papel, com marca no topo, conteúdo centralizado e copyright no rodapé; painel preto à direita com a marca e motion de aparição.

## Regras de uso

- SCSS é o padrão de estilo do front (ver ADR 0010). Reusar `styles.scss` e as primitivas de `ui.tsx`; não introduzir estilo inline novo além de ajustes pontuais de largura.
- Manter os tokens como fonte única. Cor, tipo e espaçamento novos entram como token, não como valor solto.
- Toda tela nova segue esta linguagem para manter coerência (CA13 da `spec-v1.1.0` e regra de front-end do `CLAUDE.md`).
