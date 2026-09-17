# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.5.0 |
| **Status** | Draft |
| **Data** | 2026-09-14 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Organização pessoal de oportunidades para candidatos desenvolvedores |
| **Base** | Estende `spec-v1.0.0.md` a `spec-v1.4.0.md` |

> MINOR compatível. Reorganiza o produto em torno da oportunidade do candidato, adiciona agenda, histórico, Workspace, biblioteca global de currículos e Pipeline com Kanban, Canvas e Grafo. CA1 a CA31 continuam válidos. Esta versão adiciona CA32 a CA48.

## 1. Identidade do produto

O PRDAL Careers é um organizador pessoal de vagas para candidatos desenvolvedores. O usuário encontra uma vaga fora do sistema, registra ou importa a publicação, decide se quer acompanhá-la, gera um currículo ATS específico, candidata-se externamente e usa o produto para conduzir o processo.

O único usuário do produto é o candidato. Empresa e recrutador são contexto da oportunidade, nunca perfis com acesso. O produto não publica vagas, não recebe candidaturas em nome de empresas e não forma um ATS para recrutamento.

Currículo ATS, LLM, RAG, Obsidian, score e documentos são recursos dentro do ciclo da oportunidade. Eles não substituem o objetivo principal de organizar vagas, decisões e próximos passos.

## 2. Problema

As versões anteriores entregam as capacidades essenciais, mas a experiência ainda reproduz a divisão técnica:

- Banco de vagas representa entradas cruas no MongoDB.
- Vagas representa registros operacionais no PostgreSQL.
- Candidaturas vive em um Kanban separado.
- Currículos são acessados por vaga ou pelo dashboard de score.
- Conhecimento e Perfil aparecem como ferramentas independentes.

O candidato precisa atravessar telas e reconstruir mentalmente o ciclo de uma mesma vaga. Também não existe próxima ação, lembrete interno, timeline ou uma forma de observar todas as oportunidades por setor, prioridade e relação.

## 3. Objetivo

Transformar as capacidades atuais em um workspace coerente para o candidato:

1. começar o dia sabendo o que exige atenção;
2. registrar, triar, setorizar e ordenar oportunidades;
3. concentrar currículo, candidatura, ações e histórico em um Workspace;
4. gerar currículo ATS em três etapas compreensíveis;
5. visualizar as mesmas oportunidades em Kanban, Canvas e Grafo;
6. preservar Perfil e Conhecimento como fontes confiáveis da geração.

## 4. Escopo

### Entra

1. Navegação Hoje, Oportunidades, Pipeline, Currículos, Conhecimento e Perfil.
2. Oportunidade como conceito unificado sobre entrada Mongo e vaga relacional.
3. Workspace completo da oportunidade.
4. Próximos passos e lembretes internos.
5. Timeline append-only.
6. Vínculo validado e visível entre candidatura e currículo.
7. Geração de currículo ATS em três etapas.
8. Pipeline com Kanban, Canvas manual persistente e Grafo derivado.
9. Biblioteca global de currículos.
10. Rotas profundas recarregáveis.
11. Evolução das telas Hoje, Conhecimento e Perfil.
12. Contratos aditivos, migrações e compatibilidade com rotas anteriores.

### Não entra

- Portal, conta ou interface de empresa e recrutador.
- Job board, descoberta ou recomendação automática de vagas.
- Scraping, extensão de navegador ou integração com LinkedIn.
- Candidatura ou envio de currículo automático.
- Automação n8n, execução de nós ou gatilhos no Canvas.
- Conexões manuais, formas livres e colaboração no Canvas.
- Banco de grafos, grafo editável ou relações produzidas por LLM.
- Chat genérico com a base de conhecimento.
- E-mail, calendário, WhatsApp, SMS ou notificação push.
- Assistente de mensagens para recrutadores.
- Novo microsserviço.

## 5. Decisões preservadas e novas

### Preservadas

- ADR 0001: a `api` continua como único BFF e orquestrador.
- ADR 0004: PostgreSQL guarda o núcleo relacional e MongoDB guarda conteúdo documental.
- ADR 0005: score ATS continua determinístico e explicável.
- ADR 0009: processamento em lote permanece in-process nesta fase.
- ADR 0010: SCSS e primitivas próprias continuam como padrão do `web`.
- ADR 0011: categoria e nível continuam determinísticos.
- ADR 0012: RAG usa dados do aplicativo e notas Markdown opcionais.

### Novas

- ADR 0013: Oportunidade como agregado do candidato.
- ADR 0014: agenda e histórico da oportunidade.
- ADR 0015: Pipeline multivisual de oportunidades.
- ADR 0016: renderers do Pipeline.

## 6. Arquitetura de informação

### 6.1 Navegação principal

1. **Hoje:** agenda operacional.
2. **Oportunidades:** entrada, ativas e encerradas.
3. **Pipeline:** Kanban, Canvas e Grafo.
4. **Currículos:** biblioteca transversal.
5. **Conhecimento:** fontes usadas pelo RAG.
6. **Perfil:** fonte canônica do histórico profissional.

O Workspace não aparece na sidebar. Ele é aberto a partir de qualquer representação de uma oportunidade.

### 6.2 Rotas do web

- `/hoje`
- `/oportunidades`
- `/oportunidades/:id`
- `/oportunidades/:id/curriculos/:curriculoId`
- `/pipeline?modo=kanban`
- `/pipeline?modo=canvas`
- `/pipeline?modo=grafo`
- `/curriculos`
- `/conhecimento`
- `/perfil`

Reload, botões do navegador e deep link preservam a tela e o identificador. Busca, filtros relevantes e modo do Pipeline vivem na URL.

## 7. Modelo de domínio

### 7.1 Oportunidade

`Vaga` permanece como nome físico no PostgreSQL. Na API e na interface, ela é uma Oportunidade.

Campos aditivos:

```prisma
enum PrioridadeOportunidade {
  BAIXA
  MEDIA
  ALTA
}

enum OrigemOportunidade {
  MANUAL
  IMPORTACAO
}

model Vaga {
  prioridade         PrioridadeOportunidade @default(MEDIA)
  origem             OrigemOportunidade     @default(MANUAL)
  origemImportacaoId String?
  atualizadoEm       DateTime                @updatedAt
  arquivadaEm        DateTime?

  @@unique([usuarioId, origemImportacaoId])
}
```

Apresentação derivada:

- `ENTRADA`: documento Mongo ainda não ativado.
- `ATIVA`: oportunidade relacional não arquivada e sem candidatura rejeitada ou desistida.
- `ENCERRADA`: oportunidade arquivada ou candidatura em `REJEITADA` ou `DESISTIU`.

`OFERTA` permanece ativa até decisão explícita do candidato.

### 7.2 Candidatura e currículo

Uma oportunidade pode possuir no máximo uma candidatura principal na experiência da v1.5. Candidaturas anteriores permanecem preservadas para compatibilidade:

```prisma
model Candidatura {
  principal           Boolean  @default(false)
  enviadaEm          DateTime?
  encerradaEm        DateTime?
  motivoEncerramento String?
  criadoEm           DateTime @default(now())
}
```

Um índice único parcial por `vagaId` quando `principal = true` garante no máximo uma candidatura principal. O endpoint legado `POST /candidaturas` continua aceitando novos registros conforme a v1.2 e os cria com `principal = false`. A nova operação da oportunidade cria ou devolve a candidatura principal de forma idempotente.

`curriculoId` continua nullable. Isso permite registrar candidatura feita com currículo externo ou sem artefato cadastrado. Quando informado:

- o currículo pertence à mesma oportunidade;
- a oportunidade pertence ao mesmo usuário;
- a resposta mostra rótulo, score e situação do vínculo;
- toda troca registra os identificadores anterior e novo na timeline.

Excluir um currículo vinculado não é permitido. Editar uma versão vinculada continua atualizando a versão conforme a v1.1, mas a timeline registra a edição.

### 7.3 Ações e lembretes

```prisma
enum TipoAcaoOportunidade {
  REVISAR_VAGA
  GERAR_CURRICULO
  ENVIAR_CANDIDATURA
  FAZER_FOLLOW_UP
  PREPARAR_ENTREVISTA
  PARTICIPAR_ENTREVISTA
  ENVIAR_MATERIAL
  OUTRO
}

model AcaoOportunidade {
  id            String   @id @default(uuid())
  usuarioId     String
  vagaId        String
  candidaturaId String?
  titulo        String
  tipo          TipoAcaoOportunidade
  principal     Boolean  @default(false)
  venceEm       DateTime?
  lembrarEm     DateTime?
  concluidaEm   DateTime?
  canceladaEm   DateTime?
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt
}
```

Uma oportunidade pode possuir várias ações, mas somente uma pendente é principal. Um índice único parcial no PostgreSQL protege essa regra quando `principal = true`, `concluidaEm IS NULL` e `canceladaEm IS NULL`. Lembrete é uma capacidade da ação, não uma entidade paralela. `lembrarEm` não pode ser posterior a `venceEm`.

### 7.4 Timeline

```prisma
enum OrigemEvento {
  SISTEMA
  USUARIO
}

model EventoOportunidade {
  id            String       @id @default(uuid())
  usuarioId     String
  vagaId        String
  candidaturaId String?
  curriculoId   String?
  tipo          String
  origem        OrigemEvento
  descricao     String
  dados         Json
  ocorridoEm    DateTime
  registradoEm  DateTime     @default(now())
}
```

Eventos são append-only e pertencem à oportunidade. O índice principal usa `(usuarioId, vagaId, ocorridoEm)`. O JSON guarda somente deltas e referências necessários.

### 7.5 Layout do Canvas

```prisma
model PipelineLayout {
  id        String   @id @default(uuid())
  usuarioId String
  vagaId    String
  modo      String
  posX      Float
  posY      Float
  criadoEm  DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  @@unique([usuarioId, vagaId, modo])
}
```

Preferências do usuário:

```prisma
model PreferenciaUsuario {
  usuarioId       String   @id
  fusoHorario     String
  canvasX         Float    @default(0)
  canvasY         Float    @default(0)
  canvasZoom      Float    @default(1)
  canvasRevisao   Int      @default(1)
  atualizadoEm    DateTime @updatedAt
}
```

`fusoHorario` usa identificador IANA. Instantes permanecem em UTC. O web envia o fuso detectado no primeiro acesso autenticado e o usuário pode corrigi-lo em Perfil. O Grafo não recebe tabela.

### 7.6 Geração de currículo

O `jobId` já previsto na v1.0 passa a identificar uma operação consultável:

```prisma
enum StatusGeracaoCurriculo {
  PENDENTE
  ANALISANDO
  GERANDO
  VALIDANDO
  CONCLUIDA
  ERRO
}

model GeracaoCurriculo {
  id          String                  @id @default(uuid())
  usuarioId   String
  vagaId      String
  curriculoId String?
  status      StatusGeracaoCurriculo @default(PENDENTE)
  erro        String?
  criadoEm    DateTime                @default(now())
  atualizadoEm DateTime               @updatedAt
}
```

`ANALISANDO`, `GERANDO` e `VALIDANDO` correspondem às etapas de processamento. `curriculoId` é preenchido na conclusão. Revisão e exportação são ações da terceira etapa da interface depois de `CONCLUIDA`. O processamento reutiliza o worker in-process e as fronteiras existentes.

## 8. Áreas do produto

### 8.1 Hoje

Hoje substitui o Dashboard como entrada principal e responde o que o candidato precisa fazer.

Regiões:

- atrasados;
- hoje;
- próximos sete dias;
- oportunidades ativas sem ação principal;
- atividade recente;
- métricas ATS como contexto secundário.

Ações rápidas: concluir, reagendar, cancelar, abrir oportunidade e definir próximo passo.

Estados: primeiro acesso, dia sem pendências, oportunidades sem ações, erro parcial, dados desatualizados e offline.

### 8.2 Oportunidades

Inventário único com três visões:

- **Entrada:** postagens importadas ainda não ativadas;
- **Ativas:** oportunidades em preparação, candidatura ou processo;
- **Encerradas:** rejeitadas, desistidas ou arquivadas.

Cada item mostra título, empresa, categoria, nível, prioridade, etapa, currículo vinculado, score ATS quando existir, próximo passo e última atividade.

Ordenações:

- prioridade;
- score ATS;
- correspondência de keywords;
- etapa;
- atividade recente;
- prazo do próximo passo.

Não existe número universal de ranking. Cada ordenação informa o critério usado.

Captura individual pede título, empresa, descrição e fonte opcional. Importação JSON permanece em disclosure avançado. Ativação de entrada é idempotente.

### 8.3 Workspace da oportunidade

O Workspace concentra:

- cabeçalho com título, empresa, categoria, nível, prioridade e etapa;
- descrição original e keywords;
- geração e versões de currículo;
- candidatura e currículo vinculado;
- próximo passo e demais ações;
- timeline completa.

A superfície é contínua, com navegação interna e inspetor contextual fixo. Regiões não viram cards por padrão. Modal é reservado a confirmação destrutiva curta.

A ação dominante acompanha o estado:

- sem currículo: gerar currículo;
- com currículo e sem candidatura: preparar candidatura;
- candidatura em rascunho: registrar envio;
- processo ativo: registrar atualização;
- sem próximo passo: definir próximo passo.

### 8.4 Geração de currículo ATS

A geração é apresentada em três etapas:

1. **Analisar vaga e recuperar contexto:** confirmar descrição e keywords, consultar Perfil, RAG e notas do Obsidian.
2. **Gerar currículo:** usar LLM com saída validada para produzir Markdown aterrado no histórico real.
3. **Validar, revisar e exportar:** calcular score ATS determinístico, apresentar breakdown, permitir edição e gerar DOCX e PDF.

O LLM gera texto e o algoritmo mede. Falha no RAG permite geração sem chunks. Falha no Doc Service mantém Markdown e score. Saída inválida do LLM segue retry e fallback da ADR 0003.

### 8.5 Pipeline

Os três modos usam o mesmo conjunto filtrado de oportunidades relacionais. Entradas cruas permanecem na triagem de Oportunidades até serem ativadas.

#### Kanban

Colunas:

- Preparação, para oportunidade ativa sem candidatura ou candidatura em rascunho;
- Inscrita;
- Em processo;
- Entrevista;
- Oferta;
- Encerradas, agrupando rejeitada, desistiu e arquivada sem apagar o motivo.

Mover de coluna atualiza o dado canônico e registra evento. Select ou ação textual equivalente permanece disponível.

#### Canvas

Cada oportunidade é um nó posicionável. O usuário usa pan, zoom, fit, busca e inspetor. Posição e viewport sobrevivem a reload. Mover nó não muda etapa nem prioridade. Não existem conexões autorais, portas, automações ou execução.

#### Grafo

O Grafo conecta oportunidades a empresas, categorias, níveis, skills, keywords, currículos e documentos de conhecimento. As relações são determinísticas e read-only. Selecionar uma oportunidade abre o mesmo inspetor e permite navegar ao Workspace.

#### Filtros compartilhados

- texto;
- apresentação;
- status da candidatura;
- categoria;
- nível;
- empresa;
- prioridade;
- existência de currículo;
- faixa de score;
- prazo;
- atividade recente.

Canvas e Grafo oferecem lista textual equivalente. No mobile, lista e Kanban são os caminhos operacionais prioritários.

#### Transições

O comando de transição atua sobre a oportunidade, valida origem e destino e resolve o efeito correto:

| Origem | Destinos permitidos |
|---|---|
| `PREPARACAO` | `INSCRITA`, `ARQUIVADA` |
| `INSCRITA` | `PREPARACAO`, `EM_PROCESSO`, `ENTREVISTA`, `OFERTA`, `REJEITADA`, `DESISTIU`, `ARQUIVADA` |
| `EM_PROCESSO` | `INSCRITA`, `ENTREVISTA`, `OFERTA`, `REJEITADA`, `DESISTIU`, `ARQUIVADA` |
| `ENTREVISTA` | `EM_PROCESSO`, `OFERTA`, `REJEITADA`, `DESISTIU`, `ARQUIVADA` |
| `OFERTA` | `ENTREVISTA`, `REJEITADA`, `DESISTIU`, `ARQUIVADA` |
| `REJEITADA` | `PREPARACAO` |
| `DESISTIU` | `PREPARACAO` |
| `ARQUIVADA` | `REABRIR` |

Efeitos:

- entrar em Preparação sem candidatura cria a principal em `RASCUNHO`;
- voltar de Inscrita para Preparação muda a principal para `RASCUNHO` e limpa `enviadaEm`;
- voltar de Rejeitada ou Desistiu para Preparação retira `principal` da candidatura encerrada e cria outra principal, preservando o histórico;
- entrar em Inscrita define `enviadaEm` quando ausente;
- Em processo, Entrevista e Oferta exigem candidatura principal;
- Rejeitada e Desistiu registram motivo opcional e `encerradaEm`;
- Arquivada define `arquivadaEm` sem apagar o status da candidatura;
- Reabrir remove `arquivadaEm` e restaura a apresentação derivada do status subjacente.

Qualquer par não listado responde `409`. Arquivamento tem precedência na apresentação Encerrada.

### 8.6 Currículos

A biblioteca global mostra todos os currículos agrupáveis por oportunidade:

- rótulo;
- oportunidade e empresa;
- score e breakdown resumido;
- data de geração;
- vínculo com candidatura;
- downloads disponíveis.

Filtros: oportunidade, score, vínculo e período. Comparação permanece limitada a versões da mesma oportunidade.

### 8.7 Conhecimento

A tela mostra:

- quantidade total de documentos;
- última indexação;
- distribuição por perfil, candidatura e nota;
- estado do Chroma;
- reindexação;
- upload Markdown;
- progresso e erros por lote.

Conhecimento não vira editor de notas, chat ou grafo autônomo.

### 8.8 Perfil

Perfil é exibido em modo leitura por padrão e editado por seção:

- identidade;
- contato;
- resumo;
- experiências;
- formação;
- skills.

Uma seção é editada por vez. Após alteração, o produto informa que o índice pode estar desatualizado e oferece reindexação explícita. Não há reindexação automática nesta fase.

## 9. Fluxos principais

### 9.1 Registrar e priorizar

1. O candidato captura uma vaga ou importa um lote.
2. O sistema extrai keywords e classifica categoria e nível.
3. O candidato tria a Entrada.
4. Ativa a oportunidade.
5. Define prioridade e próximo passo.
6. A oportunidade aparece em Hoje e no Pipeline.

### 9.2 Preparar currículo

1. O candidato abre o Workspace.
2. Confirma vaga, Perfil e estado do Conhecimento.
3. Executa as três etapas da geração ATS.
4. Revisa Markdown, score e breakdown.
5. Exporta DOCX ou PDF.
6. Pode vincular a versão à candidatura.

### 9.3 Registrar candidatura

1. O candidato cria a candidatura em preparação.
2. Vincula um currículo cadastrado ou informa que o currículo não está registrado.
3. Registra o envio externo e a data.
4. Muda o status para Inscrita.
5. Define próximo passo.
6. A timeline registra a sequência.

### 9.4 Conduzir processo

1. Hoje apresenta uma ação vencida ou próxima.
2. O candidato abre o Workspace.
3. Registra atualização e altera a etapa quando necessário.
4. Conclui a ação.
5. Cria a ação seguinte.

### 9.5 Encerrar

1. O candidato escolhe rejeitada, desistiu ou arquivamento.
2. Informa motivo opcional.
3. Decide cancelar ou manter ações pendentes.
4. A timeline registra o encerramento.
5. Currículos e histórico permanecem acessíveis.

## 10. Contratos da API

Todos os endpoints exigem usuário autenticado e isolam dados por `usuarioId`.

### 10.1 Hoje e preferências

- `GET /hoje?de=&ate=`: responde `{ fusoHorario, inicioDia, fimDia, atrasadas, hoje, proximosDias, semProximoPasso, atividadeRecente, resumoAts }`. `de` e `ate` são datas civis `YYYY-MM-DD` interpretadas no fuso IANA do usuário.
- `GET /preferencias`: responde fuso IANA e preferências do Canvas.
- `PATCH /preferencias`: aceita `{ fusoHorario? }`; viewport é salvo pelo contrato do Canvas.

Quando `de` e `ate` não são enviados, a API calcula os limites no fuso do usuário e consulta os instantes equivalentes em UTC.

### 10.2 Oportunidades

- `GET /oportunidades?visao=&busca=&categoria=&nivel=&prioridade=&ordenarPor=`: lista entradas e oportunidades em shape discriminado.
- `POST /oportunidades`: cria oportunidade manual.
- `POST /oportunidades/importar`: alias de produto para importação em lote.
- `POST /oportunidades/entradas/{id}/ativar`: ativa entrada de forma idempotente.
- `GET /oportunidades/{id}`: detalhe da oportunidade relacional.
- `PATCH /oportunidades/{id}`: edita campos, prioridade ou arquivamento.
- `GET /oportunidades/{id}/workspace`: responde oportunidade, candidatura, currículos, ação principal, ações e timeline recente.
- `POST /oportunidades/{id}/candidatura-principal`: cria ou devolve a candidatura principal.
- `POST /oportunidades/{id}/transicoes`: req `{ destino, motivo? }`; aplica a matriz da seção 8.5 e responde oportunidade, candidatura principal e evento.

Entradas Mongo não possuem Workspace completo antes da ativação.

### 10.3 Ações

- `GET /oportunidades/{id}/acoes`
- `POST /oportunidades/{id}/acoes`
- `PATCH /acoes/{id}`
- `POST /acoes/{id}/concluir`
- `POST /acoes/{id}/cancelar`

Criação e atualização validam principal única, datas e propriedade do usuário.

### 10.4 Timeline

- `GET /oportunidades/{id}/timeline?cursor=&limite=`
- `POST /oportunidades/{id}/timeline/notas`

Não existe POST público de evento de sistema.

### 10.5 Currículos e candidaturas

- `GET /curriculos?vagaId=&scoreMinimo=&vinculado=&de=&ate=`: listagem global enriquecida.
- `POST /oportunidades/{id}/gerar-cv`: inicia a operação e responde `202 { jobId }`.
- `GET /geracoes-curriculo/{jobId}`: responde `{ id, vagaId, status, erro, curriculoId }`; a etapa de processamento é derivada de `status`.
- `POST /candidaturas`: mantém integralmente o contrato legado, inclusive a possibilidade de outro registro.
- `GET /candidaturas`: mantém o contrato e inclui resumo do currículo e próximo passo.
- `PATCH /candidaturas/{id}`: valida o vínculo do currículo e registra timeline.

`POST /vagas/{id}/gerar-cv` permanece como alias e também devolve um `jobId` consultável.

### 10.6 Pipeline

- `GET /pipeline?busca=&apresentacao=&statusCandidatura=&categoria=&nivel=&empresa=&prioridade=&comCurriculo=&scoreMinimo=&prazo=&atividadeDesde=&ordenarPor=`: retorna resumos de oportunidades relacionais para Kanban, Canvas e lista.
- `GET /pipeline/canvas`: retorna o layout completo, sem aplicar filtros de dados, e responde `{ revisao, viewport: { x, y, zoom }, posicoes: [{ vagaId, x, y }] }`.
- `PUT /pipeline/canvas`: req `{ revisaoBase, viewport: { x, y, zoom }, posicoes: [{ vagaId, x, y }] }`; substitui o layout completo, incrementa a revisão e responde `409` quando `revisaoBase` estiver obsoleta.
- `GET /pipeline/grafo` com o mesmo DTO de filtros: responde `{ schemaVersion, nodes, edges, facets }` com IDs estáveis.

`PipelineFiltrosDto` e `PipelineOrdenacao` são compartilhados por `GET /pipeline` e `GET /pipeline/grafo`. O Canvas aplica filtros aos dados recebidos de `GET /pipeline`, mas lê e salva o layout completo separadamente para não remover posições ocultas. O `schemaVersion` do Grafo identifica as regras de normalização e arestas da ADR 0015.

### 10.7 Conhecimento

`GET /contexto/status` passa a incluir:

```json
{
  "documentos": 0,
  "ultimaIndexacao": null,
  "porOrigem": {
    "perfil": 0,
    "candidatura": 0,
    "nota": 0
  },
  "disponivel": true
}
```

Nenhum contrato central do `ai-service` ou `doc-service` muda.

### 10.8 Compatibilidade

As rotas `/vagas`, `/banco-vagas`, `/dashboard` e os endpoints atuais de currículos e candidaturas permanecem funcionais. A documentação marca os aliases antigos como legados, sem remoção na v1.5.

## 11. Requisitos funcionais

- **RF20** O candidato vê em Hoje ações atrasadas, do dia, futuras e oportunidades sem próximo passo.
- **RF21** O candidato acessa entradas, oportunidades ativas e encerradas em uma área única.
- **RF22** Toda oportunidade relacional possui Workspace com currículo, candidatura, ações e timeline.
- **RF23** O candidato cria, conclui, cancela e reagenda ações com lembrete interno.
- **RF24** Alterações relevantes geram eventos append-only.
- **RF25** A geração ATS apresenta análise, geração e validação como três etapas.
- **RF26** O candidato visualiza as oportunidades em Kanban, Canvas e Grafo.
- **RF27** O Canvas preserva posição e viewport por usuário.
- **RF28** O Grafo deriva relações de dados canônicos e classificação determinística.
- **RF29** O candidato lista e filtra currículos de todas as oportunidades.
- **RF30** O vínculo candidatura e currículo é validado, visível e opcional.
- **RF31** Conhecimento mostra distribuição por origem e Perfil sinaliza índice desatualizado.

## 12. Requisitos não funcionais

- **RNF15 Isolamento:** toda consulta e mutação valida `usuarioId`, inclusive layouts, ações, eventos e relações de grafo.
- **RNF16 Idempotência:** ativação, criação da candidatura principal e persistência versionada de layout toleram retry sem duplicação.
- **RNF17 Histórico:** mutação relacional e evento são atômicos na mesma transação PostgreSQL; operações entre stores são reconciliáveis por retry.
- **RNF18 Consistência visual:** os três modos do Pipeline usam a mesma busca, filtros e dados canônicos.
- **RNF19 Performance:** o Pipeline valida 500 nós e 1.000 arestas; renderers são lazy e ForceAtlas2 não bloqueia a thread principal.
- **RNF20 Acessibilidade:** Canvas e Grafo possuem alternativa textual, controles nomeados, foco visível e operação sem arraste.
- **RNF21 Responsividade:** fluxos funcionam em 375, 768, 1024 e 1440px sem scroll horizontal da página.
- **RNF22 Degradação:** falhas em RAG, Doc Service ou projeção de Grafo não bloqueiam organização, candidatura ou Kanban.
- **RNF23 Privacidade:** timeline não duplica corpo integral de currículo, vaga ou notas em payloads.
- **RNF24 Design:** a interface segue `docs/design-system.md`, ADR 0010 e a blocklist anti AI slop.

## 13. Estados transversais

Cada área cobre:

- loading inicial e parcial;
- vazio inicial e vazio após filtro;
- sucesso e validação;
- erro recuperável por região;
- processamento em lote;
- dados desatualizados;
- serviço de IA indisponível;
- documentos indisponíveis;
- conhecimento indisponível;
- sessão expirada;
- shell offline da PWA.

Atualização otimista de status ou posição reverte quando a persistência falha. Feedback aparece junto à ação.

## 14. Migração e dados existentes

Ordem:

1. expandir o schema com campos nullable de oportunidade e candidatura;
2. criar preferências, ações, eventos, layouts e gerações de currículo;
3. criar índices comuns e o índice parcial de ação principal;
4. preencher vagas existentes com prioridade média e origem manual;
5. marcar como principal somente a candidatura mais recente de cada oportunidade, preservando todas as anteriores;
6. criar o índice parcial que permite uma única candidatura principal por oportunidade;
7. disponibilizar os contratos novos sem remover os antigos;
8. adicionar vínculo de origem nos documentos Mongo;
9. manter entradas ativadas antigas sem associação quando não houver identificador confiável.

Não associar automaticamente registros antigos apenas por título e empresa. Uma ferramenta de reconciliação futura pode pedir confirmação do usuário.

## 15. Ordem futura de implementação

1. Migrações e tipos compartilhados.
2. Oportunidades e ativação idempotente.
3. Ações, Hoje e timeline.
4. Workspace e rotas profundas.
5. Fluxo ATS em três etapas e vínculo de currículo.
6. Biblioteca global de currículos.
7. Pipeline base e Kanban.
8. Canvas e persistência.
9. Grafo e projeção determinística.
10. Conhecimento e Perfil.
11. Compatibilidade, deprecações documentadas e validação completa.

## 16. Critérios de aceitação

- **CA32** A interface e a documentação deixam claro que o produto pertence ao candidato e não oferecem função de empresa ou recrutador.
- **CA33** Oportunidades reúne Entrada, Ativas e Encerradas sem expor MongoDB ou PostgreSQL.
- **CA34** Ativar a mesma entrada mais de uma vez devolve a mesma oportunidade e não duplica registros.
- **CA35** Hoje usa o fuso IANA do candidato para ordenar ações atrasadas, do dia e futuras e identifica oportunidades ativas sem ação principal.
- **CA36** O Workspace reúne descrição, currículos, candidatura, ações e timeline da mesma oportunidade.
- **CA37** O candidato cria, reagenda, conclui e cancela ações; lembretes internos aparecem no momento correto.
- **CA38** Criação, edição relevante, vínculo de currículo, mudança de status e conclusão de ação geram eventos imutáveis.
- **CA39** A geração expõe job consultável nos estados Analisando, Gerando e Validando; após conclusão, a terceira etapa permite revisão e exportação do currículo.
- **CA40** Falha no RAG não bloqueia geração e falha no Doc Service mantém Markdown e score.
- **CA41** A candidatura principal é idempotente e aceita currículo nulo; currículo informado pertence à mesma oportunidade e ao mesmo usuário; criação legada continua compatível.
- **CA42** Kanban, Canvas e Grafo mostram o mesmo subconjunto sob os mesmos filtros, e o comando de transição aplica a matriz definida.
- **CA43** O Canvas restaura posições e viewport após reload e mover nó não altera status implicitamente.
- **CA44** O Grafo publica a versão de seu schema e produz relações reproduzíveis sem LLM, Chroma como fonte de aresta ou banco de grafos.
- **CA45** Oportunidades podem ser setorizadas e ordenadas por critérios explícitos, sem ranking universal opaco.
- **CA46** Currículos lista versões de todas as oportunidades e identifica vínculo com candidatura.
- **CA47** Canvas e Grafo possuem alternativa textual e os fluxos passam por teclado e nos quatro breakpoints.
- **CA48** Rotas anteriores continuam funcionais e CA1 a CA31 não regridem.

## 17. Riscos

- **Escopo visual:** Canvas e Grafo podem consumir a fase. Mitigação: Kanban e lista continuam completos; renderers entram em sequência.
- **Candidaturas anteriores:** várias candidaturas podem existir para a mesma vaga. Mitigação: preservar todas e marcar somente a mais recente como principal.
- **Consistência entre stores:** ativação pode falhar entre Postgres e Mongo. Mitigação: Postgres primeiro, vínculo único e retry idempotente.
- **Grafo denso:** keywords podem gerar ruído. Mitigação: normalização, filtros e limite por relevância.
- **Carga inicial:** novas bibliotecas podem aumentar o bundle. Mitigação: lazy loading por modo.
- **Timeline sensível:** payload pode duplicar conteúdo pessoal. Mitigação: guardar somente deltas e referências.

## 18. Evolução futura registrada

Um módulo futuro de assistência a mensagens poderá ajudar o candidato a preparar e revisar conversas com recrutadores. O contexto poderá incluir descrição da vaga, requisitos comportamentais, Perfil, Conhecimento e timeline da candidatura.

Recrutadores continuarão sendo contexto, nunca usuários. Toda sugestão exigirá revisão e envio explícito do candidato. Captura de caixa de entrada, integrações e envio automático dependem de spec e ADR próprias com decisões de consentimento, privacidade, segurança e retenção.

## Changelog

- **1.5.0 (2026-09-14):** reposiciona o produto como organizador pessoal de oportunidades para desenvolvedores; adiciona Hoje, Oportunidades, Workspace, ações, lembretes internos, timeline, Pipeline multivisual, Currículos global e geração ATS em três etapas; preserva arquitetura e contratos anteriores.
