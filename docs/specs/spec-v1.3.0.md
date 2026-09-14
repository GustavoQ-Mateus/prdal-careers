# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.3.0 |
| **Status** | Draft |
| **Data** | 2026-09-13 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Gestão de candidaturas e geração de currículo otimizado para ATS |
| **Base** | Estende `spec-v1.0.0.md`, `spec-v1.1.0.md` e `spec-v1.2.0.md`; muda apenas o que esta seção descreve |

> MINOR compatível. Adiciona o RAG que aterra a geração de currículo no histórico real do candidato, com corpus derivado automaticamente dos dados do app e upload opcional de notas. CA1 a CA19 continuam válidos; adiciona CA20 a CA24.

---

## 1. Resumo da fase
A geração de currículo hoje usa só o perfil-mestre resumido e envia `contexto` vazio ao `ai-service`. A Fase 4 liga o **RAG**: indexa o histórico do candidato como embeddings locais e, na geração, recupera os trechos mais relevantes para a vaga e os injeta no prompt. Isso aterra o texto no histórico real e reduz alucinação.

Conforme a ADR 0012 (que amenda a 0006), o corpus é **derivado automaticamente dos dados do app** (perfil-mestre e notas de candidatura), com **upload opcional de notas `.md`**. Embeddings locais e gratuitos com modelo multilíngue, Chroma como container próprio, indexação pelo worker de lote da Fase 3.

## 2. Fluxos da fase

### 2.1 Indexação do conhecimento
1. `web` dispara `POST /contexto/reindexar` ou envia notas `.md` em `POST /contexto/upload`.
2. `api` monta os documentos: do perfil-mestre (resumo, cada experiência, formação, skills) e das notas de candidatura; e, no upload, grava as notas `.md` no Mongo (`notas_obsidian`).
3. `api` cria um lote tipo `INGESTAO` com um item por documento; o worker in-process chama `POST /context/ingest` no `ai-service`, que gera embeddings e grava no Chroma. Reindexar é idempotente por origem.
4. `web` acompanha o progresso via `GET /lotes/{id}`.

### 2.2 Geração aterrada
1. No `POST /vagas/{id}/gerar-cv`, antes de gerar, a `api` chama `POST /context/query` com a vaga.
2. O `ai-service` devolve os chunks mais relevantes; a `api` os passa como `contexto` ao `POST /generate-cv`.
3. Se nada estiver indexado, `contexto` vem vazio e a geração segue normalmente (degradação graciosa).

## 6. Modelo de dados (adições)
- **MongoDB `notas_obsidian`** (já previsto na v1.0.0, agora implementado): `_id`, `usuarioId`, `titulo`, `corpo`, `criadoEm`. Guarda as notas `.md` enviadas opcionalmente. Dono: `api`.
- **Chroma** (dono `ai-service`): coleção de chunks com embeddings e metadados `{ usuarioId, origem, origemId, titulo }`. `origem` distingue `perfil`, `candidatura` e `nota`. Reindexar por origem apaga e regrava os chunks daquela origem, sem duplicar.
- Reusa `lotes` e `lote_itens` da v1.2.0 com `tipo = INGESTAO`.

## 7. Contratos de API (adições)

### api (NestJS), consumida pelo web
- `POST /contexto/reindexar`: reindexa o corpus automático (perfil e candidaturas) do usuário. Resp `{ loteId, total }`.
- `POST /contexto/upload`: envia notas `.md` (multipart) para o corpus. Resp `{ loteId, total }`.
- `GET /contexto/status`: resp `{ documentos, ultimaIndexacao }`, o que está indexado.

### ai-service (FastAPI), consumida pela api
- `POST /context/ingest`: req `{ documentos: [{ usuarioId, origem, origemId, titulo, texto }] }`, resp `{ indexados }`. Gera embeddings e grava no Chroma, idempotente por `(usuarioId, origem, origemId)`.
- `POST /context/query`: req `{ usuarioId, query, k }`, resp `{ chunks: [{ texto, origem, titulo }] }`, os mais relevantes.

O `POST /generate-cv` passa a receber `contexto` de fato preenchido. Nenhum contrato do `doc-service` muda.

## 8. Requisitos funcionais (adições)
- **RF16** O sistema indexa automaticamente o histórico do candidato (perfil-mestre e notas de candidatura) como base de conhecimento.
- **RF17** O usuário pode enviar notas `.md` extras que entram na mesma base.
- **RF18** A geração de currículo usa os trechos mais relevantes da base como contexto, aterrando o texto no histórico real.
- **RF19** O usuário acompanha o progresso da indexação e vê o que está indexado.

## 9. Requisitos não funcionais
Herdados. Reforço relevante:
- **RNF6 RAG local e gratuito**: embeddings com `sentence-transformers` multilíngue em CPU, Chroma local. Sem custo de API. Base: ADR 0006 e 0012.
- **RNF14 Degradação graciosa do RAG**: falha ou ausência de índice não bloqueia a geração; o fluxo estrela segue com `contexto` vazio.
- **RNF11 Design não genérico**: a tela de base de conhecimento segue o `docs/design-system.md`, coerente com as demais.

## 10. Estrutura do monorepo
Inalterada em serviços de código, mais um container de dados: Chroma entra no `docker-compose` com volume próprio. A `api` adiciona o módulo de contexto; o `ai-service` adiciona ingest, query, o modelo de embedding e o cliente Chroma; o `web` adiciona a tela de base de conhecimento.

## 11. Critérios de aceitação (adições)
- **CA20** `POST /contexto/reindexar` cria um lote `INGESTAO` e indexa os documentos do perfil; `GET /lotes/{id}` reflete o progresso até concluir.
- **CA21** Enviar uma nota `.md` a indexa; ela passa a aparecer nos resultados de `POST /context/query` para uma consulta relacionada.
- **CA22** Com base indexada, `gerar-cv` injeta contexto do histórico no prompt; sem base, a geração ainda produz Markdown e score (degradação graciosa).
- **CA23** A reindexação é idempotente por origem: reindexar não duplica chunks da mesma origem.
- **CA24** A tela de base de conhecimento segue o design system, sem AI slop, coerente com as telas existentes.

## 12. Ordem de execução da Fase 4
1. Infra: Chroma no `docker-compose` com volume; variável de conexão no `ai-service`.
2. `ai-service`: carregar o modelo multilíngue; `POST /context/ingest` e `POST /context/query` sobre o Chroma.
3. `api`: módulo de contexto (`reindexar`, `upload`, `status`) usando o lote `INGESTAO`; ligar o `context/query` dentro do `gerar-cv`.
4. `web`: tela de base de conhecimento com reindexar, upload de `.md` e progresso do lote.
5. Validar CA20 a CA24 e atualizar o README.

## 13. Suposições
1. O corpus inicial é o perfil-mestre e as notas de candidatura, mais notas `.md` opcionais. Incluir descrições de vaga no corpus é evolução compatível, avaliada por ruído.
2. A reindexação é sob demanda (ação do usuário); reindexar automaticamente ao salvar o perfil é melhoria compatível.
3. O modelo de embedding é `paraphrase-multilingual-MiniLM-L12-v2`; trocar de modelo é configuração.

## 14. Escopo futuro registrado
- **Grafo de conhecimento estilo Obsidian** na interface, sobre o corpus e a classificação (ADR 0011). Spec própria após esta fase.
- **Mensagens de entrevista e pré-seleção** como entidades de domínio ligadas à candidatura. Specs próprias.

---

## Changelog
- **1.3.0 (2026-09-13)**: Fase 4, Obsidian e RAG. Indexa o histórico do candidato como embeddings locais multilíngues em Chroma (container próprio), corpus automático dos dados do app mais upload opcional de `.md` (ADR 0012, amenda 0006), indexação pelo lote `INGESTAO`, e geração aterrada via `context/query`. Rotas `context/ingest` e `context/query` no ai-service; `contexto/reindexar`, `contexto/upload` e `contexto/status` na api; Mongo `notas_obsidian`. Critérios CA20 a CA24.
- **1.2.0 (2026-09-13)**: Fase 3, Banco de vagas e candidaturas. Ver `spec-v1.2.0.md`.
- **1.1.0 (2026-09-13)**: Fase 2, Análise ATS. Ver `spec-v1.1.0.md`.
- **1.0.0 (2026-09-12)**: Primeira spec. Ver `spec-v1.0.0.md`.
