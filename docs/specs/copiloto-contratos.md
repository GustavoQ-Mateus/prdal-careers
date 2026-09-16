# Copiloto de candidatura, contratos

| Campo | Valor |
|---|---|
| **Status** | Backend implementado |
| **Data** | 2026-09-16 |
| **Base** | ADR 0018, `spec-v1.6.0` seção 8 |
| **Escopo** | Contratos do copiloto. Backend implementado, sem lacuna aberta; a UI é implementada em cima deste documento. |

Este documento fecha o que a ADR 0018 deixou aberto: o endpoint de chat, o schema dos eventos do stream, o registro de tools mapeado para os endpoints atuais, o protocolo de confirmação, o modo autopiloto, o tratamento de falha e os estados que a UI precisa renderizar. Toda tool aponta para um endpoint que a `api` expõe; as capacidades que faltavam viraram endpoints de leitura na seção 9.

Linguagem do produto: escopo do candidato, nunca lado empresa. O copiloto prepara o interno e reversível; o candidato dispara o externo.

## 1. Endpoint de chat

### Rota

`POST /copiloto/chat`

Autenticado pelo mesmo `JwtAuthGuard` das demais rotas. Resposta em `text/event-stream`. Um turno é uma requisição; a conversa é retomada pelo `conversaId`.

### Request

```json
{
  "conversaId": "string, opcional; ausente abre conversa nova",
  "modo": "assistido | autopiloto",
  "oportunidadeId": "string, opcional; ancora o turno numa oportunidade",
  "mensagem": "string, opcional; texto do candidato neste turno",
  "confirmacao": {
    "callId": "string; id da tool_call pendente",
    "decisao": "confirmar | recusar",
    "ajustes": "objeto, opcional; sobrescreve args antes de executar"
  }
}
```

Regras do request:

- `mensagem` e `confirmacao` são mutuamente suficientes: um turno normal manda `mensagem`; um turno que responde a um pedido de confirmação manda `confirmacao` e pode omitir `mensagem`.
- `modo` default é `assistido`. Em `autopiloto` o laço encadeia tools de escrita interna sem pedir confirmação a cada uma, respeitando as paradas da seção 5.
- `oportunidadeId` fixa o alvo do loop; sem ele, o agente pergunta ou infere a partir da conversa antes de qualquer escrita.

### Response

Stream SSE. Cada evento tem uma linha `event:` com o nome do tipo e uma linha `data:` com JSON. O turno termina sempre com um evento `fim_turno`. A conexão fecha após o `fim_turno`.

## 2. Schema dos eventos do stream

Sete tipos. Todo `data` é um objeto JSON.

### `token`

Fragmento de texto do agente, para renderização incremental.

```json
{ "delta": "string" }
```

### `tool_call`

O agente declarou intenção de acionar uma tool. Sempre precede a execução. Para efeito de leitura, a execução segue direto. Para efeito de escrita, este evento é seguido de `confirmacao` e a execução espera a decisão do candidato.

```json
{
  "callId": "string",
  "tool": "string; nome do registro da seção 3",
  "efeito": "leitura | escrita",
  "args": { "chave": "valor" },
  "exigeConfirmacao": true
}
```

### `confirmacao`

Pedido explícito de confirmação antes de gravar. Só aparece para tools de escrita. Carrega um resumo em linguagem do candidato do que será feito.

```json
{
  "callId": "string; casa com a tool_call",
  "tool": "string",
  "resumo": "string; o que vai acontecer, em uma frase",
  "args": { "chave": "valor" }
}
```

Após este evento o turno encerra com `fim_turno` de motivo `aguardando_confirmacao`. O candidato responde abrindo novo turno com `confirmacao`.

### `tool_resultado`

Resultado de uma tool executada, de leitura ou de escrita já confirmada.

```json
{
  "callId": "string",
  "tool": "string",
  "ok": true,
  "resultado": { "chave": "valor" },
  "erro": null
}
```

Em falha, `ok` é `false`, `resultado` é `null` e `erro` traz `{ "mensagem": "string localizada", "recuperavel": true }`.

### `entrega_externa`

Texto pronto para o candidato usar fora do produto. É a materialização da fronteira human-in-the-loop: o copiloto entrega, o candidato dispara. Nunca é enviado por conta própria.

```json
{
  "tipo": "mensagem_recrutador | resposta_formulario",
  "titulo": "string; rótulo curto do que é",
  "texto": "string; conteúdo pronto para copiar",
  "destino": "string, opcional; a quem ou a que campo se destina"
}
```

### `erro`

Falha localizada no turno, sem derrubar a conversa. Ver seção 6.

```json
{
  "escopo": "ai-service | chroma | doc-service | tool | interno",
  "mensagem": "string localizada",
  "recuperavel": true
}
```

### `fim_turno`

Encerra o turno e informa por que parou.

```json
{
  "motivo": "completo | aguardando_confirmacao | aguardando_acao_externa | erro"
}
```

## 3. Registro de tools

Cada tool tem nome, endpoint interno que aciona, entrada, efeito e exigência de confirmação. Todos os endpoints já existem, salvo os marcados como lacuna na seção 7. A `api` executa a tool contra os serviços do mesmo modo que no fluxo manual.

### Leitura, executa sozinha

| Tool | Endpoint interno | Entrada | Efeito |
|---|---|---|---|
| `listar_oportunidades` | `GET /oportunidades` | filtros de visão, busca, categoria, nível, prioridade | leitura |
| `buscar_oportunidade` | `GET /oportunidades/:id` | `oportunidadeId` | leitura |
| `abrir_workspace` | `GET /oportunidades/:id/workspace` | `oportunidadeId` | leitura |
| `ler_timeline` | `GET /oportunidades/:id/timeline` | `oportunidadeId`, `cursor`, `limite` | leitura |
| `listar_acoes` | `GET /oportunidades/:id/acoes` | `oportunidadeId` | leitura |
| `ler_perfil` | `GET /perfil-mestre` | nenhuma | leitura |
| `listar_curriculos` | `GET /curriculos` | `vagaId`, `scoreMinimo`, `vinculado` | leitura |
| `buscar_curriculo` | `GET /curriculos/:id` | `curriculoId` | leitura |
| `status_geracao` | `GET /geracoes-curriculo/:jobId` | `jobId` | leitura |
| `listar_banco_vagas` | `GET /banco-vagas` | nenhuma | leitura |
| `ler_agenda` | `GET /hoje` | `de`, `ate` | leitura |

### Escrita, exige confirmação

| Tool | Endpoint interno | Entrada | Efeito |
|---|---|---|---|
| `registrar_oportunidade` | `POST /oportunidades` | `titulo`, `empresa`, `descricao`, `fonte?` | escrita |
| `ativar_entrada` | `POST /oportunidades/entradas/:id/ativar` | `entradaId` | escrita |
| `ativar_banco_vaga` | `POST /banco-vagas/:id/ativar` | `bancoVagaId` | escrita |
| `gerar_curriculo` | `POST /oportunidades/:id/gerar-cv` | `oportunidadeId` | escrita |
| `editar_curriculo` | `PUT /curriculos/:id` | `curriculoId`, `markdown`, `rotulo?` | escrita |
| `definir_proximo_passo` | `POST /oportunidades/:id/acoes` | `oportunidadeId`, `titulo`, `tipo`, `venceEm?`, `lembrarEm?`, `principal?` | escrita |
| `concluir_passo` | `POST /acoes/:id/concluir` | `acaoId` | escrita |
| `mover_estagio` | `POST /oportunidades/:id/transicoes` | `oportunidadeId`, `destino`, `motivo?` | escrita |
| `registrar_candidatura` | `POST /candidaturas` | `vagaId`, `curriculoId?` | escrita |
| `atualizar_candidatura` | `PATCH /candidaturas/:id` | `candidaturaId`, `status?`, `notas?`, `curriculoId?` | escrita |
| `registrar_nota` | `POST /oportunidades/:id/timeline/notas` | `oportunidadeId`, `descricao` | escrita |

### Entrega externa, o candidato dispara

| Tool | Endpoint interno | Entrada | Efeito |
|---|---|---|---|
| `redigir_mensagem_recrutador` | `POST /copiloto/mensagem-recrutador` | `oportunidadeId`, `contexto?` | leitura que produz texto, resultado vai em `entrega_externa` |
| `redigir_respostas_formulario` | `POST /copiloto/respostas-formulario` | `oportunidadeId`, `campos` | leitura que produz texto, resultado vai em `entrega_externa` |

Essas duas tools não gravam e não enviam nada. Produzem texto que sai por `entrega_externa` para o candidato revisar e usar. O registro da candidatura, depois que o candidato de fato se inscreveu, é feito por `registrar_candidatura` ou `atualizar_candidatura`, que são de escrita e confirmadas.

## 4. O loop de candidatura fim a fim

O loop reproduz a preparação de candidatura. Cada passo mapeia para tools do registro:

1. **Extrair keywords da vaga.** Hoje a extração roda dentro da criação da oportunidade, não como passo isolado. No copiloto, o passo é `registrar_oportunidade`, que já dispara a extração de keywords no `ai-service` e as persiste na vaga. Uma prévia de keywords sem criar a vaga é lacuna, seção 7.
2. **Puxar Perfil e RAG.** `ler_perfil` traz o perfil-mestre. O RAG hoje é consumido dentro da geração, não exposto como consulta. Ler o RAG como passo visível é lacuna, seção 7.
3. **Gerar o currículo tailored.** `gerar_curriculo` devolve `jobId`; o agente acompanha por `status_geracao` até concluir e então `buscar_curriculo`.
4. **Medir o score determinístico.** O score já vem calculado no currículo gerado e é lido por `buscar_curriculo`. Reescrever o texto e remedir usa `editar_curriculo`, que recomputa o score determinístico. Um score avulso de um texto sem regerar nem editar é lacuna, seção 7. Uma vaga por vez; sem score agregado.
5. **Registrar a oportunidade.** Já coberta no passo 1 por `registrar_oportunidade`, ou `ativar_entrada` e `ativar_banco_vaga` quando a vaga vem do inventário.
6. **Definir o próximo passo.** `definir_proximo_passo` cria a ação; `mover_estagio` move a oportunidade quando o loop avança; `concluir_passo` fecha a ação feita.
7. **Redigir mensagem ao recrutador e respostas de formulário.** `redigir_mensagem_recrutador` e `redigir_respostas_formulario` produzem texto que sai por `entrega_externa`. O candidato revisa e envia. O produto só registra o resultado por `registrar_candidatura` ou `atualizar_candidatura`.

## 5. Protocolo de confirmação

1. O agente decide uma escrita e a `api` emite `tool_call` com `efeito: "escrita"` e `exigeConfirmacao: true`.
2. Em seguida a `api` emite `confirmacao` com o resumo em linguagem do candidato e encerra o turno com `fim_turno` motivo `aguardando_confirmacao`. Nada foi gravado.
3. O candidato responde abrindo novo turno com `confirmacao` carregando `callId` e `decisao`.
4. Se `decisao` é `confirmar`, a `api` executa a tool contra o serviço, emite `tool_resultado` com o efeito real e o loop segue. `ajustes` opcionais sobrescrevem os `args` antes de executar.
5. Se `decisao` é `recusar`, nada é gravado. A `api` informa o loop da recusa, o agente reconhece por `token`, não repete a mesma escrita e oferece alternativa ou aguarda nova instrução. Recusar nunca desfaz um resultado anterior nem apaga o histórico da conversa.

Em `autopiloto`, os passos 2 e 3 são pulados para escritas internas: a `api` executa a tool e emite `tool_call` seguido de `tool_resultado` sem parar. As escritas externas nunca existem como tool de envio, então a fronteira permanece.

## 6. Modo autopiloto

O autopiloto encadeia o loop sozinho. A cada rodada o `ai-service` decide o próximo passo, a `api` executa a tool de leitura ou de escrita interna e devolve o resultado, e o `ai-service` decide o próximo, até o loop de preparação estar completo.

O autopiloto para de forma obrigatória, sem exceção, quando o próximo passo é ação externa do candidato:

- antes de qualquer `entrega_externa`, para o candidato revisar o texto de mensagem ou de formulário;
- quando o loop chega ao ponto de a candidatura precisar ser enviada fora do produto, já que não existe tool de envio.

Nesses pontos a `api` emite o conteúdo pronto e encerra com `fim_turno` motivo `aguardando_acao_externa`. O autopiloto retoma quando o candidato confirma que agiu, tipicamente com `registrar_candidatura` ou `atualizar_candidatura` no turno seguinte. O candidato pode sair do autopiloto a qualquer momento; o modo é opcional e nunca ultrapassa a fronteira human-in-the-loop.

## 7. Tratamento de falha

Falha de um serviço vira erro localizado no turno, sem derrubar a conversa e sem apagar resultado anterior.

- `ai-service` fora do ar ou sem resposta: o turno emite `erro` escopo `ai-service`, `recuperavel: true`, e encerra com `fim_turno` motivo `erro`. A conversa e os resultados já gravados permanecem. O candidato pode repetir o turno.
- Chroma fora do ar: o passo de RAG degrada, como já ocorre na geração atual, que segue sem contexto quando o RAG não responde. O agente informa por `erro` escopo `chroma`, `recuperavel: true`, e oferece seguir sem o contexto recuperado.
- `doc-service` fora do ar: a geração conclui o currículo e o score, mas os arquivos docx e pdf ficam indisponíveis, como já ocorre hoje. O agente informa por `erro` escopo `doc-service`, `recuperavel: true`, e o download fica pendente até o serviço voltar.
- Falha de uma tool de escrita já confirmada: `tool_resultado` volta com `ok: false` e `erro`. Nada parcial é dado como feito; o agente relata e propõe repetir.

Nenhuma falha limpa o `conversaId`, o histórico ou os estados já persistidos por tools anteriores.

## 8. Estados para a UI do P7

A UI do copiloto renderiza estados derivados do stream:

- **ocioso:** sem turno em curso, campo de mensagem pronto.
- **pensando:** recebendo `token`, texto aparece incremental.
- **executando_leitura:** `tool_call` de leitura em curso, indicador discreto do passo.
- **aguardando_confirmacao:** recebeu `confirmacao`, mostra o resumo e os botões confirmar e recusar.
- **executando_escrita:** confirmada, `tool_call` de escrita em curso.
- **entrega_externa:** recebeu `entrega_externa`, mostra o texto pronto com ação de copiar e a instrução de que o envio é do candidato.
- **autopiloto_em_curso:** loop encadeando tools, com trilha dos passos já executados.
- **autopiloto_parado_externo:** `fim_turno` motivo `aguardando_acao_externa`, aguardando o candidato agir fora do produto.
- **erro_turno:** recebeu `erro`, mostra a mensagem localizada e a opção de repetir, preservando o histórico.

## 9. Endpoints das lacunas, resolvidos

Cada lacuna virou um endpoint de leitura na `api`, autenticado pelo mesmo `JwtAuthGuard` e sem persistir nada. Todos ficam agrupados sob `/copiloto`, apoiados numa capacidade que já existe no `ai-service`.

1. **Prévia de keywords sem criar a vaga.** `POST /copiloto/keywords-previa`. Entrada `{ descricao }`, saída `{ keywords }`. Aciona a extração do `ai-service` e devolve as keywords sem gravar vaga.
2. **Consulta de RAG como passo visível.** `POST /copiloto/rag/consulta`. Entrada `{ query, k? }`, saída `{ chunks }`. Consulta o Chroma aterrado nos dados do candidato e devolve os trechos recuperados. Chroma fora do ar degrada conforme a seção 7.
3. **Score avulso de um texto.** `POST /copiloto/score`. Entrada `{ markdown, oportunidadeId? , keywords? }`, saída `{ score, breakdown }`. Usa a função determinística da ADR 0005; as keywords vêm da oportunidade quando `oportunidadeId` é informado, senão das `keywords` do corpo. Não regera nem edita currículo.
4. **Redação de mensagem ao recrutador.** `POST /copiloto/mensagem-recrutador`. Entrada `{ oportunidadeId, contexto? }`, saída `{ tipo, titulo, texto, destino }`. A `api` compõe perfil e vaga, o `ai-service` redige, o resultado sai por `entrega_externa`. Não grava e não envia.
5. **Redação de respostas de formulário.** `POST /copiloto/respostas-formulario`. Entrada `{ oportunidadeId, campos }`, saída `{ tipo, titulo, respostas, texto }`. Mesma fronteira da anterior, com um texto por campo e um texto consolidado.
6. **Endpoint de chat do copiloto.** `POST /copiloto/chat` com SSE, conforme as seções 1 e 2. A rota conversacional correspondente no `ai-service` é `POST /copiloto/turn`: a cada rodada recebe histórico, tools disponíveis e o modo, e devolve `{ tipo, texto?, tool?, args }`, texto ou intenção de tool-call. O `ai-service` nunca executa a tool; quem executa é a `api`.

Duas notas de contrato que a implementação fixou, sem abrir lacuna nova:

- O evento `fim_turno` carrega `conversaId` além de `motivo`, para o cliente retomar a conversa entre turnos.
- Os eventos de token do agente vêm de fragmentar o texto que o `ai-service` devolve no turno; o transporte é sempre SSE token a token.
