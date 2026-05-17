import logger from '../config/logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import ws from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wsTransport = ws as any;

// Cargar variables de entorno
dotenv.config();

// Obtener las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Allow tests to run without credentials (they will skip if not configured)
const isTestEnvironment =
  process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

// Allow local startup without Supabase credentials; features that need them
// will fail when their dedicated getters are used.
if (!isTestEnvironment) {
  if (!supabaseUrl) {
    logger.warn('SUPABASE_URL is not set; using a placeholder Supabase client for startup');
  }

  if (!supabaseServiceKey && !supabaseAnonKey) {
    logger.warn(
      'Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set; Supabase-dependent features will be unavailable'
    );
  }
}

// Use the service role key if available (for administrative operations)
// Or use the anon key for normal operations
const supabaseKey = supabaseServiceKey || supabaseAnonKey || '';

// Create Supabase client with optimized configuration for the API
// En entorno de test sin credenciales, crear un cliente dummy
export const supabase: SupabaseClient =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false, // No necesario en el servidor
          persistSession: false, // No persistir sesiones en el servidor
          detectSessionInUrl: false, // No detectar sesiones en URLs
        },
        global: {
          headers: {
            'X-Client-Info': 'smashly-api@1.0.0',
          },
        },
        realtime: {
          transport: wsTransport,
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
        realtime: { transport: wsTransport },
      });

// Anon client for user authentication operations (login, signup, password reset, etc.)
export const supabaseAnon: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'X-Client-Info': 'smashly-api-anon@1.0.0',
          },
        },
        realtime: { transport: wsTransport },
      })
    : null;

// Administrative client with service role (if available)
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'X-Client-Info': 'smashly-api-admin@1.0.0',
          },
        },
        realtime: { transport: wsTransport },
      })
    : null;

export function getSupabaseAnon(): SupabaseClient {
  if (!supabaseAnon) {
    throw new Error('SUPABASE_ANON_KEY is required for user authentication operations');
  }
  return supabaseAnon;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin Supabase operations');
  }
  return supabaseAdmin;
}

// Function to verify Supabase connection
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: unknown;
}> {
  try {
    // Try a simple query
    const { data, error } = await supabase.from('rackets').select('id').limit(1);

    if (error) {
      return {
        success: false,
        message: 'Database connection failed',
        details: error,
      };
    }

    return {
      success: true,
      message: 'Supabase connection successful',
      details: { recordsFound: data?.length || 0 },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Connection test failed',
      details: error,
    };
  }
}

// Configuration logging
logger.info('📊 Supabase config loaded:', {
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasAnonKey: !!supabaseAnonKey,
  usingServiceKey: !!supabaseServiceKey,
});

export default supabase;
