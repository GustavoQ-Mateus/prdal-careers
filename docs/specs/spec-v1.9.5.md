# PRDAL Careers, Especificacao Tecnica

| Campo | Valor |
|---|---|
| **Versao** | 1.9.5 |
| **Status** | Aceita |
| **Data** | 2026-09-18 |
| **Autor** | Gustavo Queiroz Mateus |
| **Dominio** | Robustez do agente LLM: saida estruturada estrita, avaliacao de modelo e heuristicas |
| **Base** | Estende `spec-v1.9.4.md`; formalizada pela ADR 0026 |

> PATCH compativel. Melhora a qualidade e a previsibilidade das respostas do
> copiloto sem tocar a pipeline deterministica de score nem os contratos entre api e
> ai-service. CA1 a CA86 continuam validos. Esta versao adiciona CA87 a CA89; a P11
> permanece bloqueada ate o fechamento integral da P10.

## 1. Problema

O motor de LLM compartilhado (`apps/ai-service/app/llm.py`) pede saida apenas como
`json_object`, que garante JSON sintatico mas nao vinculado ao schema alvo, gerando
turnos malformados ocasionais e retries. O modelo esta fixado em
`openai/gpt-oss-120b` sem uma avaliacao registrada frente a `llama-3.3-70b-versatile`,
lacuna ja anotada em `docs/ESTADO_ATUAL.md`. E duas heuristicas do copiloto
(`_regerar_por_perfil_atualizado` e `_DETALHE_INTERNO`) sao frageis: a primeira
dispara regeracao por substring solta e sobrepoe o LLM; a segunda apaga qualquer
token `snake_case` do texto visivel, mutilando conteudo legitimo do candidato.

## 2. Objetivo

1. Pedir saida estruturada estrita quando o modelo suportar, com degradacao
   explicita para `json_object` quando nao suportar.
2. Avaliar e registrar a escolha de modelo entre `llama-3.3-70b-versatile` e
   `openai/gpt-oss-120b`, sem acoplar codigo a um modelo.
3. Tornar as heuristicas do copiloto conservadoras, preservando CA81 e CA82.

## 3. Saida estruturada estrita

`complete_model` monta `response_format: {type: "json_schema", ...}` a partir do
schema Pydantic alvo quando o modelo configurado suportar JSON Schema estrito na
Groq, e cai para o `json_object` atual quando nao suportar. A validacao Pydantic e o
laco de retries permanecem como rede final. A escolha estrito/`json_object` e
derivada do modelo em runtime, nao hardcoded. Vale para o turno do copiloto e para a
pipeline de geracao, que compartilham a mesma funcao.

## 4. Avaliacao de modelo

Fica travado avaliar `llama-3.3-70b-versatile` contra `openai/gpt-oss-120b` no turno
do copiloto e na geracao, medindo taxa de turno bem-formado, aderencia ao pipeline de
Etapas e latencia tipica. A troca e so configuracao (`AI_MODEL`). O resultado, com o
modelo escolhido e o porque, e registrado em `docs/ESTADO_ATUAL.md`.

## 5. Heuristicas conservadoras

`_regerar_por_perfil_atualizado` deixa de disparar por substring solta: exige mencao
conjunta e proxima a perfil/competencias e a nova tentativa para a oportunidade em
foco, e nao sobrepoe o LLM em caso ambiguo. O comportamento de CA81 (ler perfil,
propor nova geracao, confirmar antes de escrever) e preservado nos casos claros.
`_DETALHE_INTERNO` deixa de apagar todo `snake_case`: mira nomes de ferramenta do
catalogo, rota (`GET/POST/PUT/PATCH` mais caminho) e termos de orquestracao, sem
substituir texto legitimo. CA82 continua valido.

## 6. Criterios de aceitacao

- **CA87** `complete_model` usa `json_schema` estrito derivado do schema alvo quando
  o modelo configurado suportar, e cai para `json_object` quando nao suportar, sem
  quebrar; a validacao Pydantic permanece como rede final. Vale para o turno do
  copiloto e para a geracao.
- **CA88** Existe avaliacao registrada em `docs/ESTADO_ATUAL.md` comparando
  `llama-3.3-70b-versatile` e `openai/gpt-oss-120b`, com o modelo escolhido e a
  justificativa; a troca de modelo nao exige mudanca de codigo de contrato.
- **CA89** A regeracao por perfil atualizado nao dispara por mencao ambigua e
  preserva CA81 nos casos claros; nenhuma mensagem visivel do copiloto contem
  identificador interno (CA82) e nenhum texto legitimo do candidato e mutilado por
  substituicao indevida de `snake_case`.

## Changelog

- **1.9.5 (2026-09-18):** saida estruturada estrita com fallback, avaliacao de
  modelo registrada e revisao das heuristicas frageis do copiloto, conforme ADR 0026.
