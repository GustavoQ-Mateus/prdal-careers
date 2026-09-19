# ADR 0032, Integridade de conteúdo e página única na geração de currículo

- **Status:** Aceita
- **Data:** 2026-09-19
- **Fase-alvo:** P10-correção 7, achado crítico em comparação de modelos
- **Contexto:** Para decidir se o motor deveria trocar de provedor de LLM, foi gerado o mesmo currículo (perfil-mestre real, vaga FCamara "Desenvolvedor Back-End Java Jr") com seis configurações diferentes: `openai/gpt-oss-20b` (modelo padrão de produção), `openai/gpt-oss-120b`, `meta-llama/llama-3.3-70b-instruct`, `deepseek/deepseek-chat-v3.1` e `qwen/qwen-2.5-72b-instruct` (os quatro últimos via OpenRouter), e uma execução manual de referência pelo modo-pipeline-curriculo. Os arquivos `.md` das cinco execuções via API/modelo estão em `G:\Dev\Projetos\geracurriculo\curriculos\output\FCAMARA_comparacao_modelos\Curriculo_FCAMARA_*.md`; a execução manual de referência está em `G:\Dev\Projetos\geracurriculo\curriculos\output\Curriculo_FCAMARA_claude-manual.md` (`.md`+`.docx`+`.pdf`).

  A comparação revelou que o problema não é qual modelo é "melhor", é que o pipeline não tem nenhuma validação mecânica de conteúdo, e isso quebra de formas diferentes e sérias dependendo do modelo:

  1. **`openai/gpt-oss-20b`, o modelo em produção, omitiu duas das três experiências do perfil-mestre.** A saída trouxe só "Micro&Money" (estágio de 4 meses, a experiência mais curta e menos recente); "Modera Road Inspector" (emprego atual) e "Saraiva Leão" (onde o candidato é responsável técnico de um sistema com 13 módulos) desapareceram por completo. O sistema marcou a geração como `status: CONCLUIDA`, sem qualquer sinal de degradação.
  2. **Três dos cinco modelos testados (`gpt-oss-120b`, `deepseek-chat-v3.1`, `qwen-2.5-72b-instruct`) inverteram a ordem cronológica**, listando a experiência mais antiga (Micro&Money) antes da mais recente (Modera Road Inspector).
  3. **`qwen-2.5-72b-instruct` produziu 11 bullets** (a referência correta, que cabe em 1 página, tem 7), reproduzindo a experiência da Modera quase sem enxugar em relação ao currículo base — quase certamente estourando 1 página.
  4. **`gpt-oss-120b` usa hífen Unicode não separável (`‑`, U+2011) em vez do hífen ASCII comum**, um detalhe que pode afetar parsers de ATS mais rígidos.

  Nenhum desses quatro problemas foi pego por qualquer validação existente. A causa é estrutural: `apps/api/src/curriculos/curriculos.service.ts:641-663` (`renderizar`) conta páginas do PDF renderizado (`contarPaginasPdf`) e, se vier mais de uma página, troca para um template "compact" (margens/fonte menores) e renderiza de novo — mas **nunca reconta depois dessa segunda tentativa**. Se ainda assim sair com mais de uma página, o código só registra um aviso no log (`this.logger.warn`) e **salva o PDF de duas páginas como se fosse sucesso**. Do lado do motor, `apps/ai-service/app/generate.py:124` tem uma única frase de instrução de prompt ("máximo 3 experiências, 2 a 4 bullets"), sem nenhum código que confira se o modelo obedeceu, nem que confira se todas as experiências do perfil-mestre estão presentes, nem que confira a ordem cronológica.

  Este é o quarto caso da mesma classe de defeito já nomeada pela ADR 0030: o sistema produz uma saída plausível e prossegue como se tivesse dado certo, mesmo quando o conteúdo está incompleto, fora de ordem ou maior do que o formato permite. A diferença desta vez é que o defeito não está numa falha de LLM (`LLMUnavailable`), está numa saída de LLM *bem-sucedida tecnicamente* mas *semanticamente quebrada*, e não há verificação nenhuma para pegar isso.

  A referência de disciplina que evita esses quatro problemas já existe e está documentada: `.claude/agents/modo-pipeline-curriculo.md` (fonte no workspace `geracurriculo`, cópia genérica portada para este repositório) já prescreve "sempre validar o nº de páginas com pypdf após gerar" e o uso de `CV_FONT_DELTA` como escalonamento antes de aceitar o resultado. O motor deste produto precisa da mesma disciplina mecânica, não apenas da mesma instrução em texto.

## Decisão

### 1. Validação de página real, com escalonamento por conteúdo e falha honesta

`renderizar` (`curriculos.service.ts`) passa a recontar páginas depois da tentativa com template "compact". Se ainda assim o resultado tiver mais de uma página, isso não é mais tratado como problema de fonte/margem (o template compact já tentou resolver isso): é excesso de conteúdo, e o motor de geração é chamado de novo com um erro de reparo explícito pedindo para reduzir bullets ou remover a experiência menos aderente à vaga, usando o mesmo mecanismo de retry por erros que `_erros_formula`, `_erros_factualidade` e `_erros_coerencia` já usam em `generate.py`. O número de rodadas de corte é limitado (no máximo duas). Se mesmo assim persistir acima de uma página depois do limite de tentativas, o currículo é salvo com o campo `degradacao` preenchido de forma explícita (o mesmo campo que a P9-fix já expõe na UI), nunca como sucesso silencioso.

### 2. Completude do histórico verificada, não presumida

Quando o perfil-mestre tiver até três experiências (o teto que a própria metodologia já define), uma validação pós-geração confere que o nome de cada empresa do perfil-mestre aparece na seção de Experiência Profissional da saída. Se faltar qualquer uma, isso entra no mesmo laço de reparo do item 1 como erro a corrigir, não como corte legítimo de tailoring. Quando o perfil-mestre tiver mais de três experiências e uma seleção for necessária, a experiência mais recente (sem data de término) nunca pode ser omitida em favor de uma mais antiga.

### 3. Ordem cronológica reversa como regra explícita

`.claude/agents/modo-pipeline-curriculo.md`, nos dois repositórios (`geracurriculo` e `prdal-careers`), ganha uma frase explícita na seção da Etapa 2: "Experiências profissionais em ordem cronológica reversa, a mais recente primeiro." O prompt de `generate.py` espelha essa frase (ele já injeta o arquivo inteiro; a frase nova basta ser adicionada na fonte). Uma validação pós-geração confere que as datas de início na seção de Experiência aparecem em ordem decrescente; ordem errada entra no mesmo laço de reparo.

### 4. Consistência de caracteres ASCII em pontuação

A validação editorial já existente (que hoje pega travessão Unicode "—" e rótulos vazados da fórmula de bullet) passa a pegar também hífen Unicode não separável (`‑`, U+2011) e outros caracteres de pontuação tipográfica fora do ASCII padrão, normalizando para o caractere comum antes de aceitar a saída.

## Justificativa

- O achado mais grave (item de contexto 1) não é sobre qual modelo escrever melhor prosa; é sobre o sistema ter apagado dois terços do histórico profissional do candidato e reportado sucesso. Isso é exatamente o tipo de "nota falsa" que a ADR 0030 já definiu como pior do que não dar nota nenhuma, agora aplicado ao conteúdo do currículo em vez do score.
- Resolver isso ajustando só o prompt (pedir com mais ênfase pra não esquecer experiência) repetiria o erro que a ADR 0030 já rejeitou para keywords: tratar o sintoma de uma dependência que é frágil por construção. A correção certa é uma verificação mecânica que não depende de o modelo "lembrar" da instrução.
- O código já tem o piso certo pra isso: o padrão de retry por lista de erros (`_erros_formula` etc.) já existe e já funciona; esta ADR estende essa mesma máquina para três categorias novas de erro, em vez de inventar mecanismo novo.
- A comparação entre modelos que gerou esse achado é reaproveitável como evidência de aceite: os mesmos seis arquivos usados para encontrar o problema servem para confirmar a correção, rodando a mesma vaga de novo depois da mudança.

## Consequências

- `apps/ai-service/app/generate.py`: novas funções de validação `_erros_tamanho` (ou equivalente, quando a contagem de página real vier da API), `_erros_completude` e `_erros_ordem`, integradas ao mesmo loop de retry que já alimenta `_user()` com "Erros a corrigir nesta tentativa".
- `apps/api/src/curriculos/curriculos.service.ts`: `renderizar` precisa devolver a contagem de páginas final para o chamador poder decidir se aciona uma nova rodada de geração com reparo, em vez de só trocar de template e seguir em frente.
- `.claude/agents/modo-pipeline-curriculo.md` (workspace `geracurriculo`) e sua cópia em `apps/prdal-careers` ganham a frase de ordem cronológica reversa.
- A validação editorial existente (vazamento de vocabulário da fórmula, travessão Unicode) ganha a checagem de hífen não separável.
- A `spec-v1.9.11` registra os critérios de aceite correspondentes.
