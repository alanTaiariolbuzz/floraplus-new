import Stripe from 'stripe';
import { logError } from '../error/logger';
import stripeClient from './client';

/**
 * Obtiene el cliente de Stripe manejando errores
 * @throws Error si no se puede inicializar el cliente
 */
export function getStripeOrThrow(): Stripe {
  const result = stripeClient();

  if (!result.success) {
    throw new Error(`Error al obtener el cliente Stripe: ${result.error}`);
  }

  return result.data;
}

/**
 * Ejecuta una operación de Stripe manejando errores comunes
 * @param operation Función que contiene la operación a ejecutar
 * @returns El resultado de la operación
 */
export async function executeStripeOperation<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    let errorMessage = 'Error al procesar la operación con Stripe';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    logError({
      context: 'executeStripeOperation',
      message: errorMessage,
      error,
    });

    return { success: false, error: errorMessage };
  }
}
