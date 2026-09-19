# PRDAL Careers, Especificacao Tecnica

| Campo | Valor |
|---|---|
| **Versao** | 1.9.7 |
| **Status** | Aceita |
| **Data** | 2026-09-19 |
| **Autor** | Gustavo Queiroz Mateus |
| **Dominio** | Idempotencia de registro e falha honesta do turno do copiloto |
| **Base** | Estende `spec-v1.9.6.md`; formalizada pela ADR 0028 |

> PATCH compativel. Corrige dois defeitos observados em teste real na interface:
> registro duplicado da mesma vaga e falha de modelo reportada ao candidato como
> etapa concluida. CA1 a CA91 continuam validos. Esta versao adiciona CA92 e CA93;
> a P11 permanece bloqueada ate o fechamento integral da P10.

## 1. Problema

Em teste real (vaga Educbank, 2026-09-19), o copiloto registrou a mesma vaga duas
vezes na mesma conversa, criando duas oportunidades distintas no banco, nunca
avancou para a geracao de curriculo, e encerrou com o texto "Etapa concluida."
seguido do estado "Pronto".

Causas confirmadas por leitura de codigo:

1. A unicidade do registro e garantida apenas por instrucao no `SYSTEM_TURNO`
   (`apps/ai-service/app/copiloto.py`), que o modelo ignorou. Nao existe trava no
   servidor: `chat.service.ts` grava `conversa.oportunidadeId` apos o primeiro
   registro, mas nao impede um segundo `registrar_oportunidade`.
2. `planejar_turno` captura `LLMUnavailable` silenciosamente e cai em `_fallback`,
   que devolve `texto: "Etapa concluida."` quando a ultima mensagem e resultado de
   tool. O turno finaliza como `completo`, a UI mostra "Pronto", e o candidato
   acredita que a etapa fechou quando a chamada ao modelo falhou.

## 2. Objetivo

1. Garantir no servidor que uma conversa nao registre a mesma vaga mais de uma vez.
2. Garantir que nenhuma falha de modelo seja apresentada ao candidato como sucesso.

## 3. Idempotencia de registro

Com `conversa.oportunidadeId` ja definido, uma nova chamada de
`registrar_oportunidade` na mesma conversa nao cria registro novo: o servico
resolve a chamada devolvendo a oportunidade ja registrada, sinalizando no resultado
que o registro foi reaproveitado, e a conversa segue a partir dela. A instrucao no
prompt permanece, mas deixa de ser o unico mecanismo. Registrar a mesma vaga em
outra conversa continua permitido.

## 4. Falha honesta

`_fallback` nao pode devolver "Etapa concluida." em nenhuma situacao. Quando a
chamada ao modelo falha e nao ha acao deterministica correta a tomar, a resposta
declara a indisponibilidade em linguagem de produto e o turno e finalizado com
motivo `erro`, nao `completo`. A UI exibe o `CartaoErro` com "Repetir turno", que ja
existe. Nenhum texto visivel ao candidato pode afirmar conclusao de etapa sem que a
etapa tenha concluido.

## 5. Relacao com a spec-v1.9.5

A causa provavel da falha de modelo e o que a `spec-v1.9.5` (CA87, CA88) ja descreve:
saida sem schema estrito e ausencia de avaliacao de modelo. Esta versao trata da
honestidade e da integridade quando a falha ocorre; a `spec-v1.9.5` trata de reduzir
a frequencia da falha. Sao complementares e ambas seguem pendentes.

## 6. Criterios de aceitacao

- **CA92** Numa conversa que ja tem oportunidade registrada, uma nova chamada de
  `registrar_oportunidade` nao cria uma segunda oportunidade no banco: o resultado
  reaproveita a existente e a conversa segue a partir dela. Verificavel contando
  linhas de oportunidade apos uma conversa em que o modelo tente registrar duas
  vezes.
- **CA93** Nenhuma resposta do copiloto ao candidato contem "Etapa concluida." nem
  qualquer afirmacao de conclusao quando a chamada ao modelo falhou. A falha e
  declarada em linguagem de produto e o turno finaliza com motivo `erro`, levando a
  UI ao `CartaoErro` com "Repetir turno" em vez do estado "Pronto".

## Changelog

- **1.9.7 (2026-09-19):** idempotencia de `registrar_oportunidade` garantida no
  servidor e eliminacao do falso sucesso "Etapa concluida." quando o modelo falha,
  conforme ADR 0028.
