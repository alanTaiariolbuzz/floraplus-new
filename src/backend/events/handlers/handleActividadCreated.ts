/**
 * Manejador para el evento de creación de actividad
 * Se encarga de generar los turnos para todos los horarios de la actividad
 */

import { logError, logInfo } from '../../../../utils/error/logger';
import { generarTurnosDesdeActividad } from '../../../../app/services/turnoGenerator';
import { Horario } from '../../../../app/types';

/**
 * Procesa el evento de creación de una actividad
 * @param actividadId ID de la actividad creada
 * @param horarios Arreglo opcional de horarios asociados a la actividad
 */
export async function handleActividadCreated(
  actividadId: number,
  horarios?: Horario[]
) {
  try {
    logInfo(`Procesando creación de actividad: ${actividadId}`, {
      handler: 'handleActividadCreated',
      actividadId,
      horarios: horarios ? horarios.length : 'ninguno'
    });

    // Generar los turnos para la actividad
    const resultado = await generarTurnosDesdeActividad(actividadId);

    logInfo(`Turnos generados para actividad ${actividadId}`, {
      handler: 'handleActividadCreated',
      actividadId,
      resultado
    });

    return {
      success: true,
      ...resultado
    };
  } catch (error) {
    logError(error, {
      handler: 'handleActividadCreated',
      actividadId,
      operation: 'generar_turnos'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
