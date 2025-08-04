// app/api/actividades/handlers/putActividad.ts
import { logError, logInfo } from '@/utils/error/logger';
import { validateBody }  from './validateBody';
import { verifyExists }  from './verifyExists';
import { performUpdate } from './performUpdate';
import { mapError }      from './errorMap';
import type { RespuestaActualizacion } from '../types/types';

export async function putActividad(
  id: number,
  rawBody: unknown,
): Promise<RespuestaActualizacion> {
  try {
    // 1) Seguridad / ownership
    await verifyExists(id);

    // 2) Validación
    const body = validateBody(rawBody);

    // 3) Actualización
    const data = await performUpdate(id, body);

    logInfo('Actividad actualizada', {
      endpoint: 'PUT /api/actividades',
      actividadId: id,
      camposActualizados: Object.keys(body),
    });

    return { code: 200, message: 'OK', data };
  } catch (err) {
    // Mapear a respuesta homogénea
    const mapped = mapError(err);

    logError(err as Error, {
      endpoint: 'PUT /api/actividades',
      actividadId: id,
      status: mapped.code,
    });

    return mapped;
  }
}
