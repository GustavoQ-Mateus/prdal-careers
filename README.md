# PRDAL Careers

**PRDAL** é a sigla de **Programming, Research, Development, Automation & Logic**.

Plataforma web de gestão de candidaturas e geração de currículo otimizado para ATS. A partir de um **perfil-mestre** único, gera currículos **tailored por vaga**, mede um **score ATS** explicável e acompanha as candidaturas num quadro de status. Usa o histórico profissional mantido em notas Markdown do **Obsidian** como base de conhecimento para a geração por IA.

Projeto **spec-driven**: a fonte da verdade é a spec versionada em `docs/specs/`, com as decisões de arquitetura registradas em `docs/adr/`.

## Arquitetura

Microsserviços poliglota com orquestração única na `api`:

```
                    [ web: React + TS + Vite (PWA) ]
                                   │  REST/JSON
                    [ api: NestJS + TypeScript (BFF) ]
                   /               │                 \
   [ ai-service: Python ]   [ doc-service: C# ]   [ PostgreSQL + pgvector ]
    keywords, geração,        docx + pdf
    score, RAG Obsidian
           │
   [ Groq free / Ollama ]  +  [ embeddings e5-small ]
```

| Serviço | Stack | Responsabilidade |
|---|---|---|
| `apps/web` | React 18 + TS + Vite, PWA | Interface: vagas, perfil, geração, score, Kanban |
| `apps/api` | NestJS + TypeScript | Orquestração, auth, regras, dono do PostgreSQL (dados, conversas e vetores) |
| `apps/ai-service` | Python + FastAPI | Keywords, geração de CV, score ATS, RAG do Obsidian |
| `apps/doc-service` | C# / .NET 8 | Render `.docx` e `.pdf` |
| `apps/worker` | Node + TypeScript | Consome a fila de jobs e executa o trabalho assíncrono |

## Stack

React · TypeScript · Vite · NestJS · Python · FastAPI · .NET 8 · PostgreSQL · pgvector · Docker · GitHub Actions · Terraform (stub AWS). IA via Claude Sonnet na API da Anthropic; embeddings locais com `sentence-transformers`.

## Como rodar

> Pré-requisitos: Docker e Docker Compose. Para desenvolvimento local dos serviços: Node 20+, Python 3.12, .NET 8 SDK.

```bash
cp .env.example .env      # configure ANTHROPIC_API_KEY e AI_MODEL
docker compose -f infra/docker-compose.yml up
```

Sobe `web`, `api`, `worker`, `ai-service`, `doc-service`, ElasticMQ, SeaweedFS (S3 local) e PostgreSQL com pgvector. Cada serviço expõe `/health`.

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
docker compose -f infra/docker-compose.yml exec -T postgres pg_dump -U prdal -Fc prdal_careers > prdal-antes-pgvector.dump
docker compose -f infra/docker-compose.yml build postgres
docker compose -f infra/docker-compose.yml up -d postgres
docker compose -f infra/docker-compose.yml run --rm migracao
```

Na AWS o RDS PostgreSQL já traz o pgvector; a mesma migração cria a extensão.

### Jobs assíncronos

A api nunca executa trabalho longo dentro da requisição nem relança nada no boot. Ela grava uma linha em `jobs` (tipo, status, tentativas, `locked_until`, erro, resultado, usuário, referência ao objeto e o `requestId` do pedido) na mesma transação do pedido e, depois do commit, envia para a fila uma mensagem só com `{ jobId, tipo }`. A linha é a fonte da verdade; a mensagem é só o aviso.

O `worker` (`apps/worker`, aplicação própria com `package.json`, `Dockerfile` e testes) consome a fila. Ele pega o job com um lease no PostgreSQL (`UPDATE ... WHERE id = $1 AND (status = 'PENDENTE' OR locked_until < now()) RETURNING`); sem lease, descarta a mensagem, o que garante que duas réplicas nunca processam o mesmo job. Enquanto trabalha, renova o lease e a visibilidade da mensagem. Cada falha conta uma tentativa e volta para a fila com espera crescente; na terceira o job fica em `ERRO` com a mensagem e a fila move a mensagem para a fila de mensagens mortas (`maxReceiveCount = 3`). Se o envio para a fila falhar, o job fica `PENDENTE` e a varredura periódica do worker reenfileira os pendentes antigos sem lease. No SIGTERM o worker para de receber, espera o job em curso até `DESLIGAMENTO_PRAZO_MS` e, se não der tempo, devolve o lease sem gastar tentativa para outra réplica retomar.

A contagem de recebimentos da fila pode andar à frente das tentativas do job: um long poll abortado no desligamento ainda recebe a próxima mensagem do lado do servidor, e o SQS entrega cópias de vez em quando. Por isso a mensagem é recebida com visibilidade curta (`WORKER_VISIBILIDADE_INICIAL_S`, 15 s), estendida para o lease logo que o job é pego; quando uma falha não terminal acontece com a mensagem já perto do `maxReceiveCount`, o worker troca a mensagem por uma nova em vez de deixá-la ir para a fila de mortas; e uma cópia de job já em `ERRO` volta para a fila para o SQS movê-la para a fila de mortas, enquanto cópia de job concluído é apagada. Só vai para a fila de mortas o job que esgotou as próprias tentativas.

Tipos de job que o worker executa:

| Tipo | Disparo | Referência | O que faz |
|---|---|---|---|
| `gerar_curriculo` | gerar currículo pela tela ou pelo copiloto | geração | pipeline inteiro: contexto do RAG, reescrita, render, corte de página, PDF, DOCX e ZIP no S3, pipeline ATS e narração na conversa |
| `extrair_keywords` | criar ou editar a descrição de uma oportunidade, ativar entrada sem keywords | oportunidade | extrai as keywords com o Claude; a oportunidade mostra `keywordsExtracao` (`PENDENTE`, `EXTRAINDO`, `PRONTAS`, `ERRO`) e `keywordsErro` |
| `importar_lote` | importação do banco de vagas | item do lote | keywords e classificação de uma postagem; cada item falha sozinho |
| `reindexar_contexto` | reindexar contexto ou subir notas | item do lote | gera os vetores de um documento do RAG |
| `empacotar_curriculo` | editar o currículo ou gerar os arquivos de novo | currículo | monta o ZIP de novo a partir do S3 |

A geração guarda no job o perfil e a vaga já normalizados no momento do pedido; o worker não relê o perfil. Uma geração em andamento da mesma vaga é reaproveitada; uma concluída ou com erro nunca bloqueia outra. `Lote` continua como agrupador para a interface, que acompanha o status de cada item. O `POST /oportunidades/reprocessar-keywords` ainda roda dentro da requisição.

Na AWS a fila é o SQS; no compose é o ElasticMQ (`infra/elasticmq/elasticmq.conf`), com o mesmo adaptador e `SQS_ENDPOINT` apontando para ele. O worker gera o cliente Prisma a partir do schema da api (caminho em `config.schemaPrisma` no `package.json` dele) e nunca roda migração. O `/ready` do worker exige PostgreSQL e fila; o da api mostra a fila como dependência não obrigatória.

```bash
cd apps/worker && npm ci && npm test   # PRDAL_TESTE_POSTGRES_URL opcional, banco ja migrado pela api
```

### Arquivos no S3

PDF, DOCX e o pacote ZIP de cada currículo ficam no S3 por chave (`usuarios/<usuario>/curriculos/<curriculo>.pdf|docx|zip`); o banco guarda só a chave. O download é uma URL pré-assinada que vale no máximo 5 minutos (`S3_URL_VALIDADE_S`, teto de 300): a api responde `{ url, expiraEm }` e o navegador baixa direto do S3. A api não lê nem comprime arquivo; o ZIP é gravado pelo worker.

No compose o S3 é o SeaweedFS (`chrislusf/seaweedfs`, comando `mini`), que cria o bucket na subida e usa como credencial o par `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`. A imagem do MinIO deixou de ser publicada no Docker Hub e no quay.io. Como a URL assinada leva o host no cálculo da assinatura, há dois endereços: `S3_ENDPOINT` (`http://s3:8333`, usado por dentro da rede) e `S3_ENDPOINT_PUBLICO` (`http://localhost:8333`, que entra na URL e precisa ser alcançável pelo navegador). Na AWS os dois ficam vazios.

#### Migração dos arquivos locais

Os arquivos gerados antes desta versão estão no volume `apistorage`. O job `apps/jobs/migrar-arquivos-s3` (aplicação própria, roda como AWS Batch na nuvem) lê o volume montado só para leitura, envia cada arquivo para a chave nova, atualiza a referência no banco e monta o ZIP que faltar. Ele é idempotente: o que já está no S3 não é reenviado. O relatório traz as contagens antes e depois, o que foi enviado, o que não migrou e por quê, e os arquivos do volume que nenhum currículo referencia. Nada é apagado do volume.

```bash
docker compose -f infra/docker-compose.yml up -d --build migracao s3
docker compose -f infra/docker-compose.yml --profile migracao-arquivos run --rm --build migrar-arquivos-s3 node dist/main.js --simular
docker compose -f infra/docker-compose.yml --profile migracao-arquivos run --rm migrar-arquivos-s3 > migracao-arquivos.json
docker compose -f infra/docker-compose.yml up -d --build --remove-orphans
```

Confira no `migracao-arquivos.json` que `depois.docxLocal` e `depois.pdfLocal` estão em zero, que `depois.semPacote` está em zero e que `naoMigrados` está vazio ou explicado. O job sai com código 2 quando sobra algo em `naoMigrados`. O volume `apistorage` pode ser apagado depois dessa conferência.

### Busca no histórico (RAG)

A api é dona dos documentos e dos vetores: `documentos_rag` guarda o texto e `chunks_rag` guarda cada pedaço com o vetor numa coluna `vector(384)`. O ai-service não guarda nada; ele só divide o documento em pedaços e calcula o embedding (`POST /embeddings/documentos` e `POST /embeddings/consultas`). A recuperação é uma consulta SQL na api por distância de cosseno, sempre filtrada pelo usuário e pelo modelo que gerou o vetor.

O modelo é o `intfloat/multilingual-e5-small` (384 dimensões, janela de 512 tokens, cerca de 470 MB). Ele usa os prefixos `query: ` na consulta e `passage: ` no documento, e a consulta vai no molde `experiência com <keyword>`. A similaridade só busca e ordena: a api traz os 5 pedaços mais próximos de cada keyword e manda os candidatos ao ai-service (`POST /rag/filtrar`), que deixa passar só o pedaço que casa a keyword pela mesma função de casamento de termos do score, com os sinônimos canônicos. Não há limiar de similaridade: no conjunto de avaliação de RAG (83 consultas, quatro áreas) nenhum limiar separava as notas pessoais das notas que tratam da keyword com folga, e o portão por termo dá recall@5 de 0,6132 com zero texto sem relação no contexto. A troca é consciente: uma nota que trata do assunto sem citar a keyword nem um sinônimo fica de fora. Se o ai-service não responder ao filtro, a recuperação volta vazia e a geração avisa; ela nunca usa pedaços sem filtro.

A dimensão do vetor é fixa na migração. O ai-service e a api leem `EMBED_DIMENSAO` (384) no boot: o ai-service não sobe se o modelo gerar outra dimensão, e a api não sobe se a coluna tiver outra dimensão. Trocar de modelo exige, nesta ordem: registrar o modelo novo em `rag.py` com os prefixos e medir o conjunto de RAG; se a dimensão mudar, uma migração nova que altera a coluna e o `EMBED_DIMENSAO`; e a reindexação. Enquanto houver vetor de outro modelo, a geração avisa que parte do histórico ficou de fora.

```bash
cd apps/api
DATABASE_URL=postgresql://... AI_SERVICE_URL=http://localhost:8000 SERVICE_TOKEN=... npm run rag:reindexar
```

Sem argumento, reindexa só o documento sem vetor do modelo atual ou com vetor de outro modelo; com `-- --todos`, reindexa tudo. O resultado lista quantos documentos e pedaços foram gravados e o que falhou.

### Migração dos dados do MongoDB

Conversas do copiloto, documentos de RAG, notas e banco de vagas saíram do MongoDB para tabelas do PostgreSQL. O script `apps/api/src/scripts/migrar-mongo.ts` lê as quatro coleções, grava nas tabelas mantendo os mesmos ids, liga os itens de lote antigos aos registros migrados e reindexa os documentos com o modelo de embedding atual pelo ai-service (os vetores do Chroma não são aproveitados). Ele é idempotente: o que já está no PostgreSQL é contado como existente e não é gravado de novo. O relatório traz a contagem por coleção antes e por tabela depois, o que não migrou e por quê, e os avisos (ligação com oportunidade apagada, documento antigo sem tipo).

O MongoDB precisa estar no ar durante a migração. Rode antes de remover o container antigo do Mongo (`docker compose up --remove-orphans` o removeria). Na ordem, a partir da raiz do repositório:

```bash
docker compose -f infra/docker-compose.yml exec -T postgres pg_dump -U prdal -Fc prdal_careers > prdal-antes-c2.dump
docker exec prdal-careers-mongo-1 mongodump --username prdal --password SENHA_DO_MONGO --authenticationDatabase admin --db prdal_careers --archive --gzip > mongo-antes-c2.archive.gz
docker compose -f infra/docker-compose.yml build postgres ai-service api migracao
docker compose -f infra/docker-compose.yml up -d postgres
docker compose -f infra/docker-compose.yml run --rm migracao
docker compose -f infra/docker-compose.yml up -d ai-service
npm ci
cd apps/api
npm run build
DATABASE_URL=postgresql://prdal:SENHA_DO_POSTGRES@127.0.0.1:5432/prdal_careers \
MONGO_URL=mongodb://prdal:SENHA_DO_MONGO@127.0.0.1:27017 \
MONGO_DB=prdal_careers \
AI_SERVICE_URL=http://127.0.0.1:8000 \
SERVICE_TOKEN=O_MESMO_DO_INFRA_ENV \
node dist/scripts/migrar-mongo.js > migracao-mongo.json
```

Confira no `migracao-mongo.json` que `antes.mongo` e `depois.postgres` batem para as quatro coleções, que `naoMigrados` está vazio ou explicado e que `reindexacao.falhas` está vazio. Rodar de novo não duplica nada; com `--sem-reindexar` ele só copia os dados, e a reindexação pode ser feita depois com `npm run rag:reindexar`. Em seguida suba o resto com `docker compose -f infra/docker-compose.yml up -d --remove-orphans`.

Depois da migração conferida, os volumes `prdal-careers_mongodata` e `prdal-careers_chromadata` não são mais usados por nada e podem ser removidos com `docker volume rm`. Nenhum passo deste repositório os apaga.

### Banco de vagas vira oportunidade em entrada

A tabela `banco_vagas` deixou de existir: a vaga importada é uma oportunidade com estágio `ENTRADA`, e ativar muda o estágio da mesma oportunidade. A migração `20261005001100_oportunidade_entrada` faz a mudança de dados na mesma transação: cada vaga `CRUA` vira oportunidade em entrada com o mesmo id, os itens de lote passam a apontar para a oportunidade e a tabela sai. A vaga `ATIVADA` não é copiada, porque a oportunidade dela já existe; a que perdeu a oportunidade fica sem referência no item de lote.

O script `migrar-entradas` aplica as migrações pendentes e mostra as contagens antes e depois. Ele recusa rodar sem `DATABASE_URL` explícito e pode rodar de novo sem efeito. Rode antes de subir o compose, porque o serviço `migracao` também aplicaria a migração, só que sem o relatório. A partir da raiz do repositório:

```bash
docker compose -f infra/docker-compose.yml exec -T postgres pg_dump -U prdal -Fc prdal_careers > prdal-antes-entradas.dump
docker compose -f infra/docker-compose.yml stop api worker
cd apps/api
npm run build
DATABASE_URL=postgresql://prdal:SENHA_DO_POSTGRES@127.0.0.1:5432/prdal_careers node dist/scripts/migrar-entradas.js > migracao-entradas.json
```

Confira no `migracao-entradas.json` que `ok` é `true`, que `entradasEncontradas` é igual a `entradasEsperadas` e que `depois.vagas.entrada` é igual a `antes.bancoVagas.crua`. Em seguida suba o resto com `docker compose -f infra/docker-compose.yml up -d --build`.

