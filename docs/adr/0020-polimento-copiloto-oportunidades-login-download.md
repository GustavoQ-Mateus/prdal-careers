# ADR 0020, Polimento de copiloto, download de currículo, grafo, login e gráfico de score

- **Status:** Aceita
- **Data:** 2026-09-18
- **Fase-alvo:** P10, polimento leve pós-P9, antes do fechamento
- **Contexto:** Uso real do produto (usuário logado, fluxo ponta a ponta) expôs cinco lacunas pequenas e desacopladas entre si, todas de UX, sem tocar a pipeline de geração corrigida na P9-fix:
  1. Depois de `gerar_curriculo` retornar `status: GERANDO` (job assíncrono, ADR 0019), o copiloto encerra o turno narrando em texto livre "vou monitorar e trazer o currículo pronto", mas não volta a chamar `status_geracao`. A promessa é falsa: nada monitora de fato. A UI já tem o componente certo para isso (`PassoTrilha` em `copiloto/componentes.tsx`, ícone `Loader2` girando -> check + "Ver retorno"), só falta o loop de chamadas encadeadas que o preencha.
  2. Em `Curriculos.tsx`, o download é dois botões de texto separados, "DOCX" e "PDF", chamando `GET /curriculos/:id/docx` e `/pdf` isoladamente. Não existe rota nem UI para baixar o Markdown, nem para baixar os três formatos juntos como pasta, como o legado da pipeline `geracurriculo` já faz (pasta com o nome da vaga contendo `.md`, `.docx` e `.pdf`). O rótulo "Versão N" (`curriculos.service.ts:423`, `` `Versao ${versoes + 1}` ``) já existe no backend e já é exibido cru pela UI (`c.rotulo`); não há lacuna aí, só falta confirmar que nenhuma tela options trunca ou substitui esse valor.
  3. Em `Oportunidades.tsx`, o botão "Registrar oportunidade" usa `<Button>` sem `variant`, que resolve para `variant="primary"` (`bg-primary`, token neutro quase preto/quase branco por tema). O azul do sistema é o token `--accent` (`variant="accent"`), já usado em outros pontos da interface. O mesmo vale para o botão "Acessar" em `AuthForm.tsx`.
  4. Em `OportunidadesGrafo.tsx`, a cor do rótulo dos nós (`labelColor`) é lida de `getComputedStyle(document.documentElement).getPropertyValue('--ink')` uma única vez, na função de fábrica passada como `settings` do `SigmaContainer`. O Sigma não reaplica essa leitura quando o tema muda em runtime (classe `dark` alternada no `documentElement`), então o rótulo fica preso à cor capturada no primeiro paint, ficando ilegível contra o fundo depois de alternar tema. Nós que não são oportunidade (empresa, categoria, nível, skill, conforme `facets` do `GrafoResposta`) usam todos a mesma cor cinza fixa (`--faint`), sem diferenciação por `tipo`. E não existe nenhum handler de drag: os nós só se movem pelo layout ForceAtlas2 automático, sem reposicionamento manual do usuário.
  5. Ao final da Etapa 3 do modo-pipeline, o copiloto relata os scores ATS antes/depois só como texto e tabela Markdown. O projeto já tem `recharts` instalado e um wrapper shadcn pronto em `components/ui/chart.tsx` (usado em `Hoje.tsx`), mas o chat do copiloto nunca usa gráfico para essa comparação, que é justamente o dado mais visual do turno.

## Decisão

### 1. Acompanhamento real de geração assíncrona, sem narrar o que não faz

O agente do copiloto não pode declarar que vai monitorar uma operação que não continua monitorando. Quando `gerar_curriculo` (ou uma chamada equivalente) retornar status não terminal (`GERANDO`), o próprio turno de streaming encadeia chamadas automáticas a `status_geracao` (mesmo padrão de `tool_call` -> `tool_resultado` que qualquer outra ferramenta usa), com espera curta entre tentativas, até status terminal (`CONCLUIDA` ou `ERRO`) ou um orçamento de tempo do turno (o suficiente para não estourar o timeout de proxy/cliente já existente no produto). Cada tentativa vira um item `passo` novo, encadeado visualmente pelo `ligado` que `PassoTrilha` já suporta; nenhum componente novo é necessário no front. Se o orçamento de tempo esgotar antes de um status terminal, o agente diz isso explicitamente ("ainda gerando, sem acompanhamento automático além daqui; pergunte novamente ou volte a esta conversa para conferir") em vez de prometer um retorno espontâneo que o produto não entrega.

### 2. Download vira um pacote, não dois botões

`Arquivos` em `Curriculos.tsx` deixa de expor botões de texto "DOCX"/"PDF" e passa a expor um único botão ícone de download por currículo. A API ganha `GET /curriculos/:id/pacote`, que monta um `.zip` em memória com uma pasta `<Rótulo da vaga - Empresa>/` contendo `Curriculo_<rótulo>.md` (o campo `markdown` já persistido, escrito na hora), `.docx` e `.pdf` (os arquivos já gerados, se existirem; formatos ausentes ficam de fora do pacote sem erro). O nome da pasta e do zip seguem o padrão já usado no legado `curriculos/output/<Nome_Vaga>/` da pipeline `geracurriculo`, sanitizado para nome de arquivo. O rótulo "Versão N" já é gerado no backend e já chega cru à UI; esta ADR não muda esse mecanismo, só formaliza que ele é a fonte correta e deve continuar sendo exibido sem transformação.

### 3. Azul do sistema é o token `--accent`, não o `--primary`

Qualquer botão de ação primária de tela (não formulário de edição secundário) usa `variant="accent"`. Ficam travados dois casos concretos: "Registrar oportunidade" em `Oportunidades.tsx` e "Acessar"/"Criar conta" em `AuthForm.tsx`. Não se cria variante nova nem se muda o valor de `--primary`, que continua servindo outros usos neutros da interface.

### 4. Grafo: cor reativa ao tema, paleta por tipo de nó, reposicionamento manual

A leitura de `--ink`, `--accent`, `--faint` e `--line-strong` para as `settings` do `SigmaContainer` deixa de ser uma leitura estática de fábrica e passa a reagir a mudança de tema em runtime (observar a classe/atributo de tema no `documentElement` e reaplicar via `sigma.setSetting(...)`, ou recriar o container quando o tema muda). Nós que não são `oportunidade` deixam de compartilhar uma cor cinza única: cada valor de `tipo` presente em `GrafoResposta.nodes` (os tipos de entidade que aparecem hoje: empresa, categoria, nível, skill) ganha uma cor própria de uma paleta acessível em claro e escuro, e a legenda (`dl` de tipos) passa a listar uma linha por tipo real em vez de só "Oportunidade" e "Entidade relacionada". Usuário pode arrastar um nó com o ponteiro para reposicioná-lo manualmente, no padrão do grafo do Obsidian: ao iniciar o arraste, o nó sai do controle do `FA2Layout` (fica com posição fixada) e passa a seguir o ponteiro; ao soltar, a posição fica onde o usuário deixou até a próxima recarga dos dados do grafo. Persistência de posição entre sessões fica fora desta ADR: não existe hoje endpoint para isso (o `CanvasLayout` existente é de outra tela, o board de vagas) e criar um é escopo novo de produto, não polimento; se o usuário quiser isso depois, entra como ADR própria.

### 5. Comparação de score ATS vira gráfico no chat

Quando o resultado de uma ferramenta do copiloto trouxer `analiseInicial.score` e `analiseFinal.score` (o par que a Etapa 1 e a Etapa 3 do modo-pipeline já produzem), a mensagem correspondente no chat renderiza, além do resumo em texto que já existe, um gráfico de área usando o `ChartContainer`/`AreaChart` de `components/ui/chart.tsx` já presente no projeto (mesmo padrão do exemplo shadcn "Area Chart - Gradient"), com duas categorias no eixo X ("Base", "Gerado") e o score no eixo Y. Não se introduz biblioteca de gráfico nova; reaproveita-se o wrapper que `Hoje.tsx` já usa.

## Justificativa

- Cada um dos cinco pontos já tem o componente ou a dependência certa parcialmente construída no repositório (`PassoTrilha`, o rótulo "Versão N" do backend, o token `--accent`, o `SigmaContainer` com `settings` de cor, e `components/ui/chart.tsx`); a decisão é fechar a lacuna que falta, não introduzir arquitetura nova, mantendo o princípio de menor mudança que a `ORQUESTRACAO.md` pede.
- Não prometer monitoramento que não acontece é consistência entre o que o texto do agente diz e o que o sistema faz; isso é o mesmo princípio de "expor degradação em vez de sucesso silencioso" que a P9-fix já fixou para a geração.
- Empacotar o download como o legado da pipeline `geracurriculo` já faz aproveita um padrão validado pelo usuário em outro sistema, em vez de inventar um novo.
- Diferenciar cor por tipo de nó e permitir arraste aproxima a ferramenta de grafo de uma referência que o usuário já usa e confia (Obsidian), sem exigir biblioteca de grafo nova.

## Consequências

- `apps/web/src/copiloto/`: o backend do turno (SSE) ganha lógica de encadeamento de `status_geracao`; nenhuma mudança de contrato de evento SSE é necessária, os eventos `tool_call`/`tool_resultado` já suportam múltiplas chamadas na mesma resposta.
- `apps/api`: nova rota `GET /curriculos/:id/pacote` retornando `application/zip`; `apps/web/src/Curriculos.tsx` e `api.ts` ganham a função de download de pacote e perdem os dois botões de texto.
- `apps/web/src/Oportunidades.tsx` e `AuthForm.tsx`: troca de `variant` nos dois botões citados, sem mudança de token.
- `apps/web/src/OportunidadesGrafo.tsx`: leitura de cor reativa a tema, paleta por `tipo`, handlers de drag via `useRegisterEvents`.
- `apps/web/src/copiloto/componentes.tsx` e `tipos.ts`: novo tratamento de renderização quando o resultado de uma ferramenta traz `analiseInicial`/`analiseFinal`, usando `components/ui/chart.tsx` já existente.
- A `spec-v1.9.0` seção 7 registra CA67 a CA73 cobrindo estes cinco pontos.
- O item de reestruturação do formulário de Perfil (contato tipado, formação, experiência e certificações estruturadas) é grande demais e arriscado demais para entrar neste lote; fica coberto pela ADR 0021 e pela `spec-v1.10.0`, como fase separada (P11).
