# PRDAL Careers, Especificacao Tecnica

| Campo | Valor |
|---|---|
| **Versao** | 1.9.6 |
| **Status** | Aceita |
| **Data** | 2026-09-18 |
| **Autor** | Gustavo Queiroz Mateus |
| **Dominio** | Narracao da metodologia ATS no chat do copiloto |
| **Base** | Estende `spec-v1.9.5.md`; formalizada pela ADR 0027 |

> PATCH compativel. Corrige o copiloto nao narrar a analise ATS ao candidato: os
> dados e os graficos ja existiam (CA73, CA83), faltava a instrucao de prompt para
> exibi-los como texto. CA1 a CA89 continuam validos. Esta versao adiciona CA90 e
> CA91; a P11 permanece bloqueada ate o fechamento integral da P10.

## 1. Problema

O candidato nunca ve a analise ATS no chat do copiloto, so tool_call e resumos de
uma linha ("Geracao iniciada", "Status GERANDO"). Causa raiz: `SYSTEM_TURNO`
(`apps/ai-service/app/copiloto.py`) usa os rotulos "Etapa 1/2/3" para o protocolo
interno de sequenciamento de ferramentas, nao para a metodologia ATS
(`modo-pipeline-curriculo`: Analise, Reescrita, Score pos-geracao) que o candidato
espera ver narrada, e nenhuma instrucao existe para produzir essa narrativa como
resposta de texto. Os dados (`AtsAnalysis`) e os graficos (CA73, CA83) ja existem.

## 2. Objetivo

1. Narrar a Etapa 1 (Analise ATS) e a Etapa 3 (score pos-geracao) como texto ao
   candidato assim que a geracao concluir, no formato da metodologia ja documentada,
   com os graficos ja existentes anexados.
2. Eliminar a colisao de nomenclatura: "Etapa 1/2/3" no texto visivel ao candidato
   passa a se referir exclusivamente a metodologia ATS.

## 3. Narracao pos-conclusao

Quando `buscar_curriculo` retornar `analiseInicial` e `analiseFinal` (status
`CONCLUIDA`), o copiloto produz, no mesmo turno, duas respostas de texto
sequenciais:

- Etapa 1, Analise ATS: score, keywords da vaga ja presentes
  (`keywordsEncontradas`), keywords criticas ausentes (`keywordsCriticasAusentes`),
  pontos que eliminam automaticamente quando houver (`pontosEliminatorios`), e
  veredicto (`veredicto`) em ate duas linhas. Acompanhada do grafico radial de CA83.
- Etapa 3, ATS pos-geracao: score final comparado ao score inicial. Acompanhada do
  grafico de area Base/Gerado de CA73.

Isso substitui o resumo de uma linha atual. Nenhuma mudanca de contrato entre `api`
e `ai-service` e necessaria: os dois scores ja chegam juntos no mesmo resultado.

## 4. Terminologia

`SYSTEM_TURNO` deixa de nomear o protocolo interno de sequenciamento de ferramentas
como "Etapa 1/2/3". Qualquer uso de "Etapa 1/2/3" em texto visivel ao candidato se
refere somente a Analise, Reescrita e Score pos-geracao.

## 5. Fora de escopo

Narracao incremental de verdade, mostrando a Etapa 1 ao candidato antes da Etapa 2
comecar, exige separar a chamada de analise inicial da chamada de reescrita entre
`api` e `ai-service`, hoje uma unica chamada atomica
(`curriculos.service.ts` -> `generateCvPipeline`). Fica registrada como melhoria
futura, fora desta versao.

## 6. Criterios de aceitacao

- **CA90** Ao concluir uma geracao, o copiloto responde ao candidato com a Etapa 1
  (score, keywords encontradas, keywords ausentes, pontos eliminatorios quando
  houver, veredicto) e a Etapa 3 (score final comparado ao inicial) como texto
  narrado, nao como resumo de uma linha, com os graficos de CA73 e CA83 anexados as
  mensagens correspondentes.
- **CA91** Nenhum texto visivel ao candidato usa "Etapa 1/2/3" para se referir ao
  protocolo interno de chamada de ferramentas; esses rotulos, quando aparecem para
  o candidato, se referem exclusivamente a Analise, Reescrita e Score pos-geracao.

## Changelog

- **1.9.6 (2026-09-18):** copiloto narra a Etapa 1 e a Etapa 3 da metodologia ATS
  como texto ao candidato ao concluir a geracao, com os graficos ja existentes
  anexados, e resolve a colisao de nomenclatura de "Etapa 1/2/3", conforme ADR 0027.
