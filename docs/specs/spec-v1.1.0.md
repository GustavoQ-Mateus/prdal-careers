# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.1.0 |
| **Status** | Draft |
| **Data** | 2026-09-13 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Gestão de candidaturas e geração de currículo otimizado para ATS |
| **Base** | Estende `spec-v1.0.0.md`; muda apenas o que esta seção descreve |

> Esta versão MINOR adiciona a Fase 2 (Análise ATS) de forma compatível com a v1.0.0. Tudo que não é redefinido aqui continua valendo como na v1.0.0: arquitetura, ADRs, fluxo estrela, autenticação e os critérios CA1 a CA8. As ADRs 0001, 0005 e 0007 sustentam esta fase e não mudam.

---

## 1. Contexto e motivação da Fase 2
A v1.0.0 entrega geração de currículo tailored com um score ATS e seu breakdown. O número existe, mas o usuário ainda não tem como enxergar de onde ele vem nem comparar tentativas. A Fase 2 fecha o laço de análise: transforma o score e o breakdown, já calculados de forma determinística no `ai-service`, em uma leitura visual acionável, e permite comparar versões de currículo da mesma vaga para decidir qual enviar.

O princípio segue a ADR 0005: o score é reproduzível e explicável. A Fase 2 não introduz nenhum julgamento novo de qualidade; ela apenas visualiza e compara o que o algoritmo já produz, e permite iterar o texto para subir o score de forma transparente.

## 2. Objetivo
Entregar, no `web`, um dashboard de score sobre as vagas do usuário, uma visualização do breakdown de cada currículo, e um comparativo lado a lado entre versões de currículo de uma mesma vaga. Suportar o laço de ajuste ATS: editar o Markdown de um currículo e recalcular o score de forma determinística.

## 3. Escopo da Fase 2

### Entra
1. **Dashboard de score** (`web`): lista as vagas do usuário com o melhor score, a quantidade de versões de currículo e a data da última geração.
2. **Breakdown visual** (`web`): para um currículo, mostra os três componentes do score (keyword match, densidade, seções) e as keywords faltantes, de forma gráfica, reusando o `scoreBreakdown` já persistido.
3. **Comparativo entre versões** (`web`): para uma vaga com dois ou mais currículos, mostra as versões lado a lado com score, delta entre elas e diferença de cobertura de keywords.
4. **Edição e recálculo** (`api` + `web`): editar o Markdown de um currículo existente e recalcular o score (via `ai-service` `POST /score`), regenerando `.docx`/`.pdf` no `doc-service` quando disponível.

### Não entra (fica para fases seguintes conforme v1.0.0)
- Banco de vagas cru, promoção a vaga e Kanban de candidaturas (Fase 3, `spec-v1.2.0`).
- Ingestão do Obsidian e RAG (Fase 4, `spec-v1.3.0`).
- Qualquer mudança no provedor de IA ou no algoritmo do score.

## 4. Decisões de arquitetura
Nenhuma ADR nova é necessária. A Fase 2 reusa:
- **ADR 0001**: os novos endpoints são todos na `api`; o `web` continua falando só com a `api`.
- **ADR 0005**: o recálculo de score usa o mesmo `POST /score` determinístico do `ai-service`; nada de score vindo de LLM.
- **ADR 0007**: a regeneração de documentos após edição usa o `doc-service`, com a mesma degradação graciosa da v1.0.0 (RNF8, CA5).

## 5. Fluxos

### 5.1 Dashboard
1. `web` chama `GET /dashboard` na `api`.
2. `api` agrega, por vaga do usuário, o melhor score entre seus currículos, a contagem de versões e a data da última geração.
3. `web` renderiza a lista ordenada por melhor score.

### 5.2 Comparativo entre versões
1. `web` chama `GET /vagas/{id}/curriculos`.
2. `api` devolve as versões de currículo da vaga, cada uma com score e breakdown, ordenadas por data.
3. `web` mostra duas ou mais versões lado a lado, com o delta de score e a diferença de keywords cobertas e faltantes.

### 5.3 Edição e recálculo
1. `web` chama `PUT /curriculos/{id}` com o Markdown editado.
2. `api` recalcula o score chamando o `ai-service` `POST /score` com o Markdown novo e as keywords da vaga.
3. `api` regenera `.docx`/`.pdf` no `doc-service`; se indisponível, zera os caminhos e mantém Markdown e score (degradação graciosa).
4. `api` persiste o Markdown, o novo score e o breakdown no mesmo currículo e devolve o resultado.

## 6. Modelo de dados
Uma migração pequena e aditiva: adicionar a coluna `rotulo (text)` à tabela `curriculos`. O resto da entidade da v1.0.0 já suporta a fase: vários currículos por vaga (`vaga_id`), `score`, `score_breakdown (jsonb)`, `gerado_em`. O `rotulo` identifica a versão de forma amigável; a `api` o define na geração (ex. `Versao 1`, `Versao 2`, pela contagem de currículos da vaga) e o usuário pode renomeá-lo. A edição atualiza o currículo no lugar e passa a valer como sua versão corrente.

## 7. Contratos de API (adições à seção 7 da v1.0.0)

### api (NestJS), consumida pelo web
- `GET /dashboard`: resp `[{ vagaId, titulo, empresa, melhorScore, versoes, ultimaGeracao }]`. `melhorScore` e `ultimaGeracao` são `null` quando a vaga ainda não tem currículo.
- `GET /vagas/{id}/curriculos`: resp `[{ id, rotulo, score, breakdown, geradoEm }]`, ordenado por `geradoEm` desc.
- `PUT /curriculos/{id}`: req `{ markdown, rotulo? }` (o `rotulo` é opcional e serve para renomear a versão), resp o mesmo shape de `GET /curriculos/{id}` da v1.0.0 acrescido de `rotulo`, com score recalculado.

`GET /curriculos/{id}` da v1.0.0 passa a incluir o campo `rotulo` na resposta (aditivo e compatível). Nenhum contrato do `ai-service` ou do `doc-service` muda.

## 8. Requisitos funcionais (adições)
- **RF8** O usuário vê um dashboard com o melhor score de cada vaga e quantas versões de currículo gerou.
- **RF9** O usuário vê o breakdown do score de um currículo de forma visual, incluindo as keywords faltantes.
- **RF10** O usuário compara duas ou mais versões de currículo da mesma vaga, cada uma identificada por seu rótulo, com delta de score e diferença de keywords.
- **RF11** O usuário edita o Markdown de um currículo, pode renomear seu rótulo, e recebe o score recalculado de forma determinística, com os documentos regenerados quando o `doc-service` está disponível.

## 9. Requisitos não funcionais
Herdados da v1.0.0. Reforço relevante:
- **RNF5** O score continua determinístico e explicável; a Fase 2 só o visualiza e o recalcula pela mesma via.
- **RNF8** A edição com regeneração de documentos mantém a degradação graciosa: falha no `doc-service` não bloqueia o recálculo do score.
- **RNF11 Design não genérico**: as telas desta fase, e de toda fase futura com front, seguem a regra de front-end do `CLAUDE.md`. Evitar AI slop: nada de card centralizado sobre gradiente, layout de template padrão ou componentes de biblioteca sem ajuste. Cada tela tem intenção de design própria (escala tipográfica, espaçamento e paleta com ponto de vista, coerentes entre si) e densidade proporcional a um produto de análise de dados. A direção visual é proposta e aprovada antes da implementação das telas.

## 10. Estrutura do monorepo
Inalterada em relação à seção 10 da v1.0.0. A Fase 2 adiciona telas no `web` e rotas na `api`, sem serviço nem pacote novo.

## 11. Critérios de aceitação da Fase 2
Os critérios CA1 a CA8 da v1.0.0 continuam válidos. A Fase 2 adiciona:

- **CA9** `GET /dashboard` lista todas as vagas do usuário com o melhor score e a contagem de versões corretos; vaga sem currículo aparece com score nulo.
- **CA10** O breakdown visual de um currículo mostra keyword match, densidade, seções e a lista de keywords faltantes, coerentes com o `scoreBreakdown` persistido.
- **CA11** Para uma vaga com duas ou mais versões, o comparativo mostra os scores lado a lado, cada versão identificada por seu rótulo, com o delta entre versões e a diferença de keywords cobertas e faltantes.
- **CA12** Editar o Markdown de um currículo e recalcular resulta em um score determinístico e persistido; recarregar a página mantém o novo score, e incluir uma keyword faltante nunca reduz o componente de keyword match.
- **CA13** As telas da fase seguem a direção visual aprovada e a regra de front-end do `CLAUDE.md`, sem elementos genéricos de AI slop, com hierarquia e densidade coerentes entre dashboard, breakdown e comparativo.

## 12. Ordem de execução da Fase 2
1. `api`: migração aditiva da coluna `rotulo`; `GET /vagas/{id}/curriculos`, `GET /dashboard`, `PUT /curriculos/{id}` com recálculo e regeneração.
2. `web`: definir e aprovar a direção visual (RNF11) antes das telas; depois dashboard, tela de breakdown visual, tela de comparativo, edição do Markdown com recálculo.
3. Validar CA9 a CA13 e atualizar o README.

## 13. Suposições
1. A variação entre versões vem de gerar novamente após editar o perfil-mestre, do uso do LLM real, ou da edição direta do Markdown; o sistema não fabrica variação artificial.
2. Comparar exige pelo menos duas versões da mesma vaga; com uma só, a UI mostra apenas o breakdown.

## 14. Fora de escopo (v1.1)
Tudo que a seção 14 da v1.0.0 já lista, mais: exportar o comparativo, histórico de auditoria de edições e recomendação automática de texto para subir o score.

---

## Changelog
- **1.1.0 (2026-09-13)**: Fase 2, Análise ATS. Adiciona dashboard de score, breakdown visual e comparativo entre versões de currículo, mais edição de Markdown com recálculo determinístico do score. Novos endpoints `GET /dashboard`, `GET /vagas/{id}/curriculos` e `PUT /curriculos/{id}`. Migração pequena e aditiva (coluna `rotulo` em `curriculos`); sem ADR nova; reusa 0001, 0005 e 0007. Critérios CA9 a CA13.
- **1.0.0 (2026-09-12)**: Primeira spec. Ver `spec-v1.0.0.md`.
