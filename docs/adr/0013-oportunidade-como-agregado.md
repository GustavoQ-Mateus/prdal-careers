# ADR 0013, Oportunidade como agregado do candidato

- **Status:** Aceita
- **Data:** 2026-09-14
- **Fase-alvo:** Fase 6, ver `spec-v1.5.0`
- **Contexto:** O produto é um organizador pessoal para o candidato desenvolvedor. Hoje uma postagem importada vive em `banco_vagas` no MongoDB e, quando ativada, é copiada para `vagas` no PostgreSQL sem vínculo persistido. A interface expõe essa separação técnica como Banco de vagas e Vagas, embora ambas representem momentos do mesmo ciclo do candidato.

## Decisão

Adotar **Oportunidade** como o conceito central de produto. O único usuário do sistema é o candidato, que registra vagas encontradas fora da plataforma, decide quais acompanhar, prepara currículos, candidata-se externamente e registra o andamento.

O nome físico `vagas` permanece no PostgreSQL por compatibilidade. Uma `Vaga` relacional representa a oportunidade operacional. O MongoDB continua guardando a entrada documental crua e o PostgreSQL continua guardando o núcleo relacional, conforme a ADR 0004.

O ciclo possui três apresentações:

- **Entrada:** postagem crua ainda não ativada, no MongoDB.
- **Ativa:** oportunidade relacional em acompanhamento, no PostgreSQL.
- **Encerrada:** oportunidade relacional arquivada ou com candidatura encerrada.

Isso não cria uma máquina de estados paralela. A apresentação é derivada da existência da oportunidade relacional, de `arquivadaEm` e, quando houver, do status da candidatura.

`Vaga` recebe de forma aditiva:

- `prioridade`, com `BAIXA`, `MEDIA` ou `ALTA`;
- `origem`, com `MANUAL` ou `IMPORTACAO`;
- `origemImportacaoId`, nullable e único por usuário;
- `atualizadoEm`;
- `arquivadaEm`, nullable.

Na ativação de uma entrada, a API:

1. procura uma oportunidade do usuário por `origemImportacaoId`;
2. cria a oportunidade somente quando ainda não existir;
3. grava o identificador relacional no documento Mongo;
4. marca a entrada como ativada;
5. devolve sempre a mesma oportunidade em novas tentativas.

A operação é idempotente. O PostgreSQL é confirmado antes da atualização documental. Uma falha entre stores pode ser reconciliada por nova tentativa, sem duplicar a oportunidade.

Novas rotas `/oportunidades` formam uma fachada de produto. As rotas `/vagas` e `/banco-vagas` permanecem funcionais durante a transição.

## Justificativa

- O usuário pensa em oportunidades, não em bancos de dados.
- A oportunidade concentra currículo, candidatura, ações e histórico sem apagar as fronteiras corretas de persistência.
- A mudança aditiva evita renomear tabelas e quebrar contratos já implementados.
- O vínculo explícito elimina a cópia cega atual e permite retry seguro.
- Uma única entidade operacional sustenta lista, Workspace, Pipeline e Currículos.

## Consequências

- A API precisa oferecer projeções agregadas e esconder a origem física dos dados.
- Entradas ainda não ativadas possuem menos recursos que oportunidades relacionais.
- Dados existentes precisam de backfill. Vagas atuais recebem origem manual, prioridade média e estado ativo. Entradas ativadas devem ser reconciliadas por vínculo conhecido ou revisão segura, sem associação silenciosa por título.
- A interface deixa de expor Banco de vagas como módulo principal.
- Não entram portal de empresas, publicação de vaga, scraping, descoberta automática nem candidatura automática.
