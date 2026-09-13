# ADR 0007 — Geração de documentos em .NET (doc-service)

- **Status:** Aceita
- **Data:** 2026-09-12
- **Contexto:** O currículo precisa sair em `.docx` (editável) e `.pdf` (envio), fiel a um layout de página única quando couber. Gerar isso em Node ou Python é possível mas trabalhoso e frágil; o autor também quer um papel real e defensável para C# na arquitetura.

## Decisão
Isolar a geração de documentos num **`doc-service` em .NET 8** que recebe o Markdown do currículo e devolve `.docx` e `.pdf`. Usar **Markdig** para parse do Markdown, **OpenXML SDK** para o `.docx` e **QuestPDF** para o `.pdf`.

## Justificativa
- OpenXML e QuestPDF são maduros e dão controle fino de layout, fontes e paginação, o que importa para a regra de página única.
- Um serviço dedicado mantém a `api` limpa e dá a C# uma responsabilidade de verdade, coerente com o repertório do autor.
- O mesmo Markdown alimenta os dois formatos, garantindo que `.docx` e `.pdf` fiquem consistentes entre si.

## Consequências
- Mais um contêiner no `docker-compose` e mais um runtime na stack.
- Se o `doc-service` estiver indisponível, o fluxo degrada com elegância: a `api` ainda entrega Markdown e score, e a UI sinaliza download indisponível (RNF8, CA5).
- Templates de currículo viram um recurso versionável dentro do `doc-service`.
