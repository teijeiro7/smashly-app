import {
  createRouter,
  createRoute,
  createRootRouteWithContext,
  Outlet,
  redirect,
  useRouterState,
  useSearch,
} from '@tanstack/react-router';
import React, { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';

import Layout from './components/layout/Layout';
import { FloatingCompareButton } from './components/common/FloatingCompareButton';
import AuthModal from './components/auth/AuthModal';
import NicknamePromptModal from './components/auth/NicknamePromptModal';
import { useAuth } from './contexts/AuthContext';
import { useAuthModal } from './contexts/AuthModalContext';
import { supabase } from './lib/supabase';
import { queryClient } from './lib/queryClient';
import racketService from './services/racketService';
import { RouteLoadingFallback, CatalogSkeleton } from './components/common/LoadingFallbacks';
import { PWAInstallPrompt } from './components/pwa/PWAInstallPrompt';
import { BackgroundTaskPopup } from './components/common/BackgroundTaskPopup';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { logger } from './utils/logger';
import { sileo } from 'sileo';

// ──────────────────────────────────────────────────────────────────────────────
// Router context — the AuthProvider value is injected by main.tsx so guards
// read live auth state instead of running their own Supabase queries.
// ──────────────────────────────────────────────────────────────────────────────
type AuthCtx = ReturnType<typeof useAuth>;

export interface RouterContext {
  auth: AuthCtx;
}

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
const StoreDashboard = lazy(() =>
  import('./pages/StoreDashboard').then(m => ({ default: m.StoreDashboard }))
);
const AdminRacketReviewPage = lazy(() => import('./pages/AdminRacketReviewPage'));
const AdminRacketsPage = lazy(() => import('./pages/AdminRacketsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminStoresPage = lazy(() => import('./pages/AdminStoresPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const PublicStorePage = lazy(() => import('./pages/PublicStorePage'));
const MessagingPage = lazy(() => import('./pages/MessagingPage'));
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
      return (
        this.props.fallback ?? (
          <div role='alert' style={{ padding: '2rem', textAlign: 'center' }}>
            <p>
              Error loading page. <button onClick={this.handleRetry}>Retry</button>
            </p>
          </div>
        )
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

/** Builds `{ [key]: value }` only when `value` is a string, `{}` otherwise —
 * used so every validateSearch key comes out optional (`key?: string`)
 * rather than required-but-possibly-undefined (`key: string | undefined`).
 * TanStack only lets a caller omit `search` entirely when every key in the
 * route's search schema is optional; the latter shape looks optional at the
 * value level but the key is still mandatory, which made `search` required
 * on every navigate/Link to these routes across the app. */
function pickString<K extends string>(
  obj: Record<string, unknown>,
  key: K
): Partial<Record<K, string>> {
  const value = obj[key];
  return typeof value === 'string' ? ({ [key]: value } as Partial<Record<K, string>>) : {};
}

// ──────────────────────────────────────────────────────────────────────────────
// Auth helpers for beforeLoad guards
//
// All four read from `context.auth` (the live AuthProvider value, injected by
// main.tsx) instead of querying Supabase directly — one shared source of
// truth with the rest of the app, and no query fired on every `intent`
// preload hover. `context.auth.ready` is awaited first so a hard refresh on
// a protected route never races the pre-hydration flash of
// `isAuthenticated: false` (that race is what let a hard refresh on /admin
// bounce a genuinely logged-in Admin out).
// ──────────────────────────────────────────────────────────────────────────────
// Exported (not just used internally) so the guard logic can be unit-tested
// with a mocked `auth` object instead of only through a live browser — see
// frontend/src/__tests__/unit/router.guards.test.ts.
export const normalizeRole = (role?: string | null): string | undefined =>
  role?.toLowerCase() ?? undefined;

/** The user's role, normalized — retries once via refreshUserProfile() if the
 * session is valid but the profile row didn't load (RLS hiccup, cold start).
 * Returns undefined only if the retry also comes back empty. */
export async function resolveRole(auth: AuthCtx): Promise<string | undefined> {
  const direct = normalizeRole(auth.user?.role);
  if (direct) return direct;
  const refreshed = await auth.refreshUserProfile();
  return normalizeRole(refreshed?.role);
}

export async function ensureAuthenticated(auth: AuthCtx, next: string): Promise<void> {
  await auth.ready;
  if (!auth.isAuthenticated) {
    // A sign-out just cleared the session and is navigating to '/' — carrying
    // `?next=` would reopen the login modal the moment the user logged out.
    if (auth.isSigningOut) {
      throw redirect({ to: '/' });
    }
    throw redirect({ to: '/', search: { next } });
  }
}

export async function requireAuth({
  context,
  location,
}: {
  context: RouterContext;
  location: { href: string };
}): Promise<void> {
  await ensureAuthenticated(context.auth, location.href);
}

export async function requireAdmin({
  context,
  location,
}: {
  context: RouterContext;
  location: { href: string };
}): Promise<void> {
  await ensureAuthenticated(context.auth, location.href);
  const role = await resolveRole(context.auth);
  if (role === undefined) {
    throw redirect({ to: '/error', search: { type: 'auth' } });
  }
  if (role !== 'admin') {
    throw redirect({ to: '/error', search: { type: 'forbidden' } });
  }
}

export async function requireStoreOwner({
  context,
  location,
}: {
  context: RouterContext;
  location: { href: string };
}): Promise<void> {
  await ensureAuthenticated(context.auth, location.href);
  const role = await resolveRole(context.auth);
  if (role === undefined) {
    throw redirect({ to: '/error', search: { type: 'auth' } });
  }
  if (role !== 'store') {
    throw redirect({ to: '/dashboard' });
  }
}

/** `/dashboard`'s own guard: bounce Store-role accounts to their own
 * dashboard. Deliberately lenient on an unreadable role (falls through to
 * PlayerDashboard rather than /error) — this route isn't gating membership
 * in a role, it only redirects a specific one elsewhere, so a transient
 * profile-fetch hiccup shouldn't block a legitimate Player. */
export async function redirectStoreOwnerToDashboard({
  context,
  location,
}: {
  context: RouterContext;
  location: { href: string };
}): Promise<void> {
  await ensureAuthenticated(context.auth, location.href);
  const role = await resolveRole(context.auth);
  if (role === 'store') {
    throw redirect({ to: '/store/dashboard' });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Global onboarding handler (Google OAuth nickname prompt)
// ──────────────────────────────────────────────────────────────────────────────
const GoogleOnboardingHandler: React.FC = () => {
  const { pendingGoogleOnboarding, clearGoogleOnboarding, refreshUserProfile } = useAuth();
  const handleNicknameConfirm = async (nickname: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
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

// ──────────────────────────────────────────────────────────────────────────────
// Google block error handler (store_owner cannot use Google login)
// ──────────────────────────────────────────────────────────────────────────────
const GoogleBlockHandler: React.FC = () => {
  const { googleBlockError, clearGoogleBlockError } = useAuth();
  React.useEffect(() => {
    if (googleBlockError) {
      sileo.error({ title: 'Error', description: googleBlockError });
      clearGoogleBlockError();
    }
  }, [googleBlockError, clearGoogleBlockError]);
  return null;
};

// ──────────────────────────────────────────────────────────────────────────────
// `?next=` handler — mounted at root so it fires regardless of which public
// route a guard redirected to. Opens the login modal automatically when a
// rejected navigation left a `next` destination in the URL.
// ──────────────────────────────────────────────────────────────────────────────
const NextParamHandler: React.FC = () => {
  const { openLogin } = useAuthModal();
  const { isAuthenticated, ready } = useAuth();
  const search = useSearch({ strict: false }) as { next?: string };

  useEffect(() => {
    if (!search.next || isAuthenticated) return;
    let cancelled = false;
    ready.then(() => {
      if (!cancelled) openLogin();
    });
    return () => {
      cancelled = true;
    };
  }, [search.next, isAuthenticated, ready, openLogin]);

  return null;
};

// ──────────────────────────────────────────────────────────────────────────────
// Root route — provides the main layout shell
// ──────────────────────────────────────────────────────────────────────────────
// Focuses <main> and announces the navigation to screen readers on every
// route change — a SPA swaps content without the full-page load a screen
// reader would otherwise use as its cue to re-orient.
const RootOutlet: React.FC = () => {
  const pathname = useRouterState({ select: state => state.location.pathname });

  useEffect(() => {
    document.getElementById('main-content')?.focus();
  }, [pathname]);

  return (
    <ErrorBoundary>
      <div aria-live='polite' className='sr-only'>
        Página actualizada
      </div>
      <AnimatePresence mode='wait'>
        <Outlet key={pathname} />
      </AnimatePresence>
    </ErrorBoundary>
  );
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <MotionConfig reducedMotion='user'>
      <AuthModal />
      <NextParamHandler />
      <GoogleOnboardingHandler />
      <GoogleBlockHandler />
      <PWAInstallPrompt />
      <Layout>
        <FloatingCompareButton />
        <BackgroundTaskPopup />
        <RootOutlet />
      </Layout>
    </MotionConfig>
  ),
  pendingComponent: () => <LoadingSpinner fullScreen text='Cargando...' />,
  errorComponent: ({ error }) => (
    <div role='alert' style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Algo salió mal</h2>
      <p>{error instanceof Error ? error.message : 'Error desconocido'}</p>
    </div>
  ),
  notFoundComponent: () => (
    <LazyRoute>
      <NotFoundPage />
    </LazyRoute>
  ),
});

// ──────────────────────────────────────────────────────────────────────────────
// Public routes
// ──────────────────────────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => ({
    ...pickString(search, 'next'),
  }),
  // Landing dispatcher: an authenticated user's "home" is their role's
  // dashboard, decided here (before HomePage ever mounts) instead of via a
  // useEffect inside HomePage — that used to race the initial profile fetch
  // and leave Admins looking at the marketing page. Deliberately lenient on
  // an unreadable role (stays on HomePage) — '/' isn't a permission gate.
  beforeLoad: async ({ context }) => {
    await context.auth.ready;
    if (!context.auth.isAuthenticated) return;
    const role = await resolveRole(context.auth);
    if (role === 'admin') throw redirect({ to: '/admin' });
    if (role === 'store') throw redirect({ to: '/store/dashboard' });
    if (role === 'player') throw redirect({ to: '/dashboard' });
  },
  component: () => (
    <LazyRoute>
      <HomePage />
    </LazyRoute>
  ),
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog',
  validateSearch: (search: Record<string, unknown>) => ({
    ...pickString(search, 'search'),
    ...pickString(search, 'brand'),
    ...pickString(search, 'shape'),
    ...pickString(search, 'balance'),
    ...pickString(search, 'core'),
    ...pickString(search, 'face'),
    ...pickString(search, 'level'),
    ...pickString(search, 'gameType'),
    ...pickString(search, 'hardness'),
    ...pickString(search, 'offers'),
    ...pickString(search, 'mostViewed'),
    ...pickString(search, 'sort'),
    ...pickString(search, 'availableOnly'),
  }),
  component: () => (
    <LazyRoute fallback={<CatalogSkeleton />}>
      <CatalogPage />
    </LazyRoute>
  ),
});

const racketDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/palas/$slug',
  // Preloads the same queryKey RacketDetailPage's useQuery reads — with
  // defaultPreload: 'intent' below, hovering a card that links here fires
  // this before the click, so the page renders with data already in cache.
  loader: async ({ params }) => {
    await queryClient.ensureQueryData({
      queryKey: ['racket', 'slug', params.slug],
      queryFn: () => racketService.getRacketBySlug(params.slug),
      staleTime: 1000 * 60 * 5,
    });
  },
  component: () => (
    <LazyRoute>
      <RacketDetailPage />
    </LazyRoute>
  ),
});

// Legacy `/racket-detail?id=` links (shared/indexed pre-migration) redirect
// permanently to the canonical slug route. `reviewId` (deep-link to a
// specific review from a notification, see NotificationDropdown.tsx) is
// preserved across the redirect so that flow keeps working.
const racketDetailLegacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/racket-detail',
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.id === 'string' || typeof search.id === 'number' ? { id: search.id } : {}),
    ...pickString(search, 'name'),
    ...pickString(search, 'reviewId'),
  }),
  beforeLoad: async ({ search }) => {
    const numericId = Number(search.id);
    if (!numericId) throw redirect({ to: '/catalog' });
    const racket = await racketService.getRacketById(numericId);
    if (!racket?.slug) throw redirect({ to: '/catalog' });
    throw redirect({
      to: '/palas/$slug',
      params: { slug: racket.slug },
      ...(search.reviewId ? { search: { reviewId: search.reviewId } } : {}),
      replace: true,
    });
  },
});

const bestRacketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/best-racket',
  component: () => (
    <LazyRoute>
      <BestRacketPage />
    </LazyRoute>
  ),
});

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare',
  component: () => (
    <LazyRoute>
      <ComparePage />
    </LazyRoute>
  ),
});

const compareRacketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare-rackets',
  component: () => (
    <LazyRoute>
      <CompareRacketsPage />
    </LazyRoute>
  ),
});

const savedComparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare/$id',
  component: () => (
    <LazyRoute>
      <SavedComparisonPage />
    </LazyRoute>
  ),
});

const sharedComparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shared/$token',
  component: () => (
    <LazyRoute>
      <SharedComparisonPage />
    </LazyRoute>
  ),
});

const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: () => (
    <LazyRoute>
      <FAQPage />
    </LazyRoute>
  ),
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/terms-and-conditions',
  component: () => (
    <LazyRoute>
      <TermsAndConditionsPage />
    </LazyRoute>
  ),
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy-policy',
  component: () => (
    <LazyRoute>
      <PrivacyPolicyPage />
    </LazyRoute>
  ),
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: () => (
    <LazyRoute>
      <ForgotPasswordPage />
    </LazyRoute>
  ),
});

const updatePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/update-password',
  component: () => (
    <LazyRoute>
      <UpdatePasswordPage />
    </LazyRoute>
  ),
});

const publicStoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/store/$slug',
  component: () => (
    <LazyRoute>
      <PublicStorePage />
    </LazyRoute>
  ),
});

// ──────────────────────────────────────────────────────────────────────────────
// Protected routes (auth required)
// ──────────────────────────────────────────────────────────────────────────────
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: redirectStoreOwnerToDashboard,
  component: () => (
    <LazyRoute>
      <PlayerDashboard />
    </LazyRoute>
  ),
});

const storeDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/store/dashboard',
  beforeLoad: requireStoreOwner,
  component: () => (
    <LazyRoute>
      <StoreDashboard />
    </LazyRoute>
  ),
});

const messagingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  beforeLoad: requireAuth,
  component: () => (
    <LazyRoute>
      <MessagingPage />
    </LazyRoute>
  ),
});

const myComparisonsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/comparisons',
  beforeLoad: requireAuth,
  component: () => (
    <LazyRoute>
      <MyComparisonsPage />
    </LazyRoute>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    ...pickString(search, 'tab'),
  }),
  component: () => (
    <LazyRoute>
      <UserProfilePage />
    </LazyRoute>
  ),
});

const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lists/$id',
  beforeLoad: requireAuth,
  component: () => (
    <LazyRoute>
      <ListPage />
    </LazyRoute>
  ),
});

// ──────────────────────────────────────────────────────────────────────────────
// Admin routes (auth + admin role required)
// ──────────────────────────────────────────────────────────────────────────────
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: requireAdmin,
  component: () => (
    <LazyRoute>
      <AdminPanelPage />
    </LazyRoute>
  ),
});

const adminRacketReviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/rackets/review',
  beforeLoad: requireAdmin,
  component: () => (
    <LazyRoute>
      <AdminRacketReviewPage />
    </LazyRoute>
  ),
});

const adminRacketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/rackets',
  beforeLoad: requireAdmin,
  component: () => (
    <LazyRoute>
      <AdminRacketsPage />
    </LazyRoute>
  ),
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  beforeLoad: requireAdmin,
  component: () => (
    <LazyRoute>
      <AdminUsersPage />
    </LazyRoute>
  ),
});

const adminStoresRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/stores',
  beforeLoad: requireAdmin,
  component: () => (
    <LazyRoute>
      <AdminStoresPage />
    </LazyRoute>
  ),
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/settings',
  beforeLoad: requireAdmin,
  component: () => (
    <LazyRoute>
      <AdminSettingsPage />
    </LazyRoute>
  ),
});

// ──────────────────────────────────────────────────────────────────────────────
// Error + 404
// ──────────────────────────────────────────────────────────────────────────────
const errorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/error',
  validateSearch: (search: Record<string, unknown>) => ({
    ...pickString(search, 'type'),
    ...pickString(search, 'message'),
  }),
  component: () => (
    <LazyRoute>
      <ErrorPage />
    </LazyRoute>
  ),
});

// Splat route — `$` (not `*`) is TanStack's actual wildcard segment syntax;
// `*` parses as a literal path segment, so this never matched anything and
// every unknown URL fell through to the router's bare built-in "Not Found"
// text instead of NotFoundPage. `notFoundComponent` on the root route above
// is a second safety net for `notFound()` thrown from a loader/beforeLoad,
// which this splat route does not catch.
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: () => (
    <LazyRoute>
      <NotFoundPage />
    </LazyRoute>
  ),
});

// ──────────────────────────────────────────────────────────────────────────────
// Route tree + router
// ──────────────────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  catalogRoute,
  racketDetailRoute,
  racketDetailLegacyRoute,
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
  publicStoreRoute,
  // Protected
  dashboardRoute,
  storeDashboardRoute,
  messagingRoute,
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
  context: { auth: undefined! },
  defaultPreload: 'intent',
  scrollRestoration: true,
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
