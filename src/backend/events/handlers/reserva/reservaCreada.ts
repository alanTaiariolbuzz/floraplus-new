import { logInfo } from '@/utils/error/logger';
import { EventHandlerResult } from '../../index';

export async function handleReservaCreada(payload: any): Promise<EventHandlerResult> {
  logInfo('Procesando reserva.creada', { reservaId: payload.reservaId });
  // TODO: agregar lógica de negocio específica
  return { success: true, message: 'Evento reserva.creada procesado' };
}
