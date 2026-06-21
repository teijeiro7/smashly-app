import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Layout from './components/layout/Layout';
import { ScrollToTop } from './components/common/ScrollToTop';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { RacketsProvider } from './contexts/RacketsContext';
import { ListsProvider } from './contexts/ListsContext';
import { BackgroundTasksProvider } from './contexts/BackgroundTasksContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { FloatingCompareButton } from './components/common/FloatingCompareButton';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModalProvider, useAuthModal } from './contexts/AuthModalContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AuthModal from './components/auth/AuthModal';
import NicknamePromptModal from './components/auth/NicknamePromptModal';
import { supabase } from './lib/supabase';
import { RouteLoadingFallback, CatalogSkeleton } from './components/common/LoadingFallbacks';
import { PWAInstallPrompt } from './components/pwa/PWAInstallPrompt';
import { BackgroundTaskPopup } from './components/common/BackgroundTaskPopup';
import { logger } from './utils/logger';

// Code split routes - load on demand
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

// Error Boundary for lazy-loaded chunks with retry
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
    // Force reload the page to re-fetch chunks
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Error al cargar la página</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              No se pudo cargar el contenido. Esto suele deberse a una versión en caché desactualizada.
            </p>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrapper for lazy routes with error boundary
const LazyRoute: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <LazyChunkErrorBoundary fallback={fallback}>
    <Suspense fallback={fallback || <RouteLoadingFallback />}>
      {children}
    </Suspense>
  </LazyChunkErrorBoundary>
);

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

const LoginRedirect: React.FC = () => {
  const { openLogin } = useAuthModal();
  React.useEffect(() => { openLogin(); }, [openLogin]);
  return <Navigate to="/" replace />;
};

const RegisterRedirect: React.FC = () => {
  const { openRegister } = useAuthModal();
  React.useEffect(() => { openRegister(); }, [openRegister]);
  return <Navigate to="/" replace />;
};

export default function App() {
  return (
    <ErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <AuthProvider>
          <NotificationProvider>
            <BackgroundTasksProvider>
              <RacketsProvider>
                <ComparisonProvider>
                  <ListsProvider>
                    <AuthModalProvider>
                      <ScrollToTop />
                      <AuthModal />
                      <GoogleOnboardingHandler />
                      <PWAInstallPrompt />
                      <Layout>
                        <FloatingCompareButton />
                        <BackgroundTaskPopup />
                        <AnimatePresence mode="wait">
                        <Routes>
                        {/* Critical routes - prioritized */}
                        <Route
                          path='/'
                          element={
                            <LazyRoute>
                              <HomePage />
                            </LazyRoute>
                          }
                        />
                        <Route
                          path='/dashboard'
                          element={
                            <ProtectedRoute>
                              <LazyRoute>
                                <PlayerDashboard />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />

                        {/* Catalog with skeleton for better perceived performance */}
                        <Route
                          path='/catalog'
                          element={
                            <LazyRoute fallback={<CatalogSkeleton />}>
                              <CatalogPage />
                            </LazyRoute>
                          }
                        />

                        {/* Product pages */}
                        <Route
                          path='/racket-detail'
                          element={
                            <LazyRoute>
                              <RacketDetailPage />
                            </LazyRoute>
                          }
                        />
                        <Route
                          path='/best-racket'
                          element={
                            <LazyRoute>
                              <BestRacketPage />
                            </LazyRoute>
                          }
                        />

                        {/* Comparison routes */}
                        <Route
                          path='/compare'
                          element={
                            <LazyRoute>
                              <ComparePage />
                            </LazyRoute>
                          }
                        />
                        <Route
                          path='/compare-rackets'
                          element={
                            <LazyRoute>
                              <CompareRacketsPage />
                            </LazyRoute>
                          }
                        />
                        <Route
                          path='/compare/:id'
                          element={
                            <LazyRoute>
                              <SavedComparisonPage />
                            </LazyRoute>
                          }
                        />
                        <Route
                          path='/comparisons'
                          element={
                            <ProtectedRoute>
                              <LazyRoute>
                                <MyComparisonsPage />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/shared/:token'
                          element={
                            <LazyRoute>
                              <SharedComparisonPage />
                            </LazyRoute>
                          }
                        />
                        <Route
                          path='/forgot-password'
                          element={
                            <LazyRoute>
                              <ForgotPasswordPage />
                            </LazyRoute>
                          }
                        />
                        <Route
                          path='/update-password'
                          element={
                            <LazyRoute>
                              <UpdatePasswordPage />
                            </LazyRoute>
                          }
                        />

                        {/* User routes */}
                        <Route
                          path='/login'
                          element={<LoginRedirect />}
                        />
                        <Route
                          path='/register'
                          element={<RegisterRedirect />}
                        />
                        <Route
                          path='/faq'
                          element={
                            <LazyRoute>
                              <FAQPage />
                            </LazyRoute>
                          }
                        />

                        <Route
                          path='/profile'
                          element={
                            <ProtectedRoute>
                              <LazyRoute>
                                <UserProfilePage />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path='/lists/:id'
                          element={
                            <ProtectedRoute>
                              <LazyRoute>
                                <ListPage />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />

                        {/* Legal pages - public, no auth required */}
                        <Route
                          path='/terms-and-conditions'
                          element={
                            <LazyRoute>
                              <TermsAndConditionsPage />
                            </LazyRoute>
                          }
                        />
                        <Route
                          path='/privacy-policy'
                          element={
                            <LazyRoute>
                              <PrivacyPolicyPage />
                            </LazyRoute>
                          }
                        />

                        {/* Admin routes - protected, require admin role */}
                        <Route
                          path='/admin'
                          element={
                            <ProtectedRoute requireAdmin>
                              <LazyRoute>
                                <AdminPanelPage />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/rackets/review'
                          element={
                            <ProtectedRoute requireAdmin>
                              <LazyRoute>
                                <AdminRacketReviewPage />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/rackets'
                          element={
                            <ProtectedRoute requireAdmin>
                              <LazyRoute>
                                <AdminRacketsPage />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/users'
                          element={
                            <ProtectedRoute requireAdmin>
                              <LazyRoute>
                                <AdminUsersPage />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/stores'
                          element={
                            <ProtectedRoute requireAdmin>
                              <LazyRoute>
                                <AdminStoresPage />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/admin/settings'
                          element={
                            <ProtectedRoute requireAdmin>
                              <LazyRoute>
                                <AdminSettingsPage />
                              </LazyRoute>
                            </ProtectedRoute>
                          }
                        />

                        {/* 404 */}
                        <Route
                          path='*'
                          element={
                            <LazyRoute>
                              <NotFoundPage />
                            </LazyRoute>
                          }
                        />
                        </Routes>
                        </AnimatePresence>
                      </Layout>
                    </AuthModalProvider>
                  </ListsProvider>
                </ComparisonProvider>
              </RacketsProvider>
            </BackgroundTasksProvider>
          </NotificationProvider>
        </AuthProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
