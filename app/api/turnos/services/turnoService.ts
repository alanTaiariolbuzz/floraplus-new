import { createClient } from "../../../../utils/supabase/server";
import { logError, logInfo } from "../../../../utils/error/logger";

// Obtener el cliente de Supabase centralizado
export const getSupabase = async () => await createClient();

interface TurnoFiltros {
  id?: number;
  actividad_id?: number;
  horario_id?: number;
  agencia_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  solo_disponibles?: number;
  incluir_borrados?: boolean;
}

/**
 * Obtiene una lista de turnos aplicando filtros mediante la función `get_turnos_modificados` de Supabase
 */
export async function getTurnos(filtros: TurnoFiltros = {}) {
  try {
    const supabase = await getSupabase();

    // Invocar la función `get_turnos_modificados` con los filtros como parámetros
    const { data, error } = await supabase.rpc("get_turnos_modificados_v3", {
      p_id: filtros.id || null,
      p_actividad_id: filtros.actividad_id || null,
      p_horario_id: filtros.horario_id || null,
      p_agencia_id: filtros.agencia_id || null,
      p_fecha_desde: filtros.fecha_desde || null,
      p_fecha_hasta: filtros.fecha_hasta || null,
      p_solo_disponibles: filtros.solo_disponibles || null,
      p_incluir_borrados: filtros.incluir_borrados === true,
    });

    logInfo("Aplicando filtros para obtener turnos", {
      service: "turnoService",
      method: "getTurnos",
      filtros,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logError(error, { service: "turnoService", method: "getTurnos" });
    throw error;
  }
}

/**
 * Obtiene un turno por su ID
 */
export async function getTurnoById(id: number) {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("turnos")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      // Si no se encuentra, retornar null en lugar de lanzar un error
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logError(error, { service: "turnoService", method: "getTurnoById" });
    throw error;
  }
}

/**
 * Crea un nuevo turno en la base de datos
 */
export async function guardarTurno(turnoData: any) {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("turnos")
      .insert([turnoData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logError(error, { service: "turnoService", method: "createTurno" });
    throw error;
  }
}

/**
 * Actualiza un turno existente
 */
export async function updateTurno(id: number, turnoData: any) {
  try {
    // Primero verificar si el turno existe
    const turnoExistente = await getTurnoById(id);
    if (!turnoExistente) {
      return null;
    }

    const supabase = await getSupabase();

    // Preparar datos para actualizar
    const datosFinales = { ...turnoData };

    // Si se actualiza cupo_total pero no cupo_disponible, ajustar cupo_disponible
    if (
      datosFinales.cupo_total !== undefined &&
      datosFinales.cupo_disponible === undefined
    ) {
      const cupoTotalAnterior = turnoExistente.cupo_total || 0;
      const cupoTotalNuevo = datosFinales.cupo_total;
      const cupoDisponibleActual = turnoExistente.cupo_disponible || 0;

      // Si hay cambio en el cupo total, ajustar el disponible
      if (cupoTotalNuevo !== cupoTotalAnterior) {
        // Si aumenta el cupo total, aumenta el disponible en la misma cantidad
        // Si disminuye, se ajusta proporcionalmente, nunca negativo
        const diferencia = cupoTotalNuevo - cupoTotalAnterior;
        let nuevoCupoDisponible = Math.max(
          0,
          cupoDisponibleActual + diferencia
        );
        // Asegurar que no exceda el cupo total
        nuevoCupoDisponible = Math.min(nuevoCupoDisponible, cupoTotalNuevo);

        datosFinales.cupo_disponible = nuevoCupoDisponible;

        logInfo("Ajustando cupo_disponible en base a cambio de cupo_total", {
          service: "turnoService",
          method: "updateTurno",
          data: { id, diferencia, nuevo_cupo_disponible: nuevoCupoDisponible },
        });
      }
    }

    // Añadir timestamp de actualización
    datosFinales.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("turnos")
      .update(datosFinales)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logError(error, { service: "turnoService", method: "updateTurno" });
    throw error;
  }
}

/**
 * Elimina un turno (soft delete)
 */
export async function deleteTurno(id: number) {
  try {
    // Primero verificar si el turno existe
    const turnoExistente = await getTurnoById(id);
    if (!turnoExistente) {
      return null;
    }

    const supabase = await getSupabase();

    // Realizar soft delete
    const { data, error } = await supabase
      .from("turnos")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logError(error, { service: "turnoService", method: "deleteTurno" });
    throw error;
  }
}

/**
 * Elimina todos los turnos asociados a un horario (soft delete)
 * @param horarioId ID del horario cuyos turnos serán eliminados
 * @returns Número de turnos eliminados
 */
export async function deleteTurnosByHorario(horarioId: number) {
  try {
    const supabase = await getSupabase();

    // Realizar soft delete para todos los turnos del horario
    const { data, error, count } = await supabase
      .from("turnos")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("horario_id", horarioId)
      .is("deleted_at", null); // Solo afectar registros no eliminados previamente

    if (error) {
      throw error;
    }

    logInfo(
      `Se eliminaron ${count || 0} turnos asociados al horario ${horarioId}`,
      {
        service: "turnoService",
        method: "deleteTurnosByHorario",
      }
    );

    return count || 0;
  } catch (error) {
    logError(error, {
      service: "turnoService",
      method: "deleteTurnosByHorario",
      horarioId,
    });
    throw error;
  }
}
