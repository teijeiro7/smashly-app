import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
  Navigate,
} from '@tanstack/react-router';
import React, { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';

import Layout from './components/layout/Layout';
import { ScrollToTop } from './components/common/ScrollToTop';
import { FloatingCompareButton } from './components/common/FloatingCompareButton';
import AuthModal from './components/auth/AuthModal';
import NicknamePromptModal from './components/auth/NicknamePromptModal';
import { useAuth } from './contexts/AuthContext';
import { useAuthModal } from './contexts/AuthModalContext';
import { supabase } from './lib/supabase';
import { RouteLoadingFallback, CatalogSkeleton } from './components/common/LoadingFallbacks';
import { PWAInstallPrompt } from './components/pwa/PWAInstallPrompt';
import { BackgroundTaskPopup } from './components/common/BackgroundTaskPopup';
import LoadingSpinner from './components/common/LoadingSpinner';
import { logger } from './utils/logger';

// ──────────────────────────────────────────────────────────────────────────────
// Lazy page components
// ──────────────────────────────────────────────────────────────────────────────
const HomePage = lazy(() => import('./pages/HomePage'));
const PlayerDashboard = lazy(() =>
  import('./pages/PlayerDashboard').then(m => ({ default: m.PlayerDashboard }))
);
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const RacketDetailPage = lazy(() => import('./pages/RacketDetailPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const CompareRacketsPage = lazy(() => import('./pages/CompareRacketsPage'));
const SavedComparisonPage = lazy(() => import('./pages/SavedComparisonPage'));
const MyComparisonsPage = lazy(() => import('./pages/MyComparisonsPage'));
const SharedComparisonPage = lazy(() => import('./pages/SharedComparisonPage'));
const BestRacketPage = lazy(() =>
  import('./pages/BestRacketPage').then(m => ({ default: m.BestRacketPage }))
);
const FAQPage = lazy(() => import('./pages/FAQPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const ListPage = lazy(() => import('./pages/ListPage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const AdminRacketReviewPage = lazy(() => import('./pages/AdminRacketReviewPage'));
const AdminRacketsPage = lazy(() => import('./pages/AdminRacketsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminStoresPage = lazy(() => import('./pages/AdminStoresPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

// ──────────────────────────────────────────────────────────────────────────────
// Chunk error boundary (retry on chunk load failure)
// ──────────────────────────────────────────────────────────────────────────────
class LazyChunkErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    logger.error('Lazy chunk load error:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Error loading page. <button onClick={this.handleRetry}>Retry</button></p>
        </div>
      );
    }
    return this.props.children;
  }
}

const LazyRoute: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <LazyChunkErrorBoundary>
    <Suspense fallback={fallback || <RouteLoadingFallback />}>{children}</Suspense>
  </LazyChunkErrorBoundary>
);

// ──────────────────────────────────────────────────────────────────────────────
// Auth helpers for beforeLoad guards
// ──────────────────────────────────────────────────────────────────────────────
async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw redirect({ to: '/' });
  return session;
}

async function requireAdmin() {
  const session = await requireAuth();
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (data?.role?.toLowerCase() !== 'admin') {
    throw redirect({ to: '/error' as any });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Global onboarding handler (Google OAuth nickname prompt)
// ──────────────────────────────────────────────────────────────────────────────
const GoogleOnboardingHandler: React.FC = () => {
  const { pendingGoogleOnboarding, clearGoogleOnboarding, refreshUserProfile } = useAuth();
  const handleNicknameConfirm = async (nickname: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('user_profiles').upsert({ id: session.user.id, nickname });
    await refreshUserProfile();
    clearGoogleOnboarding();
  };
  if (!pendingGoogleOnboarding) return null;
  return (
    <NicknamePromptModal
      isOpen
      suggestedNickname={pendingGoogleOnboarding.suggestedNickname}
      onConfirm={handleNicknameConfirm}
      onClose={clearGoogleOnboarding}
    />
  );
};

// Auth modal redirects (legacy /login and /register URLs)
const LoginRedirect: React.FC = () => {
  const { openLogin } = useAuthModal();
  React.useEffect(() => { openLogin(); }, [openLogin]);
  return <Navigate to="/" />;
};

const RegisterRedirect: React.FC = () => {
  const { openRegister } = useAuthModal();
  React.useEffect(() => { openRegister(); }, [openRegister]);
  return <Navigate to="/" />;
};

// ──────────────────────────────────────────────────────────────────────────────
// Root route — provides the main layout shell
// ──────────────────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <>
      <ScrollToTop />
      <AuthModal />
      <GoogleOnboardingHandler />
      <PWAInstallPrompt />
      <Layout>
        <FloatingCompareButton />
        <BackgroundTaskPopup />
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </Layout>
    </>
  ),
  pendingComponent: () => <LoadingSpinner fullScreen text="Cargando..." />,
  errorComponent: ({ error }) => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Algo salió mal</h2>
      <p>{error instanceof Error ? error.message : 'Error desconocido'}</p>
    </div>
  ),
});

// ──────────────────────────────────────────────────────────────────────────────
// Public routes
// ──────────────────────────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <LazyRoute><HomePage /></LazyRoute>,
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog',
  component: () => <LazyRoute fallback={<CatalogSkeleton />}><CatalogPage /></LazyRoute>,
});

const racketDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/racket-detail',
  component: () => <LazyRoute><RacketDetailPage /></LazyRoute>,
});

const bestRacketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/best-racket',
  component: () => <LazyRoute><BestRacketPage /></LazyRoute>,
});

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare',
  component: () => <LazyRoute><ComparePage /></LazyRoute>,
});

const compareRacketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare-rackets',
  component: () => <LazyRoute><CompareRacketsPage /></LazyRoute>,
});

const savedComparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare/$id',
  component: () => <LazyRoute><SavedComparisonPage /></LazyRoute>,
});

const sharedComparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shared/$token',
  component: () => <LazyRoute><SharedComparisonPage /></LazyRoute>,
});

const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: () => <LazyRoute><FAQPage /></LazyRoute>,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/terms-and-conditions',
  component: () => <LazyRoute><TermsAndConditionsPage /></LazyRoute>,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy-policy',
  component: () => <LazyRoute><PrivacyPolicyPage /></LazyRoute>,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: () => <LazyRoute><ForgotPasswordPage /></LazyRoute>,
});

const updatePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/update-password',
  component: () => <LazyRoute><UpdatePasswordPage /></LazyRoute>,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginRedirect,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterRedirect,
});

// ──────────────────────────────────────────────────────────────────────────────
// Protected routes (auth required)
// ──────────────────────────────────────────────────────────────────────────────
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: requireAuth,
  component: () => <LazyRoute><PlayerDashboard /></LazyRoute>,
});

const myComparisonsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/comparisons',
  beforeLoad: requireAuth,
  component: () => <LazyRoute><MyComparisonsPage /></LazyRoute>,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireAuth,
  component: () => <LazyRoute><UserProfilePage /></LazyRoute>,
});

const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lists/$id',
  beforeLoad: requireAuth,
  component: () => <LazyRoute><ListPage /></LazyRoute>,
});

// ──────────────────────────────────────────────────────────────────────────────
// Admin routes (auth + admin role required)
// ──────────────────────────────────────────────────────────────────────────────
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: requireAdmin,
  component: () => <LazyRoute><AdminPanelPage /></LazyRoute>,
});

const adminRacketReviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/rackets/review',
  beforeLoad: requireAdmin,
  component: () => <LazyRoute><AdminRacketReviewPage /></LazyRoute>,
});

const adminRacketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/rackets',
  beforeLoad: requireAdmin,
  component: () => <LazyRoute><AdminRacketsPage /></LazyRoute>,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  beforeLoad: requireAdmin,
  component: () => <LazyRoute><AdminUsersPage /></LazyRoute>,
});

const adminStoresRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/stores',
  beforeLoad: requireAdmin,
  component: () => <LazyRoute><AdminStoresPage /></LazyRoute>,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/settings',
  beforeLoad: requireAdmin,
  component: () => <LazyRoute><AdminSettingsPage /></LazyRoute>,
});

// ──────────────────────────────────────────────────────────────────────────────
// Error + 404
// ──────────────────────────────────────────────────────────────────────────────
const errorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/error',
  component: () => <LazyRoute><ErrorPage /></LazyRoute>,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: () => <LazyRoute><NotFoundPage /></LazyRoute>,
});

// ──────────────────────────────────────────────────────────────────────────────
// Route tree + router
// ──────────────────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  catalogRoute,
  racketDetailRoute,
  bestRacketRoute,
  compareRoute,
  compareRacketsRoute,
  savedComparisonRoute,
  sharedComparisonRoute,
  faqRoute,
  termsRoute,
  privacyRoute,
  forgotPasswordRoute,
  updatePasswordRoute,
  loginRoute,
  registerRoute,
  // Protected
  dashboardRoute,
  myComparisonsRoute,
  profileRoute,
  listRoute,
  // Admin
  adminRoute,
  adminRacketReviewRoute,
  adminRacketsRoute,
  adminUsersRoute,
  adminStoresRoute,
  adminSettingsRoute,
  // Error + 404
  errorRoute,
  notFoundRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
