# ADR 0033, Robustez de formato entre modelos e preparação de terceiro provedor

- **Status:** Aceita
- **Data:** 2026-09-20
- **Fase-alvo:** P10-correção 8, achado crítico em avaliação comparativa de modelos
- **Contexto:** Ao comparar a qualidade de texto do motor de geração contra a execução manual de referência (modo-pipeline-curriculo), dois problemas novos e distintos foram encontrados, além de uma decisão de continuidade do produto.

  **1. O prompt de reescrita não exigia tailoring real, só tailoring nominal.** Comparando o resumo profissional e os bullets gerados pelo motor contra a referência manual para a mesma vaga (FCamara, Desenvolvedor Back-End Java Jr), o motor produzia frases de RH genéricas ("entrega de valor ao cliente", "alta disponibilidade na nuvem", "solida experiência em X") que não respondiam a nenhum requisito específico da vaga, e abria bullets de experiências full-stack pelo conteúdo de frontend mesmo em vaga puramente back-end. A referência manual, para a mesma vaga, tem cada frase resolvendo um requisito específico citado no texto da vaga. **Corrigido nesta sessão** (`apps/ai-service/app/generate.py`, função `_user`): nova instrução exige fato concreto em cada frase do resumo, proíbe frase de RH genérica, exige abertura de bullet pelo conteúdo mais aderente ao domínio da vaga, e proíbe mover uma tecnologia real para uma experiência onde ela não foi usada (a primeira tentativa desse ajuste causou exatamente esse erro: o gpt-oss-20b passou a atribuir Java/Spring Boot à Modera Road Inspector, que é Python/FastAPI). A instrução foi mantida deliberadamente curta: uma versão mais longa e detalhada estourou o limite de TPM (tokens por minuto) da conta Groq gratuita para `openai/gpt-oss-20b` (limite 8000, pedido chegou a 10428), causando fallback só por tamanho de prompt, sem relação com qualidade.

  **2. A validação de contrato do Markdown (`_erros_contrato`) não é robusta a variação de formato entre modelos, e isso está causando fallback desnecessário para o template determinístico.** Testando a mesma vaga com `meta-llama/llama-3.3-70b-instruct` (via OpenRouter) repetidas vezes, dois padrões de erro reais foram capturados e nunca haviam sido logados antes desta sessão (não existia log do markdown rejeitado, só da mensagem de erro agregada). Amostras reais capturadas:

  ```text
  # Gustavo Queiroz Mateus
  **Desenvolvedor BackEnd Java Jr**
  ## **Desenvolvedor BackEnd Java Jr**
  https://github.com/GustavoQ-Mateus | ... (linha de contato)
  ```
  O modelo duplica o título como um heading `##` extra antes da linha de contato. `_erros_contrato` espera que a 3ª linha útil seja o contato e não comece com `#`; a duplicação empurra o contato para a 4ª linha, disparando "linha de contato ausente".

  ```text
  ### **Desenvolvedor Full-Stack** | Modera Road Inspector | Jun. 2026 a atual | Pernambuco
  ```
  Cabeçalho de experiência com **quatro campos** separados por `|` (cargo, empresa, período, local) em vez dos três exigidos, usando **mês abreviado com ponto** ("Jun.") em vez de `MM/AAAA`, e prefixado por heading `###` em vez de linha `**Negrito**` simples. `JOB_HEADER_RE` (`^\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*$`) não casa com heading nem com quatro campos, disparando "cabecalho de experiencia invalido"; `_parse_periodo` não extrai `\d{2}/\d{4}` de "Jun. 2026", quebrando também a validação de ordem cronológica (CA117) quando esse padrão aparece.

  Um terceiro caso, mais simples, foi corrigido nesta sessão: cabeçalho com exatamente três campos prefixado por heading (`### Empresa | Cargo | MM/AAAA - atual`), resolvido por uma nova função `_normalizar_cabecalho_experiencia` que roda antes da validação. Os dois casos com quatro campos e mês abreviado **continuam sem correção robusta** ao final desta sessão; o log de aviso agora existe (`logging.getLogger(__name__).warning("reescrita rejeitada tentativa=%s erros=%s", ...)`) para que a próxima rodada não precise redescobrir isso por tentativa e erro como esta sessão precisou.

  O laço de retry (`generate_cv_pipeline`, `for tentativa in range(2)`) dá só duas tentativas e o erro devolvido ao modelo é a mensagem agregada e genérica ("cabecalho de experiencia invalido"), não uma instrução prescritiva do formato exato esperado; isso provavelmente contribui para o modelo repetir o mesmo erro na segunda tentativa e cair no fallback.

  **3. Decisão de continuidade:** o usuário está disposto a fornecer uma chave de API do Claude Opus 4.8 (Anthropic) como último recurso, caso nenhum modelo gratuito/de baixo custo atinja qualidade de tailoring aceitável após a correção do item 1. O projeto é uma demonstração para um processo seletivo (Mobiliza), não um produto com escala de custo real ainda, o que muda o cálculo de custo-benefício do modelo padrão.

## Decisão

### 1. Tailoring real no prompt (implementada nesta sessão)

Mantida como está em `generate.py`. Se uma futura rodada quiser expandir essa instrução, medir o tamanho do prompt resultante contra o limite de TPM do modelo padrão antes de aumentar o texto; preferir exemplos curtos e regras diretas a explicações longas.

### 2. Normalização de cabeçalho de experiência generalizada para N campos e formatos de data

`_normalizar_cabecalho_experiencia` (já parcialmente implementada) precisa generalizar para:
- Heading de qualquer nível (`#` a `######`) seguido de conteúdo com **3 ou mais** campos separados por `|`: o primeiro campo vira `**negrito**`, campos extras além do terceiro (ex.: local) são descartados ou anexados ao terceiro campo, nunca geram um quarto campo solto.
- Datas em formato `Mês. AAAA` (abreviações em português: Jan., Fev., Mar., Abr., Mai., Jun., Jul., Ago., Set., Out., Nov., Dez., com ou sem ponto, com ou sem acento) convertidas para `MM/AAAA` antes de `_parse_periodo` rodar, incluindo o caso "a atual"/"a Mês. AAAA" no lugar de "MM/AAAA - atual"/"MM/AAAA - MM/AAAA".
- Título duplicado como heading logo após a linha de título em negrito (mesmo texto, variação de maiúscula/case ou pontuação) é removido antes da checagem de linha de contato.

Usar os três exemplos reais capturados nesta ADR como casos de teste automatizado (`apps/ai-service/tests/test_generate.py`), não recriar exemplos sintéticos.

### 3. Retry mais prescritivo e com mais tentativas quando o erro for de formato

Quando `_erros_saida` retornar exclusivamente erros de formato mecânico (cabeçalho, linha de contato, ordem de seções) — não erros de conteúdo/factualidade — o texto de reparo enviado ao modelo (`erros` em `_user`) deve incluir a linha exata esperada como exemplo (ex.: `"formato exigido: **Empresa** | Cargo | MM/AAAA - MM/AAAA, uma linha, sem #"`), não só o nome do erro. Considerar subir o número de tentativas de 2 para 3 quando o erro for exclusivamente de formato mecânico (mais barato de corrigir que erro de factualidade), mantendo 2 para os demais casos.

### 4. Validação contra métrica numérica inventada

Nenhuma validação atual pega número/percentual inventado (ex.: "reduzindo o tempo de processamento em cerca de 40%", observado no `gpt-oss-120b` nesta sessão, sem qualquer métrica correspondente no perfil-mestre ou contexto). Nova função `_erros_metricas`: extrai todo padrão numérico com unidade de impacto (`\d+%`, `\d+x`, "em X dias/horas/módulos" quando X não aparecer no perfil/contexto) do markdown gerado e rejeita se não houver correspondência literal no perfil-mestre ou contexto factual do request. Entra no mesmo laço de retry que `_erros_factualidade` já usa.

### 5. Terceiro provedor: Anthropic (Claude), como opção condicional

`apps/ai-service/app/llm.py` já foi estendido nesta sessão para suportar `AI_PROVIDER=openrouter` além de `groq` (mesmo cliente `OpenAI` genérico, `base_url` diferente). Adicionar `AI_PROVIDER=anthropic` como terceira opção, usando o SDK `anthropic` (a API da Anthropic não é compatível com o formato OpenAI de `chat.completions`, então não dá para reaproveitar o mesmo cliente; precisa de um branch próprio em `complete_model` usando `anthropic.Anthropic(...).messages.create(...)` com saída estruturada via `tool_use` ou prefill de JSON). Não ativar por padrão: só habilitar quando `ANTHROPIC_API_KEY` for fornecida pelo usuário. Modelo recomendado a expor: `claude-opus-4-5` (verificar o id exato disponível na conta no momento da implementação). Esta é uma opção de último recurso, a ser avaliada depois que os itens 1 a 4 estiverem implementados e uma nova rodada de comparação (mesma vaga FCamara, mesmo perfil) mostrar se algum modelo gratuito/de baixo custo já atinge qualidade aceitável.

## Justificativa

- O item 1 já mostrou, em teste real, que corrigir o prompt sem gerenciar o orçamento de tokens quebra o modelo mais barato (`gpt-oss-20b`) por estouro de TPM, não por qualidade; qualquer expansão futura do prompt precisa considerar esse teto.
- Os itens 2 e 3 atacam a causa real de porque `llama-3.3-70b` e (por extensão observada) `deepseek-chat-v3.1` caem no fallback determinístico hoje: não é um problema de qualidade de conteúdo, é rigidez excessiva do parser de formato combinada com falta de instrução prescritiva no retry. Ampliar a lista de `STOPWORDS`/regras já foi rejeitado como padrão pela ADR 0030 para keywords; aqui o equivalente correto é o parser aceitar variação de formato legítima, não o modelo ser forçado a adivinhar o formato exato via tentativa e erro.
- O item 4 fecha uma lacuna real observada nesta sessão (métrica inventada) que nenhuma ADR anterior cobriu; ADR 0030 e a `_erros_factualidade` existente só cobrem tecnologia, não número.
- O item 5 é uma decisão de produto do usuário, registrada para não se perder: o projeto é uma demonstração, o cálculo de custo-benefício de modelo é diferente do de um produto em produção real.

## Consequências

- `apps/ai-service/app/generate.py`: `_normalizar_cabecalho_experiencia` generalizada; nova `_erros_metricas`; retry com feedback prescritivo e tentativas condicionais; `_user` mantida enxuta.
- `apps/ai-service/tests/test_generate.py`: novos casos de teste com os três markdowns reais capturados nesta ADR.
- `apps/ai-service/app/llm.py`: branch `anthropic` preparado, inativo até receber a chave.
- `docs/ESTADO_ATUAL.md` registra que uma nova rodada de comparação (mesma vaga FCamara) deve rodar depois destas correções, antes de qualquer decisão final de modelo/provedor.
- A `spec-v1.9.12` registra os critérios de aceite correspondentes.
