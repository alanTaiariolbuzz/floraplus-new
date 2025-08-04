import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { logError } from "@/utils/error/logger";

// Cookie configuration for secure session handling
const getCookieSettings = () => ({
  lifetime: 60 * 60 * 24 * 7, // 7 days
  domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined, // optional: configure domain in production
  path: '/',
  sameSite: 'lax' as 'lax', // TypeScript needs explicit type for sameSite
  httpOnly: true, // Critical: prevents JavaScript access
  secure: process.env.NODE_ENV === 'production', // Secure in production only
});

export const createClient = async () => {
  const cookieStore = await cookies();
  const headersList = await headers();
  const bearer = headersList.get('authorization');

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // 👉 si llega Authorization lo agregamos
      global: bearer ? { headers: { Authorization: bearer } } : {},
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Apply our security settings to every cookie
              const cookieSettings = getCookieSettings();
              const secureOptions = {
                ...cookieSettings,
                ...options,
              };
              cookieStore.set(name, value, secureOptions);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            logError("Server cookie setting error", { error });
          }
        },
      },
      auth: {
        persistSession: true,  // Enable persistence for better compatibility
        autoRefreshToken: true, // Server should refresh tokens
      },
    },
  );
};

// Export cookie settings for reuse in middleware
export { getCookieSettings };

