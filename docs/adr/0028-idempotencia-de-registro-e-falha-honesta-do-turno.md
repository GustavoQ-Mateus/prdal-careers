# ADR 0028, Idempotência de registro e falha honesta do turno do copiloto

- **Status:** Aceita
- **Data:** 2026-09-19
- **Fase-alvo:** P10-correção, revisão pós-uso real sobre a spec-v1.9.4/ADR 0025
- **Contexto:** Teste real na interface, vaga Educbank, expôs dois defeitos que nenhuma spec anterior cobre. A sessão registrou a mesma vaga **duas vezes** (`b7c04dc7...` às 00:48:25 e `e12cf6cb...` às 00:49:27, mesma empresa e mesmo título, extrações de keywords ligeiramente diferentes), nunca chamou `gerar_curriculo`, e encerrou com a mensagem "Etapa concluida." seguida do estado "Pronto", como se o fluxo tivesse terminado com sucesso. Nenhum currículo foi gerado.

  1. **Registro duplicado.** `SYSTEM_TURNO` (`apps/ai-service/app/copiloto.py`) instrui explicitamente: "depois de registrar uma oportunidade, use o id retornado para os proximos passos e nunca registre a mesma vaga novamente. Uma tool que ja aparece como concluida no historico nao deve ser chamada de novo." O modelo ignorou a instrução. Auditando `apps/api/src/copiloto/chat.service.ts`, após um `registrar_oportunidade` bem-sucedido o serviço grava `conversa.oportunidadeId` e persiste, mas **não existe nenhuma trava impedindo uma segunda chamada da mesma tool na mesma conversa**. A idempotência do registro é hoje só uma frase no prompt, e prompt não é garantia: é uma preferência estatística. O resultado é duas linhas no banco para a mesma vaga, poluindo Oportunidades e o grafo.

  2. **Falha do LLM reportada como sucesso.** `planejar_turno` (`copiloto.py`) captura `LLMUnavailable` com um `pass` silencioso e cai em `_fallback(req)`. Quando a última mensagem é do usuário, `_fallback` é honesto ("O copiloto esta indisponivel no momento"). Mas quando a última mensagem é um resultado de tool, que é o caso mais comum no meio de uma cadeia, `_fallback` devolve `TurnResponse(tipo="texto", texto="Etapa concluida.")`. Esse texto chega ao candidato como uma conclusão bem-sucedida e o turno termina em `completo`, levando a UI ao estado "Pronto". O candidato acredita que a etapa fechou; na verdade a chamada ao modelo falhou e o fluxo morreu no meio. Esta é exatamente a classe de defeito que a P9-fix já corrigiu uma vez para a geração de currículo, quando o fallback determinístico era usado silenciosamente e a UI reportava sucesso; o mesmo padrão reapareceu no turno do copiloto.

  A UI já tem a plumbing correta para o caso honesto: o evento SSE `erro`, o `fim_turno` com motivo `erro`, o estado `erro_turno` e o `CartaoErro` com "Repetir turno" já existem e funcionam. O que quebra a cadeia é o `ai-service` devolver um texto de sucesso em vez de sinalizar a falha.

## Decisão

### 1. Idempotência de registro é trava de servidor, não instrução de prompt

Quando uma conversa já tem `oportunidadeId` definido, uma nova chamada de `registrar_oportunidade` na mesma conversa não cria registro novo. O serviço resolve a chamada devolvendo a oportunidade já registrada, com um resultado que deixa claro que o registro foi reaproveitado, e a conversa segue a partir dela. A instrução correspondente permanece no prompt, porque orientar o modelo continua útil, mas deixa de ser o único mecanismo: a integridade passa a ser garantida no servidor, onde é determinística.

A trava vale para a conversa. Registrar deliberadamente a mesma vaga em outra conversa continua possível, porque isso é uma decisão legítima do candidato e não um erro de orquestração.

### 2. Falha de modelo nunca se disfarça de etapa concluída

`_fallback` deixa de devolver "Etapa concluida." em qualquer situação. Quando a chamada ao modelo falha e não há uma ação determinística correta a tomar, a resposta declara a indisponibilidade em linguagem de produto, e o turno é finalizado como erro recuperável, não como `completo`. A UI então exibe o `CartaoErro` com "Repetir turno" que já existe, em vez do estado "Pronto".

Nenhum caminho do copiloto pode produzir, para o candidato, um texto que afirme conclusão de etapa sem que a etapa tenha de fato concluído. Isso reafirma, para o turno do copiloto, a mesma regra que a P9-fix estabeleceu para a geração.

## Justificativa

- Garantia de unicidade pertence à camada que escreve no banco, não ao prompt. Enquanto a única proteção for textual, qualquer variação de modelo, temperatura ou latência reintroduz o duplicado; foi o que aconteceu aqui apesar da instrução existir e ser explícita.
- Um sistema que reporta sucesso quando falhou é pior que um sistema que falha, porque destrói a confiança no que ele reporta quando dá certo. O candidato perdeu tempo achando que o fluxo tinha terminado.
- As duas correções são pequenas e localizadas, e ambas removem uma mentira que o produto conta hoje. Não inflam escopo nem dependem da spec-v1.9.5 estar pronta.

## Relação com a spec-v1.9.5

A causa provável de a chamada ao modelo ter falhado é o que a `spec-v1.9.5`/ADR 0026 (CA87, CA88) já descreve: saída não vinculada a schema estrito e ausência de avaliação de modelo, com `gpt-oss-120b` gerando turnos malformados e latência alta. Esta ADR não substitui aquela: trata da honestidade e da integridade quando a falha acontece, enquanto a `spec-v1.9.5` trata de reduzir a frequência da falha. As duas são complementares e ambas seguem pendentes.

## Consequências

- `apps/api/src/copiloto/chat.service.ts`: passa a resolver `registrar_oportunidade` de forma idempotente por conversa.
- `apps/ai-service/app/copiloto.py`: `_fallback` deixa de emitir "Etapa concluida."; a falha de modelo é sinalizada como tal.
- `apps/api/src/copiloto/chat.service.ts`: o turno que falhou no modelo finaliza com motivo `erro`, acionando o `CartaoErro` já existente no front.
- Nenhuma mudança de contrato SSE, de schema Prisma ou de UI nova; toda a plumbing de erro já existe.
- A `spec-v1.9.7` registra CA92 e CA93.
