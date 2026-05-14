import { logger } from './logger';

/**
 * Utilidades para el manejo de autenticación y limpieza de tokens
 *
 * SECURITY NOTE: Tokens are stored as httpOnly cookies set by the backend.
 * JavaScript cannot read httpOnly cookies, which prevents XSS token theft.
 * These functions are kept for interface compatibility but no longer touch localStorage.
 */

// In-memory flag: true after a successful login in the current session.
// Cannot hold the actual token (cookies are httpOnly and unreadable from JS).
let _isAuthenticated = false;

export const setAuthToken = (_token: string): void => {
  // Token is set as httpOnly cookie by the backend. Nothing to store here.
  _isAuthenticated = true;
};

export const removeAuthToken = (): void => {
  _isAuthenticated = false;
  // Also clean any legacy localStorage tokens from before this migration
  try {
    localStorage.removeItem('auth_token');
  } catch (_) { /* ignore */ }
};

/**
 * Returns a truthy value if the user authenticated during this session.
 * NOTE: On page reload, the server validates the httpOnly cookie directly.
 * Use this only for in-session checks; prefer server validation on init.
 */
export const getAuthToken = (): string | null => {
  if (_isAuthenticated) {
    return '__cookie_auth__';
  }
  return null;
};

/**
 * Limpia completamente todos los tokens y datos de autenticación del almacenamiento local
 * Esta función es útil para forzar un logout completo cuando hay problemas con tokens persistentes
 */
export const forceCleanAuthStorage = (): void => {
  try {
    // console.log("Starting force clean of auth storage...");

    // Limpiar localStorage
    const localKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isAuthRelatedKey(key)) {
        localKeysToRemove.push(key);
      }
    }

    localKeysToRemove.forEach(key => {
      localStorage.removeItem(key);
      // console.log(`🗑️ Removed localStorage key: ${key}`);
    });

    // Limpiar sessionStorage
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && isAuthRelatedKey(key)) {
        sessionKeysToRemove.push(key);
      }
    }

    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      // console.log(`🗑️ Removed sessionStorage key: ${key}`);
    });

    // Limpiar cookies relacionadas con auth (si las hay)
    try {
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (isAuthRelatedKey(name)) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          // console.log(`🗑️ Removed cookie: ${name}`);
        }
      });
    } catch (cookieError) {
      logger.warn('Error cleaning cookies:', cookieError);
    }

    // const totalKeysRemoved = localKeysToRemove.length + sessionKeysToRemove.length;
    // console.log(
    //   `✅ Force clean completed. Removed ${totalKeysRemoved} auth-related keys.`
    // );

    return;
  } catch (error) {
    logger.error('❌ Error during force clean of auth storage:', error);

    // Fallback: intentar limpiar las claves más comunes
    try {
      const commonAuthKeys = [
        'sb-localhost-auth-token',
        'sb-auth-token',
        'supabase.auth.token',
        'access_token',
        'refresh_token',
      ];

      commonAuthKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          // Ignorar errores individuales
        }
      });

      logger.log('🔄 Fallback cleanup completed');
    } catch (fallbackError) {
      logger.error('❌ Even fallback cleanup failed:', fallbackError);
    }
  }
};

/**
 * Verifica si una clave del storage está relacionada con autenticación
 */
const isAuthRelatedKey = (key: string): boolean => {
  const authKeyPatterns = [
    'sb-',
    'supabase',
    'auth-token',
    'access_token',
    'refresh_token',
    'id_token',
    'session',
    'user_session',
    'auth_session',
  ];

  return authKeyPatterns.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()));
};

/**
 * Verifica si hay tokens huérfanos en el almacenamiento
 * Útil para debugging y diagnóstico
 */
export const detectOrphanedTokens = (): string[] => {
  const orphanedKeys: string[] = [];

  try {
    // Verificar localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isAuthRelatedKey(key)) {
        orphanedKeys.push(`localStorage.${key}`);
      }
    }

    // Verificar sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && isAuthRelatedKey(key)) {
        orphanedKeys.push(`sessionStorage.${key}`);
      }
    }

    if (orphanedKeys.length > 0) {
      logger.warn(
        `🔍 Detected ${orphanedKeys.length} potential orphaned auth keys:`,
        orphanedKeys
      );
    }

    return orphanedKeys;
  } catch (error) {
    logger.error('Error detecting orphaned tokens:', error);
    return [];
  }
};

/**
 * Función de diagnóstico para verificar el estado de autenticación
 */
export const diagnoseAuthState = (): void => {
  logger.group('🔍 Auth State Diagnosis');

  try {
    const orphanedKeys = detectOrphanedTokens();

    logger.log('📊 Storage Analysis:');
    logger.log(`- LocalStorage keys: ${localStorage.length}`);
    logger.log(`- SessionStorage keys: ${sessionStorage.length}`);
    logger.log(`- Orphaned auth keys: ${orphanedKeys.length}`);

    if (orphanedKeys.length > 0) {
      logger.log('🚨 Orphaned keys found:', orphanedKeys);
      logger.log('💡 Consider calling forceCleanAuthStorage() to clean them');
    } else {
      logger.log('✅ No orphaned auth keys detected');
    }
  } catch (error) {
    logger.error('❌ Error during diagnosis:', error);
  }

  logger.groupEnd();
};

// Función que se puede llamar desde la consola del navegador para debug
declare global {
  interface Window {
    __smashly_auth_utils: {
      forceClean: () => void;
      diagnose: () => void;
      detectOrphaned: () => string[];
    };
  }
}
