import { GlobalStyles } from '@styles/GlobalStyles';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import 'sileo/styles.css';
import SmashlyToaster from './components/common/SmashlyToaster';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';
import * as Sentry from '@sentry/react';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { BackgroundTasksProvider } from './contexts/BackgroundTasksContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { ListsProvider } from './contexts/ListsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RacketsProvider } from './contexts/RacketsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/queryClient';

import { router } from './router';

/**
 * Bridges AuthContext into the router: guards read `context.auth` instead of
 * querying Supabase themselves, and `router.invalidate()` re-runs every
 * active beforeLoad whenever auth state changes — so signing out on a
 * protected route sends you out immediately (instead of leaving the page
 * mounted until the next manual navigation), and signing in re-evaluates the
 * `/` landing redirect.
 */
const InnerApp = () => {
  const auth = useAuth();

  useEffect(() => {
    router.invalidate();
  }, [auth.isAuthenticated, auth.user?.role]);

  return (
    <>
      <RouterProvider router={router} context={{ auth }} />
      <SmashlyToaster />
    </>
  );
};

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
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
                          <InnerApp />
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
