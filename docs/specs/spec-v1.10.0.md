# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.10.0 |
| **Status** | Draft |
| **Data** | 2026-09-18 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Perfil estruturado: contato, formação, experiência, certificação |
| **Base** | Estende `spec-v1.0.0.md` a `spec-v1.9.0.md`; formalizada pela ADR 0021 |

> MINOR compatível. Reestrutura o formato de dado do perfil-mestre para contato tipado com principal, formação e certificação como objetos, e experiência com local e período estruturados, sem migration de schema Prisma. CA1 a CA73 continuam válidos. Esta versão adiciona CA74 a CA80. Depende da `spec-v1.9.0` estar implantada antes, para não acoplar risco de migração de dado ao polimento leve de UI.

## 1. Problema

O perfil-mestre guarda contato como lista plana de sete tipos com um campo "valor" genérico, sem noção de contato principal; telefone sem prefixo de país; localização como texto livre; formação e certificação como uma linha de texto por item; e experiência com local e período em texto livre, mais um campo de tecnologias redundante com a descrição. Isso deixa a geração de currículo sem dado confiável para decidir qual e-mail/telefone usar no cabeçalho ou como formatar cidade/estado, e obriga o candidato a escrever formação/certificação sem estrutura.

## 2. Objetivo

1. Contato tipado em três coleções (e-mails, telefones, links de rede) mais um endereço estruturado, cada coleção com conceito de item principal onde fizer sentido.
2. Formação e certificação como listas de objetos estruturados, editadas em modal.
3. Experiência com local por cidade/estado e período por data de início/fim com checkbox de emprego atual, sem campo de tecnologias solto.
4. Dado legado migrado por normalização na leitura, sem perda, sem migration de schema.

## 3. Contato

`PerfilMestre.contato` (lista plana antiga) é substituído por:

- `emails: { id, valor, principal }[]`. Exatamente um item é `principal` quando a lista não está vazia. Currículo usa só o principal.
- `telefones: { id, ddi, numero, principal }[]`. `ddi` vem de seletor de país com bandeira, lista fechada. Mesmo conceito de principal.
- `links: { id, tipo, url }[]`, `tipo` fechado em `linkedin | github | facebook | instagram | site`.
- `endereco: { pais, estado, cidade, bairro?, logradouro?, complemento? } | null`. `pais`, `estado`, `cidade` vêm de listas/seleção, não texto livre. Currículo usa só `cidade` e a sigla de `estado`.

UI de edição segue o padrão "lista com principal e adicionar mais" para e-mail e telefone, campos nomeados por rede para links, e formulário de campos fixos para endereço, todos em modal, substituindo o modal único genérico "tipo + valor" atual.

## 4. Formação e certificação

`formacao: string[]` vira `formacao: { id, grau, status, instituicao, curso, inicioMes, inicioAno, fimMes?, fimAno? }[]`, `status` em `concluido | em_andamento | trancado`. `certificacoes: string[]` vira `certificacoes: { id, titulo, descricao }[]`. Ambas editadas em modal de adicionar/editar, mesmo padrão de Contato e Experiência.

## 5. Experiência

`local` passa a usar a mesma seleção de cidade/estado do endereço. `periodo` (texto livre) vira `dataInicioMes`, `dataInicioAno`, `dataFimMes?`, `dataFimAno?` e `atual: boolean`; quando `atual` é verdadeiro, os campos de fim ficam desabilitados e a experiência exibe "Atual". O campo `tecnologias` é removido do tipo e do formulário.

## 6. Migração de dado legado

Sem migration de schema Prisma, porque os campos são `Json`. Na leitura, o backend normaliza formato antigo para o novo: contato plano tipo `email`/`telefone`/`linkedin`/`github`/`site` vira o primeiro item da coleção nova correspondente, marcado `principal`; `localizacao` antiga simples vira `endereco.cidade` quando parseável, senão é preservada como está e sinalizada para revisão; formação/certificação em texto livre viram um item com o único campo estruturado disponível preenchido pela linha inteira, sinalizado "formato antigo, revise"; experiência com `periodo`/`local` livres mantém o texto antigo visível até o candidato reabrir e preencher os campos estruturados. Nenhuma normalização apaga dado; o pior caso é um item marcado para revisão manual.

## 7. Critérios de aceitação

- **CA74** `PerfilMestre.contato` é substituído por `emails`, `telefones`, `links` e `endereco` conforme seção 3; a UI permite marcar e trocar o e-mail e o telefone principal, e adicionar mais itens de cada coleção.
- **CA75** Telefone é editado com seletor de prefixo de país (bandeira + DDI) de lista fechada, não texto livre.
- **CA76** `endereco.pais`, `.estado` e `.cidade` são selecionados de lista, não digitados livremente; a geração de currículo usa apenas cidade e sigla do estado no cabeçalho.
- **CA77** `formacao` e `certificacoes` são listas de objetos estruturados (seção 4), editadas em modal de adicionar/editar, não mais um `<Textarea>` de uma linha por item.
- **CA78** `ExperienciaPerfil.local` usa a mesma seleção de cidade/estado do endereço; `periodo` é substituído por datas de início/fim estruturadas com checkbox "Emprego atual" que desabilita e limpa a data de fim; o campo `tecnologias` não existe mais no tipo nem no formulário.
- **CA79** Um perfil salvo no formato anterior a esta versão é lido, normalizado para o novo formato sem perda de dado, e exibido corretamente na UI; nenhum registro existente vira erro ou fica em branco.
- **CA80** A geração de currículo consome e-mail/telefone principal e endereço estruturado do perfil normalizado, mantendo a antialucinação genérica por usuário já fixada na P9-fix (nenhum dado de empresa ou candidato específico cravado no motor).

## Changelog

- **1.10.0 (2026-09-18):** perfil-mestre com contato tipado e principal, formação e certificação estruturadas, experiência com local e período estruturados, migração de dado legado por normalização na leitura, conforme ADR 0021.
