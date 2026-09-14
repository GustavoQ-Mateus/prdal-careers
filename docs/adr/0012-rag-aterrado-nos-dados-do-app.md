# ADR 0012, RAG aterrado nos dados do proprio app, com upload opcional

- **Status:** Aceita
- **Data:** 2026-09-13
- **Fase-alvo:** Fase 4
- **Amenda:** ADR 0006
- **Contexto:** A ADR 0006 definiu o RAG ingerindo arquivos `.md` externos de um vault do Obsidian. Na prática, o app já detem o historico profissional do usuario no perfil-mestre e pode ganhar contexto das notas de candidatura. Exigir upload manual de um vault e atrito e entrega menos valor do que aproveitar o que ja existe. O usuario quer que a base de conhecimento seja populada de forma automatica.

## Decisao
O corpus do RAG passa a ser **derivado automaticamente dos dados do proprio app**, com **upload opcional de notas `.md`** para enriquecer. Mantem-se a essencia da ADR 0006: embeddings locais e gratuitos e vector store local.

- **Corpus automatico**: o perfil-mestre (resumo, cada experiencia, formacao, skills) e as notas de candidatura viram documentos, quebrados em chunks e indexados. Reindexacao idempotente por origem: reindexar atualiza os chunks daquela origem sem duplicar.
- **Upload opcional**: o usuario ainda pode enviar notas `.md` do seu Obsidian, que entram no mesmo indice.
- **Embeddings**: `sentence-transformers` com modelo multilingue (`paraphrase-multilingual-MiniLM-L12-v2`), melhor para conteudo em portugues.
- **Vector store**: Chroma em **container proprio** no compose, persistido em volume, dono `ai-service`.
- **Ingestao em lote**: a indexacao usa o worker de lote in-process da Fase 3 (ADR 0009), com progresso e sem travar a UI.
- **Uso na geracao**: antes do `generate-cv`, a `api` consulta `POST /context/query` pela vaga e injeta os chunks mais relevantes como `contexto` no prompt. Se nada estiver indexado, `contexto` vem vazio e a geracao segue (degradacao graciosa).

## Justificativa
- Aproveitar o dado que o app ja tem entrega valor imediato sem pedir trabalho manual ao usuario.
- Aterrar a geracao no historico real reduz alucinacao e reforca a regra de ouro de so usar verdade.
- Manter embeddings locais e Chroma preserva o custo zero e o funcionamento offline da ADR 0006.
- Reusar o worker de lote evita duplicar logica e cobre a carga pesada de CPU dos embeddings.

## Consequencias
- Muda a fonte do RAG em relacao a ADR 0006, de somente `.md` externos para dados do app mais `.md` opcional.
- Chroma vira um container a mais no `docker-compose`; o `ai-service` passa a depender dele por rede.
- O `ai-service` carrega o modelo de embedding na inicializacao, com custo de cold start e tamanho de imagem, como ja previa a ADR 0006.
- Reindexar ao mudar o perfil-mestre mantem o indice coerente; a politica de quando reindexar fica detalhada na spec da fase.
- Mensagens de entrevista, pre-selecao e o grafo de conhecimento nao entram aqui; sao escopo futuro em specs proprias.
