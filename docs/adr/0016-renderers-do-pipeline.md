# ADR 0016, Renderers do Pipeline

- **Status:** Aceita
- **Data:** 2026-09-14
- **Fase-alvo:** Fase 6, ver `spec-v1.5.0`
- **Contexto:** O Canvas exige manipulação controlada de nós, viewport, teclado e toque. O Grafo precisa renderizar centenas de nós e arestas com interação fluida. Implementar os dois renderers do zero aumentaria risco, acessibilidade incompleta e manutenção sem diferenciar o produto.

## Decisão

Usar `@xyflow/react` para o Canvas e `@react-sigma/core` com Graphology e ForceAtlas2 para o Grafo.

### Canvas

`@xyflow/react` será usado em modo controlado:

- posições recebidas da API e mantidas no estado React;
- nós próprios alinhados ao design system;
- persistência ao fim do arraste ou por debounce;
- viewport restaurado por usuário;
- controles de zoom com nomes acessíveis;
- minimapa somente se testes mostrarem ganho real;
- sem handles, arestas, execução ou elementos de editor.

### Grafo

`@react-sigma/core` renderizará o grafo Graphology em WebGL:

- nós e arestas produzidos pela projeção da API;
- ForceAtlas2 executado em worker quando necessário;
- busca, filtros, foco em vizinhança e seleção;
- layout pausável;
- câmera com fit, zoom e retorno ao conjunto;
- painel textual sincronizado com a seleção.

Cada modo será carregado com `React.lazy` apenas quando selecionado. Kanban não dependerá dos bundles do Canvas ou do Grafo.

Os estilos dos renderers devem usar `apps/web/src/styles.scss` e os tokens existentes. Folhas de estilo exigidas pelas bibliotecas podem ser importadas, mas não definem a identidade visual.

## Acessibilidade

- Kanban, Canvas e Grafo possuem lista textual equivalente com as mesmas ações permitidas.
- Arraste nunca é o único meio de alterar ou abrir um item.
- Nós selecionáveis recebem nome que combina vaga, empresa e etapa.
- Controles têm foco visível e nome acessível.
- Mudanças persistidas são anunciadas em região de status.
- `prefers-reduced-motion` desativa transições e animação contínua do layout.
- No mobile, busca, filtros, lista e inspetor são prioritários. Gestos de canvas não bloqueiam o scroll fora da região.

## Performance

O dataset de referência contém 500 nós e 1.000 arestas:

- interação de câmera deve permanecer responsiva em equipamento intermediário;
- filtros não remontam toda a página;
- ForceAtlas2 pode ser pausado e não bloqueia a thread principal;
- atualizações de posição são agrupadas;
- o inspetor busca detalhes sob demanda quando o resumo não for suficiente.

Acima do orçamento, a API e o cliente podem exigir filtros antes de renderizar. Virtualização da alternativa textual é permitida quando a medição justificar.

## Justificativa

- React Flow resolve interação espacial e estado controlado sem introduzir semântica de automação.
- Sigma usa WebGL e Graphology, adequados ao volume esperado e a relações derivadas.
- Lazy loading protege o tempo inicial do aplicativo.
- Alternativa textual preserva operação por teclado e em telas pequenas.

## Consequências

- Entram dependências de runtime justificadas e específicas no `web`.
- Atualizações de versão precisam validar API, CSS, teclado e touch.
- Testes cobrem carregamento por modo, persistência, filtros, seleção, fallback textual e orçamento de referência.
- Se uma biblioteca falhar, Kanban e lista continuam sendo caminhos funcionais para os mesmos dados.
