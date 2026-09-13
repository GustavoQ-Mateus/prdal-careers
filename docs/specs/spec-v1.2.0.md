# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.2.0 |
| **Status** | Draft |
| **Data** | 2026-09-13 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Gestão de candidaturas e geração de currículo otimizado para ATS |
| **Base** | Estende `spec-v1.0.0.md` e `spec-v1.1.0.md`; muda apenas o que esta seção descreve |

> MINOR compatível. Adiciona o banco de vagas com importação em massa, o primeiro processamento em lote, a classificação determinística de vagas e o Kanban de candidaturas. Não redefine arquitetura. CA1 a CA13 continuam válidos; adiciona CA14 a CA19.

---

## 1. Resumo da fase
Escopo do produto, para não haver ambiguidade: o PRDAL Careers é uma ferramenta **do candidato**, um profissional de tecnologia que organiza as vagas que ele mesmo encontrou, gera currículos para elas e acompanha suas candidaturas. Não é uma plataforma para empresas anunciarem vagas. Não existe publicação nem promoção de vaga; o "banco de vagas" é a coleção pessoal do usuário, montada por importação das postagens que ele achou em outros sites.

A Fase 3 concretiza duas entidades já previstas no modelo de dados da v1.0.0 e ainda não implementadas: o **banco de vagas** cru no MongoDB e as **candidaturas** no PostgreSQL. Introduz também o **primeiro processamento em lote** (ADR 0009), na variante in-process dentro da `api`, e um **classificador determinístico** que setoriza cada vaga (backend, frontend, fullstack, ia, dados, entre outros) e infere o nível (estágio a sênior). A classificação é capturada agora para habilitar, em fase futura, um mapa de vagas em grafo.

Sem serviço novo. A `api` ganha o worker de lote in-process; o `ai-service` ganha a rota de classificação; o `web` ganha as telas de importação, triagem, progresso de lote e Kanban.

## 2. Fluxos da fase

### 2.1 Importação em massa e lote
1. `web` envia ao `POST /banco-vagas/import` uma lista de postagens cruas, cada uma com `titulo`, `empresa`, `fonte` (link da publicação) e `descricao`.
2. `api` grava cada postagem no MongoDB (`banco_vagas`, status `CRUA`) e cria um **lote** com um item por postagem, status `PENDENTE`.
3. O **worker in-process** da `api` consome os itens pendentes com **concorrência limitada** (respeitando o rate limit do provedor de IA), e para cada um chama o `ai-service`: `POST /keywords` e `POST /classify`. Grava `keywords`, `categoria` e `nivel` na postagem e marca o item `CONCLUIDO`. Falha após retry vira `ERRO`.
4. `web` acompanha o progresso via `GET /lotes/{id}`, item por item, sem bloquear.

### 2.2 Triagem e ativação
1. `web` lista o banco de vagas em `GET /banco-vagas`, mostrando `titulo`, `empresa`, `categoria`, `nivel` e keywords.
2. O usuário ativa as que quer trabalhar via `POST /banco-vagas/{id}/ativar`, que cria uma `vaga` relacional carregando `titulo`, `empresa`, `fonte`, `descricao`, `keywords`, `categoria` e `nivel`, e marca a postagem `ATIVADA`. A vaga segue para o fluxo estrela da v1.0.0.

### 2.3 Candidaturas (Kanban)
1. O usuário cria uma candidatura a partir de uma vaga em `POST /candidaturas`, opcionalmente ligada a um currículo gerado.
2. `web` mostra o Kanban em `GET /candidaturas`, agrupado por status.
3. Mudança de coluna ou de notas persiste via `PATCH /candidaturas/{id}`.

## 6. Modelo de dados (adições)

### PostgreSQL
- **`vagas`**: adicionar `categoria (text, nullable)` e `nivel (text, nullable)`. Migração aditiva.
- **`candidaturas`** (já definida na v1.0.0, agora implementada): `id (uuid, PK)`, `vaga_id (FK)`, `curriculo_id (FK, nullable)`, `status (RASCUNHO|INSCRITA|EM_PROCESSO|ENTREVISTA|OFERTA|REJEITADA|DESISTIU)`, `notas (text)`, `atualizado_em`.
- **`lotes`**: `id (uuid, PK)`, `usuario_id (FK)`, `tipo (text, ex. IMPORTACAO)`, `status (PENDENTE|PROCESSANDO|CONCLUIDO)`, `total (int)`, `processados (int)`, `criado_em`.
- **`lote_itens`**: `id (uuid, PK)`, `lote_id (FK)`, `banco_vaga_id (text, ref do documento no Mongo)`, `status (PENDENTE|PROCESSANDO|CONCLUIDO|ERRO)`, `tentativas (int)`, `erro (text, nullable)`.

### MongoDB
- **`banco_vagas`**: `_id`, `usuarioId`, `titulo`, `empresa`, `fonte`, `descricao`, `status (CRUA|ATIVADA)`, `categoria (nullable)`, `nivel (nullable)`, `keywords (nullable)`, `criadoEm`. Coleção pessoal do usuário, importada em massa, insumo da triagem. Dono: `api` (ADR 0004).

## 7. Contratos de API (adições)

### api (NestJS), consumida pelo web
- `POST /banco-vagas/import`: req `{ itens: [{ titulo, empresa, fonte, descricao }] }`, resp `{ loteId, total }`.
- `GET /banco-vagas`: resp `[{ id, titulo, empresa, fonte, categoria, nivel, keywords, status, criadoEm }]`.
- `POST /banco-vagas/{id}/ativar`: resp a `vaga` criada (shape de `GET /vagas/{id}` da v1.0.0, acrescido de `categoria` e `nivel`).
- `GET /lotes/{id}`: resp `{ id, tipo, status, total, processados, itens: [{ id, bancoVagaId, status, erro }] }`.
- `POST /candidaturas`: req `{ vagaId, curriculoId? }`, resp a candidatura criada.
- `GET /candidaturas`: resp `[{ id, vagaId, tituloVaga, empresa, curriculoId, status, notas, atualizadoEm }]`, para o Kanban.
- `PATCH /candidaturas/{id}`: req `{ status?, notas?, curriculoId? }`, resp a candidatura atualizada.

`GET /vagas` e `GET /vagas/{id}` passam a incluir `categoria` e `nivel` (aditivo e compatível).

### ai-service (FastAPI), consumida pela api
- `POST /classify`: req `{ titulo, descricao }`, resp `{ categoria, nivel }`. Determinístico, sem LLM, por regras de vocabulário sobre título e descrição. Reproduzível. Base: ADR 0011.

Nenhum contrato do `doc-service` muda. O `POST /keywords` da v1.0.0 permanece.

## 8. Requisitos funcionais (adições)
- **RF12** O usuário importa em massa postagens de vaga, cada uma com título, empresa, link e descrição.
- **RF13** O sistema processa a importação em lote, extraindo keywords e classificando categoria e nível de cada postagem, com progresso acompanhável sem bloquear a interface.
- **RF14** O usuário faz a triagem do banco de vagas e ativa as que quer trabalhar como `vaga`, carregando keywords e classificação.
- **RF15** O usuário acompanha suas candidaturas num Kanban por status e edita status e notas de cada uma.

## 9. Requisitos não funcionais
Herdados das versões anteriores. Reforço relevante:
- **RNF12 Lote resiliente e idempotente**: o worker in-process processa cada item uma vez, com concorrência limitada para respeitar o rate limit do provedor de IA; item já concluído não reprocessa; falha após retry marca `ERRO` sem travar o lote. Mapeamento AWS (SQS, worker separado, dead-letter queue) fica para a Fase 5. Base: ADR 0009.
- **RNF13 Classificação determinística**: `categoria` e `nivel` vêm de regras reproduzíveis, nunca de número opaco do modelo, no mesmo espírito do score (ADR 0005). Base: ADR 0011.
- **RNF11 Design não genérico**: as telas desta fase seguem o `docs/design-system.md` e a regra de front-end do `CLAUDE.md`, com a mesma linguagem das telas existentes. A direção visual já está aprovada e implementada em SCSS (ADR 0010).

## 10. Estrutura do monorepo
Inalterada. A `api` adiciona os módulos de banco de vagas, candidaturas e lote (worker in-process); o `ai-service` adiciona a rota de classificação; o `web` adiciona as telas. Sem serviço nem pacote novo.

## 11. Critérios de aceitação (adições)
- **CA14** `POST /banco-vagas/import` grava as postagens no Mongo e cria um lote com um item por postagem.
- **CA15** O lote processa os itens com concorrência limitada e de forma idempotente; `GET /lotes/{id}` reflete o progresso e o estado final de cada item, e reprocessar um lote concluído não duplica trabalho.
- **CA16** A classificação é determinística: a mesma dupla título/descrição sempre resulta na mesma `categoria` e no mesmo `nivel`.
- **CA17** Ativar uma postagem cria uma `vaga` com `keywords`, `categoria` e `nivel` preenchidos, e marca a postagem como `ATIVADA`.
- **CA18** O Kanban de candidaturas persiste mudança de status e de notas e sobrevive a reload (realiza o CA6 da v1.0.0).
- **CA19** As telas da fase seguem o design system, sem AI slop, coerentes com dashboard, breakdown e comparativo.

## 12. Ordem de execução da Fase 3
1. `ai-service`: `POST /classify` determinístico com a taxonomia de categoria e nível.
2. `api`: migração aditiva (`categoria`, `nivel` em `vagas`; tabelas `candidaturas`, `lotes`, `lote_itens`); módulos de banco de vagas, lote (worker in-process) e candidaturas; os contratos da seção 7.
3. `web`: tela de importação em massa, lista/triagem do banco de vagas com progresso do lote, ativação, e Kanban de candidaturas, tudo no design system.
4. Validar CA14 a CA19 e atualizar o README.

## 13. Suposições
1. O worker de lote é in-process na `api` nesta fase; a externalização para fila e worker próprio na AWS é escopo da Fase 5 (ADR 0009).
2. A taxonomia de `categoria` e `nivel` é fixa e determinística nesta fase; refino da taxonomia é evolução compatível.
3. O batch desta fase cobre apenas importação e classificação/keywords; geração de currículos em lote e rescore em massa são fases seguintes.

## 14. Escopo futuro registrado
- **Mapa de vagas em grafo**: visualização das vagas por `categoria` e `nivel`, estilo roadmap ou grafo, aproveitando a classificação capturada nesta fase. Vira spec própria quando entrar, provavelmente após a Fase 4.
- **Ideia do autor para o import via JSON**: há uma ideia a detalhar sobre o formato e o uso do JSON de importação. Registrada aqui como marcador; será especificada com o autor antes de virar escopo.

---

## Changelog
- **1.2.0 (2026-09-13)**: Fase 3, Banco de vagas e candidaturas. Adiciona importação em massa no Mongo, primeiro lote in-process (ADR 0009), classificação determinística de vagas (ADR 0011 a escrever), ativação de vaga e Kanban de candidaturas. Campos `categoria` e `nivel` em `vagas`; tabelas `candidaturas`, `lotes`, `lote_itens`; rota `POST /classify` no ai-service. Escopo do candidato, sem publicação nem promoção de vagas. Critérios CA14 a CA19.
- **1.1.0 (2026-09-13)**: Fase 2, Análise ATS. Ver `spec-v1.1.0.md`.
- **1.0.0 (2026-09-12)**: Primeira spec. Ver `spec-v1.0.0.md`.
