# PRDAL Careers, Especificacao Tecnica

| Campo | Valor |
|---|---|
| **Versao** | 1.9.12 |
| **Status** | Aceita |
| **Data** | 2026-09-20 |
| **Autor** | Gustavo Queiroz Mateus |
| **Dominio** | Robustez de formato entre modelos e terceiro provedor |
| **Base** | Estende `spec-v1.9.11.md`; formalizada pela ADR 0033 |

> PATCH compativel. Generaliza a normalizacao de cabecalho de experiencia para N
> campos e datas por extenso, torna o retry de formato prescritivo, adiciona
> validacao contra metrica numerica inventada, e prepara Anthropic como terceiro
> provedor condicional. CA1 a CA118 continuam validos. Esta versao adiciona CA119
> a CA123.

## 1. Problema

Comparando o motor contra a execucao manual de referencia para a mesma vaga
(FCamara, Desenvolvedor Back-End Java Jr):

1. O prompt de reescrita permitia frases de RH genericas sem fato concreto e
   bullets abrindo por conteudo irrelevante ao dominio da vaga. Corrigido nesta
   sessao em `generate.py` (`_user`), mantendo o texto curto para nao estourar o
   limite de TPM da conta Groq gratuita (`openai/gpt-oss-20b`, limite 8000).
2. `meta-llama/llama-3.3-70b-instruct` (via OpenRouter) produz cabecalhos de
   experiencia validos semanticamente mas rejeitados pelo parser rigido: heading
   `###` em vez de negrito simples, quatro campos (`Cargo | Empresa | Data | Local`)
   em vez de tres, mes abreviado ("Jun. 2026") em vez de `MM/AAAA`, e um heading
   duplicado do titulo antes da linha de contato. Isso causa fallback para o
   template deterministico mesmo quando o conteudo gerado era bom. Um caso simples
   (heading de 3 campos) ja foi corrigido nesta sessao; os casos de 4 campos e mes
   abreviado continuam abertos.
3. Nenhuma validacao pega metrica numerica inventada (ex.: "~40%" observado no
   `gpt-oss-120b`, sem correspondencia no perfil-mestre).
4. Decisao do usuario: Claude Opus 4.8 (Anthropic) fica disponivel como terceiro
   provedor condicional, ativado quando `ANTHROPIC_API_KEY` for fornecida, como
   ultimo recurso se nenhum modelo gratuito/de baixo custo atingir qualidade
   aceitavel apos os itens acima.

## 2. Objetivo

1. Tornar a normalizacao de cabecalho de experiencia robusta a variacao real de
   formato entre modelos, nao so ao caso mais simples.
2. Tornar o retry por erro de formato mecanico prescritivo (mostrar o formato
   exato esperado) e com orcamento de tentativas proprio.
3. Rejeitar metrica numerica sem fonte factual, no mesmo padrao ja aplicado a
   tecnologia inventada.
4. Preparar (sem ativar por padrao) Anthropic como terceiro provedor.

## 3. Normalizacao generalizada de cabecalho de experiencia

`_normalizar_cabecalho_experiencia` passa a aceitar heading de qualquer nivel
seguido de 3 ou mais campos separados por `|`: primeiro campo vira `**negrito**`,
campos alem do terceiro sao descartados ou anexados ao terceiro campo. Datas por
extenso em portugues (mes abreviado, com ou sem ponto/acento, seguido de ano) sao
convertidas para `MM/AAAA` antes de `_parse_periodo` rodar, incluindo variantes
"a atual" e "a Mes. AAAA". Heading duplicando o titulo profissional (mesmo texto,
variacao de case/pontuacao) logo apos a linha de titulo em negrito e removido
antes da checagem de linha de contato.

Casos de teste obrigatorios (markdown real capturado, nao sintetico), incluidos em
`apps/ai-service/tests/test_generate.py`:
- Titulo duplicado como heading antes do contato.
- Cabecalho de experiencia com 4 campos (`Cargo | Empresa | Data | Local`) e mes
  abreviado.
- Cabecalho de experiencia com 3 campos prefixado por heading (caso ja corrigido,
  vira teste de regressao).

## 4. Retry prescritivo para erro de formato

Quando `_erros_saida` retornar somente erros de formato mecanico (cabecalho de
experiencia, linha de contato, ordem de secoes), a mensagem de reparo enviada ao
modelo inclui a linha exata esperada como exemplo, nao so o nome do erro
generico. Erro exclusivamente de formato mecanico pode usar ate 3 tentativas;
erro de conteudo/factualidade mantem 2.

## 5. Validacao contra metrica numerica inventada

Nova funcao `_erros_metricas`: extrai padrao numerico com unidade de impacto
(percentual, multiplicador, quantidade associada a tempo/escala) do markdown
gerado; rejeita se o numero nao tiver correspondencia literal no perfil-mestre ou
no contexto factual do request. Entra no mesmo laco de retry de
`_erros_factualidade`.

## 6. Terceiro provedor: Anthropic condicional

`llm.py` ganha um branch `AI_PROVIDER=anthropic` usando o SDK `anthropic` (nao o
cliente OpenAI generico, ja que a API da Anthropic tem formato proprio), inativo
por padrao. So habilita quando `ANTHROPIC_API_KEY` estiver presente. Modelo a
expor: verificar o id exato de Claude Opus 4.8 disponivel na conta no momento da
implementacao.

## 7. Criterios de aceitacao

- **CA119** Um cabecalho de experiencia com heading de qualquer nivel, 3 ou mais
  campos separados por `|`, e data em formato "Mes. AAAA" ou "a Mes. AAAA" e
  normalizado para o formato `**Empresa** | Cargo | MM/AAAA - MM/AAAA` (ou
  "atual") antes da validacao, usando os markdowns reais capturados na ADR 0033
  como fixture de teste.
- **CA120** Um heading duplicando o titulo profissional antes da linha de contato
  e removido antes da checagem de linha de contato; a vaga FCamara reprocessada
  com `llama-3.3-70b-instruct` nao cai mais em "linha de contato ausente" nem
  "cabecalho de experiencia invalido" por esses dois motivos especificos.
- **CA121** Erro exclusivamente de formato mecanico gera mensagem de reparo com o
  formato exato esperado como exemplo, nao so o nome do erro; pode usar ate 3
  tentativas antes de cair em fallback.
- **CA122** Uma saida contendo percentual, multiplicador ou numero de
  escala/tempo sem correspondencia no perfil-mestre ou contexto e rejeitada pelo
  mesmo mecanismo de `_erros_factualidade`. Verificavel reproduzindo o caso real
  do `gpt-oss-120b` (metrica "~40%" sem fonte) e confirmando rejeicao.
- **CA123** `AI_PROVIDER=anthropic` existe como opcao no codigo, documentada,
  inativa por padrao, e so ativa quando `ANTHROPIC_API_KEY` estiver presente no
  ambiente.

## Changelog

- **1.9.12 (2026-09-20):** generaliza normalizacao de cabecalho de experiencia
  para N campos e datas por extenso, torna o retry de formato prescritivo com
  orcamento proprio de tentativas, adiciona validacao contra metrica numerica
  inventada, e prepara Anthropic como terceiro provedor condicional, conforme
  ADR 0033.
