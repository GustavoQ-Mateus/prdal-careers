# ADR 0005 — Score ATS explicável e reproduzível

- **Status:** Aceita
- **Data:** 2026-09-12
- **Contexto:** O produto promete um "score ATS". Pedir esse número diretamente ao LLM produziria um valor opaco, não reproduzível e sem como justificar. ATS reais fazem match de termos, não julgamento subjetivo.

## Decisão
Calcular o score de forma **determinística** no `ai-service`, sem LLM, combinando três componentes contra as keywords da vaga:
1. **Keyword match**: fração das keywords da vaga presentes no currículo, ponderada pelo peso de cada keyword.
2. **Densidade**: frequência das keywords relevantes sem cair em keyword stuffing, com teto por termo.
3. **Seções**: presença das seções que um ATS espera (resumo, experiência, formação, skills, contato).

O resultado é um inteiro de 0 a 100 com um `breakdown` que mostra a contribuição de cada componente e quais keywords faltaram.

## Justificativa
- Determinístico significa reproduzível: a mesma dupla currículo/vaga sempre dá o mesmo número, o que atende ao CA4.
- O breakdown é acionável: o usuário vê exatamente quais keywords incluir para subir o score.
- Separa responsabilidades: o LLM gera texto, o algoritmo mede. Cada um faz o que é bom.

## Consequências
- Precisa de um extrator de keywords consistente (o mesmo usado no cadastro da vaga) e de normalização de texto (lowercase, remoção de acento, lematização leve).
- O peso de cada componente é configurável e documentado; ajustá-lo é decisão de produto, não mágica.
