# ADR 0002 — Stack liderada por React + Node + TypeScript

- **Status:** Aceita
- **Data:** 2026-09-12
- **Contexto:** O projeto nasce como peça de portfólio direcionada a uma vaga full-stack cujo core é React.js, Node.js, JavaScript e TypeScript, com Docker, PostgreSQL, MongoDB e, como diferenciais, AWS, IaC e microsserviços. Havia a tentação de liderar por C# e Python, que também fazem parte do repertório do autor.

## Decisão
Liderar a arquitetura por **React + Node/NestJS + TypeScript**, usar **Python apenas no `ai-service`** e **C# apenas no `doc-service`**. O front é **PWA**, espelhando o padrão de produto de plataformas acessadas por celular.

## Justificativa
- O núcleo e a maior parte do código ficam exatamente na stack que a vaga pede, o que torna o projeto uma evidência direta de aderência.
- Python e C# aparecem como serviços de fronteira, demonstrando amplitude poliglota sem diluir a mensagem principal de Node/TS.
- PostgreSQL, MongoDB, Docker, microsserviços, CI/CD, testes e um stub de Terraform/AWS cobrem também os diferenciais listados.

## Consequências
- C#/.NET tem papel real mas contido (`doc-service`); expandir para um segundo serviço C# fica como evolução futura declarada na spec.
- A narrativa de apresentação lidera por TypeScript nas duas pontas e cita Python e C# como escolhas de arquitetura, não como protagonistas.
