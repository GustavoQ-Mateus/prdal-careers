# ADR 0029, Fatia vertical coerente do copiloto

- **Status:** Aceita
- **Data:** 2026-09-18
- **Substitui para decisões futuras:** ADRs 0025, 0026, 0027 e 0028
- **Spec:** \`docs/specs/spec-v1.9.8.md\`

## Contexto

As correções recentes foram implementadas como sintomas isolados. O streaming
consolida a cadeia de ferramentas em uma operação, mas histórico e alguns
snapshots do cliente não; o backend não trava uma segunda escrita de oportunidade;
o fallback do ai-service pode dizer que uma etapa terminou quando o LLM falhou; e
o motor compartilhado não impõe schema estrito nem timeout finito. O produto será
demonstrado numa execução única, portanto a arquitetura precisa preservar o mesmo
estado visual e a mesma semântica ao vivo, após reload e ao reabrir histórico.

## Decisão

1. **Um modelo visual canônico:** o cliente terá um normalizador único de
   mensagens, pendência e retornos que reconstrói operação, preview, confirmação,
   entrega, erro, narração e gráficos. Streaming e reidratação devem convergir
   para esse contrato.
2. **Persistência suficiente:** mensagens de tool, entrega e erro carregam
   metadados opcionais; documentos antigos usam fallback por conteúdo. A
   persistência não tenta armazenar cada evento SSE, apenas os dados necessários
   para reconstrução determinística.
3. **Polling resiliente:** o \`jobId\` é a identidade da operação. O cliente retoma
   o acompanhamento depois de reload e histórico, atualiza o item in-place e
   deduplica preview/continuação.
4. **Travas determinísticas:** \`registrar_oportunidade\` reaproveita a oportunidade
   da conversa no servidor; falha de LLM e exaustão do laço encerram com erro;
   prompts permanecem como orientação.
5. **LLM delimitado:** schema estrito por modelo suportado, fallback explícito para
   JSON object, timeout finito, retries limitados e harness de avaliação. A
   configuração escolhe o modelo sem mudar contratos.
6. **Reset seguro:** a limpeza da conta de demonstração é script idempotente,
   identificado por usuário, preserva o perfil e repõe somente conhecimento
   válido.

## Alternativas rejeitadas

- Persistir somente um “cartão pronto” no localStorage: continua divergindo do
  histórico e não permite retomar polling.
- Corrigir o prompt para “nunca duplicar”: prompt não é garantia de unicidade.
- Aumentar o timeout do turno para mascarar falha: mantém o falso sucesso e o
  acoplamento com o job de fundo.
- Fazer o histórico copiar o reducer por uma segunda implementação: duas regras
  de composição recriariam a divergência atual.

## Consequências

- \`MensagemCopiloto\` recebe metadados opcionais e o frontend ganha normalização
  de compatibilidade.
- O SSE permanece compatível; mudanças são aditivas nos documentos Mongo e na
  interpretação do cliente.
- O fluxo feliz passa a ser verificável visualmente após reload e histórico.
- CAs 84–93 deixam de ser unidades independentes; CA94–CA101 são a fonte
  consolidada.
- A validação manual da interface continua obrigatória e não é substituída por
  typecheck, build ou testes unitários.

