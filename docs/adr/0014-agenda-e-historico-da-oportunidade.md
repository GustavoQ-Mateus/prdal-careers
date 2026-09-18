# ADR 0014, Agenda e histórico da oportunidade

- **Status:** Aceita
- **Data:** 2026-09-14
- **Fase-alvo:** Fase 6, ver `spec-v1.5.0`
- **Contexto:** O candidato acompanha vários processos em paralelo, mas o modelo atual guarda apenas o status e as notas da candidatura. Não existe uma próxima ação com prazo, lembrete interno nem sequência auditável de alterações. Sem essas capacidades, o produto mostra dados, mas não orienta o trabalho diário.

## Decisão

Adicionar ao PostgreSQL duas entidades pertencentes à oportunidade: `AcaoOportunidade` e `EventoOportunidade`.

### Ação da oportunidade

`AcaoOportunidade` representa um próximo passo manual:

- `id`, `usuarioId` e `vagaId`;
- `candidaturaId`, nullable;
- `titulo`;
- `tipo`, com vocabulário controlado e opção `OUTRO`;
- `principal`;
- `venceEm`, nullable;
- `lembrarEm`, nullable;
- `concluidaEm`, nullable;
- `canceladaEm`, nullable;
- `criadoEm` e `atualizadoEm`.

Uma oportunidade pode possuir várias ações pendentes, mas somente uma ação principal. Marcar outra como principal retira essa indicação da anterior na mesma transação. `lembrarEm` não pode ser posterior a `venceEm`.

A unicidade da ação principal pendente é protegida por índice único parcial sobre `vagaId` quando `principal = true`, `concluidaEm IS NULL` e `canceladaEm IS NULL`. A migração SQL complementa o schema Prisma.

Lembretes da v1.5 são internos. Eles aparecem em Hoje e no Workspace quando o horário é alcançado. Não existe processo de envio, notificação push, e-mail, SMS ou integração com calendário.

Instantes são persistidos em UTC. A preferência do usuário guarda um fuso horário IANA. Hoje calcula início e fim do dia nesse fuso e devolve timestamps ISO 8601.

### Evento da oportunidade

`EventoOportunidade` forma a timeline append-only:

- `id`, `usuarioId` e `vagaId`;
- `candidaturaId` e `curriculoId`, nullable;
- `tipo`;
- `origem`, com `SISTEMA` ou `USUARIO`;
- `descricao`;
- `dados`, JSON apenas com identificadores e deltas necessários;
- `ocorridoEm` e `registradoEm`.

Em operações exclusivamente PostgreSQL, o evento é inserido na mesma transação da escrita principal, depois da mutação e antes do commit. Em ativação entre PostgreSQL e MongoDB, a criação da oportunidade e seu evento são atômicos no PostgreSQL; a atualização documental é idempotente e reconciliada por retry. Não existe endpoint público para criar eventos de sistema. Notas manuais entram por uma ação explícita da timeline e também são imutáveis. Uma correção gera outro evento.

Eventos mínimos:

- oportunidade criada, ativada, editada, priorizada, arquivada ou reaberta;
- currículo gerado, editado ou vinculado;
- candidatura criada e status alterado;
- ação criada, reagendada, concluída ou cancelada;
- nota manual registrada.

Não armazenar o conteúdo completo de currículos, descrições ou notas dentro de `dados`. A timeline registra o fato e referências, evitando duplicação de informação sensível.

## Justificativa

- Próximos passos transformam Hoje em agenda operacional.
- Uma entidade combina ação e lembrete sem dois ciclos de vida redundantes.
- O histórico append-only preserva o contexto de decisões e mudanças de currículo.
- O vínculo direto com `vagaId` torna o Workspace simples de consultar.
- Eventos explícitos são mais auditáveis que inferir toda a história do estado atual.

## Consequências

- Serviços de oportunidades, currículos e candidaturas passam a registrar eventos.
- Operações relacionais de domínio e evento usam obrigatoriamente a mesma transação PostgreSQL.
- A consulta de Hoje precisa ordenar atrasados, itens do dia e próximos dias pelo fuso do usuário.
- Alterar perfil ou reindexar conhecimento não gera evento em todas as oportunidades.
- Sugestões automáticas de próxima ação, notificações externas e automações ficam fora desta fase.
