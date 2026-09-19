# ADR 0027, Narração da metodologia ATS no chat do copiloto

- **Status:** Aceita
- **Data:** 2026-09-18
- **Fase-alvo:** P10-correção, revisão pós-uso real sobre a spec-v1.9.4/ADR 0025
- **Contexto:** O candidato relatou que o chat do copiloto nunca mostra a análise ATS: ele só vê `Registrar oportunidade` -> `Gerar currículo` -> `Ver status da geração`, sem nenhuma narrativa do que a metodologia `modo-pipeline-curriculo` promete (Etapa 1, Análise ATS com score/keywords/veredicto; Etapa 2, reescrita; Etapa 3, score pós-geração comparado ao inicial). Auditando `apps/ai-service/app/copiloto.py`, a causa é uma colisão de nomenclatura: `SYSTEM_TURNO` já usa "Etapa 1/2/3" para outra coisa, o protocolo de sequenciamento de ferramentas (Etapa 1 registrar a vaga, Etapa 2 chamar `gerar_curriculo`, Etapa 3 consultar `status_geracao` e `buscar_curriculo`). Não existe, em nenhum lugar do prompt, instrução para o modelo produzir uma resposta `tipo: "texto"` narrando o conteúdo de `AtsAnalysis` (score, `keywordsEncontradas`, `keywordsCriticasAusentes`, `pontosEliminatorios`, `veredicto`) ao candidato. Os dados já existem no contrato (`AtsAnalysis` em `apps/web/src/api.ts`) e os gráficos já existem (CA73, área Base/Gerado; CA83, radial da Etapa 1), mas nunca são anexados a uma narrativa, só ao retorno técnico expansível de um `passo`.

  Auditando `apps/api/src/curriculos/curriculos.service.ts` (`processarJob` ou equivalente), `analiseInicial` e `analiseFinal` são calculados por uma única chamada ao `ai-service` (`this.aiClient.generateCvPipeline(...)`) que roda a pipeline inteira (Etapa 1 determinística, Etapa 2 via LLM, Etapa 3 determinística) antes de retornar; `analiseInicial` só é persistido no banco depois que essa chamada inteira volta, junto com `analiseFinal`. Ou seja, hoje é tecnicamente impossível ao `status_geracao` revelar a Etapa 1 sozinha, com a Etapa 2 ainda em andamento: os dois scores chegam juntos, perto do fim do job. Separar essa fronteira em duas chamadas (Etapa 1 exposta assim que calculada, antes da Etapa 2 começar) é uma mudança maior de arquitetura entre `ai-service` e `api`, fora do escopo desta correção.

## Decisão

### 1. Narrar a Etapa 1 e a Etapa 3 assim que a geração concluir, sem esperar reestruturação de backend

Quando `buscar_curriculo` retornar `analiseInicial` e `analiseFinal` (ou seja, quando o `status_geracao` chegar a `CONCLUIDA`), o copiloto produz, no mesmo turno, duas respostas de texto sequenciais ao candidato, em vez do resumo de uma linha atual:

- Uma narrando a Etapa 1, Análise ATS, no formato da metodologia `modo-pipeline-curriculo`: score, keywords da vaga já presentes, keywords críticas ausentes, pontos que eliminam automaticamente quando houver, e veredicto em até duas linhas. Acompanhada do gráfico radial já implementado pela CA83.
- Uma narrando a Etapa 3, ATS pós-geração: score final comparado ao score inicial, o que mudou. Acompanhada do gráfico de área Base/Gerado já implementado pela CA73.

Isso substitui o resumo terso atual ("Score X") sem exigir nenhuma mudança de contrato entre `api` e `ai-service`: os dois números e os dois gráficos já chegam juntos no mesmo resultado, só passam a ser narrados por completo em vez de resumidos.

### 2. Terminologia "Etapa 1/2/3" fica reservada para a metodologia ATS visível ao candidato

`SYSTEM_TURNO` renomeia o protocolo interno de sequenciamento de ferramentas (registrar vaga, chamar `gerar_curriculo`, consultar `status_geracao`/`buscar_curriculo`) para não usar mais os rótulos "Etapa 1/2/3". A colisão de nome entre o protocolo interno de orquestração e a metodologia ATS documentada (`modo-pipeline-curriculo`, que o candidato já conhece pela análise que roda localmente na pipeline `geracurriculo`) foi a causa raiz de este defeito ter passado despercebido: "Etapa 1" já existia no prompt, só significava outra coisa. "Etapa 1/2/3" no texto visível ao candidato só pode se referir à metodologia ATS (Análise, Reescrita, Score pós-geração).

### 3. Narração incremental de verdade fica registrada como melhoria futura, não bloqueia esta correção

Mostrar a Etapa 1 ao candidato antes da reescrita começar de fato, como a pipeline `geracurriculo` faz quando o Claude Code executa cada etapa conversacionalmente, exigiria que `ai-service` expusesse a análise inicial (hoje já determinística e rápida, calculada em `_analise` antes de qualquer chamada ao LLM) numa chamada separada da reescrita, e que `curriculos.service.ts` persistisse esse resultado assim que disponível, antes de iniciar a Etapa 2. Isso é uma mudança de contrato `api`/`ai-service`, não só de prompt, e fica fora desta ADR. Esta decisão resolve o problema relatado, mostrar a análise ATS de verdade ao candidato, sem essa reestruturação; se o produto quiser narração ao vivo etapa a etapa depois, vira ADR própria.

## Justificativa

- A causa raiz é uma colisão de nomenclatura simples de corrigir por prompt, não um defeito de arquitetura; resolver por narração pós-conclusão evita inflar esta correção com uma reestruturação de backend que não foi pedida e que atrasaria ainda mais a entrega no mesmo dia.
- Os dados e os gráficos já existem; o gap é 100% de instrução ao modelo sobre quando e como narrar, o que é uma mudança de prompt de baixo risco, sem tocar contratos, migrations ou serviços.
- Registrar a narração ao vivo como melhoria futura, e não como parte desta ADR, evita a mesma armadilha de escopo que already fez este dia se alongar: cada correção pequena e real, uma de cada vez.

## Consequências

- `apps/ai-service/app/copiloto.py`: `SYSTEM_TURNO` ganha a instrução de narrar Etapa 1 e Etapa 3 no formato da metodologia ATS quando `analiseInicial`/`analiseFinal` estiverem disponíveis, e perde a sobreposição de nome "Etapa 1/2/3" para o protocolo interno de ferramentas.
- Nenhuma mudança em `apps/api` além de, se necessário, garantir que o resultado de `buscar_curriculo` entregue ao copiloto os campos completos de `AtsAnalysis` para ambas as etapas.
- Nenhuma mudança em `apps/web` além de confirmar que os gráficos de CA73/CA83 já anexam corretamente a uma mensagem de texto do tipo `agente`, não só ao `passo` técnico.
- A `spec-v1.9.6` registra CA90 e CA91 cobrindo esta decisão.
