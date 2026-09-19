# PRDAL Careers, Especificacao Tecnica

| Campo | Valor |
|---|---|
| **Versao** | 1.9.4 |
| **Status** | Aceita |
| **Data** | 2026-09-18 |
| **Autor** | Gustavo Queiroz Mateus |
| **Dominio** | Acompanhamento de geracao fora do turno e preview de curriculo no chat |
| **Base** | Estende `spec-v1.9.3.md`; formalizada pela ADR 0025 |

> PATCH compativel. Corrige a causa raiz do acompanhamento de geracao alegar limite
> atingido rotineiramente, consolida a trilha de ferramentas de uma mesma cadeia de
> acao em um unico indicador, e adiciona preview com download do curriculo pronto no
> chat. CA1 a CA83 continuam validos. Esta versao adiciona CA84 a CA86; a P11
> permanece bloqueada ate o fechamento integral da P10.

## 1. Problema

`acompanharGeracao` faz polling sincrono dentro do turno de chat com orcamento fixo
de 90 segundos. `generate_cv_pipeline` pode custar ate tres chamadas sequenciais ao
LLM (duas tentativas mais um passe dirigido quando o score fica abaixo de 75), o que
rotineiramente excede esse orcamento com o modelo configurado, disparando a mensagem
de limite atingido mesmo quando a geracao termina pouco depois. Separadamente, a
trilha exibe um item por ferramenta chamada em vez de um indicador unico para uma
mesma cadeia de acao, e nada no chat mostra o curriculo pronto para download quando a
geracao conclui, apesar de a API de status por job e o pacote de download ja
existirem.

## 2. Objetivo

1. Eliminar o orcamento fixo de acompanhamento dentro do turno; o acompanhamento
   passa a ser responsabilidade do cliente, consultando o status do job fora do
   ciclo de vida do turno de chat.
2. Consolidar ferramentas de uma mesma cadeia de acao percebida em um unico
   indicador de operacao corrente na UI.
3. Mostrar o curriculo concluido como preview com download direto no chat.

## 3. Acompanhamento fora do turno

Quando `gerar_curriculo` retorna status nao terminal, o backend emite um item de
trilha com o `jobId` e encerra o turno normalmente, sem orcamento fixo e sem
mensagem de limite atingido. O cliente web consulta `GET /geracoes-curriculo/:jobId`
(ja existente) em intervalo curto, direto do navegador, e atualiza o mesmo item pelo
`jobId` ate status terminal (`CONCLUIDA` ou `ERRO`). A geracao continua rodando como
job de fundo desacoplado do ciclo de request/response, conforme ADR 0019; esta secao
so muda onde o status e observado.

## 4. Indicador unico por cadeia de acao

Ferramentas que representam uma mesma intencao do usuario em curso (por exemplo,
registrar oportunidade seguido de gerar curriculo para ela) sao exibidas como um
unico indicador de operacao corrente, com rotulo que muda conforme a etapa ativa,
em vez de um item de trilha por ferramenta. O retorno tecnico de cada etapa
permanece disponivel por expansao. Ao concluir, o indicador vira o resultado final
consolidado.

## 5. Preview de curriculo pronto no chat

Ao detectar status `CONCLUIDA` no acompanhamento do lado do cliente, o chat
renderiza um cartao com rotulo do curriculo, score final e acao de baixar o pacote
(`GET /curriculos/:id/pacote`, CA68), sem exigir navegacao ate a tela de Curriculos.
Este cartao e aditivo ao grafico de score de CA73/CA83.

## 6. Criterios de aceitacao

- **CA84** O backend nao faz mais polling sincrono de `status_geracao` dentro do
  turno de chat; nenhuma mensagem de "acompanhamento atingiu o limite" e emitida. O
  cliente web consulta `GET /geracoes-curriculo/:jobId` ate status terminal e
  atualiza o mesmo item da trilha in-place pelo `jobId`.
- **CA85** Uma cadeia de ferramentas que representa uma mesma acao do usuario (ex.:
  registrar oportunidade seguido de gerar curriculo) aparece como um unico
  indicador de operacao corrente na UI, com o retorno tecnico de cada etapa
  disponivel por expansao, nao como itens de trilha separados e simultaneos.
- **CA86** Quando o acompanhamento do lado do cliente detecta status `CONCLUIDA`, o
  chat exibe um cartao de preview do curriculo (rotulo, score) com acao de baixar o
  pacote, sem navegacao ate a tela de Curriculos.

## Changelog

- **1.9.4 (2026-09-18):** move o acompanhamento de geracao para fora do orcamento
  fixo do turno de chat, consolida ferramentas de uma mesma cadeia em um indicador
  unico, e adiciona preview com download do curriculo pronto no chat, conforme ADR
  0025.
