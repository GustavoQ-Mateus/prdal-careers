# ADR 0008, Topologia de repositórios polyrepo para deploy na AWS

- **Status:** Proposta
- **Data:** 2026-09-13
- **Fase-alvo:** Fase 5, Polimento e entrega
- **Contexto:** O projeto nasceu como monorepo com quatro aplicações e pacotes compartilhados, decidido na `spec-v1.0.0` seção 10. O monorepo é o caminho mais rápido para a demo do fluxo estrela e para o desenvolvimento local com um único `docker-compose`. Para o deploy na AWS, porém, front, back e o futuro worker de batch têm ciclos de deploy, escala e permissões distintos, e faz sentido separá-los em repositórios independentes. Esta decisão só passa a valer após a Fase 1 fechar em v1.0.0 e depende de uma nova versão de spec que reescreva a seção 10.

## Decisão
Adotar topologia **polyrepo** para a etapa de entrega na AWS, separando o produto em repositórios independentes:
- `prdal-careers-web`, o front React PWA.
- `prdal-careers-api`, a `api` NestJS orquestradora.
- `prdal-careers-batch`, o worker de processamento em lote (ver ADR 0009).

O `ai-service` e o `doc-service` seguem como serviços versionados por contrato HTTP; a decisão de repositório próprio para cada um fica em aberto e será resolvida na spec da Fase 5 conforme a necessidade de deploy independente.

Os contratos de tipo hoje em `packages/shared-types` passam a ser publicados como **pacote versionado** em registry privado, por exemplo GitHub Packages, consumido por `web` e `api`. O monorepo permanece válido durante o desenvolvimento local e a demo; a migração polyrepo é uma decisão de topologia de entrega, não de desenvolvimento.

## Justificativa
- Front, back e batch escalam e implantam de forma independente na AWS; polyrepo alinha o limite do repositório ao limite de deploy.
- Pipelines de CI/CD por repositório ficam menores, mais rápidos e com permissões mínimas por serviço.
- Um repositório de batch isolado tem cadência própria de release, sem arrastar o fluxo síncrono.
- Publicar `shared-types` como pacote versionado mantém os contratos da seção 7 da spec como fonte única e evita drift entre repositórios.
- A vaga da Mobiliza valoriza AWS avançado, microsserviços e IaC; a topologia polyrepo com deploy independente é a linguagem natural desse ambiente.

## Consequências
- Perde-se a conveniência do monorepo de compartilhar tipos por import direto. Passa a existir um passo de publicar e versionar `shared-types`, com o custo de gerenciar versões e evitar drift.
- O CI deixa de ser um pipeline único e vira N pipelines, um por repositório, com orquestração de release entre eles quando um contrato muda.
- O desenvolvimento local com `docker-compose` precisa referenciar repositórios separados ou consumir imagens publicadas, o que adiciona atrito ao onboarding.
- A migração exige uma nova versão de spec reescrevendo a seção 10 e ajustando a estrutura antes de qualquer mudança de código.
- Enquanto a Fase 5 não chega, o monorepo continua sendo a topologia oficial e nada de polyrepo entra em código.
