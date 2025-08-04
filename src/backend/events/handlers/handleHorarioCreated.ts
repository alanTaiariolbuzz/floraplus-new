/**
 * Manejador para el evento de creación de horario
 * Se encarga de generar los turnos para el nuevo horario creado
 */

import { logError, logInfo } from '../../../../utils/error/logger';
import { generarTurnosDesdeHorario } from '../../../../app/services/turnoGenerator';
import { Horario } from '../../../../app/types';

/**
 * Procesa el evento de creación de un horario
 * @param horario El horario recién creado
 */
export async function handleHorarioCreated(horario: Horario) {
  try {
    logInfo(`Procesando creación de horario: ${horario.id}`, {
      handler: 'handleHorarioCreated',
      horarioId: horario.id,
      actividadId: horario.actividad_id
    });

    // Verificar que el horario esté habilitado
    if (!horario.habilitada) {
      logInfo(`Horario ${horario.id} no habilitado, no se generan turnos`, {
        handler: 'handleHorarioCreated',
        horarioId: horario.id
      });

      return {
        success: true,
        skipped: true,
        reason: 'horario_no_habilitado'
      };
    }

    // Generar los turnos para este horario
    const resultado = await generarTurnosDesdeHorario(horario);

    logInfo(`Turnos generados para horario ${horario.id}`, {
      handler: 'handleHorarioCreated',
      horarioId: horario.id,
      resultado
    });

    return {
      success: true,
      ...resultado
    };
  } catch (error) {
    logError(error, {
      handler: 'handleHorarioCreated',
      horarioId: horario.id,
      actividadId: horario.actividad_id,
      operation: 'generar_turnos'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
