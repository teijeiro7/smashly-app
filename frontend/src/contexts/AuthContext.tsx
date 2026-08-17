import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { UserProfile } from '../services/userProfileService';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/withTimeout';

const GET_SESSION_TIMEOUT_MS = 8000;

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  pendingGoogleOnboarding: { suggestedNickname: string } | null;
  googleBlockError: string | null;
  signUp: (
    email: string,
    password: string,
    nickname: string,
    fullName?: string,
    _role?: 'Player' | 'Store'
  ) => Promise<{ data: UserProfile | null; error: string | null; token?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: UserProfile | null; error: string | null; errorCode?: string }>;
  signInWithGoogle: () => Promise<{ data: UserProfile | null; error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshUserProfile: () => Promise<UserProfile | null>;
  clearGoogleOnboarding: () => void;
  clearGoogleBlockError: () => void;
  isAuthenticated: boolean;
  /** True once Supabase has parsed a password-recovery link from the URL and
   * established a recovery session — UpdatePasswordPage uses this instead of
   * parsing the URL hash itself, since by the time that (lazy-loaded) page
   * mounts, supabase-js has usually already consumed and stripped the hash. */
  isPasswordRecovery: boolean;
  /** Resolves once the initial getSession() call has settled (success or
   * failure) — the router's beforeLoad guards await this so they never run
   * against the pre-hydration flash of `isAuthenticated: false`, which would
   * otherwise bounce a genuinely logged-in user out of a protected route on
   * every hard refresh. */
  ready: Promise<void>;
  /** True while a sign-out is in flight (local state already cleared, server
   * revocation still running in the background). Guards use this to redirect
   * to a clean '/' — without `?next=` — so the login modal never reopens the
   * instant the user logs out. */
  isSigningOut: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export { AuthContext };

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    logger.warn('Could not fetch user profile:', error.message);
    return null;
  }
  return data as UserProfile;
}

function deriveSuggestedNickname(session: any): string {
  const meta = session?.user?.user_metadata ?? {};
  const name: string = meta.full_name ?? meta.name ?? meta.email ?? session?.user?.email ?? '';
  return name.split('@')[0].replace(/\s+/g, '_').toLowerCase().slice(0, 20);
}

function mapSignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (/nickname|already exists|duplicate|unique/i.test(lower)) {
    return 'Ese apodo ya está en uso. Prueba con otro.';
  }
  if (/e-mail|email|already registered|already exists|duplicate|unique/i.test(lower)) {
    return 'Ese correo ya está registrado. Inicia sesión o usa otro.';
  }
  if (/database error|unexpected_failure|500/i.test(lower)) {
    return 'No se ha podido crear la cuenta. Prueba de nuevo en unos minutos.';
  }
  if (/rate limit|too many requests|only request this after/i.test(lower)) {
    return 'Demasiados intentos. Espera un momento antes de volver a intentarlo.';
  }
  // Fallback genérico: Supabase puede devolver mensajes internos en inglés
  // (captcha, signups deshabilitados, etc.) que no debemos mostrar tal cual.
  return 'No se ha podido crear la cuenta. Revisa tus datos e inténtalo de nuevo.';
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // Tracks whether a Supabase session exists, independent of whether the
  // user_profiles row could be loaded. `isAuthenticated` must key off this,
  // not off `user` — a profile fetch failing (network blip, RLS hiccup, a
  // signup whose profile insert didn't land) must not make a session holder
  // look logged out.
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingGoogleOnboarding, setPendingGoogleOnboarding] = useState<{
    suggestedNickname: string;
  } | null>(null);
  const [googleBlockError, setGoogleBlockError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const readyResolveRef = useRef<() => void>(() => {});
  // Built lazily on first render only. `useRef(new Promise(...))` would
  // re-evaluate that argument on EVERY render — useRef keeps the first
  // promise, but the `resolve` captured in readyResolveRef gets rebound to
  // each new throwaway one. Any re-render before the session settled then
  // orphaned the promise the router guards were already awaiting: resolving
  // it hit the throwaway, `ready` never settled, and every beforeLoad hung
  // forever (blank screen, no error).
  const readyRef = useRef<Promise<void> | null>(null);
  if (readyRef.current === null) {
    readyRef.current = new Promise<void>(resolve => {
      readyResolveRef.current = resolve;
    });
  }

  const loadAndSetProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const profile = await fetchProfile(userId);
    setUser(profile);
    setUserProfile(profile);
    return profile;
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setUserProfile(null);
    setHasSession(false);
  }, []);

  const clearGoogleOnboarding = useCallback(() => {
    setPendingGoogleOnboarding(null);
  }, []);

  const clearGoogleBlockError = useCallback(() => {
    setGoogleBlockError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    // supabase-js serializes getSession() through a single-tab lock (see
    // lib/supabase.ts's `processLock` comment) whose queue can stall forever
    // if one call in it never settles — neither resolving nor rejecting, so
    // the .catch() below wouldn't fire either. withTimeout bounds the wait
    // so a stuck lock can't freeze `ready` (and therefore every router
    // beforeLoad guard awaiting it) forever.
    withTimeout(supabase.auth.getSession(), GET_SESSION_TIMEOUT_MS, () => {
      logger.warn(
        `getSession() did not settle within ${GET_SESSION_TIMEOUT_MS}ms — proceeding as no session`
      );
      return { data: { session: null }, error: null } as Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >;
    })
      .then(({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          setHasSession(true);
          loadAndSetProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false);
            readyResolveRef.current();
          });
        } else {
          setLoading(false);
          readyResolveRef.current();
        }
      })
      .catch(error => {
        // A rejected getSession() must not leave `loading` stuck forever —
        // fail as "no session" rather than hang the whole app on a spinner.
        logger.warn('Could not restore session:', error);
        if (mounted) setLoading(false);
        readyResolveRef.current();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        clearAuth();
        setLoading(false);
        readyResolveRef.current();
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
        setIsPasswordRecovery(true);
        setLoading(false);
        readyResolveRef.current();
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setHasSession(true);
        const profile = await loadAndSetProfile(session.user.id);
        setLoading(false);
        readyResolveRef.current();

        // Detect new Google user who needs to set a nickname
        const provider = session.user.app_metadata?.provider;
        if (event === 'SIGNED_IN' && provider === 'google' && profile && !profile.nickname) {
          setPendingGoogleOnboarding({
            suggestedNickname: deriveSuggestedNickname(session),
          });
        }

        // Block Google login for store_owner accounts
        if (provider === 'google' && profile?.role === 'Store') {
          supabase.auth.signOut({ scope: 'local' });
          clearAuth();
          setGoogleBlockError('Las cuentas de tienda no pueden usar Google para iniciar sesión.');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadAndSetProfile, clearAuth]);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ data: UserProfile | null; error: string | null; errorCode?: string }> => {
      if (!email || !password) {
        return {
          data: null,
          error: 'Email y contraseña son requeridos',
          errorCode: 'MISSING_CREDENTIALS',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        let friendly = 'No se pudo iniciar sesión. Inténtalo de nuevo.';
        let errorCode = error.code ?? 'AUTH_ERROR';

        // Deliberately generic for credential/existence failures: mapping
        // "Invalid login credentials" and "User not found" to different
        // messages lets an attacker enumerate which emails have accounts.
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('User not found')
        ) {
          friendly = 'Credenciales inválidas. Verifica tu email y contraseña.';
          errorCode = 'INVALID_PASSWORD';
        } else if (error.message.includes('Email not confirmed')) {
          friendly = 'Por favor confirma tu email antes de iniciar sesión.';
          errorCode = 'EMAIL_NOT_CONFIRMED';
        } else if (error.message.includes('too many')) {
          friendly = 'Demasiados intentos. Espera un momento antes de intentar de nuevo.';
          errorCode = 'TOO_MANY_REQUESTS';
        }

        return { data: null, error: friendly, errorCode };
      }

      if (!data.session) {
        return { data: null, error: 'No se recibió sesión', errorCode: 'NO_SESSION' };
      }

      setHasSession(true);
      const profile = await loadAndSetProfile(data.session.user.id);
      return { data: profile, error: null };
    },
    [loadAndSetProfile]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      nickname: string,
      fullName?: string,
      _role?: 'Player' | 'Store'
    ): Promise<{ data: UserProfile | null; error: string | null; token?: string }> => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { nickname, full_name: fullName },
        },
      });

      if (error) {
        return { data: null, error: mapSignUpError(error.message) };
      }

      if (!data.user) {
        return { data: null, error: 'No se pudo crear el usuario' };
      }

      // The `user_profiles` row is created server-side by the handle_new_user
      // trigger from `raw_user_meta_data` (nickname/full_name above, role
      // always 'Player') — the client never inserts/upserts it. See
      // docs/adr/0001-user-profiles-creado-solo-server-side.md.
      if (!data.session) {
        return { data: null, error: null };
      }

      const profile = await loadAndSetProfile(data.user.id);
      return {
        data: profile,
        error: null,
        token: data.session.access_token,
      };
    },
    [loadAndSetProfile]
  );

  const signInWithGoogle = useCallback(async (): Promise<{
    data: UserProfile | null;
    error: string | null;
  }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      return { data: null, error: error.message };
    }

    // Page redirects to Google — result arrives via onAuthStateChange after redirect back
    return { data: null, error: null };
  }, []);

  const signOut = useCallback(async (): Promise<{ error: string | null }> => {
    // scope: 'local' — sign out of THIS browser only. The default ('global')
    // revokes every session for the user, so logging out on your phone would
    // also kick you out on your laptop.
    setIsSigningOut(true);
    clearAuth();
    // Drop any cached React Query data (profile, lists, conversations, ...)
    // so a different account signing in on the same device/tab never sees
    // a flash of the previous user's data before it refetches.
    queryClient.clear();
    // Never block the UI on the server-side revocation round-trip: it can
    // take seconds and the page feels frozen while it's awaited. scope
    // 'local' only blacklists this browser's refresh token, which supabase-js
    // removes from local storage when the call resolves, so the backgrounded
    // call leaves no dangling server-side session.
    void supabase.auth.signOut({ scope: 'local' });
    // Once the logout navigation has settled, restore the normal
    // `?next=` login-modal behavior for anonymous visits to protected routes.
    window.setTimeout(() => setIsSigningOut(false), 5000);
    return { error: null };
  }, [clearAuth]);

  const refreshUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      return loadAndSetProfile(session.user.id);
    }
    return null;
  }, [loadAndSetProfile]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      userProfile,
      loading,
      pendingGoogleOnboarding,
      googleBlockError,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshUserProfile,
      clearGoogleOnboarding,
      clearGoogleBlockError,
      isAuthenticated: hasSession,
      isPasswordRecovery,
      // Non-null by construction: the lazy-init block above runs on every
      // render before this point.
      ready: readyRef.current!,
      isSigningOut,
    }),
    [
      user,
      userProfile,
      hasSession,
      isPasswordRecovery,
      isSigningOut,
      loading,
      pendingGoogleOnboarding,
      googleBlockError,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshUserProfile,
      clearGoogleOnboarding,
      clearGoogleBlockError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
