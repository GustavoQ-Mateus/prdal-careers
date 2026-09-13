# PRDAL Careers, planejamento de IA e de processamento em lote (batch)

Documento de planejamento consolidado. Reúne como a IA é usada no projeto (decidido na sessão de planejamento e nas ADRs 0003, 0005 e 0006) e a estratégia de processamento em lote que passa a ser escopo do produto. Este arquivo é planejamento, não é spec. O que aqui virar decisão fechada precisa descer para uma ADR nova e uma nova versão de spec antes de virar código.

## 1. Como a IA é usada no projeto

Toda a inteligência vive no `ai-service` (Python + FastAPI). A `api` NestJS é a única orquestradora e nunca deixa o `web` falar direto com a IA.

### 1.1 Provedor de modelo, gratuito e plugável
Cliente compatível com a API OpenAI apontando por padrão para **Groq (free tier)**, rápido e sem custo, com **Ollama local** como fallback selecionável pela variável `AI_PROVIDER`. Trocar de provedor é mudança de configuração, não de código. Ollama garante demo ao vivo sem depender de rede. Base: ADR 0003.

### 1.2 Onde a IA gera texto
O LLM é responsável por gerar conteúdo em linguagem natural:
- **Extração de keywords** da descrição da vaga, rota `POST /keywords`.
- **Geração do currículo em Markdown**, tailored para a vaga, usando o perfil-mestre do usuário mais o contexto recuperado do Obsidian, rota `POST /generate-cv`.

### 1.3 Saída sempre validada
Toda saída do modelo é validada contra **schema Pydantic**. Saída fora do formato vira erro tratável, não falha silenciosa: aplica-se retry com prompt de correção e, esgotado o retry, cai num **fallback determinístico** que monta o currículo a partir do perfil-mestre sem o LLM. O produto entrega algo útil mesmo com o modelo indisponível. Base: ADR 0003.

### 1.4 O que a IA NÃO faz: score ATS
O score ATS é **determinístico**, calculado no `ai-service` sem LLM, rota `POST /score`. Combina três componentes contra as keywords da vaga: keyword match ponderado, densidade com teto por termo para evitar keyword stuffing, e presença das seções que um ATS espera. Resultado de 0 a 100 com `breakdown` acionável mostrando o que faltou. Determinístico significa reproduzível: mesma dupla currículo e vaga sempre dá o mesmo número. Base: ADR 0005.

Regra de divisão de trabalho: o LLM gera texto, o algoritmo mede. Cada um faz o que é bom.

### 1.5 RAG do Obsidian com embeddings locais
O diferencial é usar o histórico profissional em notas Markdown do Obsidian como base de conhecimento. Ingestão dos `.md` do vault, chunking, **embeddings locais e gratuitos com sentence-transformers** rodando em CPU, armazenados em **Chroma** local persistido em volume Docker. Na geração, a `api` pede os chunks mais relevantes para a vaga via `POST /context/query`, que entram no prompt como contexto. Isso aterra a geração no histórico real e reduz alucinação, reforçando a regra de ouro de só usar verdade. Base: ADR 0006.

## 2. Estratégia de processamento em lote (batch)

O plano original processa **uma vaga por vez** no fluxo estrela síncrono. Processamento em lote é **escopo novo**: não é só mais um repositório, é uma carga de trabalho nova com um serviço worker próprio. Precisa de ADR nova e de spec própria antes de virar código.

### 2.1 O que faz sentido rodar em lote
O gargalo do produto é chamada de LLM e de embedding, que são lentas e custam tempo. São exatamente as cargas que ganham com lote e assincronia:

1. **Ingestão do vault Obsidian em massa**: primeira carga do vault gera embeddings de centenas de notas de uma vez. Naturalmente batch.
2. **Importação de vagas em massa**: colar ou importar muitas vagas para o Mongo e extrair keywords de todas em lote, sem travar a UI. Encaixa na Fase 3.
3. **Geração de currículos em lote**: gerar versões tailored para várias vagas de uma tacada, com score de cada uma, para depois o usuário revisar no Kanban.
4. **Rescore em massa**: quando o perfil-mestre muda, recalcular o score de todos os currículos já gerados contra suas vagas.

### 2.2 Como a IA entra no batch
O worker de batch reusa as mesmas rotas e a mesma lógica do `ai-service`, só que disparadas de forma assíncrona e paralela em vez de sob requisição HTTP síncrona. Cada item do lote passa pela mesma validação Pydantic, mesmo retry e mesmo fallback determinístico. O score continua determinístico. Nada de lógica de IA duplicada: o batch é uma nova forma de acionar o que já existe.

Fluxo do worker:
1. `api` recebe o pedido de lote e enfileira os itens.
2. Worker consome a fila, processa cada item chamando o `ai-service`, com concorrência limitada para respeitar o rate limit do Groq free tier.
3. Cada item conclui de forma idempotente e grava resultado e status.
4. `web` acompanha o progresso do lote, item por item, sem bloquear.

### 2.3 Mapeamento para AWS
Este é o ponto que casa com a vontade de repositórios separados e com a experiência real de AWS Batch, SQS e filas:

- **Fila**: SQS recebe os itens do lote.
- **Worker**: AWS Batch para cargas pesadas de CPU, por exemplo embeddings do vault, ou ECS scheduled tasks e Lambda para lotes menores.
- **Concorrência controlada**: limitar workers em paralelo para não estourar o free tier do provedor de IA.
- **Idempotência e retry**: cada mensagem processada uma vez de forma segura, com dead-letter queue para os que falharem.

### 2.4 Repositório separado
O worker de batch é forte candidato a repositório próprio, separado de `front` e `back`, porque tem ciclo de deploy e escala independentes do fluxo síncrono. Isso conversa com a decisão de topologia polyrepo para AWS que será registrada em ADR própria. Custo a assumir nessa ADR: o `packages/shared-types` hoje é compartilhado via monorepo, e o polyrepo obriga a publicar esses contratos como pacote versionado ou aceitar duplicação.

## 3. Onde encaixa no roadmap

O batch não deve entrar agora. A ordem recomendada:

1. **Fase 1, Núcleo**: fechar o fluxo estrela síncrono no monorepo, uma vaga por vez, e taguear v1.0.0. Sem batch, sem polyrepo.
2. **Fase 3, Banco de vagas e candidaturas**: aqui entra o primeiro batch de verdade, importação de vagas em massa para o Mongo e extração de keywords em lote. Vira ADR nova mais spec própria.
3. **Fase 4, Obsidian e RAG**: ingestão do vault em massa, que é a segunda carga natural de batch.
4. **Fase 5, Polimento e entrega**: migração para polyrepo, worker de batch em repositório próprio, SQS, AWS Batch, Terraform e CI por repositório.

## 4. Ângulo para o vídeo

O batch é ótimo material de portfólio porque mostra maturidade de arquitetura, não só CRUD:
- Fluxo síncrono contra fluxo assíncrono, e quando escolher cada um.
- Fila, worker, concorrência limitada, idempotência e dead-letter queue.
- IA em produção rodando em lote, com validação de saída, retry e fallback determinístico, sem duplicar lógica.
- Processamento pesado em AWS Batch e SQS, exatamente a linguagem que as vagas de backend e IA usam.
- Contraste elegante: a demo síncrona convence, o batch prova que a arquitetura escala.

## 5. Decisões que ainda precisam virar ADR e spec

- **ADR de topologia de repositórios**: polyrepo front, back e batch para AWS, com o custo do shared-types e do CI multi-pipeline registrado.
- **ADR de processamento em lote**: fila, worker, idempotência, concorrência e mapeamento AWS.
- **Spec da Fase 3** incorporando o primeiro batch, e **spec da Fase 5** incorporando polyrepo e o worker em repositório próprio.

Nada disso entra em código antes de estar escrito como ADR mais spec aprovada.
