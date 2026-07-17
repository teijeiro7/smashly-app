import { GlobalStyles } from '@styles/GlobalStyles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'sileo/styles.css';
import { Toaster } from 'sileo';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';
import * as Sentry from '@sentry/react';

import { router } from './router';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
});
import { AuthProvider } from './contexts/AuthContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RacketsProvider } from './contexts/RacketsContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { ListsProvider } from './contexts/ListsContext';
import { BackgroundTasksProvider } from './contexts/BackgroundTasksContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

if (!import.meta.env.DEV) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <AuthProvider>
              <NotificationProvider>
                <BackgroundTasksProvider>
                  <RacketsProvider>
                    <ComparisonProvider>
                      <ListsProvider>
                        <AuthModalProvider>
                          <GlobalStyles />
                          <RouterProvider router={router} />
                          <Toaster position='top-center' options={{ duration: 4000 }} />
                        </AuthModalProvider>
                      </ListsProvider>
                    </ComparisonProvider>
                  </RacketsProvider>
                </BackgroundTasksProvider>
              </NotificationProvider>
            </AuthProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </HelmetProvider>
    </ThemeProvider>
  </StrictMode>
);
