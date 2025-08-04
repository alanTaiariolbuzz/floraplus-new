import { NextResponse } from 'next/server';

export function securityHeadersMiddleware() {
  const response = NextResponse.next();
  
  // 1. Protección XSS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // 2. Prevenir clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // 3. Control de referencias HTTP
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 4. Prevenir MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // 5. Content Security Policy (CSP)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: http:",
    "font-src 'self'",
    "connect-src 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // 6. Otras cabeceras de seguridad
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  
  return response;
}
