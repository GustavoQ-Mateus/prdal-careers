# PRDAL Careers, planejamento do projeto

Documento de planejamento que consolida a idealização do projeto feita na sessão inicial, com origem, decisões de stack, arquitetura, uso de IA, roteiro de vídeo e roadmap de fases. Este arquivo é planejamento, não é spec. A fonte da verdade de implementação continua sendo `docs/specs/spec-vX.Y.Z.md` mais as ADRs em `docs/adr/`. O que aqui virar decisão fechada desce para ADR e nova versão de spec antes de virar código.

## 1. Origem e motivação

O projeto nasceu do desafio da entrevista da **Mobiliza**: gravar um vídeo explicando um projeto, com foco nos desafios, problemas e dificuldades enfrentados. A decisão estratégica foi **construir algo novo** em vez de mostrar um projeto antigo, para ter controle total da narrativa e demonstrar iniciativa.

O tema saiu de uma dor real e vivida: gerar currículo ATS, analisar, controlar vagas e candidaturas. Isso aparece no vídeo como domínio de negócio de verdade, não teatro. O produto também reaproveita a lógica da pipeline atual do `geracurriculo`, então o esforço vai para a engenharia, que é o que a vaga quer ver.

Prazo: o desafio formal chega depois da entrevista e as inscrições vão até 28/09, então há folga para construir o produto inteiro com calma, não só uma fatia.

## 2. Decisão de stack, o pivô que fundou o projeto

A ideia inicial era um híbrido C# mais Python. Ao revisar a vaga da Mobiliza, a fundação mudou: a stack deles é **React, Node.js, TypeScript, Docker, PostgreSQL, MongoDB, Git**, com diferenciais em **AWS avançado (RDS, ECS), IaC (Terraform, CloudFormation), microsserviços, CI/CD e testes**. O produto deles é um LMS que roda como **PWA** para funcionário de campo, multi-tenant enterprise. C# não aparece, e Python só se justifica na camada de IA.

Decisão final: construir o produto **na stack exata da Mobiliza** e usar cada linguagem onde ela é imbatível.

- **React + Node + TypeScript** como core, que é o coração da vaga e a força real do candidato.
- **PWA**, que é literalmente o padrão do produto da Mobiliza.
- **Postgres + Mongo + Docker + microsserviços + CI/CD + testes + Terraform**, batendo até nos diferenciais.
- **Python + FastAPI** isolado só na IA, mostrando amplitude sem tirar o foco de Node e TS.
- **C# / .NET** com responsabilidade legítima, não decorativa: o serviço de documentos que renderiza `.docx` e `.pdf`, força nativa do .NET com OpenXML e QuestPDF, casando com a pipeline real de md para docx para pdf.

A fala central do vídeo nasce daí: em vez de forçar tudo numa linguagem, cada serviço faz o que faz melhor e conversam por contrato HTTP. Decisão de arquitetura de gente sênior.

## 3. Arquitetura

```
                    [ React + TS + Vite (PWA) ]
                               |
                    [ API NestJS + TypeScript ]   orquestrador, auth, regras
                    /          |           \
        [ AI Service ]   [ Doc Service ]   [ Postgres + MongoDB ]
         Python/FastAPI    C# / .NET
         keywords, geracao  docx + pdf
         score, RAG Obsidian (OpenXML/QuestPDF)

  Docker Compose, GitHub Actions, Terraform stub AWS, testes (Vitest/Playwright/pytest)
```

Princípio de orquestração: a `api` NestJS é o **único** ponto que compõe chamadas entre serviços. O `web` só conhece a `api` e nunca fala direto com `ai-service` nem `doc-service`. Trocar um serviço interno não vaza para o cliente. Base: ADR 0001.

### Papel de cada serviço

| Serviço | Stack | Responsabilidade |
| --- | --- | --- |
| web | React 18 + TS + Vite, PWA | Kanban de candidaturas, tela de geração, dashboard de score |
| api | NestJS + TS | Auth multi-tenant, CRUD de vagas e candidaturas, orquestração |
| ai-service | Python + FastAPI | Keywords, geração de CV, score ATS, RAG do Obsidian |
| doc-service | C# / .NET | Render de .docx e .pdf |
| dados | PostgreSQL + MongoDB | Relacional para vagas e candidaturas, Mongo para banco de vagas cru e notas |

## 4. Fluxo estrela, a demo

O fluxo que atravessa os quatro serviços e é o coração da Fase 1:

1. `web` pede `POST /vagas/{id}/gerar-cv` à `api`.
2. `api` chama o `ai-service`: extrai keywords da vaga, gera o Markdown do CV usando o perfil-mestre mais o contexto do Obsidian, calcula o score ATS.
3. `api` chama o `doc-service`: transforma o Markdown em `.docx` e `.pdf`.
4. `api` persiste em Postgres e Mongo e devolve preview, downloads e score ao `web`.

Esse fluxo distribuído é o ouro do vídeo: contrato entre serviços, timeout e retry, degradação com elegância quando um cai, idempotência. É exatamente a linguagem que a vaga usa.

## 5. Uso de IA no projeto

Toda a inteligência vive no `ai-service`. Detalhes nas ADRs 0003, 0005 e 0006.

### 5.1 Provedor gratuito e plugável
Cliente compatível com a API OpenAI apontando por padrão para **Groq free tier**, com **Ollama local** como fallback por `AI_PROVIDER`. Ollama garante demo ao vivo sem depender de rede. Trocar de provedor é configuração, não código. Base: ADR 0003.

### 5.2 Onde o LLM gera texto
- **Extração de keywords** da vaga, `POST /keywords`.
- **Geração do currículo em Markdown** tailored, `POST /generate-cv`, usando perfil-mestre mais contexto do Obsidian.

### 5.3 Saída sempre validada
Saída do modelo validada contra **schema Pydantic**. Saída inválida vira erro tratável: retry com prompt de correção e, esgotado o retry, **fallback determinístico** que monta o CV a partir do perfil-mestre sem LLM. O produto entrega algo útil mesmo com o modelo fora. Base: ADR 0003.

### 5.4 Score ATS sem LLM
O score é **determinístico**, `POST /score`, sem modelo: keyword match ponderado, densidade com teto por termo, e presença das seções que um ATS espera. Inteiro de 0 a 100 com `breakdown` acionável. Reproduzível: mesma dupla currículo e vaga dá sempre o mesmo número. Regra: o LLM gera texto, o algoritmo mede. Base: ADR 0005.

### 5.5 RAG do Obsidian com embeddings locais
Ingestão dos `.md` do vault, chunking, **embeddings locais e gratuitos com sentence-transformers** em CPU, armazenados em **Chroma** local persistido em volume. Na geração, a `api` pede os chunks relevantes via `POST /context/query`, que entram no prompt. Aterra a geração no histórico real e reduz alucinação. Base: ADR 0006.

## 6. Os três desafios plantados para o vídeo

O Bruno pediu problemas e dificuldades. Eles nascem de decisões reais de arquitetura:

1. **Comunicação entre serviços**: timeout, retry e o que fazer quando o Python cai. Como a `api` degrada com elegância.
2. **Saída estruturada e confiável da IA**: forçar formato válido, validar com Pydantic, e ter fallback quando o modelo alucina fora do formato.
3. **Medir score ATS sem chutar**: métrica real de keyword match mais densidade, não um número inventado.

Roteiro no framework de sempre: Contexto, o problema vivido, para Ação, a arquitetura poliglota, para Decisões, os três desafios acima, para Impacto, funciona ponta a ponta mais o roadmap de banco de vagas, Obsidian e candidaturas.

## 7. Roadmap de fases

- **Fase 0, Scaffold**: monorepo, docker-compose subindo os 4 serviços mais Postgres e Mongo, health checks, contrato de tipos compartilhado, hello-world ponta a ponta. Concluída e commitada.
- **Fase 1, Núcleo, a demo**: fluxo estrela completo, CRUD de vaga, geração real via Groq, docx e pdf, front mostrando markdown, score e downloads. Fecha em v1.0.0.
- **Fase 2, Análise ATS**: dashboard de score, breakdown visual, comparativo entre versões de currículo.
- **Fase 3, Banco de vagas e candidaturas**: importar vagas em massa no Mongo, promoção a vaga, Kanban de candidaturas. Primeira carga natural de batch.
- **Fase 4, Obsidian e RAG**: ingestão do vault, embeddings locais, uso do contexto na geração. Segunda carga natural de batch.
- **Fase 5, Polimento e entrega**: PWA completo, testes, CI no GitHub Actions, Terraform stub, README com diagrama.

## 8. Escopo futuro a formalizar

Decidido em conversa, ainda **não** implementado, entra algumas fases à frente, cada um vira ADR mais spec própria antes de código:

- **Topologia polyrepo para AWS**: separar `front`, `back` e `batch` em repositórios independentes, por ciclo de deploy e escala distintos. Custo a registrar na ADR: o `packages/shared-types` hoje é compartilhado via monorepo, então polyrepo obriga a publicar os contratos como pacote versionado ou aceitar duplicação, mais CI multi-pipeline. Alvo: Fase 5.
- **Processamento em lote (batch)**: worker assíncrono que reusa as rotas do `ai-service` para cargas lentas e em volume, sem duplicar lógica de IA. Cargas que valem batch: ingestão do vault em massa, importação de vagas em massa com extração de keywords, geração de CVs em lote, rescore em massa quando o perfil-mestre muda. Mapeamento AWS: SQS para a fila, AWS Batch ou ECS ou Lambda para o worker, concorrência limitada para respeitar o rate limit do Groq, idempotência e dead-letter queue. Alvo: introduzir na Fase 3 com a importação em massa, consolidar na Fase 5 junto ao polyrepo. Detalhamento em `docs/planejamento-ia-e-batch.md`.

Regra transversal: nada de batch nem polyrepo entra na Fase 1. O núcleo fecha síncrono e no monorepo, uma vaga por vez, e taguea v1.0.0. Escopo novo só vira código depois de virar ADR mais spec aprovada.
