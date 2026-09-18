# ADR 0019, Resolução de link e validação editorial da geração de currículo

- **Status:** Aceita
- **Data:** 2026-09-18
- **Fase-alvo:** Polimento da geração, culminância da `spec-v1.7.0`
- **Contexto:** A `spec-v1.7.0` seção 6 promete DOCX e PDF semanticamente equivalentes, com links reais e fonte Arial em corpo de 10pt, e a seção 5 promete uma pipeline de geração validada que nunca vaza labels internos. Auditando o código contra essas promessas, três lacunas concretas apareceram e uma quarta decisão, já implementada na prática mas nunca travada em ADR, precisava de registro formal antes de crescer escopo em cima dela:
  1. A linha de contato (`_linha_contato` no `ai-service`) sempre foi texto puro, nunca sintaxe de link Markdown. O `DocxRenderer` autodetecta URL e e-mail em texto puro por regex, mas não reconhece domínio nu como `linkedin.com/in/fulano`; o `PdfRenderer` não tem nenhuma autodetecção e só resolve link quando o Markdown já traz `[texto](url)` explícito. Resultado prático: o PDF nunca linka contato, e o DOCX só linka nos formatos com `http(s)://`, `www.` ou e-mail.
  2. A validação pós-geração (`_erros_contrato`) rejeita labels estruturais crus (`Cargo:`, `Empresa:` etc.), mas não rejeita o vazamento do vocabulário da própria fórmula de bullet que o prompt ensina ao LLM (`ferramenta por extenso`, `resultado real`), que é o tipo de frase mais provável de ser ecoada de volta no texto gerado.
  3. O título profissional já é reescrito de forma determinística e sempre coerente com a vaga (`_titulo_vaga_seguro`, aplicado incondicionalmente em `_limpar_markdown`), mas o resumo profissional da saída do LLM não passa por nenhuma checagem de coerência com a vaga; só o fallback determinístico (`_resumo_tailored`) já nasce coerente.
  4. A geração já roda desacoplada do ciclo de request/response desde o fix `acd3b70 fix(curriculos): recupera geracao apos timeout`: `POST /oportunidades/:id/gerar-cv` cria um job `GeracaoCurriculo` e dispara o processamento em segundo plano sem aguardar, devolvendo `jobId` na hora; o candidato acompanha por polling em `status_geracao`. Esse padrão nunca foi fixado em ADR, e sem essa trava alguém pode "simplificar" a chamada de volta para síncrona na próxima mudança, reabrindo o risco de estourar o tempo de resposta com modelos mais lentos como o `gpt-oss-120b`.

## Decisão

### 1. Link real tem dono na fonte e rede de segurança no renderer

A fonte da verdade do link é o `ai-service`: ao montar a linha de contato, cada tipo de contato conhecido (`email`, `linkedin`, `github`, `site`) vira sintaxe de link Markdown `[valor](url)` com a URL normalizada (`mailto:` para e-mail, `https://` prefixado quando faltar protocolo para os demais). Tipos sem URL (`telefone`, `localizacao`, `outro`) continuam texto puro.

O `doc-service` não pode depender só da geração estar bem-comportada, porque `editar_curriculo` deixa o candidato reescrever o Markdown inteiro por fora do gerador. Por isso o `doc-service` mantém uma segunda camada, de rede de segurança: a mesma detecção de link por regex que hoje só existe no `DocxRenderer` passa a cobrir também domínio nu de LinkedIn e GitHub, e o `PdfRenderer` ganha a mesma lógica de autodetecção que o `DocxRenderer` já tem, hoje ausente nele. PDF e DOCX passam a ter paridade de resolução de link, venha o Markdown de onde vier.

### 2. Validação editorial cresce como regra nova no mecanismo que já existe

Não entra mecanismo de rejeição novo. `generate_cv_pipeline` já roda `_erros_saida` depois de cada tentativa do LLM, realimenta os erros no prompt da tentativa seguinte, e cai no fallback determinístico se a saída continuar inválida depois das tentativas. A validação de vazamento de fórmula e a validação de coerência do resumo com a vaga entram como regras novas dentro desse mesmo mecanismo, não como um caminho de rejeição paralelo. O prompt que descreve a fórmula de bullet para o LLM é reescrito para não citar a frase-label de um jeito diretamente ecoável, reduzindo a chance de vazamento antes mesmo da validação entrar em ação.

O título profissional não ganha validação nova porque já é determinístico; a decisão aqui é reconhecer isso explicitamente e não duplicar uma checagem para algo que a `_limpar_markdown` já garante de forma estrutural.

### 3. Geração por job assíncrono é a arquitetura oficial

Fica travado que qualquer geração que dependa de LLM roda como job: o endpoint de disparo grava o job e devolve identificador imediatamente, o processamento roda desacoplado da requisição HTTP que o disparou, e o cliente acompanha por polling. Nenhuma rota que dispara geração via LLM pode voltar a aguardar o resultado da chamada de modelo dentro do ciclo de request/response, independente de qual `AI_MODEL` estiver configurado.

## Justificativa

- Resolver o link na fonte mantém o Markdown como contrato editorial único descrito na `spec-v1.7.0` seção 3, em vez de empurrar semântica de contato para heurística de renderer.
- Manter a rede de segurança no `doc-service` reconhece que o Markdown que chega ao renderer nem sempre passou pelo gerador, já que edição manual é um caminho de primeira classe do produto.
- Reaproveitar o loop de rejeição/retry/fallback existente em vez de desenhar um novo evita duplicar lógica de controle de fluxo para o mesmo problema, mantendo `generate_cv_pipeline` como o único lugar que decide entre LLM e fallback.
- Travar a geração assíncrona por job em ADR, e não deixar implícita no código, impede regressão futura para chamada síncrona, que é exatamente o incidente que `acd3b70` já corrigiu uma vez.

## Consequências

- `ai-service`: `_linha_contato` passa a depender do tipo de contato para decidir entre link Markdown e texto puro; `_erros_saida` ganha duas regras novas (vazamento de fórmula, coerência de resumo); o texto do prompt que descreve a fórmula de bullet muda de redação.
- `doc-service`: `DocxRenderer` e `PdfRenderer` passam a compartilhar a mesma cobertura de autodetecção de link; `PdfRenderer.AppendSpans` deixa de depender exclusivamente de `span.Url` explícito.
- Nenhuma mudança na topologia de serviços da ADR 0001, nem na escolha de IA da ADR 0003, nem no doc-service .NET da ADR 0007. Esta ADR complementa a `spec-v1.7.0` seção 6, não a substitui.
- A `spec-v1.8.0` seção 7 registra CA62 a CA66 cobrindo os quatro pontos desta decisão, incluindo cobertura de teste de regressão para o que já estava implementado antes desta ADR (fonte, margem, compactação de página, geração assíncrona).
