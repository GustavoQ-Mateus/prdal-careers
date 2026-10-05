# Regras para agentes de código

Valem para qualquer agente que implemente neste repositório (Codex, Claude Code ou outro). O orquestrador escreve um prompt por fatia em `prompts/fatia-<x>.md`; leia o prompt inteiro antes de codar e siga a ordem dos itens.

## Onde trabalhar

- Cada implementador trabalha no próprio worktree e na própria branch, nunca na `main`. Quem faz merge na `main` e push é o orquestrador, depois de revisar.
- Não faça push.
- Não edite `docs/` nem `prompts/`.
- Não use `git stash`.
- Não mexa em arquivos ignorados pelo git que pertencem ao autor, como os `.env`. Se uma linha de `.env` precisar mudar, diga qual no relatório.

## Código

- Sem comentário em código, em nenhuma linguagem.
- Nunca use travessão (o caractere U+2014), nem em código, nem em texto ao candidato, nem em README.
- Escreva como o código ao redor: mesma nomenclatura em português, mesmo estilo e mesma densidade.
- Cada pasta de `apps/` é uma unidade que vira repositório próprio: `apps/worker`, cada `apps/jobs/<nome>` e cada `apps/lambdas/<nome>` não importam código de outra pasta nem de `apps/api/src`, e a api não importa delas.
- O schema Prisma e as migrações pertencem a `apps/api/prisma`. Só mexa nele se o prompt da fatia mandar.

## Commits

- Um commit por item do prompt (pode dividir um item grande).
- `git add` por caminho explícito, nunca `git add -A` nem `git add .`.
- Mensagem conventional em português, imperativa, minúscula, sem ponto final, assunto perto de 50 caracteres.
- Sem número de fase, de fatia ou de critério de aceitação na mensagem.
- Sem linha de coautoria e sem menção a ferramenta ou empresa de IA.

## Testes e dados

- Nenhuma chamada real ao modelo de linguagem, nem em teste nem em prova ao vivo. Se precisar de uma, pergunte antes.
- Teste ao vivo só em projeto docker compose isolado (`-p <nome-proprio>`), com volumes próprios e portas diferentes das do autor. O arquivo `infra/docker-compose.yml` tem `name: prdal-careers`: sem `-p`, qualquer comando cai no ambiente do autor.
- Nunca escreva nos volumes `prdal-careers_*` nem no banco do autor (`localhost:5432`, banco `prdal_careers`). Todo comando que fala com banco recebe `DATABASE_URL` explícito apontando para o seu projeto isolado.
- Dado pessoal real nunca entra no repositório: ele é público.

## Nuvem

- AWS só com o perfil pessoal do autor: `--profile prdal-gustavo` ou `AWS_PROFILE=prdal-gustavo` explícito em todo comando AWS e Terraform. Antes da primeira ação, `aws sts get-caller-identity --profile prdal-gustavo`. Os outros perfis da máquina são da empresa do autor e nunca devem ser usados.
- Nenhuma ação na AWS sem o prompt da fatia pedir.

## Entrega

Ao terminar, entregue: tabela com item, commit, arquivos e teste que prova; resultado de todas as suítes; o que ficou de fora, os desvios e as perguntas.
