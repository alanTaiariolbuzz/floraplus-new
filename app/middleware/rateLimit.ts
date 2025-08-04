import { NextResponse } from 'next/server';

// Configuración de límites
const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minuto
  MAX_REQUESTS: 60, // Máximo de peticiones por ventana
};

// Almacén en memoria (para desarrollo, no usar en producción con múltiples instancias)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Limpiar entradas antiguas periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (data.resetTime <= now) {
      requestCounts.delete(ip);
    }
  }
}, RATE_LIMIT.WINDOW_MS);

export async function rateLimitMiddleware(request: Request) {
  // Solo aplicar rate limiting a rutas públicas de la API
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/public/')) {
    return null;
  }
  
  // No aplicar rate limiting a las opciones CORS
  if (request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  // Usar IP del cliente como identificador
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Inicializar o actualizar el contador para esta IP
  const requestData = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT.WINDOW_MS };
  
  // Si el tiempo de reinicio ha pasado, reiniciar el contador
  if (now > requestData.resetTime) {
    requestData.count = 0;
    requestData.resetTime = now + RATE_LIMIT.WINDOW_MS;
  }
  
  // Incrementar el contador
  requestData.count++;
  requestCounts.set(ip, requestData);
  
  // Calcular tiempo restante
  const resetTime = Math.ceil((requestData.resetTime - now) / 1000);
  const remaining = Math.max(0, RATE_LIMIT.MAX_REQUESTS - requestData.count);
  
  // Verificar si se excedió el límite
  if (requestData.count > RATE_LIMIT.MAX_REQUESTS) {
    return new NextResponse(
      JSON.stringify({
        error: 'Demasiadas solicitudes. Por favor, intente de nuevo más tarde.',
        retryAfter: resetTime,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': resetTime.toString(),
          'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor(requestData.resetTime / 1000).toString(),
        },
      }
    );
  }
  
  // Agregar headers de rate limit a la respuesta
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT.MAX_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.floor(requestData.resetTime / 1000).toString());
  
  return response;
}
