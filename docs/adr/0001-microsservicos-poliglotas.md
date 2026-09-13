# ADR 0001 — Arquitetura de microsserviços poliglota com orquestração única

- **Status:** Aceita
- **Data:** 2026-09-12
- **Contexto:** O PRDAL Careers tem três naturezas de trabalho bem distintas: interface e regras de produto, inteligência artificial, e geração de documentos. Cada uma tem um ecossistema de linguagem mais forte. A alternativa seria um monólito em uma linguagem só.

## Decisão
Adotar quatro serviços com fronteira por contrato HTTP/JSON: `web` (React), `api` (NestJS) como único orquestrador, `ai-service` (Python) e `doc-service` (C#/.NET). A `api` é o único ponto que compõe chamadas entre serviços; `web` nunca fala direto com `ai-service` nem `doc-service`.

## Justificativa
- O ecossistema de IA (SDKs de modelo, embeddings, parsing) é nativo de Python. Forçá-lo em Node ou C# custaria bibliotecas imaturas e retrabalho.
- Geração de `.docx` e `.pdf` fiéis é força madura do .NET (OpenXML, QuestPDF).
- Orquestração, autenticação e regras de produto pedem tipagem forte e um framework opinativo: NestJS entrega isso em TypeScript, a mesma linguagem do front.
- Um orquestrador único evita acoplamento em teia: o `web` conhece só a `api`, e trocar um serviço interno não vaza para o cliente.

## Consequências
- Mais complexidade de infraestrutura: `docker-compose` sobe seis contêineres. Aceitável e didático.
- Contratos entre serviços precisam ser versionados e testados; erros de integração viram cenário explícito de resiliência (ver RNF8 da spec).
- A latência do fluxo estrela é a soma de saltos; mitigada com timeouts e chamadas assíncronas onde couber.
