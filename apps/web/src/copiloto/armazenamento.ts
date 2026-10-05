type Armazenamento = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export function armazenamentoConversa(oportunidadeId: string | undefined, local: Armazenamento, sessao: Armazenamento) {
  return oportunidadeId ? local : sessao;
}

export function limparArmazenamentosCopiloto(local: Armazenamento, sessao: Armazenamento) {
  for (const armazenamento of [local, sessao]) {
    for (let indice = armazenamento.length - 1; indice >= 0; indice--) {
      const chave = armazenamento.key(indice);
      if (chave?.startsWith('copiloto:')) armazenamento.removeItem(chave);
    }
  }
}
