# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.9.0 |
| **Status** | Draft |
| **Data** | 2026-09-18 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Polimento de copiloto, download, grafo, login e gráfico de score |
| **Base** | Estende `spec-v1.0.0.md` a `spec-v1.8.0.md`; formalizada pela ADR 0020 |

> MINOR compatível. Fecha cinco lacunas de UX levantadas em uso real do produto, sem tocar a pipeline de geração corrigida na P9-fix nem a resolução de link da `spec-v1.8.0`. CA1 a CA66 continuam válidos. Esta versão adiciona CA67 a CA73. A reestruturação do formulário de Perfil fica fora desta versão; ver `spec-v1.10.0`.

## 1. Problema

Uso real do produto expôs: o copiloto promete monitorar a geração de currículo em texto livre sem de fato continuar chamando `status_geracao`; o download de currículo obriga dois cliques separados (DOCX, PDF) sem opção de pacote nem de Markdown; o botão de ação primária de duas telas usa o token de cor errado; o grafo de oportunidades perde legibilidade ao trocar de tema, não diferencia tipos de entidade por cor e não permite reposicionar nós manualmente; e a comparação de score ATS antes/depois só aparece como texto, apesar do projeto já ter `recharts` e um wrapper de gráfico shadcn prontos.

## 2. Objetivo

1. Fazer o copiloto encadear `status_geracao` de fato enquanto a geração estiver em andamento, dentro do turno, em vez de narrar acompanhamento que não executa.
2. Substituir os dois botões de download por um único download de pacote (`.md`, `.docx`, `.pdf`) nomeado pela vaga.
3. Padronizar os botões de ação primária de Oportunidades e Login no token `--accent`.
4. Tornar a cor do grafo reativa ao tema, diferenciar nós por tipo de entidade e permitir arraste manual de nós.
5. Renderizar a comparação de score ATS (base/gerado) como gráfico de área no chat do copiloto.

## 3. Acompanhamento de geração assíncrona

Enquanto o resultado de uma chamada de geração trouxer status não terminal, o turno do copiloto encadeia novas chamadas a `status_geracao` automaticamente, respeitando um orçamento de tempo do próprio turno, até status terminal (`CONCLUIDA` ou `ERRO`) ou o orçamento esgotar. Cada chamada gera um item `passo` novo (mesmo tipo já usado por qualquer ferramenta), renderizado encadeado pela UI existente (`PassoTrilha`, prop `ligado`). Se o orçamento esgotar sem status terminal, a resposta do agente declara isso explicitamente e orienta o usuário a perguntar de novo ou reabrir a conversa; nenhuma mensagem do agente pode afirmar que vai monitorar de forma autônoma além do que o turno de fato executa.

## 4. Download em pacote

`GET /curriculos/:id/pacote` retorna um `.zip` contendo uma pasta nomeada pela vaga (título e empresa da oportunidade, sanitizados) com `Curriculo_<rótulo>.md` (do campo `markdown` persistido), e `.docx`/`.pdf` quando existirem. A UI de Currículos substitui os botões de texto "DOCX"/"PDF" por um único botão ícone de download que baixa esse pacote. O rótulo "Versão N" já gerado pelo backend (`` `Versao ${n}` ``) continua sendo exibido sem transformação pela UI; nenhuma mudança nesse mecanismo é necessária, só a confirmação de que segue exibido cru.

## 5. Cor de ação primária

Botões de ação primária de tela usam `variant="accent"` (token `--accent`, azul do sistema), não `variant="primary"` (token neutro por tema). Aplicado a "Registrar oportunidade" (Oportunidades) e "Acessar"/"Criar conta" (Login). `--primary` não muda de valor nem é removido; continua servindo outros usos.

## 6. Grafo de oportunidades

A cor de rótulo e aresta do `SigmaContainer` é recalculada quando o tema muda em runtime, não apenas na primeira renderização. Cada `tipo` de nó presente em `GrafoResposta.nodes` (oportunidade e os tipos de entidade relacionada hoje existentes: empresa, categoria, nível, skill) recebe uma cor própria e legível em claro e escuro, refletida na legenda. O usuário pode arrastar um nó com o ponteiro para reposicioná-lo manualmente; ao iniciar o arraste, o nó sai do controle do layout automático (ForceAtlas2) e mantém a posição onde foi solto até a próxima recarga dos dados do grafo. Persistência de posição entre sessões fica fora de escopo desta versão.

## 7. Layout de login

A proporção do grid de duas colunas da tela de login estreita a coluna do formulário (hoje `lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`, ~40/60) para uma proporção mais estreita à esquerda, mantendo o formulário legível. O contêiner do formulário (hoje `max-w-sm`) e a tipografia dos campos e do título aumentam um nível (ex.: `max-w-sm` para `max-w-md`, título de 24px para um tamanho maior, altura de input mantendo toque confortável), sem quebrar em telas menores que `lg`.

## 8. Gráfico de score ATS no copiloto

Quando o resultado de uma ferramenta do copiloto trouxer par de score base/gerado (`analiseInicial.score` e `analiseFinal.score`, já produzidos pela Etapa 1 e Etapa 3 do modo-pipeline), a mensagem correspondente no chat renderiza um gráfico de área com `components/ui/chart.tsx` e `recharts`, já presentes no projeto, com duas categorias no eixo X ("Base", "Gerado") e o score no eixo Y, além do resumo em texto que já existe. Nenhuma biblioteca de gráfico nova é introduzida.

## 9. Critérios de aceitação

- **CA67** Durante uma geração de currículo com status não terminal, o copiloto encadeia chamadas reais a `status_geracao` no mesmo turno até status terminal ou esgotar o orçamento de tempo; a UI mostra cada tentativa como item `passo` encadeado. Nenhuma mensagem do agente promete acompanhamento autônomo que o turno não executa.
- **CA68** `GET /curriculos/:id/pacote` devolve um `.zip` com pasta nomeada pela vaga contendo `.md` sempre, e `.docx`/`.pdf` quando existirem; a tela de Currículos oferece um único botão de download por currículo que baixa esse pacote, substituindo os botões separados de DOCX/PDF.
- **CA69** O rótulo "Versão N" gerado pelo backend chega à UI sem transformação, confirmado por teste ou inspeção direta da tela de Currículos.
- **CA70** "Registrar oportunidade" (Oportunidades) e "Acessar"/"Criar conta" (Login) usam `variant="accent"`; nenhum outro botão do produto muda de variante como efeito colateral.
- **CA71** O texto de rótulo e a cor de aresta do grafo de oportunidades permanecem legíveis em claro e escuro após alternar o tema em runtime, sem recarregar a página; nós de cada `tipo` de entidade relacionada têm cor própria refletida na legenda; um nó pode ser arrastado com o ponteiro e mantém a posição manual até a próxima recarga dos dados.
- **CA72** A tela de login exibe a coluna do formulário mais estreita que a proporção atual (~40%) e os componentes de acesso (contêiner, título, campos) em tamanho maior que o atual, sem quebra de layout em telas `lg` e maiores.
- **CA73** Quando o resultado de uma ferramenta do copiloto trouxer `analiseInicial.score` e `analiseFinal.score`, o chat renderiza um gráfico de área comparando os dois valores, além do resumo em texto já existente, usando `components/ui/chart.tsx`.

## Changelog

- **1.9.0 (2026-09-18):** acompanhamento real de geração assíncrona no copiloto, download de currículo em pacote, cor de ação primária padronizada em `--accent`, grafo de oportunidades com cor reativa a tema e por tipo de nó e reposicionamento manual, login mais estreito e com componentes maiores, gráfico de score ATS no chat do copiloto, conforme ADR 0020.
