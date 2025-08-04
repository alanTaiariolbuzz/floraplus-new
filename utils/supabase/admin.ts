import { createClient } from "@supabase/supabase-js";
// utils/supabase/admin.ts – arriba del archivo
declare const Deno: {
  env: { get(key: string): string | undefined };
};

/**
 * Cliente Supabase con privilegios admin, pensado para Edge Functions.
 * Ignora RLS y no persiste sesión.
 */
export const createAdminClient = () => {
  // Usa process.env en Node y Deno.env en Edge.
  const getEnv = (key: string) =>
    typeof Deno !== "undefined" ? Deno.env.get(key) : process.env[key];

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    // 👈 clave para Edge: re-usar el fetch global del runtime
    global: { fetch },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};
