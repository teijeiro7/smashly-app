import { createClient } from "@supabase/supabase-js";

// Obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén disponibles
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas"
  );
}

// Crear cliente de Supabase con configuración optimizada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce", // Usar PKCE para mayor seguridad
  },
  global: {
    headers: {
      "X-Client-Info": "smashly-web@1.0.0",
    },
  },
});

// Log de éxito solo si las variables están disponibles
if (supabaseUrl && supabaseAnonKey) {
  console.log("Supabase config loaded successfully:", {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
  });
}
