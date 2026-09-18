# ADR 0024, Regeracao por perfil e score radial no copiloto

- **Status:** Aceita
- **Data:** 2026-09-18
- **Fase-alvo:** P10, revisao 1.9.3

## Contexto

No fluxo de revisao de curriculo, o candidato pode enriquecer o perfil-mestre e
pedir uma nova tentativa para a mesma oportunidade. A implementacao atual permite
que o modelo, mesmo depois de ler o perfil atualizado, peca o Markdown do
curriculo e cite identificadores internos de ferramenta. Isso contradiz a fonte
de verdade do produto: uma nova geracao usa o perfil-mestre atual e a oportunidade
em foco, enquanto a edicao de curriculo e reservada para Markdown que o candidato
efetivamente forneceu.

O grafico criado na P10 tambem mostra uma serie de area para a Etapa 1. A Etapa 1
tem somente um score e pede leitura de estado, nao comparacao. O formato radial
com valor central torna esse estado imediato; a comparacao Base e Gerado da Etapa
3 continua sendo uma serie de area.

## Decisao

1. Quando o candidato informar que atualizou o perfil e pedir nova tentativa para
   a oportunidade em foco, o copiloto le o perfil e propõe gerar uma nova versao
   do curriculo a partir desse perfil. Em modo assistido, a escrita continua
   passando pela confirmacao existente. Apos confirmada, a geracao usa a rota e a
   pipeline existentes. O copiloto nao pede Markdown nem tenta editar um
   curriculo nessa situacao.
2. Mensagens livres do copiloto usam somente linguagem de produto. Nao exibem
   identificadores internos de ferramentas, nomes de rotas, payloads ou formato
   de orquestracao. O retorno tecnico expandivel da trilha permanece fora desta
   regra e continua destinado a inspecao explicita.
3. A Etapa 1 renderiza o score ATS unico em `RadialBarChart`, com valor e rotulo
   semantico no centro, usando `ChartContainer` e `recharts` ja instalados. Quando
   houver os scores Base e Gerado, a Etapa 3 preserva o grafico de area atual.

## Consequencias

- `apps/ai-service/app/copiloto.py` ganha uma regra deterministica estreita para
  a sequencia perfil atualizado, leitura de perfil e nova geracao da oportunidade
  em foco, complementada por instrucoes de linguagem de produto ao modelo.
- `apps/web/src/copiloto/componentes.tsx` separa a visualizacao radial de score
  unico da comparacao de area de dois scores, sem dependencia nova.
- O contrato SSE, os endpoints de curriculo e a confirmacao de escrita nao mudam.
