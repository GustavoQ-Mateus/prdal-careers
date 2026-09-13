# PRDAL Careers, regras do projeto

Projeto spec-driven. A fonte da verdade é `docs/specs/spec-vX.Y.Z.md` mais as ADRs em `docs/adr/`. Só implemente o que está na spec da fase atual; escopo novo vira nova versão de spec antes de virar código.

## Código
- Simplicidade proporcional ao problema. Aplique KISS e YAGNI. Não adicione camadas de abstração, padrões de projeto, generalizações ou configurações que a spec da fase não pede. Resolva o problema atual, nunca o hipotético.
- Sem código documentado. Não escreva comentários explicativos nem docstrings. O código se explica por nomes claros de variáveis, funções e tipos. Comentário só em caso raro e genuinamente não óbvio, e curto.
- Idiomático por stack: TypeScript no web e na api, Python no ai-service, C# no doc-service. Siga o estilo já presente em cada serviço.
- Nada de dependência nova sem necessidade real.
- Nunca use travessão em nada gerado.

## Commits
- Curtos, no padrão Conventional Commits: `tipo(escopo): descrição`.
- Tipos: feat, fix, refactor, test, docs, chore, build, ci.
- Descrição no imperativo, minúscula, sem ponto final, até cerca de 50 caracteres.
- Exemplos: `feat(api): adiciona endpoint de vagas`, `fix(ai-service): valida schema de keywords`, `chore(infra): sobe postgres e mongo no compose`.
- Um commit por unidade lógica de mudança.
- NUNCA incluir "Co-Authored-By: Claude" nem qualquer referência à Anthropic.
