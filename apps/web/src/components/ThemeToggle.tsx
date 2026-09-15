import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applyTheme, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );

  function alternar() {
    const proximo: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(proximo);
    applyTheme(proximo);
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={alternar}
      aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}
