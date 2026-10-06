# Contratos

Contratos OpenAPI e tipos TypeScript gerados, com o schema Prisma para os consumidores. Implementa a `spec-v1.11.0`.

## Instalação, testes e build

Requer Node.js 22. Execute na raiz desta pasta:

```text
npm ci
npm run reunir
npm run conferir
npm test
npm run build
npm pack
```

Não há serviço, imagem Docker nem variáveis de ambiente. O pacote é consumido por Git, sem token de registro. A geração padrão usa somente `openapi/` e `prisma/` desta pasta.

## Atualizar os contratos

O mantenedor pode importar fontes explicitamente com `npm run reunir -- --apps <diretorio-das-unidades>`. Esse diretório deve conter as pastas dos serviços com `contrato/openapi.json`, incluindo `api/prisma/schema.prisma`. A instalação, os testes, o build e a conferência padrão não dependem dessas fontes externas.

`npm run conferir -- --anterior <diretorio-da-versao-publicada>` verifica compatibilidade. Quando há tags Git locais, a conferência também verifica a versão publicada anterior.

A versão `1.1.0` completa os eventos SSE e as respostas tipadas de Hoje e ATS. Os consumidores ficam na tag `v1.0.0` até o orquestrador publicar a nova versão e atualizar suas referências e lockfiles.
