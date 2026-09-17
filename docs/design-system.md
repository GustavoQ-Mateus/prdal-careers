# PRDAL Careers, Design System

Fonte de verdade visual do `web`. A partir do redesign v2, a implementação vive em Tailwind CSS mais shadcn/ui, com os tokens declarados como CSS variables em `:root` e `.dark`. A direção visual segue a ADR 0017 e revisa a doutrina de estilo da ADR 0010. A arquitetura funcional continua na `spec-v1.5.0` e é revisada na `spec-v1.6.0`.

## 1. Identidade

O PRDAL Careers é uma ferramenta profissional para o candidato conduzir a própria busca de emprego. A interface é de produto corporativo limpo: branco total, superfícies calmas, hierarquia clara e acabamento consistente. Nada de aparência crua e nada de aparência genérica de template.

A virada da v2 corrige o excesso anterior. A doutrina antiga evitava tanto o AI slop que passou a evitar acabamento: formulários crus empilhados sobre listas, tabelas sem moldura, tudo no mesmo peso visual. A correção não é abraçar o genérico. É adotar a linguagem madura de SaaS corporativo com intenção de design própria em cada tela.

O produto é do candidato. Empresa e recrutador são contexto da oportunidade, nunca perfis com acesso. A interface nunca sugere um lado empregador.

A marca vive em `apps/web/public/brand/`. O lockup aparece no topo da navegação e na tela de acesso. A marca compacta aparece na navegação recolhida, no header mobile e nos ícones do app.

### Princípios

1. Branco total como base. Superfície branco puro, canvas neutro levíssimo com viés frio.
2. Separação por borda de 1px e sombra sutil, não por peso de cor.
3. Acento azul apenas em interação, foco, estado ativo e seleção.
4. Ação primária em grafite quase preto. O azul não é a cor da ação primária.
5. Score usa a tríade reservada e nunca vira acento decorativo.
6. Acabamento consistente. Cada objeto que precisa ser percebido como unidade tem moldura e elevação claras.
7. Padrões corporativos servem ao fluxo: modal para cadastro e edição, slide-over para detalhe, wizard para etapas, card elevado no board.
8. Densidade proporcional ao domínio. Análise ATS é densa; a hierarquia serve a leitura rápida.
9. Motion e estados de interação com propósito, nunca decorativos.
10. Consistência entre telas sem aparência de template.

## 2. Tokens

Os tokens são a fonte única de estilo. Ficam como CSS variables e são consumidos pelo tema do Tailwind e pelas primitivas shadcn/ui. Cor, tipografia, espaçamento, forma e elevação nascem aqui.

### Cor, tema claro

| Token | Valor | Uso |
|---|---|---|
| `--canvas` | `#f6f8f7` | fundo do aplicativo, neutro levíssimo com viés frio |
| `--ground` | `#ffffff` | superfície branco puro, cards, painéis, inputs |
| `--ink` | `#0f1512` | texto principal |
| `--ink-2` | `#3a413d` | texto secundário de leitura |
| `--muted` | `#666d69` | texto de apoio e rótulo em repouso |
| `--faint` | `#949b97` | metadado, placeholder e ícone inativo |
| `--line` | `#e5e8e6` | borda e divisor padrão de 1px |
| `--line-strong` | `#d6dbd8` | borda de ênfase e separação de controle |
| `--accent` | `#2563eb` | interação, foco, estado ativo e seleção |
| `--accent-ink` | `#1d4ed8` | texto ou ícone sobre `--accent-soft` |
| `--accent-soft` | `#eff6ff` | fundo de seleção e realce discreto |
| `--primary` | `#12160f` | ação primária, grafite quase preto |
| `--score-good` | `#1d4ed8` | score alto e confirmação positiva |
| `--score-warn` | `#b0790a` | score intermediário e atenção |
| `--score-bad` | `#d24350` | score baixo e erro |

### Cor, tema escuro

O tema escuro preserva a mesma leitura: superfície calma, acento azul reservado à interação, tríade de score semântica. A base é um escuro neutro, cinzas sem matiz verde, com canvas bem escuro próximo do preto. O azul aparece só em interação, foco, ativo e seleção, nunca como fundo de superfície.

| Token | Valor | Uso |
|---|---|---|
| `--canvas` | `#0b0d0e` | fundo do aplicativo, neutro bem escuro |
| `--ground` | `#16191b` | superfície elevada, cards, painéis, inputs |
| `--ink` | `#e9edee` | texto principal |
| `--ink-2` | `#bfc5c7` | texto secundário de leitura |
| `--muted` | `#8b9195` | texto de apoio e rótulo em repouso |
| `--faint` | `#5b6266` | metadado, placeholder e ícone inativo |
| `--line` | `#24282a` | borda e divisor padrão de 1px |
| `--line-strong` | `#333739` | borda de ênfase e separação de controle |
| `--accent` | `#60a5fa` | interação, foco, estado ativo e seleção |
| `--accent-ink` | `#bfdbfe` | texto ou ícone sobre `--accent-soft` |
| `--accent-soft` | `#172554` | fundo de seleção e realce discreto |
| `--primary` | `#e9edee` | ação primária, superfície clara com texto escuro |
| `--score-good` | `#60a5fa` | score alto e confirmação positiva |
| `--score-warn` | `#cf9420` | score intermediário e atenção |
| `--score-bad` | `#e5606f` | score baixo e erro |

No tema claro, a ação primária é grafite quase preto com texto branco. No tema escuro, ela vira superfície clara com texto grafite, para preservar peso sem competir com o acento. O acento azul nunca colore grandes superfícies de conteúdo em nenhum dos temas.

### Tipografia

- Sans: Inter ou Geist, self-hosted, com fallback `system-ui`, `Segoe UI`, sans-serif.
- Mono: fonte mono tabular self-hosted com fallback `Cascadia Mono`, `Consolas`, monospace.
- Título de página: 23px, peso 700.
- Título de seção: 16px, peso 700.
- Corpo: 14px, peso 400, line-height 1.5.
- Label: 11px, peso 600, caixa-alta, tracking leve.
- Número operacional e score: mono, `font-variant-numeric: tabular-nums`.

A escala é enxuta e usa menos metadado apagado que a versão anterior. Texto secundário existe para hierarquia, não para diluir a tela. Caixa-alta fica restrita a labels curtas e códigos, nunca em parágrafos ou navegação inteira.

### Espaçamento

Escala: 4, 8, 12, 16, 20, 24, 32, 40 e 48px.

- Espaço interno de controle: 8 a 12px.
- Espaço entre label e controle: 6px.
- Espaço entre campos: 16px.
- Espaço entre regiões: 32px.
- Padding do workspace: 24px em desktop, 16px em mobile.

### Forma e elevação

- Raio de card e modal: 12px.
- Raio de controle, botão e input: 8px.
- Raio de chip e badge curto: pill.
- Borda padrão de 1px em `--line`, ênfase em `--line-strong`.
- Sombra sutil apenas onde algo eleva de verdade: card no board, modal, slide-over, popover e menu.
- Sombra de repouso: `0 1px 2px rgba(15,21,18,.06)`.
- Sombra de elevação: `0 8px 24px rgba(15,21,18,.12)`.
- Superfície plana de conteúdo não recebe sombra só por decoração.

## 3. Superfície e elevação

Branco puro é a superfície de trabalho. A separação entre regiões acontece por borda de 1px e espaço, e a elevação por sombra sutil reservada ao que realmente flutua ou se destaca como unidade.

Três níveis:

1. Canvas: fundo do app em `--canvas`, sem sombra.
2. Superfície: regiões e cards de conteúdo em `--ground`, borda de 1px, sombra de repouso quando são unidade manipulável.
3. Sobreposição: modal, slide-over, popover e menu em `--ground`, borda de 1px e sombra de elevação.

## 4. Padrões de UI adotados

A v2 adota padrões corporativos de interação como norma. Cada um tem lugar definido.

### Modal

Cadastro e edição focada acontecem em modal centralizado sobre backdrop. O modal contém o foco, fecha por Escape e por clique no backdrop quando não há edição pendente, e devolve o foco ao gatilho. Botão que abre cadastro ou edição é o padrão; o formulário nunca fica empilhado cru sobre a lista.

Entram em modal: captura de oportunidade, edição de campos da oportunidade, criação e edição de ação, edição de seção do Perfil, upload e reindexação de Conhecimento, confirmação destrutiva curta.

### Slide-over

Detalhe lateral que precisa ser lido sem perder o contexto da lista ou do board abre em slide-over à direita. Ele desliza sobre a página, mantém a origem visível ao fundo e fecha por Escape ou backdrop.

Entram em slide-over: inspetor da oportunidade a partir do board, da lista e do grafo; atividade recente e detalhe rápido de uma ação.

### Wizard

Fluxos com etapas ordenadas usam wizard com indicador de progresso real, avanço e retorno. O indicador comunica etapa, não decora.

Entra em wizard: geração de currículo ATS em três etapas, analisar e recuperar contexto, gerar, validar e exportar.

### Card elevado

Card é a unidade que precisa ser percebida e manipulada como objeto. Tem borda de 1px, raio de 12px e sombra de repouso. No board, o card da oportunidade é arrastável e mostra apenas o essencial de movimentação. Fora do board, card se aplica a objetos que o usuário compara ou seleciona como unidade, não a todo bloco de texto.

## 5. Componentes

### Botões

- Primário: fundo `--primary`, texto de contraste. Move o fluxo principal.
- Acento: usado em seleção, filtro ativo e alternância de visão, com `--accent`. Não é a ação primária.
- Secundário: superfície `--ground`, borda `--line-strong`.
- Ghost: sem borda, fundo apenas no hover.
- Destrutivo: `--score-bad`, apenas para destruição real.
- Loading mantém a largura e troca o rótulo por estado claro.

### Campos

- Label sempre visível acima do campo.
- Borda `--line-strong` no controle; foco com borda `--accent` e anel de foco derivado do acento.
- Erro abaixo do controle, associado por `aria-describedby`.
- Placeholder não substitui label.

### Tabelas

- Moldura de 1px na região da tabela e cabeçalho discreto, sticky quando houver scroll vertical.
- Divisor horizontal entre linhas.
- Linha clicável tem hover, foco e ação por teclado.
- Números alinham à direita em mono tabular.
- Ações na última coluna, nunca só por ícone sem nome acessível.

### Regiões e cards

Região é uma seção definida por título, espaço e, quando útil, borda. Card entra quando o objeto é unidade percebida e manipulada. A escolha é intencional, não automática para cada bloco.

### Status e chips

- Badge de status curto usa pill.
- Categoria, nível e keyword usam chip compacto com borda neutra.
- Cor nunca é o único indicador e não se pinta cada categoria de uma cor.

### Score ATS

- Score principal em mono tabular.
- Meter fino e linear.
- Faixas: menor que 50 usa `--score-bad`; 50 a 74 usa `--score-warn`; 75 ou mais usa `--score-good`.
- Breakdown em linhas alinhadas com barra e valor.
- Keywords faltantes usam texto e borda de atenção suave, sem grandes fundos coloridos.

### Feedback

- Loading aparece no botão e na região afetada.
- Erro aparece junto ao contexto com texto acionável.
- Sucesso curto é inline e não bloqueia.
- Empty state usa título, explicação curta e ação quando houver próximo passo.
- Skeleton apenas quando reduz salto de layout, sempre neutro.

## 6. Navegação e shell

A navegação da v2 é uma jornada, não um menu de tabelas técnicas. O topo da hierarquia expressa o trabalho do candidato.

Entradas principais:

1. Hoje, a agenda operacional.
2. Oportunidades, o hub único que reúne inventário e as visões lista, board e grafo.
3. Currículos, a biblioteca transversal.
4. Fundação: Perfil e Conhecimento, as fontes confiáveis da geração.

O hub de Oportunidades absorve o antigo Pipeline. A aba Pipeline deixa de existir como destino separado e o board e o grafo passam a ser visões dentro de Oportunidades, alternadas por um seletor de visão. O Workspace da oportunidade não aparece na navegação; abre a partir de qualquer representação de uma oportunidade.

O shell usa navegação clara sobre superfície branca, sem sidebar escura. Item ativo é marcado com o acento azul de forma discreta, por realce e não por bloco pesado de cor. No desktop a barra lateral recolhe para uma faixa só de ícones, com o rótulo em tooltip no hover e o item ativo ainda evidente; a preferência persiste em `localStorage` e o controle expõe `aria-expanded`. No mobile, a navegação vira drawer acessível que contém o foco e fecha por Escape ou backdrop.

O cabeçalho contextual mantém título e descrição à esquerda e ações primárias à direita. Ele não fica dentro de card.

## 7. Guia por tela

### Login

Composição de produto em proporção 40/60 no desktop, com formulário no painel menor e plano escuro de destaque no painel maior. A marca do formulário integra o bloco de acesso; a marca do plano escuro fecha o rodapé. Sem card genérico centralizado sobre gradiente. O plano de destaque usa mensagem curta e composição tipográfica de forte contraste. No mobile, apenas o formulário aparece.

### Hoje

Agenda operacional, não dashboard de métricas. Atrasados, itens do dia e próximos sete dias formam uma lista temporal contínua. Oportunidades sem próximo passo aparecem como exceção acionável. Métricas ATS ocupam uma faixa secundária, sem mosaico de KPI. Concluir e reagendar não deslocam a lista.

### Oportunidades, hub único

Uma superfície reúne o inventário e as visões. Um seletor de visão alterna lista, board e grafo, preservando busca, filtros e o subconjunto atual ao trocar.

- Lista: tabela densa com título, empresa, categoria, nível, prioridade, etapa, currículo vinculado, score, próximo passo e última atividade. Cada ordenação nomeia o critério; não existe ranking universal opaco.
- Board: colunas por etapa, cada oportunidade em card elevado arrastável, com apenas o essencial de movimentação. Detalhe abre em slide-over. Toda mudança por arraste tem equivalente textual.
- Grafo: projeção de leitura de relações determinísticas sobre fundo claro, com tipo de nó comunicado por forma, rótulo e legenda, não só por cor. Seleção sincroniza o slide-over.

Captura individual e importação em lote abrem em modal a partir de um botão do cabeçalho. O formulário não fica empilhado sobre a lista.

### Workspace da oportunidade

Página profunda com cabeçalho persistente que mostra título, empresa, etapa, prioridade e ação dominante antes do conteúdo. A superfície divide resumo e descrição, geração de currículo, candidatura e currículo vinculado, próximos passos e timeline. Edição de campos abre em modal; o inspetor lateral integrado mostra próxima ação e atividade recente sem cobrir o conteúdo. Em mobile, o inspetor passa para o fluxo da página.

### Geração ATS

Wizard de três etapas explícitas: analisar vaga e recuperar contexto; gerar com LLM, RAG, Perfil e notas; validar score, revisar e exportar. O indicador comunica progresso real. Score e breakdown aparecem na revisão. Falha de RAG ou de documentos permanece localizada e não apaga o resultado disponível. O Markdown do currículo é renderizado, não exibido cru.

### Currículos

Biblioteca transversal em tabela, agrupável por oportunidade. Rótulo, score, vínculo, geração e downloads são comparáveis sem mosaico. Abrir leva à análise profunda; comparação continua restrita a versões da mesma oportunidade.

### Conhecimento, fundação

Estado, origem dos documentos, distribuição por perfil, candidatura e nota, ações e progresso em regiões contínuas, sem mosaico de cards. Upload e reindexação são ações explícitas em modal. Conhecimento não vira editor de notas, chat ou grafo autônomo.

### Perfil, fundação

Modo leitura como padrão. Identidade, Contato, Resumo, Experiências, Formação e Skills são editadas uma por vez em modal. O estado desatualizado do índice aparece junto à ação de reindexar.

## 8. Blocklist anti AI slop, revisada

A v2 remove as proibições que travavam acabamento. Modal em fluxo de cadastro e edição, card elevado e sombra sutil passam a ser permitidos e recomendados nos lugares definidos acima. Continuam proibidos os sinais de interface genérica:

- Gradiente, glow, glassmorphism ou blur decorativo.
- Dashboard como mosaico uniforme de KPI.
- Conteúdo inteiro preso a uma coluna central estreita.
- Ícone grande em círculo colorido como enfeite.
- Muitas cores por categoria; cada categoria com sua própria cor.
- Microcopy genérica ou celebratória.
- Sidebar de template com avatar e bloco de upgrade.
- Hero promocional dentro do produto autenticado.
- Tipografia gigante sem relação com a tarefa.
- Tela de biblioteca de componentes jogada sem ajuste.

O teste continua sendo intenção. Cada modal, card e sombra precisa comunicar algo necessário. O que não comunica sai.

## 9. Responsividade

- Breakpoints de referência: 720px, 960px e 1200px.
- Mobile usa uma coluna e padding de 16px.
- Navegação vira drawer acessível abaixo de 960px.
- Tabelas usam overflow local; colunas secundárias podem ser ocultadas com rótulos preservados.
- No hub, lista e board são os caminhos operacionais prioritários no mobile; o grafo permite busca, seleção e inspeção sem depender de arraste.
- Slide-over ocupa largura total no mobile.
- Alvos interativos têm no mínimo 44px no mobile.
- A página nunca cria scroll horizontal; regiões largas usam overflow local.

## 10. Acessibilidade

- Contraste mínimo 4.5:1 para texto normal, verificado em tema claro e escuro.
- `:focus-visible` sempre perceptível, derivado do acento.
- Ordem de tab segue a ordem visual.
- Botões de ícone têm nome acessível.
- Modal e slide-over contêm o foco, fecham por Escape e devolvem o foco ao gatilho.
- Status não depende só de cor.
- Motion respeita `prefers-reduced-motion`.
- Arraste nunca é a única forma de mover etapa ou abrir oportunidade.
- Nós do board e do grafo têm nome com vaga, empresa e estado.
- Mudança persistida é anunciada em região `role="status"`.

## 11. Motion

- Duração entre 120 e 240ms.
- Propriedades: opacity, transform e color.
- Motion comunica abertura, seleção, progresso ou mudança de estado.
- Entrada de modal e slide-over usa transição curta e direção coerente com a origem.
- Nenhuma animação decorativa em loop.

## 12. Verificação

Para cada tela:

1. Verificar 375, 768, 1024 e 1440px.
2. Verificar tema claro e escuro.
3. Navegar somente por teclado.
4. Conferir foco, contraste e alvos de toque.
5. Conferir loading, vazio, erro e sucesso.
6. Procurar overflow da página.
7. Confirmar que cada modal, card e sombra comunica algo necessário.
8. Confirmar que o azul aparece só em interação, foco, ativo e seleção, e que o score usa apenas a tríade reservada.
