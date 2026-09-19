# ADR 0025, Acompanhamento de geração fora do turno e preview de currículo no chat

- **Status:** Aceita
- **Data:** 2026-09-18
- **Fase-alvo:** P10-correção, revisão pós-uso real sobre CA67/CA81 (ADR 0022, ADR 0024)
- **Contexto:** Uso real do copiloto expôs três problemas relacionados, todos no fluxo de geração de currículo:
  1. O usuário reportou que o chat empilha um item de trilha por ferramenta chamada (`Registrar oportunidade`, `Gerar currículo`, `Ver status da geração`), quando o esperado é um único indicador que se atualiza ao longo da operação. A consolidação da ADR 0022 resolveu chamadas repetidas da mesma ferramenta (`status_geracao` x N vira 1 item), mas não consolida ferramentas diferentes de uma mesma cadeia de ação em um único indicador.
  2. O usuário reportou que a mensagem "A geração ainda está em andamento e o acompanhamento deste turno atingiu o limite" aparece rotineiramente, mesmo quando a geração termina bem pouco depois. Auditando `chat.service.ts`, `acompanharGeracao` faz polling síncrono dentro do próprio turno HTTP/SSE, com orçamento fixo `ORCAMENTO_ACOMPANHAMENTO_MS = 90_000` e intervalo `INTERVALO_ACOMPANHAMENTO_MS = 1_500`. Auditando `generate_cv_pipeline` (`apps/ai-service/app/generate.py:641`), uma geração pode custar até três chamadas sequenciais ao LLM: até duas tentativas no laço principal (`for _ in range(2)`) mais um possível "passe dirigido" quando o score final fica abaixo de 75. Com `gpt-oss-120b` e `AI_REASONING_EFFORT` acima do mínimo, três chamadas sequenciais somam rotineiramente mais que 90 segundos. O orçamento não está mal calculado por engano pontual: a arquitetura amarra o acompanhamento de um job de fundo, que já foi desacoplado do ciclo de request/response pela ADR 0019 exatamente para não depender de latência de LLM, à duração de um turno de chat que tem seu próprio orçamento fixo. Isso reintroduz, por outra porta, o mesmo tipo de acoplamento que a ADR 0019 eliminou.
  3. Quando a geração conclui, nada no chat mostra o currículo pronto. O candidato só descobre abrindo a tela de Currículos. A API já expõe `GET /geracoes-curriculo/:jobId` (`GeracaoCurriculo` com `status`, `curriculoId`, `etapas`) e o cliente web já tem a função correspondente (`api.ts`); o pacote de download da CA68 (`GET /curriculos/:id/pacote`) também já existe. As peças para montar um preview com download direto no chat já estão todas no projeto.

## Decisão

### 1. O acompanhamento de geração sai do turno de chat e vira responsabilidade do cliente

`acompanharGeracao` deixa de fazer polling síncrono dentro do turno SSE do backend. Quando `gerar_curriculo` retorna status não terminal, o backend emite um único item de trilha do tipo geração (`passo` com `tool: 'gerar_curriculo'`, ou um tipo dedicado equivalente) contendo o `jobId`, e encerra o turno normalmente, sem a mensagem de orçamento esgotado. O cliente web, ao ver esse item em estado não terminal, assume o acompanhamento: consulta `GET /geracoes-curriculo/:jobId` (já existente) em intervalo curto, direto do navegador, sem depender de um turno de chat aberto. Cada resposta atualiza o mesmo item da trilha no lugar, pelo `jobId`, em vez de criar itens novos. O acompanhamento continua enquanto a aba estiver aberta na conversa; não há mais orçamento fixo arbitrário nem mensagem alegando limite atingido, porque a espera deixa de estar amarrada à duração de um turno.

Isso não reabre o risco que a ADR 0019 fechou: a geração em si continua um job de fundo desacoplado de qualquer request síncrono. Esta decisão apenas move de onde parte a leitura de status, do backend dentro do turno para o cliente fora do turno, o que é consistente com o próprio padrão de polling que a ADR 0019 já definiu para o resto do produto.

### 2. Uma cadeia de ação em progresso consolida em um único indicador

Quando o copiloto encadeia ferramentas que representam uma mesma intenção do usuário em curso (registrar oportunidade seguido de gerar currículo para ela, por exemplo), a UI passa a expor essa cadeia como um único indicador de operação corrente com um rótulo que muda conforme a etapa ativa ("Registrando oportunidade" -> "Gerando currículo" -> "Aguardando geração"), em vez de um item de trilha por ferramenta chamada. Ao concluir, o indicador vira o resultado final consolidado (não uma lista de itens passados). O retorno técnico de cada etapa continua disponível por expansão ("Ver retorno"), preservando a rastreabilidade que a trilha atual já oferece, só que sem repetir a poluição visual de vários cartões abertos ao mesmo tempo. Decidir exatamente quais sequências de ferramentas contam como "uma mesma cadeia" fica com a implementação, orientado por intenção percebida do usuário no turno, não por uma lista fixa de pares de ferramenta.

### 3. Currículo concluído aparece como preview com download no chat

Quando o acompanhamento do lado do cliente (item 1) detecta status `CONCLUIDA`, o chat renderiza um cartão de entrega com o rótulo do currículo, o score final, e uma ação de baixar o pacote (reusando `GET /curriculos/:id/pacote` da CA68), sem exigir navegação até a tela de Currículos. Esse cartão é aditivo ao gráfico de score de CA73/CA83, que continua aparecendo junto.

## Justificativa

- Mover o acompanhamento para o cliente, consultando um endpoint que já existe, remove a causa raiz do problema em vez de só aumentar um número de orçamento que voltaria a ficar curto assim que o modelo configurado mudar de novo, repetindo o mesmo tipo de incidente que a ADR 0019 já resolveu uma vez para o ciclo de request/response.
- Consolidar a cadeia de ferramentas em um indicador único responde diretamente ao incômodo relatado de "vários spots do que está fazendo" sem descartar a trilha técnica detalhada, que continua acessível por expansão.
- Mostrar o resultado pronto no chat fecha o loop que hoje força o candidato a sair da conversa para achar o que acabou de pedir; as duas peças de backend necessárias (status por job, pacote de download) já existem, então isto é composição de UI, não infraestrutura nova.

## Consequências

- `apps/api/src/copiloto/chat.service.ts`: `acompanharGeracao` para de fazer polling síncrono; `ORCAMENTO_ACOMPANHAMENTO_MS` e a mensagem de limite esgotado são removidos.
- `apps/web/src/copiloto/`: `useCopiloto.ts` ganha um mecanismo de polling client-side por `jobId` que atualiza o item correspondente in-place; `componentes.tsx` ganha a consolidação visual de cadeia de ferramentas e o cartão de preview/download.
- Nenhuma mudança nos serviços `ai-service` ou `doc-service`; a latência real da geração de currículo não muda, só onde e como o acompanhamento é observado.
- A `spec-v1.9.4` seção correspondente registra CA84 a CA86 cobrindo estes três pontos.
