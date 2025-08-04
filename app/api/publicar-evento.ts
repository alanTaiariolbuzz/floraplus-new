import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export type EventoPayload = Record<string, any>;

/**
 * Inserta un evento en la tabla `eventos` usando Supabase con service role.
 * Debe llamarse dentro de la misma transacción que la lógica de negocio
 * para cumplir con el patrón outbox.
 */
export async function publicarEvento(
  origen: string,
  tipo: string,
  payload: EventoPayload,
  externoId?: string
) {
  const supabase = createClient();
  const { error } = await supabase.from('eventos').insert({
    id: uuidv4(),
    origen,
    externo_id: externoId,
    tipo,
    payload,
  });
  if (error) throw new Error(`Error publicando evento: ${error.message}`);
}
