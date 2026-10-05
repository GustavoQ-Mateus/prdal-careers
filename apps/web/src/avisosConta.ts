export function destinoErroConta(erro: unknown, origem: 'exclusao' | 'copiloto' | 'geracao') {
  if (!(erro instanceof Error) || !('codigo' in erro)) return 'comum';
  if (origem === 'exclusao' && erro.codigo === 'senha_incorreta') return 'dialogo';
  if (origem !== 'exclusao' && erro.codigo === 'consentimento_pendente') return 'consentimento';
  return 'comum';
}
