import { GlobalStyles } from '@styles/GlobalStyles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'sileo/styles.css';
import { Toaster } from 'sileo';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';

// Suppress all browser console output. Errors shown via sileo toasts.
// To debug, set VITE_DEBUG_CONSOLE=true in .env.local
if (import.meta.env.VITE_DEBUG_CONSOLE !== 'true') {
  const noop = () => {};
  window.console.log     = noop;
  window.console.info    = noop;
  window.console.debug   = noop;
  window.console.warn    = noop;
  window.console.error   = noop;
  window.console.group   = noop;
  window.console.groupEnd = noop;
  window.console.table   = noop;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GlobalStyles />
        <App />
        <Toaster position='top-center' options={{ duration: 4000 }} />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
