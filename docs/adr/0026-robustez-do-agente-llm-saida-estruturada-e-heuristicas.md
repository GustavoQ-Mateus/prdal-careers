# ADR 0026, Robustez do agente LLM: saída estruturada estrita, avaliação de modelo e revisão de heurísticas

- **Status:** Aceita
- **Data:** 2026-09-18
- **Fase-alvo:** P10-correção, revisão pós-uso real da qualidade de resposta do copiloto (complementa ADR 0003, ADR 0024)
- **Contexto:** Uso real relatou que o copiloto "não está funcionando bem" nas respostas. Auditando `apps/ai-service/app/llm.py`, `copiloto.py` e `generate.py`, três pontos independentes explicam parte disso, todos no motor de LLM compartilhado, sem tocar a pipeline determinística de score corrigida na P9-fix:
  1. `complete_model` (`llm.py`) pede saída com `response_format: {type: "json_object"}`. Isso obriga JSON sintático, mas não vincula ao schema real (`TurnResponse`, e os schemas de geração). O modelo pode devolver JSON válido com campos errados, faltando ou extras; a validação Pydantic falha depois e cai no laço de `retries`, que só reenvia uma instrução textual pedindo "JSON válido". Com `openai/gpt-oss-120b` isso gera turnos malformados ocasionais e latência extra de retry.
  2. O modelo é fixado por `AI_MODEL` com default `openai/gpt-oss-120b` (`llm.py`). O `docs/ESTADO_ATUAL.md` já registra como lacuna aberta confirmar se `llama-3.3-70b-versatile` está acessível na conta Groq e é melhor para este uso, mas essa avaliação nunca foi feita de forma registrada.
  3. Duas heurísticas do copiloto são frágeis e sobrepõem ou mutilam a decisão do LLM:
     - `_regerar_por_perfil_atualizado` (`copiloto.py`) decide regerar por currículo (CA81) via `substring` em português ("atualiz", "adicionei", "tente", "novamente"...). Casa falso positivo (o candidato menciona "atualizei o LinkedIn") e falso negativo (frases fora da lista), e **sobrepõe** o LLM antes de qualquer chamada.
     - `_DETALHE_INTERNO` (`copiloto.py`) protege o texto visível (CA82) com o regex `\b(?:[a-z]+_)+[a-z]+\b`, que troca **qualquer** token `snake_case` por "esta acao". Além de nomes internos, ele apaga conteúdo legítimo que por acaso tenha `snake_case`, degradando a mensagem ao candidato.

## Decisão

### 1. Saída estruturada estrita quando o modelo suportar, com degradação explícita

`complete_model` passa a pedir `response_format: {type: "json_schema", json_schema: {...}}` derivado do schema Pydantic alvo (`schema.model_json_schema()`), quando o modelo configurado suportar JSON Schema estrito na Groq. Quando o modelo não suportar, cai para o `json_object` atual, sem quebrar. A validação Pydantic e o laço de `retries` permanecem como rede de segurança final. A escolha entre estrito e `json_object` é derivada do modelo em runtime, não hardcoded a um provedor, mantendo o princípio da ADR 0003 (saída estruturada) sem introduzir dependência nova.

### 2. Avaliação de modelo registrada, decisão por configuração

Fica travado avaliar `llama-3.3-70b-versatile` contra `openai/gpt-oss-120b` para o turno do copiloto e para a geração, medindo taxa de turno bem-formado, aderência ao pipeline de Etapas e latência típica de geração. A troca de modelo é só configuração (`AI_MODEL`), sem mudança de código de contrato. O resultado da comparação, com o modelo escolhido e o porquê, é registrado em `docs/ESTADO_ATUAL.md`, fechando a lacuna que já estava aberta ali. Esta ADR não fixa um vencedor a priori; fixa que a decisão passa a existir e ser rastreável.

### 3. Heurísticas do copiloto ficam conservadoras e param de mutilar texto

- `_regerar_por_perfil_atualizado` deixa de ser gatilho por `substring` solta. A intenção de regerar a partir de perfil atualizado (CA81) continua existindo, mas com condição mais restrita: exige menção conjunta e próxima a perfil/competências **e** a nova tentativa para a oportunidade em foco, e deixa de sobrepor o LLM quando o sinal for ambíguo; no caso ambíguo, o LLM decide o próximo passo normalmente. O comportamento de CA81 (ler perfil, propor nova geração, confirmar antes de escrever) é preservado nos casos claros.
- `_DETALHE_INTERNO` deixa de apagar todo `snake_case`. A proteção de CA82 passa a mirar os vazamentos reais (nomes de ferramentas do catálogo, verbos de rota `GET/POST/PUT/PATCH` seguidos de caminho, e os termos de orquestração `payload/json/tool/tools/rota`), sem substituir texto legítimo do candidato. CA82 continua válido: nenhum identificador interno aparece na mensagem visível.

## Justificativa

- JSON Schema estrito ataca a causa da malformação onde ela nasce, em vez de depender só do retry textual, e reduz latência de turnos refeitos; é a evolução natural da ADR 0003 agora que os modelos da Groq expõem o recurso.
- Registrar a avaliação de modelo transforma uma lacuna vaga do `ESTADO_ATUAL` em decisão rastreável, sem acoplar código a um modelo específico.
- Tornar as heurísticas conservadoras corrige regressões de qualidade percebida (regeração disparada na hora errada, mensagem mutilada) sem reabrir os comportamentos que CA81 e CA82 fixaram.

## Consequências

- `apps/ai-service/app/llm.py`: `complete_model` monta `json_schema` a partir do schema alvo quando o modelo suportar, com fallback para `json_object`; afeta tanto `copiloto.py` (turno) quanto `generate.py` (pipeline), que já compartilham essa função.
- `apps/ai-service/app/copiloto.py`: `_regerar_por_perfil_atualizado` e `_DETALHE_INTERNO` ficam mais restritos, preservando CA81 e CA82.
- Nenhuma mudança de contrato entre `api` e `ai-service`; os schemas de request/response permanecem os mesmos.
- `docs/ESTADO_ATUAL.md`: passa a registrar o resultado da avaliação de modelo e o modelo escolhido.
- A `spec-v1.9.5` registra CA87 a CA89 cobrindo estes três pontos.
