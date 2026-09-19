# PRDAL Careers, Especificacao Tecnica

| Campo | Valor |
|---|---|
| **Versao** | 1.9.10 |
| **Status** | Aceita |
| **Data** | 2026-09-19 |
| **Autor** | Gustavo Queiroz Mateus |
| **Dominio** | Polimento final de login, copiloto, grafo e tema |
| **Base** | Estende `spec-v1.9.9.md`; formalizada pela ADR 0031 |

> PATCH compativel. Reabre CA84-93 com exigencia de prova visual, corrige extracao de
> keywords institucionais, remove o modo Assistido do copiloto em favor de um unico
> modo com redacao assistida, corrige a simulacao de forca do grafo, adiciona paridade
> de ordenacao, revisa o rotulo do curriculo, o tema padrao, a cor de acento e a
> expiracao de sessao. CA1 a CA97 continuam validos, exceto CA69 e a clausula final de
> CA71, substituidas nesta versao. Esta versao adiciona CA98 a CA108.

## 1. Problema

Validacao manual de uma vaga real (FCamara, Desenvolvedor Back-End Java Jr) e revisao
geral da interface expuseram onze pontos. Ver ADR 0031 para o contexto completo,
causa-raiz por arquivo/linha e justificativa de cada decisao. Resumo:

1. Etapas e preview do curriculo nao aparecem no chat do copiloto, apesar de CA84-93
   e CA90/91 estarem declarados implementados.
2. `extract_keywords` aceita termos institucionais (pais, valores da empresa, frases
   de missao) como se fossem requisito tecnico quando o LLM funciona normalmente.
3. O copiloto tem dois modos (Assistido/Autopiloto) e nenhum cobre redacao assistida
   de formulario ou de mensagem ao recrutador, lacuna que a ADR 0018 ja registrava.
4. Arrastar um no do grafo desliga a simulacao de forca inteira
   (`OportunidadesGrafo.tsx:204`), nao so o no arrastado.
5. Grafo e board nao tem o controle de ordenacao que a lista ja tem.
6. O rotulo "Versao N" do curriculo gerado nao comunica nada sobre a vaga.
7. O tema padrao de primeira visita segue a preferencia do sistema operacional, nunca
   foi uma decisao de produto registrada.
8. `--accent` tem tons diferentes entre claro (`#2563eb`) e escuro (`#60a5fa`).
9. O botao "Definir proximo passo" esta fora do padrao de cor de acao primaria.
10. O campo de texto do login usa um anel de foco azul saturado sem relacao com o
    design system.
11. O token de acesso expira em 7 dias, sem refresh nem tratamento de 401 no cliente;
    nunca foi uma politica de seguranca revisada, e sim o default nao tocado do Nest.

## 2. Objetivo

1. Fechar o acompanhamento visual de geracao no chat do copiloto com prova real, nao
   so leitura de codigo.
2. Restringir keyword de vaga a natureza tecnica, por categoria positiva, nao por
   lista negativa de termos institucionais.
3. Consolidar o copiloto em um unico modo, cobrindo redacao assistida de formulario e
   de mensagem ao recrutador.
4. Corrigir a simulacao de forca do grafo para o padrao Obsidian real: only o no
   arrastado fica fixo, os demais continuam reagindo.
5. Igualar o controle de ordenacao entre lista, board e grafo.
6. Substituir o rotulo "Versao N" por identificacao da vaga.
7. Definir tema claro como padrao de primeira visita.
8. Unificar a cor de acento entre temas, preservando contraste.
9. Fechar a paridade de cor de acao primaria.
10. Remover o anel de foco azul saturado do login, preservando acessibilidade.
11. Revisar a politica de expiracao de sessao e o tratamento de sessao expirada no
    cliente.

## 3. Etapas do copiloto: reabertura com prova visual

CA84 a CA93 voltam ao estado "nao fechado". Fecham apenas quando existir evidencia
visual real anexada a `docs/ESTADO_ATUAL.md` (captura de tela ou gravacao) mostrando,
numa geracao real na interface: indicador unico e consolidado de progresso por
etapas como conteudo principal da mensagem (nao os cartoes brutos de chamada de
ferramenta com JSON atras de "Ocultar retorno"), narracao de Etapa 1 e Etapa 3 com os
graficos quando `analiseInicial.score` e `analiseFinal.score` estiverem presentes, e
um cartao de curriculo pronto com botao de baixar o pacote. Build e testes passando
continuam obrigatorios, mas nao substituem a prova visual.

## 4. Extracao de keywords por categoria tecnica

O schema de saida de `extract_keywords` ganha um campo de categoria por termo (`tipo`:
stack | ferramenta | metodologia | dominio_negocio | certificacao). O prompt exige
que o termo represente competencia tecnica, ferramenta, linguagem, framework,
metodologia, certificacao ou dominio de negocio explicito no requisito da vaga. Nome
de pais, adjetivo institucional (diversidade, etica, respeito, inovacao, missao) e
frase de employer branding nunca sao keyword valida, independente de destaque no
texto da vaga. Termo que nao se enquadrar em nenhuma categoria e descartado na
validacao pos-extracao; se nada restar, a vaga segue o fluxo de "sem keywords
extraidas" ja definido na ADR 0030.

## 5. Copiloto com um unico modo e redacao assistida

A UI remove a opcao "Assistido"; "Autopiloto" fica como unico modo, com o rotulo de
mais alto nivel da interface ajustado de acordo (nao deixar rotulo referenciando o
modo removido). O modo unico ganha dois casos de dialogo assistido: preenchimento de
formulario dirigido por conversa (usuario descreve o campo, o agente propoe valor a
partir do perfil-mestre e do contexto da vaga, usuario confirma ou corrige) e redacao
de mensagem ao recrutador ou resposta de formulario de candidatura a partir do
perfil-mestre e da descricao da vaga. Isso e redacao, nao envio: acao externa de
enviar continua exigindo confirmacao humana explicita (ADR 0018, principio 2).

## 6. Grafo: simulacao continua

`onArrastar` para de desligar `layoutAtivo` globalmente. Iniciar o arraste fixa
apenas o no arrastado (atributo do proprio no); o `FA2Layout` continua rodando para
os demais nos, que se reacomodam ao redor do no fixado. Soltar o no mantem a posicao
fixa ate a proxima recarga dos dados do grafo. O botao "Pausar layout" / "Retomar
layout" continua existindo como controle manual independente.

## 7. Ordenacao paritaria

Board e grafo de Oportunidades ganham o mesmo controle de ordenacao (campo e
direcao) que a lista ja tem, aplicado de forma consistente nas tres visualizacoes.

## 8. Rotulo do curriculo

O rotulo primario exibido passa a ser `{empresa} · {titulo da vaga}`; a partir da
segunda geracao para a mesma vaga, recebe o sufixo ` (regeracao N)`. O contador
`Versao N` pode continuar existindo como metadado interno, nao como rotulo primario
exibido.

## 9. Tema, cor de acento e consistencia visual

Primeira visita sem preferencia salva em `localStorage` resolve para tema `light`,
independente da preferencia do sistema operacional; alternancia manual do usuario
continua com prioridade absoluta. `--accent` usa o mesmo tom nos dois temas; se o tom
unico nao passar em contraste AA sobre o fundo escuro, ajustar `--accent-fg` no tema
escuro em vez de divergir o tom do acento. O botao "Definir proximo passo" e qualquer
outro botao de acao primaria ainda fora do padrao adotam `variant="accent"`. O campo
de texto do login troca o anel de foco azul saturado por um estado de foco neutro do
design system, sem remover a acessibilidade do foco visivel.

## 10. Expiracao de sessao

`expiresIn` do token de acesso muda de `7d` para `24h`. O cliente web trata resposta
`401` limpando o token e redirecionando para login com indicacao de sessao expirada,
em vez de falhar sem explicacao. Refresh token fica fora de escopo desta versao.

## 11. Criterios de aceitacao

- **CA98** Reabre CA84-93: uma geracao real de curriculo pela interface exibe um
  indicador unico de progresso por etapas como conteudo principal (nao JSON bruto
  como conteudo principal), narracao de Etapa 1 e Etapa 3 com graficos quando os
  scores estiverem presentes, e um cartao final com botao de baixar o pacote.
  Verificavel apenas por evidencia visual anexada (captura de tela ou gravacao).
- **CA99** Uma vaga com texto institucional extenso (missao, valores, paises de
  atuacao) tem keywords persistidas contendo somente termos de stack, ferramenta,
  metodologia, certificacao ou dominio de negocio explicito; nenhum nome de pais,
  adjetivo institucional ou frase de missao aparece na lista de keywords da vaga.
- **CA100** A UI do copiloto nao exibe mais a opcao "Assistido"; existe um unico modo
  visivel. Verificavel por inspecao da tela do copiloto.
- **CA101** No mesmo modo, o usuario consegue pedir ao agente para redigir uma
  mensagem ao recrutador ou preencher um campo de formulario a partir do
  perfil-mestre e da vaga em foco, recebendo o texto redigido no chat para revisar
  antes de qualquer uso externo; nenhuma acao de envio ocorre sem confirmacao
  explicita separada.
- **CA102** Arrastar um no do grafo fixa apenas esse no; os demais nos continuam se
  movendo pela simulacao de forca enquanto o layout estiver ativo. Verificavel
  arrastando um no e observando nos vizinhos se reacomodarem.
- **CA103** Board e grafo de Oportunidades oferecem o mesmo controle de ordenacao
  (campo e direcao) disponivel na lista.
- **CA104** O rotulo primario de um curriculo gerado exibido na tela de Curriculos e
  no chat do copiloto e `{empresa} · {titulo da vaga}`, com sufixo ` (regeracao N)`
  a partir da segunda geracao da mesma vaga; "Versao N" isolado deixa de ser o rotulo
  primario.
- **CA105** Uma sessao de navegador sem preferencia de tema salva abre em tema claro,
  independente da preferencia do sistema operacional; a alternancia manual anterior
  do usuario, se existir em `localStorage`, prevalece.
- **CA106** `--accent` tem o mesmo valor de cor nos temas claro e escuro; texto e
  icone sobre `--accent` no tema escuro atendem contraste minimo AA.
- **CA107** O botao "Definir proximo passo" no detalhe da vaga usa `variant="accent"`.
- **CA108** O campo de texto do formulario de login nao exibe mais o anel de foco
  azul saturado; o foco por teclado continua visivel por outro meio (contorno neutro
  perceptivel).
- **CA109** Um token de acesso emitido apos esta mudanca expira em 24 horas; uma
  chamada autenticada apos a expiracao recebe 401, e o cliente web limpa o token e
  redireciona para login com indicacao de sessao expirada, em vez de falhar sem
  explicacao.
- **CA110** O grafico comparando `analiseInicial.score` e `analiseFinal.score`
  aparece dentro do proprio cartao `OperacaoCorrente` quando `item.etapa ===
  'concluida'`, obtido diretamente do passo `buscar_curriculo` em `item.passos` via
  `scoresAts(...)`. Nao depende de o LLM mencionar "Etapa 1"/"Etapa 3" em texto
  livre, de regex sobre prosa, nem de recarregar a conversa apos o turno.
  Verificavel gerando um curriculo real e observando o grafico aparecer no mesmo
  cartao de progresso, sem esperar por uma segunda mensagem do agente.

## Changelog

- **1.9.10 (2026-09-19):** reabre CA84-93 com exigencia de prova visual, restringe
  extracao de keywords a categoria tecnica, remove o modo Assistido do copiloto em
  favor de redacao assistida no modo unico, corrige a simulacao de forca do grafo
  para so fixar o no arrastado, adiciona ordenacao paritaria em board e grafo,
  substitui o rotulo "Versao N", define tema claro como padrao, unifica a cor de
  acento entre temas, fecha paridade de cor de acao primaria, remove o anel de foco
  azul do login e revisa a politica de expiracao de sessao, conforme ADR 0031.
- **1.9.10-addendum (2026-09-19):** adiciona CA110, causa-raiz real de CA98
  encontrada apos a primeira tentativa: o cartao `OperacaoCorrente` nunca chamava o
  mecanismo de grafico, que dependia de o LLM narrar em texto livre. Corrige para
  renderizacao deterministica direto de `item.passos`.
