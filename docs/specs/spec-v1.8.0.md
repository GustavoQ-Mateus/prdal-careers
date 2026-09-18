# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.8.0 |
| **Status** | Draft |
| **Data** | 2026-09-18 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Conformidade da geração e do doc-service |
| **Base** | Estende `spec-v1.0.0.md` a `spec-v1.7.0.md`; formalizada pela ADR 0019 |

> MINOR compatível. Fecha lacunas concretas da seção 6 e da seção 5 da `spec-v1.7.0`: link real em DOCX e PDF, rejeição de vazamento da fórmula de bullet, coerência do resumo com a vaga, e formaliza a geração assíncrona por job que já roda em produção. CA1 a CA61 continuam válidos. Esta versão adiciona CA62 a CA66.

## 1. Problema

A `spec-v1.7.0` já promete DOCX e PDF semanticamente equivalentes com links reais, e uma pipeline de geração que nunca vaza labels internos. Auditando a implementação contra essas promessas, quatro pontos concretos ficaram descobertos: o PDF nunca resolve link de contato porque depende de sintaxe explícita que a geração nunca produz; a validação pós-geração não pega o vazamento do vocabulário da própria fórmula de bullet que o prompt ensina ao modelo; o resumo profissional da saída do LLM não é checado contra a vaga; e a geração assíncrona por job, que já roda em produção desde a correção de um timeout anterior, nunca foi travada como decisão de arquitetura, ficando vulnerável a regressão futura.

## 2. Objetivo

1. Garantir link real e clicável de e-mail, LinkedIn, GitHub e site em DOCX e PDF, qualquer que seja a origem do Markdown.
2. Rejeitar e corrigir, antes de persistir, saída que vaze o vocabulário interno da fórmula de bullet.
3. Garantir que o resumo profissional da saída seja coerente com a vaga, com o mesmo rigor que o título profissional já tem.
4. Formalizar a geração por job assíncrono como a arquitetura oficial, cobrindo com teste de regressão o que impede um retrocesso para geração síncrona.

## 3. Link real de contato

A fonte do link é a geração: `email`, `linkedin`, `github` e `site` sempre entram na linha de contato como link Markdown `[valor](url)`, com `mailto:` para e-mail e `https://` prefixado quando faltar protocolo nos demais. `telefone`, `localizacao` e `outro` continuam texto puro.

O Doc Service não depende só disso, porque `editar_curriculo` permite Markdown escrito à mão por fora da geração. Por isso os renderers também resolvem por padrão em texto puro: além de URL completa e e-mail, passam a reconhecer domínio nu de LinkedIn e GitHub. DOCX e PDF usam a mesma cobertura de detecção; nenhum dos dois depende exclusivamente de sintaxe de link explícita.

## 4. Validação editorial

`_erros_saida` ganha duas regras novas, sem mudar o mecanismo existente de tentativa, correção e fallback:

- rejeita saída que contenha vocabulário interno da fórmula de bullet, como `ferramenta por extenso`, `resultado:`, `resultado real` ou `verbo de ação`, em qualquer seção do currículo;
- rejeita resumo profissional sem overlap mínimo de vocabulário com o título ou as palavras-chave da vaga.

O título profissional não ganha validação nova porque já é reescrito de forma determinística e sempre coerente com a vaga, para LLM e para fallback; essa garantia é estrutural, não depende de validação pós-hoc.

O prompt que ensina a fórmula de bullet ao LLM muda de redação para não citar a frase-label de um jeito diretamente copiável, reduzindo a chance de vazamento antes mesmo da validação atuar.

## 5. Geração assíncrona por job

Fica formalizado que toda geração que depende de LLM roda como job: o endpoint de disparo grava o job e devolve o identificador imediatamente; o processamento roda desacoplado do ciclo de request/response que disparou; o cliente acompanha por polling. Nenhuma rota de geração pode voltar a aguardar a chamada ao modelo dentro do ciclo de request/response, qualquer que seja o `AI_MODEL` configurado. Ver ADR 0019.

## 6. Critérios de aceitação

- **CA62** DOCX e PDF resolvem e-mail, LinkedIn, GitHub e site como hyperlink real e clicável, com ou sem sintaxe de link explícita no Markdown de origem.
- **CA63** Documentos usam Arial 10pt e margem 700 twips no DOCX (equivalente no PDF); PDF acima de uma página aciona o template compacto a 9pt sem remover conteúdo. Comportamento coberto por teste automatizado de contagem de página.
- **CA64** A saída da geração, LLM e fallback, nunca contém vocabulário interno da fórmula de bullet; validação pós-geração rejeita e aciona nova tentativa ou fallback quando o vazamento aparece.
- **CA65** O resumo profissional da saída é coerente com a vaga, com overlap mínimo de vocabulário com título ou palavras-chave; saída sem essa coerência é rejeitada e regenerada ou cai no fallback tailored. O título profissional permanece garantido de forma determinística.
- **CA66** A geração roda desacoplada do ciclo de request/response: o endpoint de disparo devolve `jobId` imediatamente e a pipeline conclui em processamento de fundo, sem quebrar a requisição HTTP original independente da latência do `AI_MODEL` configurado. Comportamento coberto por teste de regressão.

## Changelog

- **1.8.0 (2026-09-18):** garante link real de contato em DOCX e PDF, rejeita vazamento de vocabulário da fórmula de bullet, valida coerência do resumo com a vaga e formaliza a geração assíncrona por job, conforme ADR 0019.
