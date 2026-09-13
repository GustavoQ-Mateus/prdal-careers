# ADR 0006 — RAG do Obsidian com embeddings locais e gratuitos

- **Status:** Aceita
- **Data:** 2026-09-12
- **Contexto:** O diferencial do produto é usar o histórico profissional do usuário, mantido em notas Markdown do Obsidian, como base de conhecimento na geração do currículo. Isso pede recuperação semântica (RAG). APIs de embedding pagas contrariam a regra de custo zero do projeto.

## Decisão
Ingerir os arquivos `.md` do vault, quebrá-los em chunks, gerar **embeddings localmente** com `sentence-transformers` (modelo aberto, roda em CPU) e armazenar em **Chroma** local. Na geração, a `api` pede à rota `POST /context/query` os chunks mais relevantes para a vaga, que entram no prompt como contexto.

## Justificativa
- `sentence-transformers` é gratuito, roda offline e é suficiente para a escala de um vault pessoal.
- Chroma é um vector store local simples de subir, sem serviço externo.
- RAG mantém o prompt enxuto e aterrado no histórico real do usuário, reduzindo alucinação e reforçando a regra de ouro de só usar verdade.

## Consequências
- O `ai-service` carrega um modelo de embedding na inicialização, o que adiciona alguns segundos de cold start e algumas centenas de MB de imagem.
- A ingestão é idempotente por caminho de arquivo: reingerir o vault atualiza os chunks sem duplicar.
- Chroma persiste em volume Docker para sobreviver a restart.
