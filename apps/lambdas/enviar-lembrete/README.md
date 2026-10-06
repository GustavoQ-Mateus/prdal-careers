# enviar-lembrete

Lambda de envio de lembretes por SES, com servidor HTTP para uso local. Implementa a `spec-v1.11.0`.

## Instalação, testes e execução

Execute na raiz desta unidade. Não são necessários arquivos do monorepo. Requer Node.js 22 e Git para instalar os contratos quando aplicável.

```text
npm ci
npm test
npm run build
npm start
```

Defina SERVICE_TOKEN e REMETENTE_MODO=log no uso local, que registra o envio sem acessar SES. O servidor local usa a porta 3002. Para SES, configure SES_ORIGEM, AWS_REGION e credenciais de escopo mínimo. docker build --target local -t enviar-lembrete-local . constrói o servidor local; a imagem padrão executa dist/lembrete.handler na Lambda.

## Imagem

```text
docker build -t prdal-enviar-lembrete .
```

O contexto é somente esta pasta. A imagem final executa sem root e não inclui dependências de desenvolvimento nem configurações de agentes. Injete as variáveis com --env-file em um arquivo local fora do controle de versão.

## Variáveis de ambiente

As variáveis opcionais usam os padrões definidos no código; configure explicitamente os destinos de banco e serviços no seu ambiente.

`AWS_ACCESS_KEY_ID`, `AWS_REGION`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `PORTA`, `REMETENTE_MODO`, `SERVICE_TOKEN`, `SES_ORIGEM`.
