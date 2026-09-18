# ADR 0021, Perfil estruturado: contato tipado, formação, experiência e certificação

- **Status:** Aceita
- **Data:** 2026-09-18
- **Fase-alvo:** P11, depois da P10 (ADR 0020 / `spec-v1.9.0`)
- **Contexto:** `PerfilForm.tsx` guarda hoje o perfil-mestre com formatos rasos demais para o que o candidato precisa registrar e para o que a geração de currículo precisa consumir com precisão:
  - `ContatoPerfil` é uma lista plana `{ id, tipo, valor, rotulo? }` com sete tipos (`email`, `telefone`, `linkedin`, `github`, `site`, `localizacao`, `outro`) tratados todos como um campo "valor" genérico de texto livre. Não há conceito de contato principal versus secundário (a geração não sabe qual e-mail/telefone usar no cabeçalho), telefone não tem prefixo de país, links de rede não são tipados individualmente (LinkedIn e GitHub são tipos próprios mas Facebook e Instagram caem em `outro`), e localização é só uma string livre, sem país/cidade/estado separados.
  - `formacao` e `certificacoes` são `string[]`, uma linha de texto livre por item, editadas em um `<Textarea>" só. Não há grau, status, instituição, curso, datas de início/fim para formação, nem título e descrição separados para certificação.
  - `ExperienciaPerfil.periodo` e `.local` são strings livres (`"Jan. 2024 a atual"`, texto qualquer); não há data de início/fim estruturada, nem checkbox de emprego atual, nem local como cidade/estado selecionável. `.tecnologias` é um campo à parte que duplica o que o candidato já escreve em `.descricao`.
  - Todos esses campos são colunas `Json` no Postgres (`schema.prisma`, `model PerfilMestre`), não colunas tipadas: mudar o formato interno não exige migração de schema Prisma, só migração de dado dentro do JSON já armazenado e mudança de DTO/tipo TypeScript.
  - Este é o maior e mais arriscado dos itens de polimento levantados junto com a ADR 0020: mexe no formato de dado que a geração de currículo já consome (`perfilParaIa`) e tem registros reais de usuário no banco no formato antigo. Por isso fica em fase e ADR própria, para não misturar risco de migração de dado com o polimento leve de UI da `spec-v1.9.0`.

## Decisão

### 1. Contato vira três grupos tipados mais um endereço à parte

`PerfilMestre.contato` deixa de ser uma lista plana de sete tipos e passa a três coleções mais um objeto:

- `emails: { id, valor, principal }[]`, com exatamente um marcado `principal` quando a lista não está vazia; a geração de currículo só usa o principal no cabeçalho, os demais ficam disponíveis no perfil mas fora do currículo.
- `telefones: { id, ddi, numero, principal }[]`, mesmo conceito de principal; `ddi` vem de um seletor de prefixo de país com bandeira (lista fechada de países, não texto livre).
- `links: { id, tipo, url }[]`, com `tipo` fechado em `linkedin | github | facebook | instagram | site`, um campo por tipo já sugerido na UI (o candidato preenche o que tiver, não escolhe "tipo" de uma lista solta).
- `endereco: { pais, estado, cidade, bairro?, logradouro?, complemento? } | null`, campo próprio, não mais um item dentro de `contato`. `pais`, `estado` e `cidade` vêm de listas (país fixo, estado condicionado ao país, cidade como busca/lista), não texto livre. A geração de currículo usa só `cidade` e a sigla de `estado` (ex.: "Fortaleza, CE"), igual ao padrão já usado no legado da pipeline `geracurriculo`.

O fluxo de edição de Contato no Perfil deixa de ser um modal único genérico "tipo + valor" e passa a seguir o padrão de lista com "principal" e "adicionar mais", coerente com o texto do usuário: selecionar e-mails com um principal e um "+" para adicionar mais, o mesmo para telefones, os campos de rede social já nomeados individualmente, e o endereço como formulário de campos fixos.

### 2. Formação e certificação viram listas de objetos, editadas em modal como Contato/Experiência já são

`formacao: string[]` vira `formacao: { id, grau, status, instituicao, curso, inicioMes, inicioAno, fimMes?, fimAno? }[]`. `status` é um enum fechado (ex.: `concluido | em_andamento | trancado`). `certificacoes: string[]` vira `certificacoes: { id, titulo, descricao }[]`. Ambas ganham modal de adicionar/editar no mesmo padrão que `abrirContato`/`abrirExperiencia` já usam (não mais um `<Textarea>` de uma linha por item).

### 3. Experiência: local estruturado, período com início/fim e "emprego atual", sem campo de tecnologias

`ExperienciaPerfil.local` deixa de ser texto livre e passa a usar a mesma lista de cidade/estado do endereço de Contato. `ExperienciaPerfil.periodo` (string livre) vira `dataInicioMes`, `dataInicioAno`, `dataFimMes?`, `dataFimAno?`, mais `atual: boolean`; quando `atual` é verdadeiro, os campos de fim ficam desabilitados e a experiência exibe "Atual" no lugar da data de término. O campo `tecnologias` é removido do formulário e do tipo: o candidato já registra tecnologia e competência dentro de `descricao`, e manter os dois é redundante e cria divergência entre o que a descrição diz e o que a lista de tecnologias lista.

### 4. Dado legado migra por normalização na leitura, não por migração de schema

Como todos esses campos são `Json` no Postgres, não há migração de coluna. Existe migração de forma: ao ler um `PerfilMestre` do formato antigo (contato plano com os sete tipos antigos; `formacao`/`certificacoes` como `string[]`; `experiencia.periodo`/`.local` como texto livre), o backend normaliza para o formato novo antes de devolver à UI, no mesmo espírito do backfill de taxonomia de oportunidades da P8b: contato antigo tipo `email`/`telefone`/`linkedin`/`github`/`site` vira o primeiro item da coleção nova correspondente, marcado `principal`; `localizacao` antiga vira `endereco.cidade` se for só uma string simples parseável, ou fica preservada como está e sinalizada para o candidato revisar, nunca descartada; formação e certificação antigas em texto livre viram um item cujo único campo preenchido é o que existir de estruturado (ex.: `curso` ou `titulo` recebe a linha inteira), sinalizado como "formato antigo, revise" até o candidato editar; experiência com `periodo`/`local` livres mantém os textos antigos legíveis (exibidos como estavam) até o candidato reabrir e preencher os campos estruturados, sem apagar o dado por trás enquanto isso não acontece.

## Justificativa

- Separar contato em coleções tipadas com "principal" resolve o problema concreto que o usuário levantou: hoje não há como dizer qual e-mail ou telefone deve aparecer no cabeçalho do currículo quando existe mais de um.
- Prefixo de país com bandeira e país/estado/cidade como listas evita erro de digitação e dado inconsistente que a geração de currículo teria que adivinhar; a regra de ouro de antialucinação (ADR 0012, `spec-v1.7.0` §5) já exige que a geração confie no dado factual do usuário, então esse dado precisa ser confiável na origem.
- Remover o campo de tecnologias da experiência elimina uma fonte de divergência (o candidato pode escrever uma tecnologia na lista que não está sustentada pela descrição), o que é exatamente o tipo de risco que a antialucinação genérica por usuário da P9-fix tenta evitar.
- Migrar por normalização na leitura, sem tocar o schema Prisma, é a mudança de menor risco possível para dado de produção já existente: nenhuma coluna muda de tipo, nenhum `ALTER TABLE`, e o pior caso de uma normalização mal-sucedida é o campo aparecer como "revise", nunca perda de dado.
- Separar esta decisão da ADR 0020 mantém o lote de polimento leve (P10) pequeno e de baixo risco, e isola o lote que mexe em dado de perfil real (P11) para poder validar migração e UI de formulário sem acoplar aos outros cinco pontos.

## Consequências

- `apps/web/src/api.ts`: `ContatoPerfil`, `ExperienciaPerfil` e `PerfilMestre` mudam de forma; nenhum tipo é reaproveitado sem alteração.
- `apps/web/src/PerfilForm.tsx`: as seções Contato, Formação, Experiência e Certificações mudam de UI (listas com principal, modais estruturados, seletores de país/estado/cidade e de prefixo telefônico).
- `apps/api/src/perfil/*`: DTO e normalização (`perfil.dto.ts`, `perfil.normalizacao.ts`) ganham a lógica de leitura com migração do formato antigo para o novo; nenhuma migration Prisma é necessária porque os campos continuam `Json`.
- A geração de currículo (`apps/ai-service`, `perfilParaIa`) passa a consumir e-mail/telefone principal, endereço estruturado (cidade + sigla do estado) e experiência com datas estruturadas, sem quebrar a antialucinação genérica por usuário já fixada na P9-fix.
- A `spec-v1.10.0` seção correspondente registra os critérios de aceitação desta ADR, numerados a partir de CA74.
