// app/api/actividades/handlers/performUpdate.ts
import { ActualizacionActividad } from './validateBody';
import { updateActividad } from '@/app/api/actividades/services/actividadService';
import { ForeignKeyViolationError } from './error-types';
import { PostgrestError } from '@supabase/supabase-js';

// Envolvemos el servicio actual y traducimos algunos errores
export async function performUpdate(id: number, body: ActualizacionActividad) {
  try {
    return await updateActividad(id, body);
  } catch (e) {
    // Si es error de Postgres por FK (23503) lo mapeamos a error de dominio
    if (isForeignKeyViolation(e)) {
      throw new ForeignKeyViolationError('Tarifas');
    }
    throw e; // Se manejará arriba
  }
}
export function isForeignKeyViolation(err: unknown): err is PostgrestError {
  if (err && typeof err === 'object' && 'code' in err) {
    return (err as PostgrestError).code === '23503';
  }
  return false;
}
