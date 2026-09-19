# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.9.8 |
| **Status** | Aceita para implementação nesta rodada |
| **Data** | 2026-09-18 |
| **Domínio** | Fatia vertical coerente do copiloto: integridade, reidratação e fluxo feliz |
| **Base** | Consolida e substitui as correções 1.9.4, 1.9.5, 1.9.6 e 1.9.7; ADR 0029 |

> Esta é a única spec de correção do copiloto a partir desta rodada. As specs
> anteriores continuam como histórico, mas seus critérios não devem ser
> implementados separadamente nem considerados fonte concorrente.

## 1. Problema e objetivo

O copiloto tem três representações incompatíveis da mesma conversa: eventos SSE,
mensagens mínimas persistidas e itens derivados no cliente. A consolidação do
indicador só existe no streaming; histórico e algumas reidratações criam cartões
soltos. O backend também aceita registro repetido dentro da conversa, o
ai-service transforma falha de LLM em conclusão e \`complete_model\` não impõe
schema nem timeout finito. O produto precisa de uma execução feliz reproduzível:

1. colar uma vaga;
2. registrar uma única oportunidade;
3. acompanhar a geração com um único indicador que atualiza;
4. narrar Etapa 1 e Etapa 3 com os gráficos;
5. baixar o pacote;
6. relatar falha de modelo como falha recuperável.

## 2. Princípios e não-objetivos

- Prompt orienta; invariantes de integridade, sequência, unicidade e estado são
  garantidas por servidor ou cliente determinístico.
- O streaming, o histórico, o localStorage e o polling devem convergir para o
  mesmo modelo visual de itens.
- A mudança deve ser compatível com conversas antigas sem metadados novos; o
  cliente deve inferir o máximo seguro dos retornos existentes.
- Não reestruturar a pipeline ATS para narrar Etapa 1 antes da conclusão; a
  narração continua pós-conclusão nesta versão.
- Não alterar nem apagar o perfil-mestre no script de limpeza.

## 3. Contrato canônico da conversa

### 3.1 Mensagens persistidas

\`MensagemCopiloto\` ganha metadados opcionais, compatíveis com documentos antigos:

\`\`\`ts
dados?: {
  callId?: string;
  efeito?: 'leitura' | 'escrita' | 'entrega_externa';
  args?: Record<string, unknown>;
  ok?: boolean;
  resultado?: unknown;
  erro?: string;
  entrega?: { tipo: string; titulo: string; texto: string; destino?: string };
  evento?: 'erro';
  escopo?: string;
};
\`\`\`

O servidor preenche \`dados\` ao persistir o retorno de uma tool, a entrega externa
ou um erro de turno. Documentos antigos continuam válidos: o normalizador usa
\`conteudo\` como fallback.

### 3.2 Normalizador único no cliente

\`useCopiloto.ts\` deve ter uma função pura que converta mensagens persistidas e
pendência em \`Item[]\`. O mesmo contrato de operação usado pelo reducer ao vivo
deve ser usado pelo histórico e pela restauração de localStorage.

- \`registrar_oportunidade\` inicia ou atualiza uma \`operacao\` com efeito de escrita
  e etapa \`registrando\`.
- \`gerar_curriculo\`, \`status_geracao\` e \`buscar_curriculo\` são passos da mesma
  operação enquanto pertencem à oportunidade/job em foco.
- Status repetido para o mesmo \`jobId\` atualiza o passo existente, não cria
  cartões.
- Resultado terminal com \`curriculoId\` cria/atualiza preview; o preview é
  deduplicado por currículo.
- Efeito, args, resultado, erro e callId usam metadados quando disponíveis; o
  fallback antigo infere o efeito por catálogo e gera ids estáveis.
- Entrega externa com metadados vira \`entrega\`; sem metadados permanece um passo
  textual, sem inventar conteúdo que não foi persistido.
- Evento persistido de erro vira \`erro\` e restaura \`erro_turno\`.
- Pendência atual vira \`confirmacao\` no fim da lista e restaura
  \`aguardando_confirmacao\`.

O normalizador também deve consolidar snapshots antigos do localStorage que ainda
contenham passos separados da mesma cadeia.

### 3.3 Reidratação e continuação

- \`abrirHistorico\` usa o normalizador e não força cegamente \`ocioso\`.
- O estado de oportunidade do payload enviado ao servidor vem do estado corrente
  do hook, não somente da prop inicial do componente.
- Operação não terminal com \`jobId\` é elegível ao mesmo polling após streaming,
  localStorage ou histórico.
- Polling consulta o job até estado terminal, atualiza o item por \`jobId\`, busca
  o currículo concluído até conseguir e dispara no máximo uma continuação de
  turno por job. Falha transitória de \`getCurriculo\` pode ser tentada novamente.
- Ao recarregar a página no meio da geração, o indicador permanece único e o job
  continua sendo acompanhado; ao abrir a conversa pelo histórico, a mesma forma
  visual e o mesmo polling são usados.

## 4. Integridade no servidor

### 4.1 Registro idempotente por conversa

Antes de executar \`registrar_oportunidade\`, \`ChatService\` verifica
\`conversa.oportunidadeId\`. Se já houver id, não chama \`POST /oportunidades\` para
criar outra linha: busca a oportunidade existente do usuário, devolve o mesmo
objeto com \`reaproveitada: true\` e persiste o retorno normal da tool. A conversa
continua usando esse id. Outra conversa pode registrar outra oportunidade.

O comportamento também vale na confirmação assistida e no autopiloto. A lógica
de deduplicação do domínio de oportunidades permanece como defesa adicional, mas
não é a trava primária do copiloto.

### 4.2 Falha honesta

- \`_fallback\` nunca retorna texto de conclusão.
- Falha de \`complete_model\` no turno, sem diretiva determinística explícita do
  usuário que possa ser executada com segurança, sobe como indisponibilidade.
- O endpoint do ai-service responde erro não-2xx; o \`ChatService\` emite \`erro\`,
  persiste evento de erro e finaliza \`fim_turno\` com \`motivo: erro\`.
- O frontend mostra \`CartaoErro\`/\`erro_turno\` e habilita \`Repetir turno\`.
- Exaustão de \`MAX_PASSOS\` também é erro recuperável, nunca \`completo\`.
- Nenhum texto gerado por esse caminho afirma conclusão de etapa.

## 5. LLM estruturado, timeout e heurísticas

\`complete_model\` deve:

1. aceitar timeout configurável, finito e aplicado ao cliente/chamada;
2. gerar \`schema.model_json_schema()\`;
3. em modelos Groq que suportam strict structured outputs, enviar
   \`response_format.type=json_schema\`, \`strict=true\`, nome estável e schema
   compatível com as restrições do provedor;
4. em modelo não suportado, enviar explicitamente \`json_object\`;
5. manter validação Pydantic e retries limitados, sem retry infinito;
6. distinguir erro de timeout/transportes de resposta inválida no diagnóstico
   interno, sem vazar detalhes ao candidato.

A seleção strict é derivada do modelo em runtime e pode ser sobrescrita por
configuração para permitir troca de modelo sem alteração de contrato. O default
\`openai/gpt-oss-120b\` deve usar strict; \`llama-3.3-70b-versatile\` deve
degradar para \`json_object\` enquanto não estiver na lista configurada de suporte.

\`_DETALHE_INTERNO\` só remove nomes reais do catálogo de tools, padrões de rota e
termos explícitos de orquestração; não remove qualquer \`snake_case\` genérico.
\`_regerar_por_perfil_atualizado\` exige sinais próximos de atualização de
perfil/competências e intenção de nova tentativa para a oportunidade em foco;
casos ambíguos seguem para o LLM.

Deve existir um harness versionado para comparar os modelos
\`llama-3.3-70b-versatile\` e \`openai/gpt-oss-120b\` no turno e na geração, medindo
resposta válida, aderência à sequência, resultado ATS e latência. O resultado
executado ou a indisponibilidade de credenciais deve ser registrado em
\`docs/ESTADO_ATUAL.md\`; não inventar métricas.

## 6. Narração ATS e gráficos

Quando \`buscar_curriculo\` persistir \`analiseInicial\` e \`analiseFinal\`, o turno
produz a narração determinística de Etapa 1 e Etapa 3. O normalizador deve
preservar os dados necessários para que:

- a mensagem Etapa 1 tenha score, keywords encontradas, keywords críticas
  ausentes, pontos eliminatórios quando houver e veredicto, com radial;
- a mensagem Etapa 3 compare score final e inicial, com gráfico de área Base /
  Gerado;
- streaming, reload, histórico e localStorage exibam os mesmos gráficos.

## 7. Limpeza da conta de demonstração

Criar script versionado em \`apps/api/src/scripts/limpar-conta-teste.ts\`, executado
após build, que:

- resolve exatamente \`gustavoq.mateusgithub@gmail.com\` e aborta se não encontrar
  um único usuário;
- captura e confirma a existência do \`PerfilMestre\` antes de apagar qualquer
  dependência;
- apaga, restrito ao \`usuarioId\`, dependências e dados de oportunidades na ordem
  correta: candidaturas, ações, layouts, eventos, currículos, gerações e vagas;
- apaga conversas do copiloto e documentos RAG de origem de candidatura;
- não toca \`perfil_mestre\`, \`usuarios\`, notas do candidato ou dados de outras
  contas;
- reindexa o perfil preservado e documentos de conhecimento ainda válidos, sem
  deixar vetores das oportunidades/candidaturas apagadas;
- é idempotente: uma segunda execução encontra zero linhas de produto para
  apagar, preserva o mesmo perfil e não duplica documentos nem dados no índice;
- imprime contagens por tabela/coleção, id do usuário mascarado e confirmação
  explícita do perfil preservado.

## 8. Critérios de aceitação consolidados

Os critérios abaixo substituem, nesta versão, CA84–CA93 das specs anteriores.

- **CA94 — forma única:** a mesma sequência de mensagens produz uma única
  \`operacao\` e os mesmos tipos de item em streaming, localStorage e histórico.
- **CA95 — reload/histórico:** operação não terminal mantém um único indicador,
  \`jobId\` e polling depois de reload e depois de abrir pelo histórico; status
  repetido atualiza in-place.
- **CA96 — preview e gráficos:** geração concluída restaura preview deduplicado,
  download e narração Etapa 1/Etapa 3 com radial/área em todos os caminhos.
- **CA97 — confirmação e erro:** pendência é restaurada como confirmação; erro
  de modelo, endpoint, transporte ou limite do laço aparece como erro recuperável
  e nunca como “Etapa concluída”/“Pronto”.
- **CA98 — idempotência:** segunda tentativa de \`registrar_oportunidade\` na
  mesma conversa retorna a oportunidade existente e não cria segunda linha;
  outra conversa permanece independente.
- **CA99 — LLM:** \`complete_model\` aplica timeout finito, schema strict nos
  modelos suportados, \`json_object\` nos demais e validação/retry limitados; o
  harness de modelos e seu estado ficam registrados sem métricas inventadas.
- **CA100 — heurísticas:** texto legítimo com \`snake_case\` é preservado, detalhes
  internos não vazam e regeração ambígua não é forçada.
- **CA101 — limpeza:** script restrito ao usuário-alvo apaga as tabelas/coleções
  exigidas, preserva o perfil, reindexa conhecimento válido e relata contagens;
  repetição é segura.

## 9. Absorção e substituição explícita

| Origem | CAs absorvidos | Tratamento em 1.9.8 |
|---|---|---|
| spec-v1.9.4 | CA84, CA85, CA86 | Absorvidos por CA94–CA96; operação, polling e preview passam a ser reconstruídos, não só emitidos ao vivo. |
| spec-v1.9.5 | CA87, CA88, CA89 | Absorvidos por CA99–CA100; strict/timeout/harness e heurísticas entram no mesmo fluxo de erro e reidratação. |
| spec-v1.9.6 | CA90, CA91 | Absorvidos por CA96; narração e gráficos são requisitos de todas as representações. |
| spec-v1.9.7 | CA92, CA93 | Absorvidos por CA97–CA98; idempotência e falha honesta passam a ser travas determinísticas. |

As ADRs 0025–0028 ficam supersedidas para decisões futuras pela ADR 0029. Seus
registros históricos não são apagados.

