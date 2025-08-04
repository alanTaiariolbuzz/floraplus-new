import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

/**
 * Devuelve la IP del cliente o undefined si no se encuentra.
 */
export async function getClientIp(req?: NextRequest): Promise<string | undefined> {
  // 1) Si llega un NextRequest (handler / middleware)
  if (req) {
    // x-forwarded-for puede traer varias IPs separadas por coma
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();

    // Algunos proxies usan x-real-ip
    const realIp = req.headers.get('x-real-ip');
    if (realIp) return realIp;
  }

  // 2) Contexto server action / React Server Component
  const hdrs = await headers();          // NO es async
  const forwarded = hdrs.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = hdrs.get('x-real-ip');
  if (realIp) return realIp;

  return undefined;                // sin fallback inventado
}
