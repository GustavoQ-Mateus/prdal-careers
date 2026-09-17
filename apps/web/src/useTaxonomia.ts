import { useEffect, useState } from 'react';
import { getTaxonomia, type Taxonomia } from './api';

const VAZIA: Taxonomia = { categorias: [], niveis: [] };

let cache: Taxonomia | null = null;

export function useTaxonomia(): Taxonomia {
  const [taxonomia, setTaxonomia] = useState<Taxonomia>(cache ?? VAZIA);

  useEffect(() => {
    if (cache) return;
    getTaxonomia()
      .then((r) => {
        cache = r;
        setTaxonomia(r);
      })
      .catch(() => {});
  }, []);

  return taxonomia;
}
