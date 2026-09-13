# ADR 0009, Processamento em lote com worker assíncrono

- **Status:** Proposta
- **Data:** 2026-09-13
- **Fase-alvo:** introdução na Fase 3, consolidação na Fase 5
- **Contexto:** O fluxo estrela da `spec-v1.0.0` processa **uma vaga por vez** de forma síncrona. As operações caras do produto são chamadas de LLM e de embedding, lentas e sujeitas a rate limit do provedor gratuito. Conforme o produto cresce, surgem cargas que são naturalmente em volume e não podem travar a interface: ingestão do vault Obsidian em massa, importação de muitas vagas de uma vez, geração de currículos em lote e recálculo de score em massa quando o perfil-mestre muda. Processar isso no caminho síncrono degradaria a experiência e estouraria o rate limit. Esta decisão é escopo novo e depende de nova versão de spec antes de virar código.

## Decisão
Introduzir um **worker de processamento em lote** assíncrono que **reusa as rotas e a lógica do `ai-service`**, sem duplicar inteligência. O batch é uma nova forma de acionar o que já existe, disparado de forma assíncrona e paralela em vez de sob requisição HTTP síncrona.

Fluxo:
1. A `api` recebe o pedido de lote e **enfileira** os itens.
2. O worker **consome a fila** e processa cada item chamando o `ai-service`, com **concorrência limitada** para respeitar o rate limit do provedor de IA.
3. Cada item conclui de forma **idempotente**, gravando resultado e status.
4. O `web` acompanha o progresso do lote item por item, sem bloquear.

Cada item do lote passa pela mesma validação Pydantic, mesmo retry e mesmo fallback determinístico da ADR 0003, e o score segue determinístico conforme a ADR 0005.

Cargas que entram como batch:
- Ingestão do vault Obsidian em massa, primeira carga de embeddings, ligada à Fase 4.
- Importação de vagas em massa no Mongo com extração de keywords em lote, ligada à Fase 3.
- Geração de currículos em lote para várias vagas, com score de cada uma.
- Rescore em massa dos currículos já gerados quando o perfil-mestre muda.

Mapeamento AWS na entrega: **SQS** para a fila, **AWS Batch** para cargas pesadas de CPU como embeddings ou **ECS scheduled tasks** e **Lambda** para lotes menores, **dead-letter queue** para itens que falham após retry. O worker é forte candidato a repositório próprio conforme a ADR 0008.

## Justificativa
- LLM e embedding são lentos e limitados por rate; processá-los em lote assíncrono é o padrão correto e evita travar a UI.
- Reusar as rotas do `ai-service` mantém uma única fonte de verdade da lógica de IA, sem duplicação.
- Concorrência limitada respeita o free tier do Groq sem quebrar a regra de custo zero.
- Idempotência e dead-letter queue tornam o lote resiliente a falhas parciais.
- Fila mais worker mais idempotência é material forte de portfólio e de vídeo, mostrando maturidade de arquitetura além de CRUD, na linguagem de AWS que a vaga usa.

## Consequências
- Surge um novo componente de infraestrutura, a fila e o worker, com seu ciclo de deploy e observabilidade próprios.
- O modelo de dados ganha o conceito de lote e de status por item, a ser detalhado na spec da fase.
- É preciso definir política de concorrência, retry e dead-letter, e testá-las no caminho de falha.
- O `web` precisa de uma visão de progresso assíncrono, diferente da resposta síncrona do fluxo estrela.
- Nada de batch entra na Fase 1. O primeiro batch real chega na Fase 3 com a importação em massa e consolida na Fase 5 junto ao polyrepo e ao mapeamento AWS. Escopo novo só vira código depois de virar spec aprovada.
