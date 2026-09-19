# PRDAL Careers, Especificacao Tecnica

| Campo | Valor |
|---|---|
| **Versao** | 1.9.9 |
| **Status** | Aceita |
| **Data** | 2026-09-19 |
| **Autor** | Gustavo Queiroz Mateus |
| **Dominio** | Proibicao de fallback silencioso de LLM e integridade das keywords |
| **Base** | Estende `spec-v1.9.8.md`; formalizada pela ADR 0030 |

> PATCH compativel, prioridade critica. Corrige a apresentacao de score ATS calculado
> sobre keywords degeneradas e proibe fallback silencioso de LLM em todo o sistema.
> CA1 a CA93 continuam validos. Esta versao adiciona CA94 a CA97.

## 1. Problema

Em validacao manual, a Etapa 1 apresentou "keywords da vaga" que sao palavras comuns
do texto: "como", "desenvolvimento", "aplicacoes", "sera", "garantir", "solucoes",
"missao", "voce".

Causa-raiz: `extract_keywords` (`apps/ai-service/app/keywords.py`) cai
silenciosamente em `_deterministic`, que devolve as 15 palavras mais frequentes da
descricao, quando a chamada ao LLM falha. A lista `STOPWORDS` (`text.py`) nao cobre
esses termos.

Consequencias medidas na mesma execucao:

1. `calcular_score` da 60% do peso ao `keyword_match`; o score 62 exibido ao
   candidato foi calculado contra esses termos, portanto nao mede aderencia a vaga.
2. `_lacunas_autorizadas` injetou esses termos no prompt da reescrita como lacunas a
   fechar, instruindo o modelo a inserir palavras comuns no curriculo. O score caiu
   de 62 para 54 apos a geracao: a pipeline degradou o curriculo obedecendo ao lixo.
3. Nada distingue, na interface ou no dado persistido, uma analise real de uma
   analise sobre keywords inventadas.

Terceiro caso do mesmo defeito estrutural: geracao com fallback silencioso (corrigido
na P9-fix), turno do copiloto devolvendo "Etapa concluida." (`spec-v1.9.7`, pendente),
e agora a extracao de keywords.

## 2. Objetivo

1. Proibir fallback silencioso de LLM em todo o sistema.
2. Eliminar contagem de frequencia como fonte de keyword de vaga.
3. Impedir que keyword degenerada instrua a reescrita do curriculo.
4. Tornar vagas ja contaminadas detectaveis e reprocessaveis.

## 3. Fallback sempre sinalizado

Todo ponto que substitui saida de LLM por caminho deterministico registra esse fato
no dado produzido e propaga ate a superficie onde o resultado e consumido. Resultado
degradado nunca e indistinguivel de resultado integro, nem para o candidato nem para
codigo que decida com base nele. Onde a sinalizacao ja existe (degradacao da geracao,
P9-fix), ela e mantida e padronizada.

## 4. Fonte de keywords

`_deterministic` deixa de ser fonte de keywords para analise ATS ou geracao. Quando a
extracao por LLM falhar, a vaga fica explicitamente sem keywords extraidas, em vez de
receber keywords inventadas. Ampliar `STOPWORDS` nao e solucao aceita: trata sintoma
de uma abordagem errada na origem.

Vaga sem keywords validas nao produz score ATS. A analise informa que a extracao nao
foi possivel e oferece nova tentativa. Nao dar nota e preferivel a dar nota falsa,
porque o candidato decide candidatura real com base nesse numero.

## 5. Geracao protegida

`_lacunas_autorizadas` so considera termos de extracao integra. Sem keywords validas,
a geracao nao recebe lacunas a fechar e nao e instruida a inserir termo algum.

## 6. Recuperacao de vagas contaminadas

Vagas gravadas com keywords degeneradas sao identificaveis e podem ter a extracao
reprocessada, sem apagar a vaga nem o historico de candidatura associado.

## 7. Criterios de aceitacao

- **CA94** Nenhum caminho do sistema substitui saida de LLM por caminho
  deterministico sem registrar isso no dado e propagar ate a superficie de consumo.
  Verificavel forcando falha do LLM em extracao de keywords, turno do copiloto e
  geracao, e confirmando que as tres sinalizam degradacao.
- **CA95** A extracao de keywords nunca devolve resultado de contagem de frequencia
  como se fosse extracao. Com o LLM indisponivel, a vaga fica marcada como sem
  keywords extraidas. Verificavel forcando falha do LLM e conferindo que nenhuma
  palavra comum da descricao e persistida como keyword.
- **CA96** Vaga sem keywords validas nao produz score ATS nem lacunas para a
  reescrita: a analise informa a impossibilidade e oferece nova tentativa, e a
  geracao nao recebe instrucao de inserir termos.
- **CA97** Vagas ja gravadas com keywords degeneradas sao identificaveis e podem ter
  a extracao reprocessada, preservando vaga, curriculos e historico associados.

## Changelog

- **1.9.9 (2026-09-19):** proibe fallback silencioso de LLM, elimina contagem de
  frequencia como fonte de keyword de vaga, impede que keyword degenerada instrua a
  reescrita e torna vagas contaminadas reprocessaveis, conforme ADR 0030.
