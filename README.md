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

React · TypeScript · Vite · NestJS · Python · FastAPI · .NET 8 · PostgreSQL · MongoDB · Chroma · Docker · GitHub Actions · Terraform (stub AWS). IA via Claude Sonnet na API da Anthropic; embeddings locais com `sentence-transformers`.

## Como rodar

> Pré-requisitos: Docker e Docker Compose. Para desenvolvimento local dos serviços: Node 20+, Python 3.12, .NET 8 SDK.

```bash
cp .env.example .env      # configure ANTHROPIC_API_KEY e AI_MODEL
docker compose -f infra/docker-compose.yml up
```

Sobe `web`, `api`, `ai-service`, `doc-service`, PostgreSQL e MongoDB. Cada serviço expõe `/health`.

### Migrações do banco

O schema do PostgreSQL muda só por migração Prisma versionada em `apps/api/prisma/migrations`. O boot da api não aplica schema: no compose, o serviço `migracao` roda `prisma migrate deploy` uma vez e a api só sobe depois que ele termina com sucesso.

Banco criado antes das migrações (pelo antigo `prisma db push` no boot): marque o baseline como aplicado uma única vez e depois aplique o resto. O baseline descreve exatamente o que o `db push` e o boot antigo criavam; as migrações seguintes criam os índices de chave estrangeira e preenchem a candidatura principal.

Antes do `resolve`, confira se o banco tem tudo o que o baseline descreve. Um banco de versão antiga pode não ter tabelas, colunas ou enums que o baseline cria, e o `resolve` marcaria o baseline como aplicado sem criá-los. A comparação é contra um banco temporário com só o baseline aplicado, e não contra o `schema.prisma`, porque o schema também tem o que as migrações seguintes criam; aplicar essa parte antes faria o `migrate deploy` falhar com objeto já existente.

```bash
cd apps/api
export DATABASE_URL=postgresql://prdal:SENHA@localhost:5432/prdal_careers
export BASELINE_URL=postgresql://prdal:SENHA@localhost:5432/prdal_baseline
docker compose -f ../../infra/docker-compose.yml exec postgres createdb -U prdal prdal_baseline
npx prisma db execute --url "$BASELINE_URL" --file prisma/migrations/20261005000000_baseline/migration.sql
npx prisma migrate diff --from-url "$DATABASE_URL" --to-url "$BASELINE_URL" --script > alinhamento.sql
grep -inE "DROP|ALTER COLUMN|SET DATA TYPE" alinhamento.sql
```

Se o `alinhamento.sql` não vier vazio, ele deve ter só adições (`CREATE TYPE`, `CREATE TABLE`, `CREATE INDEX`, `ADD COLUMN`, `ADD CONSTRAINT`), e o `grep` acima não deve mostrar nada. Se mostrar remoção ou troca de tipo, pare e investigue: o banco tem algo que o baseline não descreve. Com só adições, aplique o script e siga:

```bash
npx prisma db execute --url "$DATABASE_URL" --file alinhamento.sql
docker compose -f ../../infra/docker-compose.yml exec postgres dropdb -U prdal prdal_baseline
npx prisma migrate resolve --applied 20261005000000_baseline
npx prisma migrate deploy
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
rm alinhamento.sql
```

O último comando deve responder `No difference detected`. Sem o `resolve`, o `migrate deploy` recusa o banco existente com o erro `P3005` e não altera nada.

### PostgreSQL com pgvector

O serviço `postgres` do compose é construído de `infra/postgres/Dockerfile`: a mesma imagem `postgres:16-alpine` de antes com a extensão `vector` (pgvector) compilada por cima, e a migração `20261005000400_extensao_vector` cria a extensão. A base continua alpine de propósito. Trocar para uma imagem Debian sobre o mesmo volume muda a biblioteca C (musl para glibc) e, com ela, a ordenação de texto; os índices de texto gravados com a ordenação antiga podem ficar inconsistentes sem nenhum erro aparente. Com a mesma base e o mesmo PostgreSQL 16, o volume `pgdata` existente é aberto sem conversão.

Para o banco de quem já roda o compose, faça um dump de segurança, troque a imagem e aplique as migrações:

```bash
docker compose -f infra/docker-compose.yml exec postgres pg_dump -U prdal -Fc prdal_careers > prdal-antes-pgvector.dump
docker compose -f infra/docker-compose.yml build postgres
docker compose -f infra/docker-compose.yml up -d postgres
docker compose -f infra/docker-compose.yml run --rm migracao
```

Na AWS o RDS PostgreSQL já traz o pgvector; a mesma migração cria a extensão.

## Documentação

- **Spec atual:** [`docs/specs/spec-v1.7.0.md`](docs/specs/spec-v1.7.0.md)
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
- **Fase 4** Obsidian e RAG: base de conhecimento com embeddings locais multilíngues em Chroma, corpus automático do histórico mais upload de `.md`, e geração de currículo aterrada no contexto recuperado. `v1.3.0`
- **Fase 5** Polimento: PWA, testes, CI, Terraform.
