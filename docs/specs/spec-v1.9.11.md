# PRDAL Careers, Especificacao Tecnica

| Campo | Valor |
|---|---|
| **Versao** | 1.9.11 |
| **Status** | Aceita |
| **Data** | 2026-09-19 |
| **Autor** | Gustavo Queiroz Mateus |
| **Dominio** | Integridade de conteudo e pagina unica na geracao de curriculo |
| **Base** | Estende `spec-v1.9.10.md`; formalizada pela ADR 0032 |

> PATCH compativel, prioridade critica. Fecha a lacuna de validacao mecanica de
> pagina, completude do historico e ordem cronologica na geracao de curriculo,
> encontrada ao comparar seis execucoes da mesma vaga com modelos diferentes.
> CA1 a CA114 continuam validos. Esta versao adiciona CA115 a CA118.

## 1. Problema

Comparando a mesma vaga e o mesmo perfil-mestre gerados com seis configuracoes de
modelo (`openai/gpt-oss-20b` em producao, `openai/gpt-oss-120b`,
`meta-llama/llama-3.3-70b-instruct`, `deepseek/deepseek-chat-v3.1`,
`qwen/qwen-2.5-72b-instruct`, mais uma execucao manual de referencia), quatro
problemas apareceram sem que nenhuma validacao existente os pegasse:

1. `openai/gpt-oss-20b` (modelo de producao) omitiu duas das tres experiencias do
   perfil-mestre, mantendo so a mais curta e menos recente. A geracao foi marcada
   `CONCLUIDA` normalmente.
2. Tres dos cinco modelos inverteram a ordem cronologica das experiencias.
3. Um modelo produziu 11 bullets (a referencia correta tem 7), quase sem enxugar
   uma experiencia irrelevante pra vaga, quase certamente estourando 1 pagina.
4. Um modelo usou hifen Unicode nao separavel em vez do hifen ASCII comum.

Causa raiz: `renderizar` (`apps/api/src/curriculos/curriculos.service.ts:641-663`)
conta paginas, tenta um template "compact" se vier mais de 1 pagina, mas nunca
reconta depois; se ainda assim sair com mais de 1 pagina, so registra aviso no log
e salva mesmo assim. `generate.py:124` tem so uma frase de instrucao de prompt
para o limite de experiencias/bullets, sem nenhuma validacao de codigo. Nada
confere completude de experiencias nem ordem cronologica. Os seis arquivos de
evidencia estao em `G:\Dev\Projetos\geracurriculo\curriculos\output\Curriculo_FCAMARA_*.md`.

## 2. Objetivo

1. Fazer a validacao de pagina unica ser mecanica, com retry por conteudo, nao so
   uma frase de prompt.
2. Garantir que nenhuma experiencia do perfil-mestre desapareca silenciosamente
   quando couber no limite de 3 experiencias.
3. Garantir ordem cronologica reversa nas experiencias exibidas.
4. Normalizar pontuacao tipografica fora do ASCII padrao (hifen nao separavel,
   alem do travessao ja coberto).

## 3. Validacao de pagina com escalonamento por conteudo

`renderizar` reconta paginas apos a tentativa com template "compact". Se ainda
assim sair com mais de 1 pagina, isso e tratado como excesso de conteudo, nao
problema de fonte: o motor de geracao e chamado de novo com um erro de reparo
explicito ("reduza bullets ou remova a experiencia menos aderente a vaga"), pelo
mesmo mecanismo de retry que ja alimenta `_erros_formula`, `_erros_factualidade` e
`_erros_coerencia`. Maximo de duas rodadas de corte. Se persistir acima de 1
pagina apos o limite, o curriculo e salvo com `degradacao` preenchido de forma
explicita, nunca como sucesso silencioso.

## 4. Completude do historico

Quando o perfil-mestre tiver ate 3 experiencias, uma validacao pos-geracao confere
que o nome de cada empresa aparece na secao de Experiencia Profissional da saida.
Falta de qualquer uma entra no mesmo laco de reparo da secao 3, nao e tratada como
corte legitimo. Quando houver mais de 3 experiencias e selecao for necessaria, a
experiencia mais recente (sem data de termino) nunca pode ser omitida em favor de
uma mais antiga.

## 5. Ordem cronologica reversa

`.claude/agents/modo-pipeline-curriculo.md` (nos dois repositorios) ganha a frase
explicita "Experiencias profissionais em ordem cronologica reversa, a mais
recente primeiro" na secao da Etapa 2. Uma validacao pos-geracao confere que as
datas de inicio aparecem em ordem decrescente na secao de Experiencia; ordem
errada entra no mesmo laco de reparo.

## 6. Normalizacao de pontuacao

A validacao editorial existente (vazamento de vocabulario da formula de bullet,
travessao Unicode) passa a normalizar tambem hifen Unicode nao separavel (`U+2011`)
para hifen ASCII comum antes de aceitar a saida.

## 7. Criterios de aceitacao

- **CA115** Apos a tentativa com template "compact", `renderizar` reconta paginas;
  se ainda vier mais de 1 pagina, o motor de geracao e chamado de novo com erro de
  reparo explicito pedindo reducao de conteudo, respeitando o limite de duas
  rodadas de corte. Verificavel forcando uma vaga com perfil extenso e observando
  o log/trace do retry por excesso de conteudo, nao so a troca de template.
- **CA116** Se apos o limite de tentativas da CA115 o resultado ainda tiver mais
  de 1 pagina, o curriculo persistido tem `degradacao` preenchido de forma
  explicita, nunca `CONCLUIDA` sem sinalizacao. Verificavel simulando um perfil
  cujo conteudo nao cabe em 1 pagina mesmo apos os cortes.
- **CA117** Para um perfil-mestre com ate 3 experiencias, a saida da geracao
  contem o nome de todas elas na secao de Experiencia Profissional, na ordem
  cronologica reversa (mais recente primeiro). Verificavel repetindo a vaga
  FCamara com o perfil-mestre real (3 experiencias: Modera Road Inspector,
  Saraiva Leao, Micro&Money) e conferindo as tres presentes, com Modera Road
  Inspector (emprego atual) primeiro.
- **CA118** A saida da geracao nao contem hifen Unicode nao separavel (`U+2011`)
  nem outra pontuacao tipografica fora do ASCII padrao ja coberta pela validacao
  editorial existente.

## Changelog

- **1.9.11 (2026-09-19):** adiciona validacao mecanica de pagina com retry por
  conteudo e falha honesta, completude do historico do perfil-mestre, ordem
  cronologica reversa das experiencias e normalizacao de hifen Unicode, conforme
  ADR 0032, a partir de achado real comparando seis modelos na mesma vaga.
