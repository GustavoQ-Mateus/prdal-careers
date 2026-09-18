# PRDAL Careers, Especificacao Tecnica

| Campo | Valor |
|---|---|
| **Versao** | 1.9.3 |
| **Status** | Aceita |
| **Data** | 2026-09-18 |
| **Autor** | Gustavo Queiroz Mateus |
| **Dominio** | Revisao do copiloto e visualizacao de score ATS |
| **Base** | Estende `spec-v1.9.2.md`; formalizada pela ADR 0024 |

> PATCH compativel. Corrige o reuso do perfil-mestre no fluxo de nova geracao e
> melhora a leitura visual da Etapa 1. CA1 a CA73 continuam validos. Esta versao
> adiciona CA81 a CA83; a P11 permanece bloqueada ate o fechamento integral da P10.

## 1. Problema

Depois de o candidato atualizar competencias no perfil-mestre e pedir nova
tentativa, o copiloto pode reler o perfil e ainda pedir o Markdown do curriculo,
como se a operacao correta fosse editar um documento existente. A mensagem tambem
pode expor identificadores internos de ferramenta. Separadamente, a Etapa 1
mostra um unico score como grafico de area, embora a comparacao de area seja
apropriada somente quando a Etapa 3 tiver o score Gerado.

## 2. Objetivo

1. Regerar o curriculo da oportunidade em foco a partir do perfil-mestre atual,
   preservando confirmacao antes de escrita.
2. Impedir que texto livre do copiloto exponha detalhes internos de orquestracao.
3. Mostrar o score unico da Etapa 1 em grafico radial e preservar a comparacao de
   area Base e Gerado na Etapa 3.

## 3. Nova tentativa apos atualizacao de perfil

Quando a conversa tiver oportunidade em foco e o candidato disser que atualizou
o perfil ou as competencias e quer tentar novamente, o copiloto le o perfil atual.
Depois dessa leitura, seleciona gerar uma nova versao do curriculo para a mesma
oportunidade. Em modo assistido, o produto exibe a confirmacao de geracao antes
de qualquer escrita. A geracao usa o perfil atual no instante de execucao e segue
as Etapas 1, 2 e 3 ja definidas.

Esse fluxo nao pede Markdown e nao seleciona edicao de curriculo. Edicao continua
restrita a quando o candidato tiver fornecido explicitamente o Markdown de um
curriculo existente para alterar.

## 4. Linguagem visivel ao candidato

Todo texto livre gerado pelo copiloto descreve a acao em linguagem de produto,
como "gerar uma nova versao do curriculo". Identificadores de ferramenta, nomes
de rota, campos de payload, instrucoes de orquestracao e nomes de funcoes nao
podem aparecer nesse texto. A trilha de passos e o retorno tecnico que o candidato
escolhe expandir permanecem mecanismos de inspecao separados.

## 5. Grafico de score ATS por etapa

Com somente `etapas.analiseInicial.score`, a trilha mostra um `RadialBarChart`
com anel de progresso, valor central e o rotulo "Score ATS inicial". A extensao
do arco corresponde ao score na escala de 0 a 100 e o componente funciona em
claro e escuro por meio dos tokens semanticos existentes.

Com `analiseInicial.score` e `analiseFinal.score`, a comparacao estabelecida em
CA73 permanece um grafico de area com os pontos Base e Gerado. Nenhuma biblioteca
de grafico nova e introduzida.

## 6. Criterios de aceitacao

- **CA81** Dada uma oportunidade em foco, quando o candidato atualizar o perfil
  ou competencias e pedir nova tentativa, o copiloto le o perfil e propõe gerar
  uma nova versao para a mesma oportunidade. Em modo assistido, a geracao so
  ocorre apos confirmacao. O fluxo nao pede Markdown nem seleciona a edicao de
  curriculo.
- **CA82** Nenhuma mensagem livre do copiloto ao candidato contem identificador
  interno de ferramenta, rota, payload, funcao ou instrucao de orquestracao. A
  acao e descrita em linguagem de produto.
- **CA83** A trilha renderiza score unico da Etapa 1 como grafico radial com valor
  e rotulo central, em claro e escuro. Quando houver Base e Gerado, conserva o
  grafico de area de CA73.

## Changelog

- **1.9.3 (2026-09-18):** formaliza a nova geracao a partir de perfil atualizado,
  protege o texto do copiloto contra vazamento de detalhes internos e troca o
  score unico da Etapa 1 por visualizacao radial, conforme ADR 0024.
