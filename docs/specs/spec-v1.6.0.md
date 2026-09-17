# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.6.0 |
| **Status** | Draft |
| **Data** | 2026-09-15 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Organização pessoal de oportunidades para candidatos desenvolvedores |
| **Base** | Estende `spec-v1.0.0.md` a `spec-v1.5.0.md` |

> MINOR compatível. Redesign v2 do `web`. Reposiciona a navegação como jornada, funde Oportunidades e Pipeline num hub único de visões, adota a linguagem de produto corporativo e a migração de estilo da ADR 0017 e formaliza o copiloto de candidatura como escopo futuro. CA1 a CA48 continuam válidos. Esta versão adiciona CA49 a CA55. Não altera contratos da API, domínio nem serviços.

## 1. Identidade do produto

A identidade funcional permanece a da `spec-v1.5.0`. O PRDAL Careers é um organizador pessoal de vagas para candidatos desenvolvedores, do candidato, nunca do lado empresa ou recrutador. Esta versão trata da camada de experiência e apresentação, não do domínio.

## 2. Problema

A v1.5.0 entregou as capacidades certas, mas a interface ficou entre dois extremos. A doutrina anti AI slop virou anti acabamento: formulários crus empilhados sobre listas, tabelas sem moldura, sobreposições proibidas por padrão e telas em que tudo tem o mesmo peso visual. Ao mesmo tempo, a navegação ainda expõe a divisão técnica, com Pipeline como destino separado e a lista como visão equivalente paralela.

O candidato precisa de um produto com acabamento maduro e de uma navegação que expresse a jornada, não a estrutura de dados.

## 3. Objetivo

1. Adotar a linguagem de produto corporativo limpo do `docs/design-system.md` v2.
2. Transformar a navegação em jornada, com Oportunidades como hub único.
3. Absorver o Pipeline multivisual como visões dentro de Oportunidades.
4. Tornar os padrões corporativos de interação um requisito de UI verificável.
5. Formalizar o copiloto de candidatura como escopo, sem especificar seus contratos aqui.

## 4. Escopo

### Entra

1. Redesign visual do `web` segundo o design system v2 e a ADR 0017.
2. Migração de estilo de SCSS para Tailwind CSS mais shadcn/ui, com tokens em CSS variables.
3. Navegação como jornada e hub único de Oportunidades com seletor de visão lista, board e grafo.
4. Padrões corporativos de interação como requisito de UI: modal, slide-over, wizard e card elevado.
5. Tema claro e escuro coerentes com os tokens.
6. Formalização do copiloto de candidatura como escopo, apontando para a ADR 0018 e para detalhamento de contratos em versão futura.

### Não entra

- Mudança em contratos da API, no domínio ou nos serviços.
- Especificação dos contratos, endpoints ou fluxos do copiloto de candidatura.
- Qualquer função de empresa ou recrutador.
- Reintrodução de SCSS ou de biblioteca de componentes opaca.

## 5. Decisões preservadas e novas

### Preservadas

- ADR 0001 a 0009, 0011 a 0016 permanecem válidas no que não conflita com esta versão.
- ADR 0013: Oportunidade como agregado do candidato.
- ADR 0014: agenda e histórico da oportunidade.
- ADR 0016: renderers do Pipeline continuam válidos; os renderers passam a viver dentro do hub de Oportunidades.

### Revisadas

- ADR 0010: superseded pela ADR 0017. SCSS deixa de ser o padrão de estilo.
- ADR 0015: a seção de navegação é revisada. Kanban, Canvas e Grafo continuam projeções do mesmo conjunto de oportunidades relacionais, mas deixam de ser um destino Pipeline separado e passam a ser visões do hub de Oportunidades. As regras de projeção, filtros compartilhados, transições e persistência do Canvas permanecem intactas.

### Novas

- ADR 0017: linguagem de produto corporativa e migração para Tailwind mais shadcn/ui.
- ADR 0018: copiloto de candidatura, a ser escrita antes da implementação do copiloto.

## 6. Arquitetura de informação

### 6.1 Navegação principal

A navegação passa a expressar a jornada do candidato:

1. **Hoje:** agenda operacional.
2. **Oportunidades:** hub único que reúne o inventário e as visões lista, board e grafo.
3. **Currículos:** biblioteca transversal.
4. **Perfil** e **Conhecimento:** fundação, as fontes confiáveis da geração.

A aba Pipeline deixa de existir como destino separado. O board e o grafo passam a ser visões dentro de Oportunidades, alternadas por um seletor de visão. Some a noção de lista como visão equivalente paralela; a lista é a visão textual primária do próprio hub. O Workspace continua fora da navegação e abre a partir de qualquer representação de uma oportunidade.

### 6.2 Rotas do web

O hub concentra as visões em uma rota com parâmetro de visão:

- `/hoje`
- `/oportunidades?visao=lista`
- `/oportunidades?visao=board`
- `/oportunidades?visao=grafo`
- `/oportunidades/:id`
- `/oportunidades/:id/curriculos/:curriculoId`
- `/curriculos`
- `/conhecimento`
- `/perfil`

Busca, filtros relevantes e a visão atual vivem na URL. Trocar de visão preserva busca, filtros e o subconjunto atual. Reload, botões do navegador e deep link preservam a tela, a visão e o identificador.

As rotas `/pipeline` da v1.5.0 permanecem como aliases legados e redirecionam para `/oportunidades` com a visão correspondente, sem quebrar deep links salvos.

## 7. Requisitos de UI

Esta versão eleva a apresentação a requisito verificável, alinhado ao `docs/design-system.md` v2.

### 7.1 Padrões corporativos de interação

- Cadastro, edição focada e confirmação destrutiva curta acontecem em modal. Formulário não fica empilhado cru sobre a lista.
- Detalhe lateral sem perder contexto acontece em slide-over.
- Fluxo com etapas ordenadas, como a geração ATS, acontece em wizard com indicador de progresso real.
- Card elevado é a unidade manipulável, com destaque no board.
- Sombra sutil é reservada ao que eleva de verdade.
- Modal e slide-over contêm o foco, fecham por Escape e devolvem o foco ao gatilho.

### 7.2 Intenção visual por área

Cada área tem intenção de design própria, coerente entre telas, conforme o guia por tela do design system:

- Hoje é agenda temporal contínua, não mosaico de KPI.
- Oportunidades é um hub único com seletor de visão; a lista é densa, o board usa card elevado arrastável e o grafo comunica tipo por forma, rótulo e legenda.
- Workspace é página profunda com cabeçalho persistente e inspetor integrado.
- Geração ATS é wizard de três etapas com o currículo renderizado, não exibido cru.
- Currículos, Perfil e Conhecimento usam regiões e tabelas, sem mosaico de cards.

### 7.3 Cor, tipografia e tema

- Base branco total. Acento teal apenas em interação, foco, ativo e seleção. Ação primária em grafite quase preto. Score usa a tríade reservada e nunca vira acento.
- Tokens em CSS variables como fonte única, consumidos por Tailwind e shadcn/ui.
- Tema claro e escuro coerentes com os tokens.
- A blocklist anti AI slop revisada do design system vale como critério de revisão.

## 8. Copiloto de candidatura, escopo formalizado

O copiloto de candidatura passa a ser escopo reconhecido do produto, como culminância do redesign. Ele reproduz, virado produto, o loop de preparação de candidatura: extrair keywords, puxar Perfil e RAG, gerar o currículo tailored, medir o score determinístico, registrar a oportunidade e o próximo passo e redigir texto de mensagem e respostas para o candidato usar.

Princípios que esta versão fixa, sem especificar contratos:

- O agente prepara e orquestra o que é interno e reversível. O humano dispara o externo. O agente não envia candidatura nem mensagem sozinho; entrega texto pronto para o candidato revisar e enviar. Human-in-the-loop, coerente com a `spec-v1.5.0` seção 18.
- A infraestrutura já existe. O copiloto orquestra os serviços e endpoints atuais por tool-calling; não é IA nova.
- O score continua determinístico. O LLM chama a função de score, não inventa número.
- Ler e analisar rodam sozinhos; criar, gerar e mover pedem confirmação explícita.
- O copiloto convive com o fluxo manual, que segue primeiro-classe sobre os mesmos endpoints.

Os contratos, endpoints, streaming e fluxos do copiloto serão definidos na **ADR 0018** e em uma versão de spec futura, em prompt próprio. Esta versão apenas reserva o escopo e as fronteiras.

## 9. Requisitos funcionais

- **RF32** A navegação principal expressa a jornada com Hoje, Oportunidades, Currículos, Perfil e Conhecimento, sem uma aba Pipeline separada.
- **RF33** Oportunidades é um hub único com seletor de visão lista, board e grafo, e trocar de visão preserva busca, filtros e subconjunto.
- **RF34** Cadastro e edição usam modal; detalhe lateral usa slide-over; geração ATS usa wizard; o board usa card elevado.
- **RF35** O `web` oferece tema claro e escuro coerentes com os tokens.
- **RF36** O copiloto de candidatura é escopo reconhecido, com fronteiras human-in-the-loop registradas, e seus contratos ficam para a ADR 0018 e versão futura.

## 10. Requisitos não funcionais

- **RNF25 Estilo:** o `web` usa Tailwind CSS mais shadcn/ui com tokens em CSS variables como fonte única; SCSS não é reintroduzido.
- **RNF26 Design:** a interface segue `docs/design-system.md` v2 e a blocklist anti AI slop revisada, substituindo a referência de design das versões anteriores.
- **RNF27 Continuidade:** a migração de estilo e navegação não altera contratos da API, domínio ou serviços, e as rotas anteriores permanecem funcionais por alias.
- **RNF28 Acessibilidade:** modal, slide-over e wizard contêm foco, fecham por Escape e devolvem foco; a operação passa por teclado nos quatro breakpoints em tema claro e escuro.

## 11. Critérios de aceitação

- **CA49** A navegação principal apresenta Hoje, Oportunidades, Currículos, Perfil e Conhecimento, sem aba Pipeline, e o Workspace abre a partir de representações da oportunidade.
- **CA50** Oportunidades reúne inventário e as visões lista, board e grafo sob um seletor de visão, preservando busca, filtros e subconjunto ao alternar.
- **CA51** As rotas `/pipeline` anteriores redirecionam para `/oportunidades` na visão correspondente, sem quebrar deep links, e a visão vive na URL.
- **CA52** Cadastro e edição acontecem em modal, detalhe em slide-over e geração ATS em wizard, com foco contido, fechamento por Escape e retorno de foco.
- **CA53** O `web` usa Tailwind mais shadcn/ui com tokens em CSS variables, sem SCSS, e oferece tema claro e escuro coerentes.
- **CA54** Cada área respeita a intenção visual do design system v2, com acento teal só em interação, foco, ativo e seleção, ação primária grafite e score na tríade reservada, e passa a blocklist anti AI slop revisada.
- **CA55** O copiloto de candidatura consta como escopo formalizado com fronteiras human-in-the-loop, apontando para a ADR 0018, sem contratos definidos nesta versão. CA1 a CA48 não regridem.

## 12. Migração

A migração é de front e ocorre sem tocar contratos, domínio ou serviços:

1. introduzir Tailwind e shadcn/ui, declarar os tokens como CSS variables em `:root` e `.dark`;
2. migrar shell e navegação para o hub único, com o seletor de visão e os aliases de rota;
3. migrar as telas por área conforme o guia do design system, substituindo primitivas próprias por componentes shadcn/ui ajustados;
4. adotar as bibliotecas da ADR 0017 onde a tela exigir;
5. remover o SCSS e as primitivas antigas ao fim da migração de cada área;
6. validar tema claro e escuro, teclado e os quatro breakpoints por tela.

## 13. Riscos

- **Regressão de acabamento:** afrouxar a blocklist pode reintroduzir o genérico. Mitigação: blocklist revisada e verificação por tela.
- **Escopo do redesign:** migrar todas as telas é extenso. Mitigação: migração por área, com Kanban e lista sempre funcionais.
- **Deep links salvos:** trocar Pipeline por hub pode quebrar links. Mitigação: aliases de rota com redirecionamento.
- **Bundle:** novas bibliotecas aumentam o peso inicial. Mitigação: lazy loading por visão, mantido da ADR 0016.

## Changelog

- **1.6.0 (2026-09-15):** redesign v2 do `web`; navegação como jornada e hub único de Oportunidades absorvendo o Pipeline multivisual; padrões corporativos de interação como requisito de UI; migração de SCSS para Tailwind mais shadcn/ui com tokens em CSS variables; tema claro e escuro; copiloto de candidatura formalizado como escopo, com contratos reservados para a ADR 0018 e versão futura; preserva contratos, domínio e serviços.
