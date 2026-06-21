import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../services/userProfileService';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  pendingGoogleOnboarding: { suggestedNickname: string } | null;
  signUp: (
    email: string,
    password: string,
    nickname: string,
    fullName?: string,
    _role?: 'player' | 'store_owner'
  ) => Promise<{ data: UserProfile | null; error: string | null; token?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: UserProfile | null; error: string | null; errorCode?: string }>;
  signInWithGoogle: () => Promise<{ data: UserProfile | null; error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshUserProfile: () => Promise<void>;
  clearGoogleOnboarding: () => void;
  isAuthenticated: boolean;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingGoogleOnboarding, setPendingGoogleOnboarding] = useState<{
    suggestedNickname: string;
  } | null>(null);

  const loadAndSetProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const profile = await fetchProfile(userId);
    setUser(profile);
    setUserProfile(profile);
    return profile;
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setUserProfile(null);
  }, []);

  const clearGoogleOnboarding = useCallback(() => {
    setPendingGoogleOnboarding(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        loadAndSetProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        clearAuth();
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const profile = await loadAndSetProfile(session.user.id);
        setLoading(false);

        // Detect new Google user who needs to set a nickname
        const provider = session.user.app_metadata?.provider;
        if (event === 'SIGNED_IN' && provider === 'google' && profile && !profile.nickname) {
          setPendingGoogleOnboarding({
            suggestedNickname: deriveSuggestedNickname(session),
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadAndSetProfile, clearAuth]);

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ data: UserProfile | null; error: string | null; errorCode?: string }> => {
    if (!email || !password) {
      return { data: null, error: 'Email y contraseña son requeridos', errorCode: 'MISSING_CREDENTIALS' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      let friendly = error.message;
      let errorCode = error.code ?? 'AUTH_ERROR';

      if (error.message.includes('Invalid login credentials')) {
        friendly = 'Credenciales inválidas. Verifica tu email y contraseña.';
        errorCode = 'INVALID_PASSWORD';
      } else if (error.message.includes('Email not confirmed')) {
        friendly = 'Por favor confirma tu email antes de iniciar sesión.';
        errorCode = 'EMAIL_NOT_CONFIRMED';
      } else if (error.message.includes('too many')) {
        friendly = 'Demasiados intentos. Espera un momento antes de intentar de nuevo.';
        errorCode = 'TOO_MANY_REQUESTS';
      } else if (error.message.includes('User not found')) {
        friendly = 'No tienes una cuenta con este email. ¿Quieres registrarte?';
        errorCode = 'USER_NOT_FOUND';
      }

      return { data: null, error: friendly, errorCode };
    }

    if (!data.session) {
      return { data: null, error: 'No se recibió sesión', errorCode: 'NO_SESSION' };
    }

    const profile = await loadAndSetProfile(data.session.user.id);
    return { data: profile, error: null };
  }, [loadAndSetProfile]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    nickname: string,
    fullName?: string,
    _role?: 'player' | 'store_owner'
  ): Promise<{ data: UserProfile | null; error: string | null; token?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { nickname, full_name: fullName },
      },
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data.user) {
      return { data: null, error: 'No se pudo crear el usuario' };
    }

    // Update profile with nickname/fullName (trigger creates the basic row)
    await supabase.from('user_profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      nickname,
      full_name: fullName ?? null,
      role: 'player',
    });

    if (!data.session) {
      // Email confirmation required — return without a loaded profile
      return { data: null, error: null };
    }

    const profile = await loadAndSetProfile(data.user.id);
    return {
      data: profile,
      error: null,
      token: data.session.access_token,
    };
  }, [loadAndSetProfile]);

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
    const { error } = await supabase.auth.signOut();
    clearAuth();
    return { error: error?.message ?? null };
  }, [clearAuth]);

  const refreshUserProfile = useCallback(async (): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadAndSetProfile(session.user.id);
    }
  }, [loadAndSetProfile]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    userProfile,
    loading,
    pendingGoogleOnboarding,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUserProfile,
    clearGoogleOnboarding,
    isAuthenticated: !!user,
  }), [
    user,
    userProfile,
    loading,
    pendingGoogleOnboarding,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUserProfile,
    clearGoogleOnboarding,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
