import { logInfo, logError } from '@/utils/error/logger';
import { syncStripeAccount } from '@/utils/stripe/sync';
import { EventHandlerResult } from '../../index';


export async function handleAccountUpdatedEvent(payload: any): Promise<EventHandlerResult>  {
  logInfo('Procesando evento account.updated', { id: payload.id });

  try {
    // Sincronizar la cuenta Stripe con nuestra base de datos
    const syncResult = await syncStripeAccount(payload.id);

    if (!syncResult.success) {
      logError('Error al sincronizar cuenta Stripe', { id: payload.id, error: syncResult.error });
      return { success: false, error: syncResult.error };
    }

    logInfo('Cuenta Stripe sincronizada correctamente', { id: payload.id });
    return { success: true };
  } catch (error) {
    logError('Error procesando evento account.updated', { id: payload.id, error: (error as Error).message });
    return { success: false, error: (error as Error).message };
  }
}

