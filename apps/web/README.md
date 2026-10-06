# web

Interface React para oportunidades, currículos e copiloto. Implementa a `spec-v1.11.0`.

## Instalação, testes e execução

Execute na raiz desta unidade. Não são necessários arquivos do monorepo. Requer Node.js 22 e Git para instalar os contratos quando aplicável.

```text
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

VITE_API_URL e VITE_API_VERSAO configuram a API no build. O servidor de desenvolvimento usa a porta 5173.

## Imagem

```text
docker build -t prdal-web .
```

O contexto é somente esta pasta. A imagem final executa sem root e não inclui dependências de desenvolvimento nem configurações de agentes. Injete as variáveis com --env-file em um arquivo local fora do controle de versão.

## Variáveis de ambiente

Use `.env.example` como referência, sem versionar segredos. As variáveis opcionais usam os padrões definidos no código; configure explicitamente os destinos de banco e serviços no seu ambiente.

`PRDAL_API_ORIGIN`, `PRDAL_HSTS`, `VITE_API_URL`, `VITE_API_VERSAO`.

## Contratos

A dependência usa `github:GustavoQ-Mateus/prdal-careers-contracts#v1.1.0`, com os tipos de eventos SSE, arrays de Hoje e análises ATS. O typecheck usa os contratos instalados por `npm ci`.
