import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
// Import shared cookie settings
import { getCookieSettings } from "./server";

// Generate a csrf token for protecting mutation endpoints
const generateCsrfToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Helper function to validate CSRF token in requests
 * Can be imported and reused in API routes and Server Actions
 */
export const validateCsrf = (request: NextRequest): boolean => {
  const csrfHeader = request.headers.get('x-csrf-token');
  const csrfCookie = request.cookies.get('csrf_token')?.value;
  
  // For non-GET requests, validate CSRF token
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    if (!csrfHeader || csrfHeader !== csrfCookie) {
      // Only enforce in production to make development easier
      if (process.env.NODE_ENV === 'production') {

        return false;
      } else {
        // In development, just warn but allow the request
        console.warn('CSRF validation would fail in production', { 
          path: request.nextUrl.pathname, 
          method: request.method,
          has_header: !!csrfHeader,
          has_cookie: !!csrfCookie
        });
      }
    }
  }
  
  return true;
};

/**
 * Creates a Supabase client for use in middleware
 */
export const createClient = (request: NextRequest) => {
  // Create a response object that we'll modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const cookieSettings = getCookieSettings();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Don't use localStorage
        autoRefreshToken: true, // Server should refresh tokens
      },
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Apply our security settings to every cookie
          const secureOptions = {
            ...cookieSettings,
            ...options,
          };
          
          // If the request is coming from middleware, we need to set the cookie
          // for the response
          request.cookies.set({
            name,
            value,
            ...secureOptions,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...secureOptions,
          });
        },
        remove(name: string, options: any) {
          const secureOptions = {
            ...cookieSettings,
            ...options,
          };
          
          request.cookies.set({
            name,
            value: "",
            ...secureOptions,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...secureOptions,
          });
        },
      },
    }
  );

  return { supabase, response };
};

/**
 * Updates the Supabase auth session cookie and adds CSRF protection
 */
export const updateSession = async (request: NextRequest) => {
  try {
    // Create Supabase client and get the modified response
    const { supabase, response } = createClient(request);
    
    // Log session refresh attempt with request info for monitoring
    const method = request.method;
    const path = request.nextUrl.pathname;
    const isMutationRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    
    // Add CSRF protection for mutation endpoints
    if (isMutationRequest && !validateCsrf(request)) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
    
    // Attempt to refresh session if expired - required for Server Components
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Guard clause: if there's an error with the token, don't proceed with cookie operations
      if (error) {
        // Only log errors in production, use debug in development
        if (process.env.NODE_ENV === 'production') {

        } else {
          console.debug('Session refresh failed', {
            path,
            error_message: error.message 
          });
        }
        return response;
      }
      
      // For non-API requests, generate a fresh CSRF token
      if (!path.startsWith('/api/') && method === 'GET') {
        const csrfToken = generateCsrfToken();
        response.cookies.set({
          name: 'csrf_token',
          value: csrfToken,
          httpOnly: false, // Needs to be readable by JS
          sameSite: 'lax' as 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        });
        
        // Add CSRF token as a header and meta tag so frontend can use it
        response.headers.set('x-csrf-token', csrfToken);
        
        // Para modo desarrollo, inyectar el CSRF token como header
        // No modificamos el HTML directamente ya que response es una constante
        // y trabajamos con Next.js que maneja su propio HTML
        if (process.env.NODE_ENV !== 'production') {
          // Añadir un header adicional que el frontend puede leer
          response.headers.set('x-csrf-meta', 'true');
        }
      }
      
      // Log for monitoring token refreshes (at appropriate level)
      if (session) {
        if (process.env.NODE_ENV === 'production') {

        } else {
          console.debug('Session refresh successful', {
            user_id: session.user.id,
            expires_in_seconds: Math.floor((new Date(session.expires_at!).getTime() - Date.now()) / 1000)
          });
        }
      }
    } catch (innerError) {
   //   logError('Unexpected error during session refresh', { error: innerError });
    }
    
    return response;
  } catch (e) {
  //  logError('Session refresh failed', { error: e });
    // If Supabase client could not be created, continue but log the error
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
