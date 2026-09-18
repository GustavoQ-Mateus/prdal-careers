# PRDAL Careers, Especificação Técnica

| Campo | Valor |
|---|---|
| **Versão** | 1.7.0 |
| **Status** | Draft |
| **Data** | 2026-09-17 |
| **Autor** | Gustavo Queiroz Mateus |
| **Domínio** | Paridade editorial da geração de currículo ATS |
| **Base** | Estende `spec-v1.0.0.md` a `spec-v1.6.0.md` |

> MINOR compatível. Formaliza o contrato editorial do Markdown, completa a fonte factual do Perfil e torna DOCX e PDF semanticamente equivalentes. CA1 a CA55 continuam válidos. Esta versão adiciona CA56 a CA61.

## 1. Problema

A geração ponta a ponta existe, mas o contrato entre IA e documentos ainda aceita saídas estruturalmente fracas. O fallback pode fundir nome e título, transformar uma experiência densa em texto com labels internos e produzir competências sem categorias. O Doc Service, por sua vez, achata a semântica do Markdown e não distingue título profissional, contato, competências e campos de experiência.

O Perfil também não possui campos próprios para certificações e idiomas. Isso força seções vazias ou dependência incidental do RAG para fatos que pertencem à fonte primária do candidato.

## 2. Objetivo

1. Produzir currículo factual, tailored e denso tanto pelo LLM quanto pelo fallback.
2. Validar o Markdown antes de persistir e renderizar.
3. Preservar a semântica do currículo em DOCX e PDF.
4. Tentar compactação visual quando o PDF exceder uma página.
5. Registrar certificações e idiomas como fatos estruturados do Perfil.

## 3. Contrato editorial do Markdown

O currículo usa, nesta ordem:

1. `# NOME`.
2. `**Título profissional**` em linha própria.
3. Linha de contato no corpo do documento.
4. Resumo profissional.
5. Competências categorizadas no formato `- Categoria: valores`.
6. Experiência profissional com cabeçalho `**Empresa** | Cargo | MM/AAAA - MM/AAAA` e bullets finais.
7. Formação acadêmica.
8. Certificações.
9. Idiomas.

Cada bullet de experiência começa com verbo de ação e preserva contexto, tecnologias e impacto comprovado. Fatos não atravessam experiências. Contribuição de time não vira autoria individual. Não existem tabelas, colunas, ícones, labels crus dentro das experiências, travessão Unicode ou keyword stuffing.

O alvo é uma página. A geração prioriza até três experiências e dois a quatro bullets densos por experiência. Reduzir relevância é permitido; reduzir uma experiência a tarefa genérica não é.

## 4. Perfil factual

`PerfilMestre` recebe dois campos JSON aditivos:

- `certificacoes: string[]`;
- `idiomas: string[]`.

Os campos entram na edição do Perfil, na projeção enviada ao AI Service e no corpus automático do RAG. Clientes antigos podem omiti-los; nesse caso a API persiste listas vazias.

Descrições de experiência podem manter bullets em Markdown. A normalização extrai essas realizações sem adicionar labels ou texto artificial. Experiências legadas no formato `Empresa | Cargo | Período | Descrição` continuam aceitas.

## 5. Geração e validação

O AI Service mantém saída JSON validada por Pydantic e adiciona validação editorial do conteúdo Markdown. Saída vazia ou fora do contrato usa fallback determinístico factual.

O fallback:

- separa nome e título;
- ordena a linha de contato;
- categoriza apenas competências sustentadas pelo Perfil;
- converte meses conhecidos para `MM/AAAA`;
- reaproveita bullets reais da experiência;
- seleciona realizações por aderência à vaga sem misturar empresas;
- inclui certificações e idiomas somente quando registrados.

Regras específicas de uma pessoa ou empresa não ficam no prompt global. A verdade vem do Perfil e do contexto RAG.

## 6. Documentos

O Doc Service continua seguindo a ADR 0007 e os mesmos endpoints. O parser Markdig produz elementos semânticos para nome, título profissional, contato, seção, competência, cargo, empresa, período, formação e bullet.

DOCX e PDF usam:

- página A4;
- Arial;
- margem de 700 twips no DOCX e equivalente no PDF;
- corpo de 10 pt no template padrão;
- contato no corpo;
- links visuais e links reais no DOCX;
- bullets reais no DOCX;
- cargo, empresa e período em blocos distintos;
- hierarquia e espaçamento equivalentes.

Ao detectar PDF com mais de uma página, a API renderiza novamente PDF e DOCX com o template `compact`, equivalente a 9 pt e espaçamento reduzido. Se ainda exceder uma página, preserva o conteúdo e registra aviso; não corta texto silenciosamente.

## 7. Critérios de aceitação

- **CA56** LLM e fallback entregam Markdown no contrato editorial e o fallback não contém labels crus ou sufixos artificiais.
- **CA57** Competências ficam categorizadas e experiências preservam bullets densos, factuais e vinculados à empresa correta.
- **CA58** Perfil, RAG e geração aceitam certificações e idiomas estruturados sem quebrar clientes anteriores.
- **CA59** DOCX preserva bullets reais, links, negrito inline e campos separados de cargo, empresa e período.
- **CA60** PDF e DOCX usam a mesma semântica e hierarquia visual, com texto selecionável e fonte Arial.
- **CA61** PDF acima de uma página dispara uma segunda renderização compacta; conteúdo não é removido pelo renderer.

## Changelog

- **1.7.0 (2026-09-17):** formaliza o contrato editorial do currículo, completa Perfil com certificações e idiomas, valida a saída Markdown, corrige o fallback factual e adiciona renderização semântica com compactação de página.
