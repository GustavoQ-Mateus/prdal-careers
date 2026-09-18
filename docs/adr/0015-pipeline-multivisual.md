# ADR 0015, Pipeline multivisual de oportunidades

- **Status:** Aceita
- **Data:** 2026-09-14
- **Fase-alvo:** Fase 6, ver `spec-v1.5.0`
- **Contexto:** O candidato precisa operar etapas, organizar espacialmente e explorar relações entre todas as vagas registradas. Kanban, um ambiente visual com nós e um grafo estilo Obsidian atendem perguntas diferentes. Manter dados próprios para cada visualização criaria divergências e esconderia a oportunidade central definida na ADR 0013.

## Decisão

Kanban, Canvas e Grafo são projeções do mesmo conjunto de oportunidades relacionais. Candidatura, currículos, score, ações e conhecimento enriquecem a oportunidade quando existirem. Entradas cruas permanecem na triagem de Oportunidades até serem ativadas. Nenhum modo possui status ou cópia independente do domínio.

Busca, filtros e ordenação são compartilhados. O usuário pode setorizar e ordenar por categoria, nível, empresa, etapa, prioridade, score ATS, correspondência de keywords, próximo passo e atividade recente. Não existe ranking universal nem ranking opaco produzido por LLM.

### Kanban

O Kanban é a projeção operacional por etapa. Oportunidades ativas sem candidatura aparecem em Preparação. Quando há candidatura, as colunas refletem seu status. Oportunidades encerradas permanecem disponíveis por filtro.

Mover entre colunas altera o estado canônico correspondente e registra evento. Toda alteração por arraste possui uma ação textual equivalente.

### Canvas

O Canvas é um plano manual de organização:

- cada oportunidade é um nó;
- o usuário posiciona nós, usa pan, zoom, fit e busca;
- posição e viewport persistem por usuário;
- mover um nó altera apenas a organização espacial;
- status, prioridade e demais campos mudam somente por ação explícita;
- não existem portas, conexões autorais, formas livres, gatilhos ou execução.

`PipelineLayout` armazena `usuarioId`, `vagaId`, `modo`, `posX`, `posY` e timestamps. `PreferenciaUsuario` armazena um viewport único com `x`, `y` e `zoom`, além de uma revisão global do layout completo. O salvamento é idempotente, em lote e ocorre no fim do arraste ou após debounce. A revisão evita sobrescrever uma atualização mais recente.

### Grafo

O Grafo é uma projeção de leitura gerada pela API. Tipos de nó:

- oportunidade;
- empresa;
- categoria;
- nível;
- competência ou keyword;
- currículo;
- documento de conhecimento.

A projeção publica `schemaVersion`. Textos relacionais são normalizados por lowercase, remoção de acentos, trim, compactação de espaços e remoção de pontuação. Não há similaridade aproximada.

Arestas são criadas somente por estas regras:

- oportunidade para empresa, categoria e nível por igualdade do valor normalizado;
- oportunidade para competência por keyword normalizada;
- oportunidade para currículo e currículo para candidatura pelas FKs;
- candidatura para documento virtual de conhecimento quando `Candidatura.notas` não está vazia;
- oportunidade para nota Markdown do MongoDB quando uma keyword normalizada aparece exatamente no título ou corpo de `notas_obsidian`;
- perfil para competência pelos valores canônicos de `PerfilMestre.skills`.

PostgreSQL e a coleção `notas_obsidian` definida na ADR 0012 são as únicas fontes da projeção. Documentos virtuais recebem IDs estáveis a partir do tipo e do ID da entidade de origem. Chroma fornece recuperação semântica para geração, mas não é consultado para criar arestas. LLM também não cria relações.

O grafo não recebe tabela própria. IDs são estáveis e compostos pelo tipo e identificador canônico. O layout visual pode variar, mas o mesmo conjunto de dados e filtros produz os mesmos nós e arestas.

## Justificativa

- Kanban responde em que etapa cada oportunidade está.
- Canvas permite ao candidato construir uma organização espacial pessoal.
- Grafo revela setores, competências e relações que uma lista não evidencia.
- Um único domínio evita conflito entre visualizações.
- Persistir somente o Canvas respeita a intenção manual sem transformar relações derivadas em dados autorais.

## Consequências

- Atualizar uma oportunidade em um modo deve refletir nos demais após confirmação da API.
- O Canvas exige nova persistência PostgreSQL; o Grafo não exige graph database.
- Os três modos precisam de uma representação textual equivalente.
- Mobile prioriza lista e Kanban. Canvas e Grafo permitem busca, seleção e inspeção sem depender de arraste.
- O grafo de conhecimento não vira editor de notas, e o Canvas não vira ferramenta de automação.
