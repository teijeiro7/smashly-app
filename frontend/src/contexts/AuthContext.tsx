import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UserProfile, UserProfileService } from '../services/userProfileService';
import { forceCleanAuthStorage, setAuthToken, removeAuthToken } from '../utils/authUtils';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import { GoogleAuthService } from '../services/googleAuthService';
import { logger } from '../utils/logger';

// Interfaces para TypeScript
interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
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
  signInWithGoogle: () => Promise<{
    data: UserProfile | null;
    error: string | null;
    isNewUser?: boolean;
    suggestedNickname?: string;
  }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshUserProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Crear el contexto con valor por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Exportar el contexto para testing
export { AuthContext };

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

// Proveedor del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Función utilitaria para limpiar completamente el almacenamiento de auth
  const clearAuthStorage = useCallback(() => {
    forceCleanAuthStorage();
    removeAuthToken();
  }, []);

  // Función para cargar el perfil del usuario desde la API
  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await UserProfileService.getUserProfile();

      if (!profile) {
        logger.warn('No profile found for authenticated user. User needs to complete profile setup.');
        setUser(null);
        setUserProfile(null);
        return profile;
      }

      setUser(profile);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.toLowerCase().includes('token') ||
          error.message.toLowerCase().includes('expired'))
      ) {
        setUser(null);
        setUserProfile(null);
        clearAuthStorage();
      } else {
        logger.error('Error loading user profile:', error);
        setUser(null);
        setUserProfile(null);
      }
      return null;
    }
  }, [clearAuthStorage]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await loadUserProfile();
      } catch (error) {
        logger.error('Error during auth initialization:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [loadUserProfile]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    nickname: string,
    fullName?: string,
    _role?: 'player' | 'store_owner'
  ): Promise<{ data: UserProfile | null; error: string | null; token?: string }> => {
    try {
      const url = buildApiUrl(API_ENDPOINTS.AUTH_REGISTER);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          nickname,
          full_name: fullName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.message || result.error || 'Error desconocido durante el registro';
        return { data: null, error: errorMessage };
      }

      const access_token = result.data.session?.access_token;
      const registeredUser = result.data.user;

      if (access_token) {
        setAuthToken(access_token);
        await loadUserProfile();
      }

      return { data: registeredUser || userProfile, error: null, token: access_token };
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'Error inesperado durante el registro',
      };
    }
  }, [loadUserProfile, userProfile]);

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ data: UserProfile | null; error: string | null; errorCode?: string }> => {
    try {
      if (!email || !password) {
        return {
          data: null,
          error: 'Email y contraseña son requeridos',
          errorCode: 'MISSING_CREDENTIALS',
        };
      }

      const url = buildApiUrl(API_ENDPOINTS.AUTH_LOGIN);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorCode = result.error;
        const errorMessage = result.message || result.error || 'Error desconocido durante el inicio de sesión';

        let friendlyErrorMessage = errorMessage;
        if (errorCode === 'USER_NOT_FOUND') {
          friendlyErrorMessage = 'No tienes una cuenta con este email. ¿Quieres registrarte?';
        } else if (errorCode === 'INVALID_PASSWORD') {
          friendlyErrorMessage = 'La contraseña es incorrecta. Inténtalo de nuevo.';
        } else if (
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('incorrect')
        ) {
          friendlyErrorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
        } else if (errorMessage.toLowerCase().includes('not found')) {
          friendlyErrorMessage = 'No tienes una cuenta con este email. ¿Quieres registrarte?';
        } else if (errorMessage.toLowerCase().includes('not confirmed')) {
          friendlyErrorMessage = 'Por favor confirma tu email antes de iniciar sesión.';
        } else if (errorMessage.toLowerCase().includes('too many')) {
          friendlyErrorMessage = 'Demasiados intentos. Espera un momento antes de intentar de nuevo.';
        }

        return { data: null, error: friendlyErrorMessage, errorCode };
      }

      const { access_token } = result.data;

      if (access_token) {
        setAuthToken(access_token);
        const loadedProfile = await loadUserProfile();
        return { data: loadedProfile, error: null };
      }

      return { data: null, error: 'No se recibió token de autenticación', errorCode: 'NO_TOKEN' };
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'Error inesperado durante el inicio de sesión. Verifica tu conexión a internet.',
        errorCode: error.code || 'UNKNOWN_ERROR',
      };
    }
  }, [loadUserProfile]);

  const refreshUserProfile = useCallback(async (): Promise<void> => {
    await loadUserProfile();
  }, [loadUserProfile]);

  const signInWithGoogle = useCallback(async (): Promise<{
    data: UserProfile | null;
    error: string | null;
    isNewUser?: boolean;
    suggestedNickname?: string;
  }> => {
    try {
      const result = await GoogleAuthService.signInWithGoogle();
      const { user: googleUser, session, isNewUser, suggestedNickname } = result;

      if (session?.access_token) {
        setAuthToken(session.access_token);
        const loadedProfile = await loadUserProfile();
        return { data: loadedProfile, error: null, isNewUser, suggestedNickname };
      }

      return { data: googleUser || null, error: 'No se recibió token de autenticación', isNewUser, suggestedNickname };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al iniciar sesión con Google' };
    }
  }, [loadUserProfile]);

  const signOut = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      try {
        const url = buildApiUrl(API_ENDPOINTS.AUTH_LOGOUT);
        await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (logoutError) {
        logger.warn('Error calling logout endpoint:', logoutError);
      }

      setUser(null);
      setUserProfile(null);
      clearAuthStorage();
      return { error: null };
    } catch (error: any) {
      setUser(null);
      setUserProfile(null);
      clearAuthStorage();
      return { error: error.message || 'Error inesperado durante el cierre de sesión' };
    }
  }, [clearAuthStorage]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    userProfile,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUserProfile,
    loading,
    isAuthenticated: !!user,
  }), [user, userProfile, signUp, signIn, signInWithGoogle, signOut, refreshUserProfile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
