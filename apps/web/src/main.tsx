import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import { App } from './App';
import { applyTheme, initialTheme } from './lib/theme';
import './index.css';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const chave = 'prdal:chunk-reload';
  if (!sessionStorage.getItem(chave)) {
    sessionStorage.setItem(chave, '1');
    window.location.reload();
  } else {
    sessionStorage.removeItem(chave);
  }
});

applyTheme(initialTheme());

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
