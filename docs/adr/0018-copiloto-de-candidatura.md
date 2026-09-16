# ADR 0018, Copiloto de candidatura

- **Status:** Aceita
- **Data:** 2026-09-16
- **Fase-alvo:** Redesign v2, culminância da `spec-v1.6.0`
- **Contexto:** A `spec-v1.6.0` seção 8 formaliza o copiloto de candidatura como escopo reconhecido do produto e aponta para esta ADR para travar a decisão de arquitetura, sem ainda fixar contratos. O produto já entrega, de forma manual, todo o loop de preparação de candidatura: extrair keywords da vaga, puxar Perfil e RAG, gerar o currículo tailored, medir o score determinístico, registrar a oportunidade, definir o próximo passo e redigir texto para o candidato usar. Falta uma camada que conduza esse loop conversando com o candidato, sem virar um produto novo nem um segundo cérebro de decisão.

## Decisão

Adotar o copiloto de candidatura como um agente de orquestração por tool-calling que dirige a infraestrutura já existente. O copiloto conversa com o candidato, propõe passos do loop e executa cada passo chamando os endpoints que a `api` já expõe hoje. Ele não é inteligência nova; é uma nova forma de acionar a inteligência que o produto já tem.

Esta ADR fixa seis princípios. Os contratos concretos, rotas, eventos e registro de tools, vivem no documento irmão `docs/specs/copiloto-contratos.md`, que o P7 implementa sem ambiguidade.

### 1. O copiloto não traz IA nova

O copiloto orquestra a infra atual. A geração de currículo continua no `ai-service`, com Groq no free tier e fallback Ollama, conforme a ADR 0003. O RAG continua aterrado nos dados do candidato no Chroma, conforme a ADR 0006 e a ADR 0012. O score continua determinístico no `ai-service`, conforme a ADR 0005. A geração de documento continua no `doc-service`, conforme a ADR 0007. As tools do agente são os endpoints que a `api` já publica; nenhuma capacidade cognitiva nova entra por esta ADR.

### 2. Human-in-the-loop é o limite duro de escopo

O agente prepara e orquestra tudo que é interno e reversível. O candidato dispara tudo que é externo. O copiloto nunca envia candidatura a um portal, nunca manda mensagem a recrutador e nunca responde formulário fora do produto por conta própria. Ele redige o texto pronto e entrega para o candidato revisar, copiar e enviar. Isso é coerente com o escopo do produto, que é do candidato e nunca do lado empresa ou recrutador, e com a `spec-v1.5.0` seção 18.

### 3. Confirmação antes de gravar

Ler e analisar rodam sozinhos. Criar, gerar e mover pedem confirmação explícita do candidato no chat antes de executar. Toda tool declara seu efeito, leitura ou escrita, e toda escrita passa por um pedido de confirmação no stream. Existe um modo autopiloto opcional que encadeia o loop de ponta a ponta sem pedir confirmação a cada escrita interna, mas esse modo ainda para nos pontos externos e nunca ultrapassa a fronteira do princípio 2.

### 4. Score permanece determinístico

O LLM nunca inventa o número do score. Quando o loop precisa medir aderência, o agente chama a função de score determinística do `ai-service`, a mesma da ADR 0005, e usa o valor que ela retorna. O agente pode explicar o breakdown e sugerir quais keywords faltam, mas o número é sempre computado, nunca estimado. O loop trata uma vaga por vez; não há score agregado nem comparação em lote dentro de um turno.

### 5. O fluxo manual continua primeiro-classe

O copiloto convive com o fluxo manual, não o substitui. As telas de Oportunidades, Workspace, Currículos, Perfil e Conhecimento seguem operando sobre os mesmos endpoints, sem depender do copiloto. Um candidato pode fazer todo o loop na mão, todo pelo copiloto, ou alternar entre os dois na mesma oportunidade. As tools do agente são exatamente os endpoints do fluxo manual, então os dois caminhos convergem no mesmo estado.

### 6. Arquitetura de transporte

O copiloto adiciona um endpoint de chat na `api` com streaming por SSE. A cada turno, o `ai-service` devolve para a `api` texto ou uma intenção de tool-call. Quando é texto, a `api` repassa os tokens ao `web`. Quando é intenção de escrita, a `api` emite um pedido de confirmação e só executa a tool após o candidato confirmar. Quando é intenção de leitura, a `api` executa direto. A `api` roda a tool contra os próprios serviços, do mesmo jeito que já faz no fluxo manual, e devolve o resultado ao loop do `ai-service`, que segue o raciocínio.

Isso mantém a ADR 0001 intacta. O `web` continua falando só com a `api`. A `api` continua sendo o único orquestrador que compõe chamadas entre serviços. O `ai-service` continua sem tocar banco nem outros serviços por conta própria; ele decide o próximo passo e a `api` executa. O copiloto é uma nova rota de orquestração sobre a topologia que já existe, não uma nova topologia.

## Justificativa

- Reusar os endpoints do fluxo manual como tools garante que copiloto e mão levam ao mesmo estado, sem um segundo caminho de escrita para manter em sincronia.
- Manter o `ai-service` como quem raciocina e a `api` como quem executa preserva a fronteira da ADR 0001 e evita dar ao serviço de IA acesso direto a dados e a outros serviços.
- Confirmação antes de gravar e a fronteira human-in-the-loop mantêm o candidato no controle do que é irreversível ou externo, que é o valor central do produto.
- Score determinístico via função dedicada mantém o número reproduzível e explicável, como a ADR 0005 exige, mesmo dentro de uma conversa livre.
- SSE entrega a sensação de agente que pensa em voz alta, com token a token e passos visíveis, sem exigir infraestrutura de socket bidirecional.

## Consequências

- Entra um módulo de copiloto na `api`, dono do endpoint de chat SSE, do laço de tool-calling e da execução das tools contra os serviços internos. Entra a rota conversacional correspondente no `ai-service`.
- O registro de tools vira contrato explícito: cada tool aponta para um endpoint existente, declara efeito e declara se exige confirmação. Isso está no documento de contratos.
- O loop de candidatura tem passos que ainda não têm endpoint próprio: prévia de keywords sem criar a vaga, consulta de RAG como passo visível, score avulso de um texto sem regerar, e redação de mensagem ao recrutador e de respostas de formulário. Esses são lacunas listadas no documento de contratos, a resolver no P7, sem inventar rota nesta ADR.
- A UI do copiloto do P7 renderiza estados definidos pelo stream: pensando, aguardando confirmação, executando, entrega externa pronta para copiar, autopiloto em curso, autopiloto parado para ação externa e erro localizado no turno.
- A ADR 0001, a 0003, a 0005, a 0006, a 0007 e a 0012 permanecem válidas e são as fundações que o copiloto orquestra. Esta ADR não altera nenhuma delas.
