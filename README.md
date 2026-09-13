# PRDAL Careers

**PRDAL** é a sigla de **Programming, Research, Development, Automation & Logic**.

Plataforma web de gestão de candidaturas e geração de currículo otimizado para ATS. A partir de um **perfil-mestre** único, gera currículos **tailored por vaga**, mede um **score ATS** explicável e acompanha as candidaturas num quadro de status. Usa o histórico profissional mantido em notas Markdown do **Obsidian** como base de conhecimento para a geração por IA.

Projeto **spec-driven**: a fonte da verdade é a spec versionada em `docs/specs/`, com as decisões de arquitetura registradas em `docs/adr/`.

## Arquitetura

Microsserviços poliglota com orquestração única na `api`:

```
                    [ web — React + TS + Vite (PWA) ]
                                   │  REST/JSON
                    [ api — NestJS + TypeScript (BFF) ]
                   /               │                 \
   [ ai-service — Python ]   [ doc-service — C# ]   [ PostgreSQL + MongoDB ]
    keywords, geração,        docx + pdf
    score, RAG Obsidian
           │
   [ Groq free / Ollama ]  +  [ Chroma (embeddings) ]
```

| Serviço | Stack | Responsabilidade |
|---|---|---|
| `apps/web` | React 18 + TS + Vite, PWA | Interface: vagas, perfil, geração, score, Kanban |
| `apps/api` | NestJS + TypeScript | Orquestração, auth, regras, dono de Postgres + Mongo |
| `apps/ai-service` | Python + FastAPI | Keywords, geração de CV, score ATS, RAG do Obsidian |
| `apps/doc-service` | C# / .NET 8 | Render `.docx` e `.pdf` |

## Stack

React · TypeScript · Vite · NestJS · Python · FastAPI · .NET 8 · PostgreSQL · MongoDB · Chroma · Docker · GitHub Actions · Terraform (stub AWS). IA via Groq free tier com fallback Ollama local; embeddings locais com `sentence-transformers`.

## Como rodar

> Pré-requisitos: Docker e Docker Compose. Para desenvolvimento local dos serviços: Node 20+, Python 3.12, .NET 8 SDK.

```bash
cp .env.example .env      # configure AI_PROVIDER e chaves
docker compose -f infra/docker-compose.yml up
```

Sobe `web`, `api`, `ai-service`, `doc-service`, PostgreSQL e MongoDB. Cada serviço expõe `/health`.

## Documentação

- **Spec atual:** [`docs/specs/spec-v1.0.0.md`](docs/specs/spec-v1.0.0.md)
- **Decisões de arquitetura (ADRs):**
  - [0001 — Microsserviços poliglota](docs/adr/0001-microsservicos-poliglotas.md)
  - [0002 — Stack liderada por React + Node + TS](docs/adr/0002-stack-alinhada-a-vaga.md)
  - [0003 — IA gratuita com saída estruturada](docs/adr/0003-ia-gratuita-saida-estruturada.md)
  - [0004 — Persistência poliglota](docs/adr/0004-persistencia-poliglota.md)
  - [0005 — Score ATS explicável](docs/adr/0005-score-ats-explicavel.md)
  - [0006 — RAG do Obsidian com embeddings locais](docs/adr/0006-rag-obsidian-embeddings-locais.md)
  - [0007 — Geração de documentos em .NET](docs/adr/0007-doc-service-dotnet.md)

## Roadmap

Construção em fases (detalhe na seção 12 da spec):

- **Fase 0** Scaffold: monorepo, docker-compose, health checks, hello-world ponta a ponta.
- **Fase 1** Núcleo: perfil-mestre, vagas com keywords, geração de CV com score e docx/pdf. `v1.0.0`
- **Fase 2** Análise ATS: dashboard de score, breakdown visual, comparativo entre versões e edição do Markdown com recálculo. `v1.1.0`
- **Fase 3** Banco de vagas: importação em massa, classificação determinística por categoria e nível, processamento em lote e Kanban de candidaturas. `v1.2.0`
- **Fase 4** Obsidian e RAG. `v1.3.0`
- **Fase 5** Polimento: PWA, testes, CI, Terraform.
