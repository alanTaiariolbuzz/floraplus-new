/**
 * Manejador para el evento de actualización de horario
 * Se encarga de regenerar los turnos para el horario actualizado
 * Gestiona conflictos con turnos existentes que ya tengan reservas
 */

import { logError, logInfo } from '../../../../utils/error/logger';
import { fechaActual, formatDate, stringToDate } from '../../../../app/utils/calendar';
import { generarTurnosDesdeHorario } from '../../../../app/services/turnoGenerator';
import { Horario } from '../../../../app/types';
import { createClient } from '../../../../utils/supabase/server';

// Obtener el cliente de Supabase centralizado
export const getSupabase = async () => await createClient();

/**
 * Procesa el evento de actualización de un horario
 * @param horarioAnterior Estado anterior del horario
 * @param horarioActualizado Estado nuevo del horario
 * @param regenerarTodos Si es true, regenera todos los turnos (incluso pasados); false solo regenera turnos futuros
 */
export async function handleHorarioUpdated(
  horarioAnterior: Horario,
  horarioActualizado: Horario,
  regenerarTodos: boolean = false
) {
  try {
    // Obtener el cliente de Supabase una sola vez al inicio
    const supabase = await getSupabase();
    
    logInfo(`Procesando actualización de horario: ${horarioActualizado.id}`, {
      handler: 'handleHorarioUpdated',
      horarioId: horarioActualizado.id,
      regenerarTodos
    });

    // Verificar cambios relevantes que requieran regeneración
    const requiereRegeneracion = (
      horarioAnterior.habilitada !== horarioActualizado.habilitada ||
      horarioAnterior.fecha_inicio !== horarioActualizado.fecha_inicio ||
      !arrayEquals(horarioAnterior.dias, horarioActualizado.dias) ||
      horarioAnterior.dia_completo !== horarioActualizado.dia_completo ||
      horarioAnterior.hora_inicio !== horarioActualizado.hora_inicio ||
      horarioAnterior.hora_fin !== horarioActualizado.hora_fin
    );

    // Si no hay cambios relevantes para la regeneración, salir
    if (!requiereRegeneracion) {
      // Aunque no se regeneren turnos, verificar si cambió el cupo
      if (horarioAnterior.cupo !== horarioActualizado.cupo) {
        await actualizarCuposTurnos(horarioActualizado.id!, horarioAnterior.cupo, horarioActualizado.cupo);
        
        return {
          success: true,
          message: 'Solo se actualizaron cupos',
          cupoAnterior: horarioAnterior.cupo,
          cupoNuevo: horarioActualizado.cupo
        };
      }
      
      return {
        success: true,
        message: 'No se requiere regeneración de turnos',
        regeneracion: false
      };
    }

    // Si el horario se deshabilitó, desactivar turnos futuros
    if (horarioAnterior.habilitada && !horarioActualizado.habilitada) {
      await desactivarTurnosFuturos(horarioActualizado.id!);
      
      return {
        success: true,
        message: 'Horario deshabilitado. Turnos futuros desactivados',
        desactivados: true
      };
    }

    // Determinar qué turnos se pueden regenerar
    const hoy = fechaActual();
    const fechaLimite = regenerarTodos ? new Date('1900-01-01') : hoy;

    // 1. Obtener los turnos existentes
    const { data: turnosExistentes, error: errorConsulta } = await supabase
      .from('turnos')
      .select('id, fecha, cupo_total, cupo_disponible')
      .eq('horario_id', horarioActualizado.id)
      .gte('fecha', formatDate(fechaLimite))
      .is('deleted_at', null);

    if (errorConsulta) {
      logError(errorConsulta, {
        handler: 'handleHorarioUpdated',
        horarioId: horarioActualizado.id,
        operation: 'consultar_turnos_existentes'
      });
      throw errorConsulta;
    }

    // 2. Identificar turnos con reservas
    const turnosConReservas = turnosExistentes?.filter((t: any) => t.cupo_total !== t.cupo_disponible) || [];
    const fechasTurnosConReservas = new Set(
      turnosConReservas.map((t: any) => t.fecha)
    );

    // 3. Decidir qué estrategia seguir
    if (turnosConReservas.length > 0) {
      // Hay turnos con reservas, utilizamos estrategia conservadora
      logInfo(`Detectados ${turnosConReservas.length} turnos con reservas`, {
        handler: 'handleHorarioUpdated',
        horarioId: horarioActualizado.id,
        estrategia: 'conservadora'
      });

      // 3a. Borrar turnos sin reservas (soft delete)
      for (const turno of turnosExistentes || []) {
        if (!fechasTurnosConReservas.has(turno.fecha)) {
          await supabase
            .from('turnos')
            .update({
              deleted_at: new Date().toISOString()
            })
            .eq('id', turno.id);
        }
      }

      // 3b. Actualizar turnos con reservas (conservando reservas)
      for (const turno of turnosConReservas) {
        const reservasActuales = turno.cupo_total - turno.cupo_disponible;
        await supabase
          .from('turnos')
          .update({
            hora_inicio: horarioActualizado.hora_inicio,
            hora_fin: horarioActualizado.hora_fin,
            cupo_total: horarioActualizado.cupo,
            cupo_disponible: Math.max(0, horarioActualizado.cupo - reservasActuales),
            updated_at: new Date().toISOString()
          })
          .eq('id', turno.id);
      }
    } else {
      // No hay turnos con reservas, podemos regenerar completamente
      logInfo(`No hay turnos con reservas, regenerando completamente`, {
        handler: 'handleHorarioUpdated',
        horarioId: horarioActualizado.id,
        estrategia: 'regeneración_completa'
      });

      // Borrar todos los turnos existentes (soft delete)
      if (turnosExistentes && turnosExistentes.length > 0) {
        await supabase
          .from('turnos')
          .update({
            deleted_at: new Date().toISOString()
          })
          .eq('horario_id', horarioActualizado.id)
          .gte('fecha', formatDate(fechaLimite));
      }
    }

    // 4. Regenerar nuevos turnos
    const resultado = await generarTurnosDesdeHorario(horarioActualizado);

    return {
      success: true,
      message: 'Turnos regenerados exitosamente',
      turnosConReservas: turnosConReservas.length,
      resultadoRegeneracion: resultado
    };
  } catch (error) {
    logError(error, {
      handler: 'handleHorarioUpdated',
      horarioId: horarioActualizado.id,
      operation: 'regenerar_turnos'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Actualiza los cupos de los turnos existentes cuando cambia el cupo del horario
 * @param horarioId ID del horario
 * @param cupoAnterior Cupo anterior
 * @param cupoNuevo Nuevo cupo
 */
async function actualizarCuposTurnos(horarioId: number, cupoAnterior: number, cupoNuevo: number) {
  try {
    // Obtener el cliente de Supabase una sola vez al inicio
    const supabase = await getSupabase();
    
    // Obtener turnos futuros
    const hoy = fechaActual();
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('id, cupo_total, cupo_disponible')
      .eq('horario_id', horarioId)
      .gte('fecha', formatDate(hoy))
      .is('deleted_at', null);

    if (error) throw error;
    if (!turnos || turnos.length === 0) return;

    // Actualizar cada turno
    for (const turno of turnos) {
      // Calcular reservas actuales
      const reservasActuales = turno.cupo_total - turno.cupo_disponible;
      
      // Calcular nuevo cupo disponible
      const nuevoCupoDisponible = Math.max(0, cupoNuevo - reservasActuales);
      
      // Actualizar turno
      await supabase
        .from('turnos')
        .update({
          cupo_total: cupoNuevo,
          cupo_disponible: nuevoCupoDisponible,
          updated_at: new Date().toISOString()
        })
        .eq('id', turno.id);
    }

    logInfo(`Cupos actualizados para ${turnos.length} turnos del horario ${horarioId}`, {
      handler: 'actualizarCuposTurnos',
      horarioId,
      cupoAnterior,
      cupoNuevo,
      turnosActualizados: turnos.length
    });
  } catch (error) {
    logError(error, {
      handler: 'actualizarCuposTurnos',
      horarioId,
      cupoAnterior,
      cupoNuevo
    });
    throw error;
  }
}

/**
 * Desactiva los turnos futuros de un horario que ha sido deshabilitado
 * @param horarioId ID del horario deshabilitado
 */
async function desactivarTurnosFuturos(horarioId: number) {
  try {
    // Obtener el cliente de Supabase una sola vez al inicio
    const supabase = await getSupabase();
    
    const hoy = fechaActual();
    const { data, error } = await supabase
      .from('turnos')
      .update({
        bloqueado: true,
        updated_at: new Date().toISOString()
      })
      .eq('horario_id', horarioId)
      .gte('fecha', formatDate(hoy))
      .is('deleted_at', null);

    if (error) throw error;

    logInfo(`Turnos futuros desactivados para horario ${horarioId}`, {
      handler: 'desactivarTurnosFuturos',
      horarioId
    });
  } catch (error) {
    logError(error, {
      handler: 'desactivarTurnosFuturos',
      horarioId
    });
    throw error;
  }
}

/**
 * Compara dos arrays para verificar si son iguales
 */
function arrayEquals(a: any[], b: any[]): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
