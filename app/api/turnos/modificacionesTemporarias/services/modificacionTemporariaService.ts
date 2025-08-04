import { createClient } from "@/utils/supabase/server";
import { logError, logInfo } from "@/utils/error/logger";
import { z } from "zod";
import { modificacionTemporariaSchema } from "../schemas/modificacionTemporariaSchema";
import { revertirModificacionTemporaria } from "../../../../services/modificacionTemporaria";

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(409, message, details);
  }
}

class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(422, message, details);
  }
}

class BadRequestError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, details);
  }
}

// Obtener el cliente de Supabase centralizado
export const getSupabase = async () => await createClient();

/**
 * Verifica si hay reservas en un rango de fechas para una agencia
 * @param fecha_desde Fecha de inicio del rango
 * @param fecha_hasta Fecha de fin del rango
 * @returns Promise<boolean> true si hay reservas, false si no hay
 */
async function hayReservasAgencia(
  agencia_id: number,
  fecha_desde: string,
  fecha_hasta: string
): Promise<boolean> {
  const supabase = await getSupabase();
  const { data: reservas, error } = await supabase
    .from("reservas")
    .select(
      `
    id,
    turnos!inner(fecha)    
  `
    )
    .eq("agencia_id", agencia_id)
    .gte("turnos.fecha", fecha_desde)
    .lte("turnos.fecha", fecha_hasta)
    .eq("estado", "hold");

  if (error) {
    logError("Error al obtener las reservas de la agencia", error);
    throw new ApiError(500, "Error al verificar reservas de la agencia", error);
  }

  return (reservas && reservas.length > 0) || false;
}

/**
 * Verifica si hay reservas para una actividad en un rango de fechas
 * @param actividad_id ID de la actividad
 * @param fecha_desde Fecha de inicio del rango
 * @param fecha_hasta Fecha de fin del rango
 * @returns Promise<boolean> true si hay reservas, false si no hay
 */
async function hayReservasActividad(
  actividad_id: number,
  fecha_desde: string,
  fecha_hasta: string
): Promise<boolean> {
  const supabase = await getSupabase();
  const { data: reservas, error } = await supabase
    .from("reservas")
    .select(
      `
    id,
    turnos!inner(fecha)    
  `
    )
    .eq("actividad_id", actividad_id)
    .gte("turnos.fecha", fecha_desde)
    .lte("turnos.fecha", fecha_hasta);

  if (error) {
    logError("Error al obtener las reservas de la actividad", error);
    throw new ApiError(
      500,
      "Error al verificar reservas de la actividad",
      error
    );
  }

  return (reservas && reservas.length > 0) || false;
}

/**
 * Verifica si hay reservas para un horario en un rango de fechas
 * @param horario_id ID del horario
 * @param fecha_desde Fecha de inicio del rango
 * @param fecha_hasta Fecha de fin del rango
 * @returns Promise<boolean> true si hay reservas, false si no hay
 */
async function hayReservasHorario(
  horario_id: number,
  fecha_desde: string,
  fecha_hasta: string
): Promise<boolean> {
  const supabase = await getSupabase();

  // 1. Obtener los turnos del horario en el rango de fechas (turnos.fecha existe)
  const { data: turnos, error: errorTurnos } = await supabase
    .from("turnos")
    .select("id")
    .eq("horario_id", horario_id)
    .gte("fecha", fecha_desde)
    .lte("fecha", fecha_hasta);

  if (errorTurnos) {
    logError("Error al obtener los turnos del horario", errorTurnos);
    throw new ApiError(
      500,
      "Error al verificar turnos del horario",
      errorTurnos
    );
  }

  if (!turnos || turnos.length === 0) {
    return false;
  }

  // 2. Verificar si existen reservas para esos turnos
  const { data: reservas, error: errorReservas } = await supabase
    .from("reservas")
    .select("id")
    .in(
      "turno_id",
      turnos.map((t) => t.id)
    );

  if (errorReservas) {
    logError("Error al obtener las reservas del horario", errorReservas);
    throw new ApiError(
      500,
      "Error al verificar reservas del horario",
      errorReservas
    );
  }

  return Boolean(reservas && reservas.length > 0);
}

/**
 * Verifica si se puede cambiar cupos cuando hay reservas existentes
 * @param horario_id ID del horario
 * @param fecha_desde Fecha de inicio del rango
 * @param fecha_hasta Fecha de fin del rango
 * @param nuevos_cupos_totales Nuevo cupo total a establecer
 * @returns Promise<{puede: boolean, mensaje?: string}>
 */
async function verificarCambioCuposConReservas(
  horario_id: number,
  fecha_desde: string,
  fecha_hasta: string,
  nuevos_cupos_totales: number
): Promise<{ puede: boolean; mensaje?: string }> {
  const supabase = await getSupabase();

  // 1. Obtener los turnos del horario con información de cupos y reservas
  const { data: turnos, error: errorTurnos } = await supabase
    .from("turnos")
    .select("id, cupo_total, cupo_disponible")
    .eq("horario_id", horario_id)
    .gte("fecha", fecha_desde)
    .lte("fecha", fecha_hasta);

  if (errorTurnos) {
    logError("Error al obtener los turnos del horario", errorTurnos);
    throw new ApiError(
      500,
      "Error al verificar turnos del horario",
      errorTurnos
    );
  }

  if (!turnos || turnos.length === 0) {
    return { puede: true };
  }

  // 2. Verificar cada turno
  for (const turno of turnos) {
    const reservasActuales = turno.cupo_total - turno.cupo_disponible;

    // Si el nuevo cupo es menor que las reservas existentes, no se puede hacer
    if (nuevos_cupos_totales < reservasActuales) {
      return {
        puede: false,
        mensaje: `No se puede reducir el cupo a ${nuevos_cupos_totales} porque hay ${reservasActuales} reservas existentes en el turno ${turno.id}`,
      };
    }
  }

  return { puede: true };
}

/**
 * Guarda una modificación temporaria en la base de datos
 * @param modificacion Objeto de modificación temporaria a guardar
 * @returns Datos de la modificación guardada o error
 */
export async function guardarModificacion(
  modificacion: z.infer<typeof modificacionTemporariaSchema>
) {
  try {
    const supabase = await getSupabase();

    let reservas_query = false;

    switch (modificacion.tipo_modificacion) {
      case "BLOQUEAR_TODAS":
        if (modificacion.agencia_id === undefined) {
          throw new ValidationError(
            "ID de agencia es requerido para este tipo de modificación"
          );
        }
        reservas_query = await hayReservasAgencia(
          modificacion.agencia_id,
          modificacion.fecha_desde,
          modificacion.fecha_hasta
        );
        break;
      case "BLOQUEAR_ACTIVIDAD":
        if (!modificacion.actividad_id) {
          throw new ValidationError(
            "ID de actividad es requerido para este tipo de modificación"
          );
        }
        reservas_query = await hayReservasActividad(
          modificacion.actividad_id,
          modificacion.fecha_desde,
          modificacion.fecha_hasta
        );
        break;
      case "CAMBIAR_CUPOS":
        if (!modificacion.horario_id) {
          throw new ValidationError(
            "ID de horario es requerido para este tipo de modificación"
          );
        }
        if (!modificacion.nuevos_cupos_totales) {
          throw new ValidationError(
            "Nuevos cupos totales es requerido para cambiar cupos"
          );
        }
        // Para cambiar cupos, verificar si se puede hacer con reservas existentes
        const verificacionCupos = await verificarCambioCuposConReservas(
          modificacion.horario_id,
          modificacion.fecha_desde,
          modificacion.fecha_hasta,
          modificacion.nuevos_cupos_totales
        );
        if (!verificacionCupos.puede) {
          throw new ConflictError(
            verificacionCupos.mensaje ||
              "No se puede cambiar cupos con las reservas existentes"
          );
        }
        // Si se puede cambiar cupos, no hay conflicto
        reservas_query = false;
        break;
      case "BLOQUEAR_HORARIO":
      case "CAMBIAR_HORA_INICIO":
        if (!modificacion.horario_id) {
          throw new ValidationError(
            "ID de horario es requerido para este tipo de modificación"
          );
        }
        reservas_query = await hayReservasHorario(
          modificacion.horario_id,
          modificacion.fecha_desde,
          modificacion.fecha_hasta
        );
        break;
      default:
        throw new BadRequestError("Tipo de modificación no reconocido");
    }

    if (reservas_query) {
      throw new ConflictError(
        "No se puede realizar la modificación porque hay reservas asociadas en el período seleccionado"
      );
    }

    const { data, error } = await supabase
      .from("modificaciones_temporarias")
      .insert([modificacion])
      .select("*");

    if (error) {
      logError("Error al guardar la modificación temporaria", error);
      throw new ApiError(
        500,
        "Error al guardar la modificación temporaria",
        error
      );
    }

    return { data };
  } catch (error) {
    logError("Error en guardarModificacion", error);
    throw error;
  }
}

/**
 * Obtiene las modificaciones temporarias con filtros opcionales
 * @param filtros Filtros a aplicar (incluye agencia_id)
 * @returns Lista de modificaciones temporarias
 */
export async function getModificacionesTemporarias(filtros: {
  agencia_id?: number;
  tipo?: string;
  actividad_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}) {
  const supabase = await getSupabase();

  // Construir la consulta base
  let query = supabase
    .from("modificaciones_temporarias")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false });

  // Aplicar filtros si están presentes
  if (filtros.agencia_id) {
    query = query.eq("agencia_id", filtros.agencia_id);
  }

  if (filtros.tipo) {
    query = query.eq("tipo_modificacion", filtros.tipo);
  }

  if (filtros.actividad_id) {
    query = query.eq("actividad_id", filtros.actividad_id);
  }

  if (filtros.fecha_desde) {
    query = query.gte("fecha_desde", filtros.fecha_desde);
  }

  if (filtros.fecha_hasta) {
    query = query.lte("fecha_hasta", filtros.fecha_hasta);
  }

  // Ejecutar la consulta
  const { data, error } = await query;

  if (error) {
    logError(error, {
      service: "modificacionTemporariaService",
      method: "getModificacionesTemporarias",
      filtros,
    });
    return { error: error.message };
  }

  return data || [];
}

/**
 * Actualiza una modificación temporaria por su ID
 * @param id ID de la modificación temporaria
 * @param modificacion Datos de la modificación a actualizar
 * @returns Modificación actualizada o error
 */
export async function updateModificacionTemporaria(
  id: number,
  modificacion: Partial<z.infer<typeof modificacionTemporariaSchema>>
) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();

  // Verificar que la modificación existe
  const { data: modificacionExistente, error: errorConsulta } = await supabase
    .from("modificaciones_temporarias")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (errorConsulta || !modificacionExistente) {
    logError(errorConsulta || "Modificación no encontrada", {
      service: "modificacionTemporariaService",
      method: "updateModificacionTemporaria",
      id,
    });
    return { error: "Modificación no encontrada" };
  }

  // Actualizar la modificación
  const { data, error } = await supabase
    .from("modificaciones_temporarias")
    .update({
      ...modificacion,
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    logError(error, {
      service: "modificacionTemporariaService",
      method: "updateModificacionTemporaria",
      id,
      modificacion,
    });
    return { error: error.message };
  }

  logInfo("Modificación temporaria actualizada exitosamente", { id });
  return data;
}

/**
 * Elimina una modificación temporaria (soft delete) y revierte los cambios aplicados
 * @param id ID de la modificación temporaria a eliminar
 * @returns Datos de la modificación eliminada o error
 */
export async function deleteModificacionTemporaria(id: number) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();

  // Verificar que la modificación existe
  const { data: modificacionExistente, error: errorConsulta } = await supabase
    .from("modificaciones_temporarias")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (errorConsulta || !modificacionExistente) {
    logError(errorConsulta || "Modificación no encontrada", {
      service: "modificacionTemporariaService",
      method: "deleteModificacionTemporaria",
      id,
    });
    return { error: "Modificación no encontrada" };
  }

  try {
    // 1. Revertir los cambios aplicados a los turnos
    logInfo(`Iniciando reversión de modificación temporal ${id}`, {
      service: "modificacionTemporariaService",
      method: "deleteModificacionTemporaria",
      tipo: modificacionExistente.tipo_modificacion,
    });

    const resultadoReversion = await revertirModificacionTemporaria(id);

    logInfo(`Reversión completada para modificación ${id}`, {
      service: "modificacionTemporariaService",
      method: "deleteModificacionTemporaria",
      turnosRevertidos: resultadoReversion.turnosModificados,
    });

    // 2. Realizar soft delete de la modificación
    const { data, error } = await supabase
      .from("modificaciones_temporarias")
      .update({
        deleted_at: now,
        updated_at: now,
        activo: false,
      })
      .eq("id", id)
      .select("id, deleted_at")
      .single();

    if (error) {
      logError(error, {
        service: "modificacionTemporariaService",
        method: "deleteModificacionTemporaria",
        id,
      });
      return { error: error.message };
    }

    logInfo("Modificación temporaria eliminada y cambios revertidos", {
      service: "modificacionTemporariaService",
      method: "deleteModificacionTemporaria",
      id,
      deleted_at: now,
      turnosRevertidos: resultadoReversion.turnosModificados,
    });

    return {
      data,
      reversion: resultadoReversion,
    };
  } catch (error) {
    logError(error, {
      service: "modificacionTemporariaService",
      method: "deleteModificacionTemporaria",
      id,
      errorType: "reversionError",
    });
    return {
      error: "Error al revertir los cambios de la modificación temporal",
    };
  }
}
