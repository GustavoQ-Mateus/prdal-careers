# ADR 0030, Proibição de fallback silencioso de LLM e integridade das keywords da vaga

- **Status:** Aceita
- **Data:** 2026-09-19
- **Fase-alvo:** P10-correção, achado crítico em validação manual
- **Contexto:** Durante validação manual do copiloto, a Etapa 1 apresentou ao candidato esta análise: score 62, keywords encontradas "como, desenvolvimento, backend, aplicacoes, dados, sera", keywords críticas ausentes "garantir, solucoes, praticas, bancos, ferramentas, monitoramento, missao, voce". Nenhum desses termos é palavra-chave de vaga. São palavras comuns do texto da descrição.

  Causa-raiz confirmada por leitura de código. `extract_keywords` (`apps/ai-service/app/keywords.py`) tenta extrair keywords via LLM e, ao receber `LLMUnavailable`, cai silenciosamente em `_deterministic(descricao)`, que é `Counter(content_tokens(descricao)).most_common(15)`: as quinze palavras mais frequentes do texto, ponderadas por frequência relativa. A lista `STOPWORDS` (`apps/ai-service/app/text.py`) tem cerca de cinquenta entradas e não contém "como", "sera", "voce", "missao", "garantir", "solucoes", "praticas", "bancos", "ferramentas" nem "monitoramento". Essas palavras passam pelo filtro e são persistidas na vaga como se fossem requisitos técnicos.

  O dano não para no score errado:

  1. `calcular_score` (`score.py`) atribui 60% do peso ao `keyword_match`. Com keywords degeneradas, o score não mede aderência à vaga; mede coincidência de vocabulário comum. O 62 exibido ao candidato é ruído apresentado como avaliação.
  2. `_lacunas_autorizadas` (`generate.py`) seleciona as "keywords críticas ausentes" e as injeta no prompt da reescrita como lacunas a fechar. Ou seja, o sistema instruiu o modelo a inserir "garantir", "missao" e "voce" no currículo. Na mesma execução o score caiu de 62 para 54 após a geração: a pipeline piorou ativamente o currículo, obedecendo a uma instrução derivada de lixo.
  3. A análise é persistida e exibida com a mesma aparência de uma análise válida. Nada distingue, para o candidato ou para o sistema, uma extração real de uma contagem de palavras.

  Este é o terceiro caso do mesmo defeito estrutural neste repositório: geração caindo no fallback determinístico sem aviso, corrigido na P9-fix; turno do copiloto devolvendo "Etapa concluida." quando o modelo falha, coberto pela `spec-v1.9.7` e ainda pendente; e agora a extração de keywords. O padrão é constante: quando a chamada ao LLM falha, o código produz uma saída plausível e prossegue como se nada tivesse acontecido.

## Decisão

### 1. Nenhum fallback de LLM pode ser silencioso

Todo ponto do sistema que substitui uma saída de LLM por um caminho determinístico registra esse fato no dado produzido e o propaga até a superfície onde o resultado é consumido. Um resultado degradado nunca é indistinguível de um resultado íntegro, nem para o candidato, nem para outra parte do código que vá tomar decisão com base nele.

Isso vale para os três casos conhecidos e para qualquer outro que o mapeamento da `spec-v1.9.8` revele. Onde já existir sinalização (a degradação da geração exposta na P9-fix), ela é mantida e padronizada.

### 2. Contagem de frequência não é fonte válida de keyword de vaga

`_deterministic` deixa de ser usado como fonte de keywords para análise ATS ou para geração. Extração por frequência não distingue requisito técnico de palavra comum, e ampliar a lista de stopwords não resolve o problema: trata o sintoma de uma abordagem que é errada na origem.

Quando a extração por LLM falhar, a vaga fica explicitamente sem keywords extraídas, em vez de receber keywords inventadas. Uma vaga nesse estado não produz score ATS: a análise informa que a extração não foi possível e oferece nova tentativa. É preferível não dar nota a dar uma nota falsa, porque o candidato toma decisão real sobre a candidatura com base nesse número.

### 3. Keyword degenerada nunca instrui a reescrita

`_lacunas_autorizadas` só considera termos vindos de uma extração íntegra. Com a vaga sem keywords válidas, a geração não recebe lacunas a fechar e não é instruída a inserir termo nenhum. Isso impede que o pipeline degrade o currículo perseguindo palavras que não são requisito.

### 4. Vagas já contaminadas são detectáveis e recuperáveis

Vagas gravadas com keywords degeneradas continuam no banco e seguem produzindo score falso a cada nova geração. É preciso poder identificá-las e reprocessar a extração, sem apagar a vaga nem o histórico de candidatura associado.

## Justificativa

- Um score ATS é a principal promessa do produto. Um número errado apresentado com aparência de correto é pior que a ausência do número, porque induz o candidato a se candidatar ou a descartar uma vaga com base em ruído.
- O problema relatado pelo usuário como "a LLM está ruim por completo" não é qualidade do modelo: é o sistema encobrir as falhas do modelo. Corrigir a classe do defeito ataca a causa; ampliar stopwords ou trocar de modelo só mudaria a frequência com que o lixo aparece.
- Falhar de forma visível é barato aqui: o candidato pode pedir nova tentativa. Falhar de forma invisível custa o currículo inteiro, como já custou nesta execução, em que a nota caiu depois da geração porque a geração obedeceu ao lixo.

## Consequências

- `apps/ai-service/app/keywords.py`: `extract_keywords` deixa de devolver resultado de frequência como se fosse extração; o caminho de falha passa a ser explícito.
- `apps/ai-service/app/generate.py`: `_analise` e `_lacunas_autorizadas` passam a distinguir vaga com keywords íntegras de vaga sem extração válida; sem extração, não há score nem lacunas.
- `apps/api`: a vaga carrega o estado da extração; a interface distingue vaga analisável de vaga pendente de extração e permite reprocessar.
- Relaciona-se com a `spec-v1.9.7` (CA93, falha honesta do turno) e com a `spec-v1.9.5` (CA87, saída estruturada estrita), que reduzem a frequência das falhas que disparam esses fallbacks. Esta ADR trata do que o sistema faz quando a falha acontece.
- A `spec-v1.9.9` registra CA94 a CA97.
