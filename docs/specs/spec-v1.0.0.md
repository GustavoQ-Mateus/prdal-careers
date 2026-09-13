# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.0.0 |
| **Status** | Draft |
| **Data** | 2026-09-12 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Gestão de candidaturas e geração de currículo otimizado para ATS |

> Versionamento: esta spec segue **SemVer**. MAJOR muda contrato/arquitetura de forma incompatível, MINOR adiciona escopo compatível, PATCH corrige texto/detalhe. Cada versão tem seu arquivo em `docs/specs/spec-vX.Y.Z.md`. Mudanças relevantes ficam no Changelog no fim deste arquivo e viram ADRs em `docs/adr/` quando são decisões de arquitetura.

---

## 1. Contexto de negócio
Quem procura emprego enfrenta dois problemas reais e caros. Primeiro, currículos passam por filtros **ATS** que descartam candidatos antes de qualquer olho humano ver, o que obriga a reescrever o currículo para cada vaga fazendo espelhamento de keywords. Segundo, o candidato perde o controle de dezenas de vagas em paralelo: onde se inscreveu, em que etapa está, qual versão do currículo mandou.

O **PRDAL Careers** resolve os dois. É uma plataforma web que centraliza o **banco de vagas**, gera **currículos tailored e otimizados para ATS** a partir de um **perfil-mestre** único, mede um **score ATS** contra cada vaga e acompanha as **candidaturas** num quadro de status. Um diferencial é usar o histórico profissional do próprio usuário, mantido em notas Markdown do **Obsidian**, como base de conhecimento que alimenta a geração por IA.

Objetivo de engenharia: provar arquitetura de **microsserviços poliglota** com fronteiras bem definidas (orquestração em Node/TypeScript, IA em Python, geração de documentos em C#/.NET), **persistência poliglota** (PostgreSQL + MongoDB), integração com **modelo de IA gratuito** com saída estruturada e confiável, e um front **PWA** em React, com Docker, CI/CD e infraestrutura como código.

## 2. Objetivo
Entregar uma plataforma web funcional ponta a ponta onde o usuário cadastra uma vaga, dispara a geração de um currículo tailored a partir do seu perfil-mestre, recebe o documento em `.docx` e `.pdf` com um score ATS, e acompanha a candidatura num quadro de status. Tudo sobe com um único `docker-compose up`.

## 3. Escopo
Monorepo com quatro aplicações e pacotes compartilhados:

1. **web** (React 18 + TypeScript + Vite, PWA): interface. Cadastro de vagas, perfil-mestre, tela de geração de currículo, dashboard de score e quadro Kanban de candidaturas.
2. **api** (NestJS + TypeScript): orquestrador e BFF. Autenticação, regras de negócio, CRUD de vagas/candidaturas/perfil, e orquestração das chamadas ao AI Service e ao Doc Service. Dono do PostgreSQL e do MongoDB.
3. **ai-service** (Python + FastAPI): camada de inteligência. Extração de keywords da vaga, geração do currículo em Markdown, cálculo do score ATS e RAG sobre as notas do Obsidian.
4. **doc-service** (C# / .NET 8): geração de documentos. Recebe o Markdown do currículo e renderiza `.docx` e `.pdf`.
5. **packages/shared-types** (TypeScript): DTOs e contratos compartilhados entre `web` e `api`.

## 4. Stack
**Frontend:** React 18 · TypeScript · Vite · PWA (service worker + manifest) · React Query · Zustand · testes com Vitest e Playwright.

**API / orquestrador:** NestJS · TypeScript · Prisma ou TypeORM sobre PostgreSQL · driver oficial do MongoDB · autenticação JWT · `HttpModule` para falar com AI Service e Doc Service · testes com Jest.

**AI Service:** Python 3.12 · FastAPI · Pydantic (saída estruturada validada) · cliente compatível com API OpenAI apontando para **Groq (free tier)** por padrão, com **Ollama local** como fallback plugável por variável de ambiente · `sentence-transformers` para embeddings locais e gratuitos · Chroma como vector store local · testes com pytest.

**Doc Service:** .NET 8 · ASP.NET Core Minimal API · Markdig (parse de Markdown) · QuestPDF (PDF) · OpenXML SDK (docx) · testes com xUnit.

**Dados:** PostgreSQL (relacional) + MongoDB (documentos) + Chroma (vetorial, local).

**Infra:** Docker + docker-compose (sobe os 4 serviços, Postgres e Mongo) · GitHub Actions (CI: lint, testes, build) · Terraform stub descrevendo o alvo AWS (ECS + RDS + DocumentDB).

## 5. Arquitetura
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

**Fluxo estrela — gerar currículo tailored** (atravessa os quatro serviços):
1. `web` chama `POST /vagas/{id}/gerar-cv` na `api`.
2. `api` chama o `ai-service`: extrai keywords da vaga, recupera contexto relevante do perfil-mestre e das notas do Obsidian via RAG, e gera o Markdown do currículo tailored.
3. `api` chama o `ai-service` novamente (ou no mesmo passo) para calcular o **score ATS** do Markdown contra a vaga.
4. `api` chama o `doc-service` passando o Markdown, que devolve `.docx` e `.pdf`.
5. `api` persiste o currículo, o score e os arquivos, e devolve preview, links de download e score para o `web`.

## 6. Modelo de dados

### PostgreSQL (relacional, dono: `api`)
- **`usuarios`**: `id (uuid, PK)`, `email (unique)`, `senha_hash`, `criado_em`.
- **`perfil_mestre`**: `id (uuid, PK)`, `usuario_id (FK)`, `nome`, `contato (jsonb)`, `resumo`, `experiencias (jsonb)`, `formacao (jsonb)`, `skills (jsonb)`, `atualizado_em`. É a fonte única de verdade do histórico profissional.
- **`vagas`**: `id (uuid, PK)`, `usuario_id (FK)`, `titulo`, `empresa`, `descricao (text)`, `fonte (url)`, `keywords (jsonb)`, `criado_em`.
- **`curriculos`**: `id (uuid, PK)`, `vaga_id (FK)`, `markdown (text)`, `docx_path`, `pdf_path`, `score (int)`, `score_breakdown (jsonb)`, `gerado_em`.
- **`candidaturas`**: `id (uuid, PK)`, `vaga_id (FK)`, `curriculo_id (FK, nullable)`, `status (RASCUNHO|INSCRITA|EM_PROCESSO|ENTREVISTA|OFERTA|REJEITADA|DESISTIU)`, `notas (text)`, `atualizado_em`.

### MongoDB (documentos, dono: `api`)
- **`banco_vagas`**: postagens de vaga cruas importadas em massa, texto não estruturado, para triagem antes de virar uma `vaga` relacional.
- **`notas_obsidian`**: conteúdo dos arquivos `.md` do vault ingeridos, com caminho, título e corpo, insumo do RAG.

### Chroma (vetorial, dono: `ai-service`)
- Coleção de embeddings dos chunks do perfil-mestre e das notas do Obsidian, para recuperação semântica na geração.

## 7. Contratos de API

### api (NestJS) — consumida pelo web
- `POST /auth/login` e `POST /auth/register` — JWT.
- `GET|POST|PUT|DELETE /vagas` — CRUD de vagas.
- `GET|PUT /perfil-mestre` — leitura e edição do perfil-mestre.
- `POST /vagas/{id}/gerar-cv` — dispara o fluxo estrela; responde `202 Accepted` com `jobId`, e o resultado fica em `GET /curriculos/{id}`.
- `GET /curriculos/{id}` — Markdown, score, breakdown e links de download.
- `GET /candidaturas` — lista para o Kanban; `PATCH /candidaturas/{id}` — muda status.
- `POST /banco-vagas/import` — importa postagens cruas em massa para o Mongo.
- `POST /obsidian/ingest` — envia arquivos do vault para ingestão.
- `GET /health`.

### ai-service (FastAPI) — consumida pela api
- `POST /keywords` — req `{ descricao }`, resp `{ keywords: [{ termo, peso }] }`.
- `POST /generate-cv` — req `{ perfilMestre, vaga, keywords, contexto }`, resp `{ markdown }`.
- `POST /score` — req `{ markdown, vaga }`, resp `{ score: 0-100, breakdown: { keywordMatch, densidade, secoes } }`.
- `POST /context/query` — req `{ query, k }`, resp `{ chunks: [...] }` (RAG).
- `POST /obsidian/ingest` — req `{ arquivos: [{ caminho, titulo, corpo }] }`, resp `{ ingeridos }`.
- `GET /health`.

### doc-service (.NET) — consumida pela api
- `POST /render/docx` — req `{ markdown, template }`, resp arquivo `.docx` (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
- `POST /render/pdf` — req `{ markdown, template }`, resp arquivo `.pdf`.
- `GET /health`.

## 8. Requisitos funcionais
- **RF1** O usuário se autentica e mantém um único **perfil-mestre** com seu histórico real.
- **RF2** O usuário cadastra uma **vaga** colando a descrição; a `api` pede as keywords ao `ai-service` e as persiste.
- **RF3** O usuário dispara `gerar-cv` para uma vaga; o sistema gera o Markdown tailored, calcula o score e produz `.docx` e `.pdf`.
- **RF4** O usuário vê o **score ATS** e o breakdown do currículo gerado, e baixa os arquivos.
- **RF5** O usuário acompanha suas **candidaturas** num Kanban e muda o status de cada uma.
- **RF6** O usuário importa um lote de vagas cruas para o **banco de vagas** e promove as relevantes a `vaga`.
- **RF7** O usuário ingere seu **vault do Obsidian**; o conteúdo passa a alimentar o contexto da geração via RAG.

## 9. Requisitos não funcionais
- **RNF1 Fronteiras de serviço**: cada serviço tem uma responsabilidade única e se comunica só por contrato HTTP/JSON. A `api` é o único ponto de orquestração. Ver ADR 0001.
- **RNF2 Alinhamento de stack**: front e orquestração em React + Node + TypeScript, espelhando a stack alvo; Python só na IA e C# só em documentos, cada linguagem onde é mais forte. Ver ADR 0002.
- **RNF3 IA gratuita e saída estruturada**: geração usa modelo gratuito (Groq, com Ollama local como fallback por env), sempre validando a saída contra um schema Pydantic, com retry e fallback quando o modelo foge do formato. Ver ADR 0003.
- **RNF4 Persistência poliglota**: PostgreSQL para dado relacional consistente e MongoDB para conteúdo não estruturado. Ver ADR 0004.
- **RNF5 Score explicável**: o score ATS é uma métrica reproduzível de match de keywords, densidade e presença de seções, nunca um número opaco vindo do modelo. Ver ADR 0005.
- **RNF6 RAG local e gratuito**: embeddings gerados localmente com `sentence-transformers` e armazenados em Chroma, sem custo de API. Ver ADR 0006.
- **RNF7 Documentos fiéis**: `.docx` e `.pdf` gerados em .NET a partir do mesmo Markdown, com layout de página única quando couber. Ver ADR 0007.
- **RNF8 Resiliência**: chamadas entre serviços têm timeout, retry com backoff e degradação graciosa; se o `doc-service` cair, o usuário ainda vê o Markdown e o score.
- **RNF9 Observabilidade**: logging estruturado e `jobId` propagado ponta a ponta no fluxo de geração.
- **RNF10 PWA**: o `web` instala como PWA e serve o shell offline, espelhando o padrão de produto de plataformas acessadas por celular.

## 10. Estrutura do monorepo
```
prdal-careers/
├─ apps/
│  ├─ web/            # React + TS + Vite (PWA)
│  ├─ api/            # NestJS + TS (orquestrador/BFF, Postgres + Mongo)
│  ├─ ai-service/     # Python + FastAPI (keywords, geração, score, RAG)
│  └─ doc-service/    # .NET 8 (render docx + pdf)
├─ packages/
│  └─ shared-types/   # DTOs e contratos TypeScript compartilhados
├─ infra/
│  ├─ terraform/      # stub AWS (ECS + RDS + DocumentDB)
│  └─ docker-compose.yml
├─ .github/workflows/ # CI: lint, testes, build
├─ docs/
│  ├─ specs/          # specs versionadas (esta)
│  └─ adr/            # decisões de arquitetura
├─ .gitignore  .editorconfig  .env.example
└─ README.md
```

## 11. Critérios de aceitação
- **CA1** `docker-compose up` sobe web, api, ai-service, doc-service, PostgreSQL e MongoDB, todos com `/health` verde.
- **CA2** Cadastrar uma vaga colando a descrição gera e persiste a lista de keywords.
- **CA3** Disparar `gerar-cv` produz um Markdown tailored, um score ATS com breakdown e os arquivos `.docx` e `.pdf` baixáveis.
- **CA4** O score é reproduzível: a mesma dupla currículo/vaga sempre dá o mesmo número, e o breakdown explica de onde ele vem.
- **CA5** Se o `doc-service` estiver fora, a geração ainda devolve Markdown e score, e a UI sinaliza que o download está indisponível.
- **CA6** O Kanban de candidaturas persiste mudanças de status e sobrevive a reload.
- **CA7** Ingerir um vault de exemplo do Obsidian faz o conteúdo aparecer como contexto recuperado em `POST /context/query`.
- **CA8** README explica arquitetura, como rodar e as decisões, linkando as ADRs.

## 12. Ordem de execução (fases)
1. **Fase 0 — Scaffold**: monorepo, `docker-compose` subindo os 4 serviços + Postgres + Mongo, `/health` em cada um, `shared-types`, hello-world atravessando `web → api → ai-service → doc-service`, `.gitignore`/`.editorconfig`/`.env.example`, `git init`.
2. **Fase 1 — Núcleo (a demo)**: perfil-mestre, CRUD de vagas com extração de keywords, fluxo estrela `gerar-cv` completo (geração via Groq, score, docx/pdf), tela de geração no `web`. Tag `v1.0.0`.
3. **Fase 2 — Análise ATS**: dashboard de score, breakdown visual, comparativo entre versões de currículo. (`spec-v1.1.0`)
4. **Fase 3 — Banco de vagas e candidaturas**: importação em massa para o Mongo, promoção a `vaga`, Kanban de candidaturas. (`spec-v1.2.0`)
5. **Fase 4 — Obsidian e RAG**: ingestão do vault, embeddings locais, uso do contexto na geração. (`spec-v1.3.0`)
6. **Fase 5 — Polimento e entrega**: PWA completo, testes (Vitest/Playwright/pytest/xUnit), CI no GitHub Actions, Terraform stub, README com diagrama.

## 13. Suposições (documentar no README)
1. Provedor de IA padrão: **Groq free tier**, compatível com a API OpenAI; alternável para **Ollama local** por variável de ambiente.
2. Embeddings: **locais e gratuitos** via `sentence-transformers`, armazenados em Chroma.
3. Persistência: **PostgreSQL** para relacional e **MongoDB** para documentos; ambos de propriedade da `api`.
4. Geração de documentos: **.NET** com QuestPDF (PDF) e OpenXML (docx).
5. Escopo single-tenant por usuário autenticado na v1; multi-tenant é evolução futura.

## 14. Fora de escopo (v1)
Login social/OAuth, cobrança, envio automático de candidaturas em portais externos, colaboração multiusuário, e o **microsserviço C# adicional além do `doc-service`** (por exemplo um serviço de analytics de candidaturas), que é candidato natural a uma versão futura. As fases 2 a 5 acima entram em specs `v1.1.0` em diante.

---

## Changelog
- **1.0.0 (2026-09-12)** — Primeira spec. Define o domínio de gestão de candidaturas e geração de currículo ATS, a arquitetura de microsserviços poliglota (React/Node/TS + Python IA + C# documentos), persistência poliglota (PostgreSQL + MongoDB + Chroma), contratos dos quatro serviços, fluxo estrela de geração de currículo, modelo de dados, critérios de aceitação e plano em fases.
