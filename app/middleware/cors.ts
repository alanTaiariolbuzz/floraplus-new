import { NextResponse } from 'next/server';

export function corsMiddleware(request: Request) {
  // Permitir todos los orígenes temporalmente
  const response = NextResponse.next();
  
  // Configurar headers CORS básicos
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas

  // Manejar solicitudes preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 204,
      headers: Object.fromEntries(response.headers)
    });
  }

  return response;
}
