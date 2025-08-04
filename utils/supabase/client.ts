import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          if (!isBrowser) return undefined;
          
          try {
            const value = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`))
              ?.split('=')[1];
            return value;
          } catch (e) {
            console.error('Error al recuperar cookie:', e);
            return undefined;
          }
        },
        set(name, value, options) {
          if (!isBrowser) return;
          
          try {
            const cookieSettings = {
              path: '/',
              maxAge: 60 * 60 * 24 * 7, // 1 week
              sameSite: 'lax', // CSRF protection
              secure: process.env.NODE_ENV === 'production',
              ...options,
            };

            let cookieString = `${name}=${value}`;
            
            Object.entries(cookieSettings).forEach(([key, val]) => {
              if (val === true) {
                cookieString += `; ${key}`;
              } else if (val !== false && val !== undefined) {
                cookieString += `; ${key}=${val}`;
              }
            });
            
            document.cookie = cookieString;
          } catch (e) {
            console.error('Error al configurar cookie:', e);
          }
        },
        remove(name, options) {
          if (!isBrowser) return;
          
          try {
            document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          } catch (e) {
            console.error('Error al eliminar cookie:', e);
          }
        }
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: isBrowser, // Only detect session in URL on client-side
      }
    }
  );
};

// Helper function to process OAuth callback URLs
export const processOAuthCallback = async () => {
  // Only process if the URL contains an OAuth token fragment
  if (typeof window !== 'undefined' && 
      window.location.hash && 
      (window.location.hash.includes('access_token') || 
       window.location.hash.includes('error='))) {
      
    const client = createClient();
    try {
      // Log that we're processing an OAuth callback
      console.info('Processing OAuth callback URL');
      
      // Process URL fragment and set up cookies properly
      const { data, error } = await client.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        console.error('Error processing OAuth session:', error);
      } else {
        console.info('Successfully processed OAuth session');
      }
      
      // Clean up URL fragment after processing
      const cleanUrl = window.location.href.split('#')[0];
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (err) {
      console.error('Failed to process OAuth callback:', err);
    }
  } else {
    // Skip processing if no tokens in URL
    return;
  }
};
