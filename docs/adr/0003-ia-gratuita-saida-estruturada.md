# ADR 0003 — Modelo de IA gratuito com saída estruturada validada

- **Status:** Aceita
- **Data:** 2026-09-12
- **Contexto:** A geração do currículo depende de um LLM. O projeto é de portfólio e não pode ter custo recorrente de API. Além disso, LLM tende a devolver texto fora do formato pedido, o que quebraria o pipeline downstream que espera Markdown estruturado.

## Decisão
Usar um cliente compatível com a API OpenAI apontando por padrão para **Groq (free tier)**, com **Ollama local** como fallback selecionável por variável de ambiente `AI_PROVIDER`. Toda saída do modelo é validada contra um **schema Pydantic**; em caso de saída inválida, aplica-se retry com prompt de correção e, esgotado o retry, um fallback determinístico que monta o currículo a partir do perfil-mestre sem o LLM.

## Justificativa
- Groq é gratuito, rápido e compatível com a API OpenAI, o que mantém o código do cliente limpo e portável.
- Ollama local remove qualquer dependência de rede para demonstração ao vivo, sem custo.
- Validar com Pydantic transforma "o modelo às vezes erra o formato" em erro tratável, não em falha silenciosa.
- O fallback determinístico garante que o produto entrega algo útil mesmo se o modelo estiver indisponível.

## Consequências
- O `ai-service` precisa de uma camada de validação e de prompts de correção, com testes cobrindo o caminho de saída inválida.
- A qualidade do texto varia conforme o provedor escolhido; o contrato de saída não varia.
- Trocar de provedor é mudança de configuração, não de código.
