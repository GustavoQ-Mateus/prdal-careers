# @prdal/contracts

Pacote de contratos da `spec-v1.11.0`, versao inicial `1.0.0`.

Contem os OpenAPI de api e ai-service em `openapi/`, tipos TypeScript gerados em `src/` e `dist/`, e uma copia do schema Prisma em `prisma/schema.prisma`. O contrato de doc-service entra quando o produtor publicar `contrato/openapi.json`. A api continua dona do schema e das migracoes; este pacote nao publica migracoes.

## Gerar e conferir

No monorepositorio, gere primeiro os contratos dos produtores:

```powershell
npm run contrato --workspace apps/api
cd apps/ai-service
.venv/Scripts/python.exe scripts/contrato.py
cd ../..
npm run reunir --workspace packages/contracts
npm run conferir --workspace packages/contracts
npm run build --workspace packages/contracts
npm test --workspace packages/contracts
```

`reunir` copia cada `apps/*/contrato/openapi.json`, copia `apps/api/prisma/schema.prisma` e regenera os tipos com `openapi-typescript`. Nunca edite os tipos ou os OpenAPI reunidos a mao. `conferir` faz a mesma geracao em memoria e falha se houver arquivos ausentes, desatualizados ou excedentes. O produtor da api deriva DTOs de resposta dos tipos retornados pelos controllers, antes de gerar o documento com `@nestjs/swagger`; seu script nao conecta ao banco nem expoe documentacao no servidor.

Os produtores possuem testes de contrato: `npm run test:contrato` na api e `python -m pytest tests/test_contrato.py` no ai-service. Eles comparam o documento gerado com o arquivo versionado e provam a rejeicao de um contrato divergente. A exportacao Python funciona mesmo com as rotas de documentacao desligadas em producao.

## Consumir

```typescript
import type { apiPaths, aiServicePaths, HealthResponse } from '@prdal/contracts';
import type { components } from '@prdal/contracts/api';
```

OpenAPI e Prisma tambem sao exportados por `@prdal/contracts/openapi/api.json` e `@prdal/contracts/prisma/schema.prisma`. `npm run build` produz `dist/`; `prepare` executa esse build para instalacoes por dependencias git, inclusive em um checkout apenas deste pacote. O build usa os tipos versionados e nao depende de pastas de aplicacao. O pacote possui seu proprio `package-lock.json`.

## Versionar

Use versao semantica em `package.json`: patch para correcoes compativeis, minor para adicoes compativeis e major para quebras. Gere, confira, teste e revise antes de publicar. No repositorio espelho, publique a versao no GitHub Packages e marque uma tag `v<versao>`, por exemplo `v1.0.0`. A sincronizacao, a tag e a publicacao pertencem ao orquestrador.

`conferir` compara os contratos reunidos com a ultima tag semantica local que contenha `@prdal/contracts`. Mantenha as tags publicadas disponiveis no checkout. Na primeira versao ainda nao existe anterior. Para comparar com um pacote anterior extraido de um artefato publicado, execute na pasta do pacote:

```powershell
npm run conferir -- --anterior C:/contratos-anteriores
```

O diretorio anterior deve conter `package.json` e `openapi/`. A conferencia rejeita remocao de rota ou metodo, remocao de campo de resposta e novo campo obrigatorio no pedido, inclusive campos aninhados, arrays e parametros. Essas quebras exigem aumento da versao maior do pacote. Os testes incluem uma versao publicada de exemplo e o caminho de falha do CLI. Preserve compatibilidade por pelo menos uma release antes de remover contratos usados pelos consumidores.

Esta entrega prepara produtores e pacote. A migracao dos consumidores e dos builds por pasta pertence a entrega seguinte.
