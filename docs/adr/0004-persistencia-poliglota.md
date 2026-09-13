# ADR 0004 — Persistência poliglota: PostgreSQL + MongoDB

- **Status:** Aceita
- **Data:** 2026-09-12
- **Contexto:** A vaga alvo lista tanto PostgreSQL quanto MongoDB. O domínio tem dois tipos de dado: entidades relacionais com integridade forte (usuário, perfil, vaga, currículo, candidatura) e conteúdo não estruturado em volume (postagens de vaga cruas, notas do Obsidian).

## Decisão
Usar **PostgreSQL** para o núcleo relacional e **MongoDB** para conteúdo não estruturado. Ambos são de propriedade exclusiva da `api`; nenhum outro serviço acessa os bancos diretamente.

## Justificativa
- Perfil, vaga, currículo e candidatura têm relações e invariantes que pedem um relacional: chaves estrangeiras, transações, consistência.
- Banco de vagas cru e notas do Obsidian são documentos heterogêneos, sem schema fixo, que se encaixam melhor em Mongo e alimentam a ingestão do RAG.
- Exercitar os dois bancos cobre um item explícito da vaga e demonstra escolha consciente de armazenamento por natureza do dado.

## Consequências
- Dois drivers e duas configurações de conexão no `docker-compose`.
- A `api` é a fronteira transacional; escritas que cruzam os dois bancos são raras e tratadas de forma idempotente.
- Embeddings ficam num terceiro store (Chroma, ADR 0006), separado do dado de origem.
