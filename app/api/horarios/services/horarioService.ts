import { createClient } from "../../../../utils/supabase/server";
import { logError, logInfo } from "../../../../utils/error/logger";
import { verificarActividad } from "../../actividades/services/actividadService";
import { Horario } from "../schemas/horarioSchema";

/**
 * Obtiene un horario por su ID
 * @param id ID del horario
 * @returns Datos del horario o null si no existe
 */
export async function getHorarioById(id: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("horarios")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    logError(error, {
      service: "horarioService",
      method: "getHorarioById",
      id,
    });
    return null;
  }

  return data;
}

/**
 * Obtiene todos los horarios con filtros opcionales
 * @param filtros Filtros a aplicar
 * @returns Lista de horarios
 */
export async function getHorarios(filtros: {
  actividad_id?: number;
  id?: number;
  habilitada?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  agencia_id?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("horarios")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false });

  // Aplicar filtros si se proporcionan
  if (filtros.actividad_id) {
    query = query.eq("actividad_id", filtros.actividad_id);
  }

  if (filtros.id) {
    query = query.eq("id", filtros.id);
  }

  if (filtros.habilitada !== undefined) {
    query = query.eq("habilitada", filtros.habilitada);
  }

  if (filtros.agencia_id) {
    query = query.eq("agencia_id", filtros.agencia_id);
  }

  if (filtros.fecha_desde) {
    query = query.gte("fecha_inicio", filtros.fecha_desde);
  }

  if (filtros.fecha_hasta) {
    query = query.lte("fecha_inicio", filtros.fecha_hasta);
  }

  const { data, error } = await query;

  if (error) {
    logError(error, {
      service: "horarioService",
      method: "getHorarios",
      filtros,
    });
    return [];
  }

  return data || [];
}

/**
 * Crea un nuevo horario
 * @param horarioData Datos del horario a crear
 * @returns Horario creado o null si hay error
 */
export async function createHorario(horarioData: Horario, AGENCIA_ID: number) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Verificar que la actividad existe
  if (!horarioData.actividad_id) {
    return { error: "ID de actividad es requerido" };
  }

  const actividadExiste = await verificarActividad(horarioData.actividad_id);
  if (!actividadExiste) {
    return { error: "Actividad no encontrada o no pertenece a esta agencia" };
  }

  // Insertar el nuevo horario
  const { data, error } = await supabase
    .from("horarios")
    .insert({
      actividad_id: horarioData.actividad_id,
      agencia_id: AGENCIA_ID,
      fecha_inicio: horarioData.fecha_inicio,
      dias: horarioData.dias,
      dia_completo: horarioData.dia_completo,
      hora_inicio: horarioData.hora_inicio,
      hora_fin: horarioData.hora_fin,
      cupo: horarioData.cupo,
      habilitada: horarioData.habilitada,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    logError(error, {
      service: "horarioService",
      method: "createHorario",
      data: horarioData,
    });
    return { error: error.message };
  }

  logInfo("Horario creado exitosamente", { id: data.id });

  return { data };
}

/**
 * Actualiza un horario existente
 * @param id ID del horario a actualizar
 * @param horarioData Datos del horario
 * @returns Horario actualizado o null si hay error
 */
export async function updateHorario(id: number, horarioData: Horario) {
  const supabase = await createClient();

  // Verificar que el horario existe
  const horarioExistente = await getHorarioById(id);
  if (!horarioExistente) {
    return { error: "Horario no encontrado" };
  }

  // Verificar que la actividad existe
  if (!horarioData.actividad_id) {
    return { error: "ID de actividad es requerido" };
  }

  const actividadExiste = await verificarActividad(horarioData.actividad_id);
  if (!actividadExiste) {
    return { error: "Actividad no encontrada o no pertenece a esta agencia" };
  }

  // Actualizar el horario
  const { data, error } = await supabase
    .from("horarios")
    .update({
      actividad_id: horarioData.actividad_id,
      fecha_inicio: horarioData.fecha_inicio,
      dias: horarioData.dias,
      dia_completo: horarioData.dia_completo,
      hora_inicio: horarioData.hora_inicio,
      hora_fin: horarioData.hora_fin,
      cupo: horarioData.cupo,
      habilitada: horarioData.habilitada,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    logError(error, {
      service: "horarioService",
      method: "updateHorario",
      id,
      data: horarioData,
    });
    return { error: error.message };
  }

  logInfo("Horario actualizado exitosamente", { id });

  return { data };
}

/**
 * Elimina un horario (soft delete)
 * @param id ID del horario a eliminar
 * @returns Datos del horario eliminado o null si hay error
 */
export async function deleteHorario(id: number) {
  const supabase = await createClient();

  // Verificar que el horario existe
  const horarioExistente = await getHorarioById(id);
  if (!horarioExistente) {
    return { error: "Horario no encontrado" };
  }

  // Realizar soft delete
  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("horarios")
    .update({
      habilitada: false,
      deleted_at: deletedAt,
    })
    .eq("id", id)
    .select("id, deleted_at")
    .single();

  if (error) {
    logError(error, {
      service: "horarioService",
      method: "deleteHorario",
      id,
    });
    return { error: error.message };
  }

  logInfo("Horario marcado como eliminado", { id, deleted_at: deletedAt });

  return { data };
}
