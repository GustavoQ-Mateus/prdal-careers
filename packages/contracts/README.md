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

A versão `1.3.0` amplia a lista de ações aceitas no pedido de telemetria com `colar_vaga_nova`, `priorizar_vagas` e `importar_vagas_lote`. Preserva os contratos existentes da versão `1.2.0`, com ação obrigatória em `copiloto_acao_rapida`. Os consumidores passam para a tag `v1.3.0` depois que o mantenedor publicar essa tag, com referências e lockfiles próprios.
