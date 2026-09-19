# ADR 0031, Polimento final de login, copiloto, grafo e tema

- **Status:** Aceita
- **Data:** 2026-09-19
- **Fase-alvo:** P10-correção 6, achados de validação manual e revisão geral do produto
- **Contexto:** Validação manual de uma vaga real (FCamara, Desenvolvedor Back-End Java Jr) e revisão geral da interface expuseram onze pontos, alguns bugs de regressão contra critérios de aceite já aceitos, outros reversões conscientes de decisões anteriores, e um caso de política de segurança nunca revisada.

  1. **Etapas e preview do currículo não aparecem no chat do copiloto.** CA84 a CA93 e CA90/CA91 (specs 1.9.4 a 1.9.8) já declaram esse comportamento implementado e verificado por leitura de código, mas a validação real na interface mostrou o chat exibindo apenas os cartões de chamada de ferramenta com JSON técnico bruto por trás de "Ocultar retorno" ("Registrar oportunidade", "Gerar currículo", "Ver status da geração"), sem o indicador de etapas consolidado nem o `CartaoPreviewCurriculo` com botão de download. É o quarto ciclo em que este ponto é levantado sem fechar. O padrão de "código correto, nunca comprovado visualmente" já está documentado em `ESTADO_ATUAL.md` ("Pendente de validação manual: nenhum CA visual/fluxo foi declarado aprovado").
  2. **Extração de keywords aceita termos não técnicos.** A `spec-v1.9.9` (CA94-97) corrigiu o caso do LLM indisponível (fallback por frequência). Um caso novo e distinto: o LLM roda com sucesso (`keywordsStatus: "VALIDAS"`) e devolve termos institucionais da vaga em vez de requisitos técnicos. Vaga real FCamara: keywords persistidas foram "Desenvolvedor Back-End Java, Banco de Investimentos, capital de investimento, gerenciamento de patrimônio, ativos globais, ecossistema de tecnologia, inovação, expansão global, Brasil, Portugal, Reino Unido, comunidade tech, diversidade, respeito, ética". Só o primeiro termo é competência técnica; o resto é nome de país, valor institucional ou frase de missão da empresa. O prompt de `extract_keywords` (`apps/ai-service/app/keywords.py`) não restringe o tipo semântico do termo, só a origem (LLM vs. frequência).
  3. **Copiloto tem dois modos, um deles supérfluo, e nenhum cobre redação assistida.** A ADR 0018 já registrava como lacuna aberta, sem rota própria, "redação de mensagem ao recrutador e de respostas de formulário". O modo "Assistido" hoje não entrega isso, e coexistir com "Autopiloto" divide a atenção do usuário sem ganho: o autopiloto já cobre o mesmo caminho com menos fricção.
  4. **Arrastar um nó do grafo mata a simulação inteira.** `OportunidadesGrafo.tsx:204`, `onArrastar={() => setLayoutAtivo(false)}`, desliga `layoutAtivo`, que por sua vez (`CarregarGrafo`, linha 62) impede o `FA2Layout` de rodar até o usuário clicar manualmente em "Retomar layout" (linha 178). A intenção original da CA71 (ADR 0020) já citava o grafo do Obsidian como referência, mas a implementação interpretou isso como "parar tudo ao arrastar", quando no Obsidian só o nó arrastado fica fixo e os demais continuam reagindo à simulação de força.
  5. **Grafo e board não têm o controle de ordenação que a lista tem.** Lacuna de paridade entre as três visualizações de Oportunidades.
  6. **Rótulo "Versão N" no currículo gerado.** CA69 (ADR 0020) apenas validou que esse rótulo genérico (`curriculos.service.ts:509`, `` `Versao ${versoes + 1}` ``) chega sem transformação à UI. Em uso real, esse rótulo não diz nada sobre a vaga; o usuário quer revisitar essa decisão.
  7. **Tema escuro como padrão de primeira visita.** `apps/web/src/lib/theme.ts:5-8`, `initialTheme()` resolve para `prefers-color-scheme` do sistema quando não há preferência salva. Nunca houve ADR fixando isso como decisão de produto; é o comportamento default de quem implementou a função, não uma escolha registrada.
  8. **Azul de acento diferente entre claro e escuro.** `apps/web/src/index.css:14` (`--accent: #2563eb` no claro) e linha 37 (`--accent: #60a5fa` no escuro) usam tons distintos, prática comum de acessibilidade (tom mais claro contra fundo escuro), mas o usuário quer o mesmo tom nos dois temas.
  9. **Botão "Definir próximo passo" fora do padrão de cor de ação primária** que a CA70 (ADR 0020) já fixou para outros botões equivalentes.
  10. **Anel de foco azul saturado nos campos de texto do login**, sem relação com o token de acento do resto do produto.
  11. **Sessão de 7 dias sem revisão de política.** `apps/api/src/auth/auth.module.ts:13`, `signOptions: { expiresIn: '7d' }`; o token fica em `localStorage` (`apps/web/src/api.ts:194`) sem refresh e sem handler de 401 no cliente. Fechar o terminal e desligar a máquina não desloga o usuário, porque o token continua válido e nada intercepta uma eventual expiração para redirecionar ao login. Isso nunca foi uma decisão registrada, é o default do Nest não revisado.

## Decisão

### 1. Etapas e preview do currículo no chat: reabertura com prova visual obrigatória

CA84 a CA93 voltam ao estado "não fechado" até existir evidência visual real (captura de tela ou gravação, anexada a `ESTADO_ATUAL.md`) mostrando, para uma geração ponta a ponta na interface: um indicador único e consolidado de progresso por etapas (não os cartões brutos de chamada de ferramenta como conteúdo principal), a narração de Etapa 1 e Etapa 3 com os gráficos correspondentes quando `analiseInicial.score` e `analiseFinal.score` estiverem presentes, e um cartão de currículo pronto com botão de baixar o pacote. Build passando e teste automatizado não fecham este item sozinhos; typecheck e testes continuam obrigatórios, mas não substituem a prova visual.

### 2. Extração de keywords restrita a natureza técnica

O schema de saída de `extract_keywords` ganha um campo de categoria por termo (por exemplo `tipo`: stack | ferramenta | metodologia | dominio_negocio | certificacao). O prompt em `apps/ai-service/app/keywords.py` instrui explicitamente que um termo só é válido se representar competência técnica, ferramenta, linguagem, framework, metodologia, certificação ou domínio de negócio explícito no requisito da vaga (ex.: "gerenciamento de patrimônio" pode ser válido como domínio de negócio de uma vaga de banco de investimento). Nome de país, adjetivo institucional (diversidade, ética, respeito, inovação, missão) e frase de employer branding nunca são keyword válida, independentemente de aparecerem com destaque no texto da vaga. Uma validação pós-extração descarta o termo que não se enquadrar em nenhuma categoria; se nada restar após o filtro, a vaga segue o mesmo caminho de "sem keywords extraídas" já definido na ADR 0030, oferecendo nova tentativa em vez de produzir score sobre lixo institucional.

### 3. Copiloto com um único modo, com redação assistida

A UI do copiloto deixa de expor "Assistido" como opção; "Autopiloto" passa a ser o único modo disponível, absorvendo a etiqueta de mais alto nível da interface (renomear referências visuais de "Autopiloto" para o nome do produto, não simplesmente remover a opção concorrente e deixar o rótulo antigo). O autopiloto ganha capacidade conversacional explícita para dois casos que a ADR 0018 já registrava como lacuna sem rota própria: preencher um formulário dirigido por diálogo (o usuário descreve o campo, o agente propõe o valor a partir do perfil-mestre e do contexto da vaga, o usuário confirma ou corrige) e redigir mensagem ao recrutador ou resposta de formulário de candidatura a partir do perfil-mestre e da descrição da vaga, no mesmo espírito com que um agente de codificação redige uma mensagem a partir do perfil do candidato e da vaga. Isso é redação assistida, não envio: a ação externa de enviar continua exigindo confirmação humana explícita, conforme o princípio 2 da ADR 0018, que esta ADR não altera.

### 4. Grafo: simulação de força contínua ao estilo Obsidian

`onArrastar` deixa de desligar `layoutAtivo` globalmente. Ao iniciar o arraste de um nó, apenas esse nó recebe posição fixa (atributo do próprio nó no grafo, não um interruptor global do layout); o `FA2Layout` continua rodando para todos os outros nós, que se reacomodam ao redor do nó fixado, no padrão do grafo do Obsidian. Soltar o nó mantém sua posição fixa até a próxima recarga dos dados do grafo, exatamente como a CA71 original já previa para o nó individual; o que muda é que os demais nós não param de simular. O botão "Pausar layout" / "Retomar layout" continua existindo como controle manual explícito do usuário, independente do comportamento de arraste.

### 5. Ordenação paritária entre lista, board e grafo

As visões de board e grafo de Oportunidades ganham o mesmo controle de ordenação (campo e direção) já disponível na visão de lista, aplicado de forma consistente nas três visualizações.

### 6. Rótulo do currículo: substitui "Versão N"

CA69 (ADR 0020) é substituída. O rótulo primário exibido ao usuário passa a ser `{empresa} · {título da vaga}`; a partir da segunda geração para a mesma vaga, o rótulo recebe o sufixo ` (regeração N)`. `curriculos.service.ts:509` deixa de usar `` `Versao ${versoes + 1}` `` como identidade principal exibida; o contador numérico pode continuar existindo como metadado interno (nome de arquivo, ordenação), mas não como rótulo primário.

### 7. Tema claro como padrão de primeira visita

`initialTheme()` (`apps/web/src/lib/theme.ts`) deixa de resolver por `prefers-color-scheme` do sistema operacional quando não há preferência salva; a primeira visita sem preferência em `localStorage` resolve para `'light'`. A alternância manual do usuário, já persistida em `localStorage`, continua tendo prioridade absoluta sobre esse padrão.

### 8. Cor de acento única entre claro e escuro

`--accent` em `apps/web/src/index.css` passa a usar o mesmo valor de tom nos blocos claro e escuro. Antes de fechar, verificar contraste mínimo AA (WCAG) do texto e ícone que ficam sobre `--accent` no fundo escuro; se o tom único do claro (`#2563eb`) não passar em contraste sobre o fundo escuro atual, a implementação ajusta o `--accent-fg` (cor de texto sobre o acento) no tema escuro para manter a legibilidade, em vez de voltar a divergir o tom do acento em si.

### 9. Consistência de cor de ação primária

O botão "Definir próximo passo" no detalhe da vaga, e qualquer outro botão de ação primária de tela ainda fora do padrão, adota `variant="accent"`, seguindo o que a CA70 (ADR 0020) já fixou.

### 10. Higiene visual do foco no login

O anel de foco azul saturado do padrão de campo de texto usado no formulário de login é substituído por um estado de foco neutro, consistente com o restante do design system, sem eliminar a acessibilidade do foco visível: o contorno continua perceptível ao navegar por teclado, só deixa de usar o azul saturado atual como cor.

### 11. Sessão de acesso expira em 24 horas, com tratamento explícito no cliente

`expiresIn` em `apps/api/src/auth/auth.module.ts` muda de `'7d'` para `'24h'`. `apps/web/src/api.ts` ganha tratamento de resposta `401`: limpa o token de `localStorage` e redireciona para a tela de login com uma indicação de sessão expirada, em vez de deixar a chamada falhar sem explicação. Refresh token fica fora de escopo desta ADR; se a expiração de 24h se mostrar curta demais em uso real, entra como ADR própria com a política de refresh.

## Justificativa

- O item 1 é o mesmo padrão estrutural que a ADR 0030 já nomeou: código que o agente que implementa declara pronto sem prova visual real, repetido pela quarta vez neste mesmo ponto específico. A ADR 0030 já havia estabelecido "não dar nota é melhor que dar nota falsa" para keywords; o princípio equivalente aqui é "não declarar pronto sem prova visual", e esta ADR o aplica explicitamente ao acompanhamento de geração no chat.
- O item 2 seria resolvido incorretamente ampliando alguma lista de bloqueio de palavras (o mesmo erro que a ADR 0030 já rejeitou para `STOPWORDS`); a correção correta é restringir por categoria semântica positiva (o que é keyword), não por lista negativa de termos institucionais específicos, porque a próxima vaga vai trazer outro conjunto de palavras de employer branding que uma lista fixa não cobre.
- O item 3 fecha uma lacuna que a própria ADR 0018 já havia identificado e adiado ("sem inventar rota nesta ADR"); mantém o princípio 2 dessa ADR intacto, porque redigir não é enviar.
- O item 4 corrige uma implementação que citou o Obsidian como referência mas não replicou o comportamento real dele; a correção aproxima o produto da própria referência que a ADR 0020 já escolheu.
- Os itens 6, 7 e 8 são reversões conscientes de decisões anteriores (CA69, o default de tema nunca formalizado, e a divergência de tom de acento), decisão do usuário como dono do produto; ficam registradas aqui para não se perderem como "mudança de humor" não documentada.
- O item 11 trata política de segurança como decisão de produto, não como default de biblioteca; um produto multiusuário (ADR 0012) não pode ter prazo de sessão como efeito colateral de não ter sido revisado.

## Consequências

- `apps/web/src/copiloto/`: possível revisão de `useCopiloto.ts` e `componentes.tsx` para garantir que o item consolidado de operação seja o conteúdo padrão exibido, não os cartões de chamada de ferramenta crus; nenhuma mudança de contrato SSE é esperada a priori, mas deve ser confirmada durante a implementação.
- `apps/ai-service/app/keywords.py` e o schema `KeywordsLlmResponse`: novo campo de categoria por keyword; possível necessidade de ajuste em `apps/ai-service/app/score.py` e `generate.py` se algo depender do formato atual da lista de keywords.
- `apps/web/src/copiloto/*` e a tela de configuração do copiloto: remoção da opção "Assistido" da UI; novo fluxo de diálogo para preenchimento de formulário e redação de mensagem, possivelmente novas tools no contrato do copiloto (`docs/specs/copiloto-contratos.md`) para os dois casos.
- `apps/web/src/OportunidadesGrafo.tsx`: `onArrastar` para de desligar `layoutAtivo`; passa a fixar apenas o nó arrastado (via atributo de nó, ex. `fixed: true`, respeitado pelo `FA2Layout` ou filtrado da lista de nós que ele atualiza).
- `apps/web/src/Oportunidades.tsx` (board) e `OportunidadesGrafo.tsx`: novo controle de ordenação replicando o que a lista já tem.
- `apps/api/src/curriculos/curriculos.service.ts:509`: mudança do rótulo primário de currículo gerado.
- `apps/web/src/lib/theme.ts`: `initialTheme()` para de consultar `prefers-color-scheme`.
- `apps/web/src/index.css`: unificação de `--accent` entre blocos de tema claro e escuro, com possível ajuste de `--accent-fg`.
- `apps/web/src/*` (detalhe da vaga) e `apps/web/src/components/ui/input.tsx` ou equivalente: trocas de variante/classe, sem mudança de token novo.
- `apps/api/src/auth/auth.module.ts` e `apps/web/src/api.ts`: expiração de token e tratamento de 401 no cliente.
- A `spec-v1.9.10` registra CA98 a CA108.

## Addendum (2026-09-19): causa-raiz real de CA98 e correção do mecanismo

A rodada que implementou CA98-109 introduziu `OperacaoCorrente`
(`apps/web/src/copiloto/componentes.tsx:234-299`), o cartão consolidado com o
indicador "01 Oportunidade / 02 Geração / 03 Validação ATS" e o JSON técnico atrás
de "Ver retorno técnico". Esse cartão nunca renderiza `GraficoScoreAts`. O gráfico
só é produzido por um mecanismo anterior e independente, que já existia antes desta
ADR: o backend (`persistirConclusaoCopiloto`/`anexarConclusaoGeracao`,
`curriculos.service.ts` e `mongo.service.ts`) grava no Mongo um texto de narração
contendo literalmente "Etapa 1"/"Etapa 3"; o front-end faz polling
(`useCopiloto.ts:642-691`), detecta esse texto por regex
(`/etapa\s*[13]/i`), recarrega a conversa inteira e só então
`itensDeHistorico`/`scoresNarracaoAts` (`visualizacao.ts`) transformam esse texto em
um item `'agente'` separado com `scoresAts`, que dispara `GraficoScoreAts`. Esse
caminho nunca foi conectado ao cartão novo, e depende de o LLM produzir a frase
exata esperada por um regex, entregue por uma reidratação assíncrona sujeita a
condição de corrida (`!refEstado.current.streaming`). É um mecanismo frágil por
construção, não uma falta de esforço de implementação.

**Correção:** eliminar essa dependência. `OperacaoCorrente` já recebe `item.passos`
(`PassoOperacao[]`), que inclui o resultado de `buscar_curriculo` com
`analiseInicial.score`/`analiseFinal.score`. O gráfico passa a ser renderizado
diretamente dentro de `OperacaoCorrente` quando `item.etapa === 'concluida'`,
localizando o passo `buscar_curriculo` com `status === 'ok'` e reaproveitando a
função já existente `scoresAts(passo.tool, passo.resultado)` de `visualizacao.ts`
(hoje só o tipo `ScoreAts` é importado em `componentes.tsx`, não a função). Sem
depender de o LLM mencionar "Etapa 1"/"Etapa 3" em texto livre, sem regex sobre
prosa, sem reidratação assíncrona de conversa. O mecanismo antigo
(`scoresNarracaoAts`, `etapaNarradaAts`, a narração persistida no Mongo) fica
obsoleto para este fluxo; pode ser removido ou mantido apenas se outro fluxo do
copiloto ainda depender dele (verificar antes de apagar). Isso está alinhado com a
ADR 0005 (score determinístico): a presença do gráfico não pode depender de o
modelo de linguagem escolher as palavras certas.

## Addendum 2 (2026-09-19): o cartão de progresso não segue o método real, e é essa a causa de fundo

Depois de conectar o dado ao gráfico (addendum 1), o gráfico ainda não apareceu na
validação manual. A causa não era mais o código do gráfico; era o modelo de etapas
do próprio cartão. `OperacaoCorrente` usa três rótulos inventados nesta rodada
("Oportunidade", "Geração", "Validação ATS") que nunca corresponderam à metodologia
real do produto: as 3 etapas fixas do modo pipeline de currículo, definidas em
`.claude/agents/modo-pipeline-curriculo.md` no workspace `geracurriculo` (Etapa 1,
Análise ATS; Etapa 2, Reescrita otimizada; Etapa 3, ATS pós-geração), a mesma
metodologia que o orquestrador já executa manualmente na conversa com o candidato
sempre que roda a pipeline fora do produto. "Registrar oportunidade" nunca foi uma
dessas etapas; é uma ação de cadastro anterior ao pipeline, e o cartão a tratou como
"01" da mesma numeração.

Esse é o padrão real do erro, repetido por várias rodadas: o cartão de progresso foi
desenhado a partir de uma ideia genérica de "acompanhamento de geração", não a partir
do método real e já nomeado que o produto inteiro herda do modo pipeline de
currículo. Corrigir o gráfico sem corrigir os rótulos e a estrutura das etapas deixa
o problema de fundo intacto.

**Correção:** o rastreador de progresso do pipeline ATS no chat do copiloto passa a
usar exatamente os três rótulos do método ("Etapa 1 - Análise ATS", "Etapa 2 -
Reescrita otimizada", "Etapa 3 - ATS pós-geração"), nesta ordem, sem "registrar
oportunidade" contando como uma dessas etapas. Ao concluir a Etapa 1, o candidato vê
o resultado completo da análise (score, keywords encontradas, keywords críticas
ausentes, veredicto) e o gráfico radial, antes de qualquer geração. Entre a Etapa 1 e
a Etapa 2, mesmo em autopiloto, o copiloto para e pergunta explicitamente se pode
prosseguir, porque o candidato pode querer ajustar a vaga ou desistir antes de gastar
uma geração completa; isso é uma exceção pontual ao princípio de autopiloto que
encadeia escritas internas sem parar (seção 3 da ADR 0018), restrita a esta
transição. Ao concluir a Etapa 3, o candidato vê o score pós-geração, a comparação
com a Etapa 1 e o cartão de download, rotulados "Etapa 3 - ATS pós-geração".

A `spec-v1.9.10` registra CA111 a CA114, substituindo CA98 e CA110.
