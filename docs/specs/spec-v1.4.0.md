# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.4.0 |
| **Status** | Draft |
| **Data** | 2026-09-14 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Gestão de candidaturas e geração de currículo otimizado para ATS |
| **Base** | Estende `spec-v1.0.0.md` a `spec-v1.3.0.md`; muda somente a apresentação do `web` |

> MINOR compatível. Redesenha toda a interface do `web` sem alterar contratos, modelos de dados ou regras de negócio. CA1 a CA24 continuam válidos. Esta versão adiciona CA25 a CA31.

## 1. Contexto

A interface existente entrega os fluxos do produto, mas usa uma composição genérica de topbar, coluna central e painéis repetidos. A nova interface deve parecer uma ferramenta profissional construída para o trabalho do candidato: cadastrar e triar vagas, gerar currículos, entender score ATS, comparar versões e acompanhar candidaturas.

O redesenho adota um workspace totalmente claro, uma sidebar azul `#003049` persistente e superfícies contínuas. Branco, off-white e o preto `#171717` formam a base do conteúdo. O azul da sidebar é o único acento cromático de interação. Cor semântica permanece permitida somente para score, erro e estado que não possa ser comunicado apenas por texto.

## 2. Objetivo

Criar uma arquitetura de interface completa e coerente para todas as telas do `web`, com navegação clara, densidade adequada ao domínio, responsividade e acessibilidade, preservando integralmente as funcionalidades das fases anteriores.

## 3. Escopo

### Entra

1. Novo design system documentado em `docs/design-system.md`.
2. Novo shell autenticado com sidebar fixa no desktop e navegação lateral acessível no mobile.
3. Cabeçalho contextual, breadcrumbs em rotas profundas e workspace com largura definida pela tarefa.
4. Redesenho de login, dashboard, vagas, banco de vagas, candidaturas, base de conhecimento, perfil, versões e currículo.
5. Estados de loading, vazio, erro, sucesso, processamento e indisponibilidade.
6. Validação responsiva, teclado, contraste e redução de movimento.

### Não entra

- Mudança em contrato de API, modelo de dados ou serviço.
- Tailwind CSS, shadcn/ui, CSS-in-JS ou biblioteca de componentes.
- Command palette, busca global, nova rota ou nova funcionalidade de produto.
- Tema escuro.
- Landing page, grafo de conhecimento, mensagens de entrevista ou integrações externas.

Qualquer nova funcionalidade exige ADR quando houver decisão arquitetural e uma nova versão de spec antes do código.

## 4. Decisões preservadas

- ADR 0001: o `web` continua falando somente com a `api`.
- ADR 0002: React, TypeScript, Vite e PWA permanecem.
- ADR 0005: score ATS continua determinístico e explicável.
- ADR 0009: progresso de lote permanece visível e não bloqueante.
- ADR 0010: SCSS, tokens CSS e primitivas próprias permanecem como padrão.
- ADR 0011: categoria e nível continuam determinísticos.
- ADR 0012: a base de conhecimento continua aterrada nos dados do aplicativo.

Nenhuma ADR nova é necessária para esta fase.

## 5. Arquitetura global

### 5.1 Shell autenticado

- Sidebar fixa com marca, navegação principal e área de conta.
- Destinos: Dashboard, Vagas, Banco de vagas, Candidaturas, Base de conhecimento e Perfil.
- Item ativo identificado por marcador branco, contraste tipográfico e superfície branca translúcida.
- Perfil e Sair ficam no rodapé, separados da navegação de trabalho.
- O recolhimento mantém rótulos disponíveis por tooltip e nome acessível.
- No mobile, a sidebar abre a partir do cabeçalho, contém o foco, fecha por Escape e devolve o foco ao acionador.

### 5.2 Workspace

- Sem largura máxima global. Cada tela usa a largura adequada ao trabalho.
- Cabeçalho contextual contém título, descrição curta quando necessária e ações da tela.
- Breadcrumb aparece somente em Versões e Currículo.
- Conteúdo é organizado por regiões, alinhamento e espaço. Contorno aparece apenas quando comunica limite, estado ou interação.
- Modal é reservado a confirmação destrutiva ou tarefa curta. Nenhum fluxo desta fase exige modal.
- Edição principal ocorre inline. Detalhe auxiliar pode usar drawer somente quando não justificar navegação.

## 6. Arquitetura das telas

### 6.1 Login e registro

Página em split assimétrico. O formulário ocupa a superfície clara e não recebe card externo. O plano secundário usa `#171717`, marca e texto curto. Login e registro alternam inline. No mobile, apenas a região funcional permanece.

Estados: modo login, modo registro, envio, erro e sucesso de autenticação.

### 6.2 Dashboard

Visão operacional das vagas. Uma faixa contínua resume volume e qualidade sem mosaico de cards. A tabela principal apresenta vaga, empresa, melhor score, versões e última geração. A linha abre Versões.

Estados: loading, erro, vazio, vaga sem currículo e dados carregados.

### 6.3 Vagas

O cadastro aparece em região inline no início da página, com título, empresa e descrição. A lista ocupa uma tabela de trabalho com categoria, nível, keywords e ações por linha. Gerar CV e acompanhar candidatura exibem progresso local.

Estados: formulário, validação, lista vazia, geração, acompanhamento, sucesso e erro.

### 6.4 Banco de vagas

A importação em lote fica no topo com entradas repetíveis e JSON avançado em disclosure. O progresso aparece junto à operação. A triagem usa tabela ampla com origem, classificação, keywords, data e ativação.

Estados: entrada vazia, JSON inválido, lote em andamento, classificação pendente, item ativado, erro e lista vazia.

### 6.5 Candidaturas

Kanban full-width com sete lanes correspondentes aos status existentes. Cabeçalhos permanecem visíveis e mostram contagem. Cada candidatura é uma unidade independente com título, empresa, status e notas. O select continua como alternativa acessível à mudança de coluna.

Estados: loading, erro, vazio global, lane vazia, atualização e falha de persistência.

### 6.6 Base de conhecimento

Página operacional com descrição curta, quantidade de documentos, última indexação, reindexação, upload `.md` e progresso do lote na mesma superfície.

Estados: loading, base vazia, indexação, upload, concluído e erro.

### 6.7 Perfil-mestre

Formulário longo dividido por títulos e separadores em Identidade, Contato, Resumo, Experiências, Formação e Skills. A ação de salvar permanece no contexto da página.

Estados: loading, edição, salvando, salvo e erro.

### 6.8 Versões da vaga

Subpágina com breadcrumb, contexto da vaga e tabela de versões. Com duas ou mais versões, a comparação aparece em região dedicada com seletores, score, delta e diferenças de keywords simultaneamente visíveis.

Estados: loading, erro, nenhuma versão, uma versão e comparação.

### 6.9 Currículo

Subpágina de análise com metadados e ações no cabeçalho. O layout divide diagnóstico ATS e conteúdo do currículo. Score, meter, breakdown e keywords ficam próximos. Markdown é visualizado e editado inline. Downloads ficam na barra de ações.

Estados: loading, erro, leitura, edição, recálculo, downloads disponíveis e downloads indisponíveis.

## 7. Design e interação

- Workspace claro obrigatório, ancorado pela sidebar azul `#003049`.
- Raio padrão de 8px.
- Branco e off-white dominantes, preto `#171717` para texto e superfícies de alto contraste.
- Azul `#003049` como único acento de interface.
- Score usa vermelho, âmbar e verde somente em sua própria visualização.
- Sombras não estruturam layout. Quando indispensável em navegação mobile, são curtas e neutras.
- Números usam fonte mono tabular.
- Motion dura de 120 a 240ms e comunica mudança de estado.
- Alvos de toque têm no mínimo 44 por 44px no mobile.

## 8. Responsividade

- 375px: uma coluna, navegação lateral sob demanda, tabelas com scroll ou composição por registros.
- 768px: formulários e comparações adaptam para uma ou duas colunas conforme conteúdo.
- 1024px: sidebar persistente e workspace completo.
- 1440px: tabelas e Kanban aproveitam a largura sem alongar texto corrido.

Não pode existir scroll horizontal na página. Kanban e tabelas largas podem ter scroll em sua própria região.

## 9. Ordem de implementação

1. Tokens, reset, tipografia e primitivas.
2. Sidebar, shell e cabeçalhos.
3. Kanban como referência visual e responsiva.
4. Dashboard.
5. Vagas e Banco de vagas.
6. Base de conhecimento e Perfil.
7. Versões, comparação e Currículo.
8. Login e registro.
9. Validação completa.

## 10. Critérios de aceitação

- **CA25** Todas as telas usam o novo design system e a sidebar, sem alterar contratos ou regras de negócio.
- **CA26** O workspace é claro, usa `#171717` e azul `#003049` como único acento de interface e fundo da sidebar, com raio padrão de 8px.
- **CA27** Cards, bordas e sombras aparecem somente quando comunicam agrupamento, interação ou estado; nenhum fluxo principal usa modal.
- **CA28** Dashboard, tabelas, Kanban, score e comparação mantêm alta densidade e hierarquia legível em desktop e mobile.
- **CA29** Loading, vazio, erro, sucesso, processamento e indisponibilidade são apresentados junto ao contexto afetado.
- **CA30** A interface funciona por teclado, possui foco visível, contraste WCAG AA, alvos de toque adequados e respeita `prefers-reduced-motion`.
- **CA31** O `web` passa em typecheck e build, e os fluxos CA1 a CA24 afetados pela interface permanecem funcionais.

## Changelog

- **1.4.0 (2026-09-14)**: redesenho completo do `web` com tema claro, sidebar, design system próprio em SCSS e arquitetura de todas as telas, sem nova funcionalidade.
