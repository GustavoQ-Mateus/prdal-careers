export type Theme = 'light' | 'dark';

const KEY = 'prdal-theme';

export function initialTheme(): Theme {
  const salvo = localStorage.getItem(KEY);
  if (salvo === 'light' || salvo === 'dark') return salvo;
  return 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(KEY, theme);
}
