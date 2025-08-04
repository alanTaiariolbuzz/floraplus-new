import { logError, logInfo } from "@/utils/error/logger";
import { ActividadCompleta } from "../schemas/actividadSchema";
import { createClient } from "@/utils/supabase/server";
import { deleteTurnosByActividad } from "../../turnos/services/deleteTurnosByActividad";
import { syncTarifas, syncPivot } from "../handlers/sync";
import { syncCronograma } from "../handlers/syncCronograma";

export async function getActivityById(id: number): Promise<ActividadCompleta> {
  const supabase = await createClient();

  // Obtener datos básicos de la actividad
  const { data: actividad, error: actividadError } = await supabase
    .from("actividades")
    .select(
      `
      *,
      agencias (
        id,
        stripe_account_id,
        convenience_fee_fijo_valor
      )
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (actividadError || !actividad) {
    logError(actividadError || new Error("Actividad no encontrada"), {
      endpoint: "/api/actividades/GET",
      actividadId: id,
    });
    throw new Error("Actividad no encontrada");
  }

  // Parsear la ubicación si existe
  let ubicacion;
  try {
    if (actividad.ubicacion) {
      ubicacion = JSON.parse(actividad.ubicacion);
    }
  } catch (e) {
    logError(e, {
      endpoint: "/api/actividades/GET",
      message: "Error al parsear ubicación de actividad",
    });
  }

  // Colocar el ID al inicio y devolver todos los datos disponibles
  return {
    id: actividad.id,
    titulo: actividad.titulo,
    titulo_en: actividad.titulo_en || undefined,
    descripcion: actividad.descripcion,
    descripcion_en: actividad.descripcion_en || undefined,
    es_privada: actividad.es_privada,
    imagen: actividad.imagen,
    estado: actividad.estado,
    iframe_code: actividad.iframe_code || "",
    ubicacion: ubicacion,
    stripe_account_id: actividad.agencias?.stripe_account_id,
    convenience_fee_fijo_valor: actividad.agencias?.convenience_fee_fijo_valor,
    agencia_id: actividad.agencias?.id,
    cronograma: [], // Se completará después
    detalles: {
      minimo_reserva: actividad.minimo_personas_reserva,
      limite_reserva_minutos: actividad.limite_reserva_minutos || null,
      umbral_limite_personas: actividad.umbral_limite_personas || null,
      umbral_limite_minutos: actividad.umbral_limite_minutos || null,
      umbral_limite_tipo: actividad.umbral_limite_tipo || null,
    },
    tarifas: [], // Se completará después
    adicionales: [], // Se completará después
    transporte: [], // Se completará después
    descuentos: [], // Se completará después
    creado_en: actividad.created_at,
    actualizado_en: actividad.updated_at, // Mapeado correctamente a la propiedad del objeto de retorno
  };
}

/**
 * Obtiene una actividad por ID incluyendo las soft deleted (para mostrar en reservas)
 */
export async function getActivityByIdIncludingDeleted(
  id: number
): Promise<ActividadCompleta> {
  const supabase = await createClient();

  // Obtener datos básicos de la actividad (incluyendo soft deleted)
  const { data: actividad, error: actividadError } = await supabase
    .from("actividades")
    .select(
      `
      *,
      agencias (
        id,
        stripe_account_id,
        convenience_fee_fijo_valor
      )
    `
    )
    .eq("id", id)
    .single();

  if (actividadError || !actividad) {
    logError(actividadError || new Error("Actividad no encontrada"), {
      endpoint: "/api/actividades/GET",
      actividadId: id,
    });
    throw new Error("Actividad no encontrada");
  }

  // Parsear la ubicación si existe
  let ubicacion;
  try {
    if (actividad.ubicacion) {
      ubicacion = JSON.parse(actividad.ubicacion);
    }
  } catch (e) {
    logError(e, {
      endpoint: "/api/actividades/GET",
      message: "Error al parsear ubicación de actividad",
    });
  }

  // Colocar el ID al inicio y devolver todos los datos disponibles
  return {
    id: actividad.id,
    titulo: actividad.titulo,
    titulo_en: actividad.titulo_en || undefined,
    descripcion: actividad.descripcion,
    descripcion_en: actividad.descripcion_en || undefined,
    es_privada: actividad.es_privada,
    imagen: actividad.imagen,
    estado: actividad.estado,
    iframe_code: actividad.iframe_code || "",
    ubicacion: ubicacion,
    stripe_account_id: actividad.agencias?.stripe_account_id,
    convenience_fee_fijo_valor: actividad.agencias?.convenience_fee_fijo_valor,
    agencia_id: actividad.agencias?.id,
    cronograma: [], // Se completará después
    detalles: {
      minimo_reserva: actividad.minimo_personas_reserva,
      limite_reserva_minutos: actividad.limite_reserva_minutos || null,
      umbral_limite_personas: actividad.umbral_limite_personas || null,
      umbral_limite_minutos: actividad.umbral_limite_minutos || null,
      umbral_limite_tipo: actividad.umbral_limite_tipo || null,
    },
    tarifas: [], // Se completará después
    adicionales: [], // Se completará después
    transporte: [], // Se completará después
    descuentos: [], // Se completará después
    creado_en: actividad.created_at,
    actualizado_en: actividad.updated_at,
  };
}

export async function getAllActivities(
  agenciaId: number | null = null
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase
    .from("actividades")
    .select("id, titulo, titulo_en, imagen, iframe_code, estado")
    .is("deleted_at", null)
    .order("estado", { ascending: false }) // 'publicado' (mayor valor alfabético) primero
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (agenciaId) {
    query = query.eq("agencia_id", agenciaId);
  }

  const { data, error } = await query;

  if (error) {
    logError(error, { endpoint: "/api/actividades/GET" });
    throw new Error(`Error obteniendo actividades: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene múltiples actividades por IDs incluyendo las soft deleted (para mostrar en reservas)
 */
export async function getActivitiesByIdsIncludingDeleted(
  ids: number[]
): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("actividades")
    .select("id, titulo, titulo_en, imagen, iframe_code, estado")
    .in("id", ids);

  if (error) {
    logError(error, { endpoint: "/api/actividades/GET" });
    throw new Error(`Error obteniendo actividades: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene todas las actividades incluyendo las soft deleted
 */
export async function getAllActivitiesIncludingDeleted(
  agenciaId: number | null = null
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase
    .from("actividades")
    .select("id, titulo, titulo_en, imagen, iframe_code, estado")
    .order("estado", { ascending: false }) // 'publicado' (mayor valor alfabético) primero
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (agenciaId) {
    query = query.eq("agencia_id", agenciaId);
  }

  const { data, error } = await query;

  if (error) {
    logError(error, { endpoint: "/api/actividades/GET" });
    throw new Error(`Error obteniendo actividades: ${error.message}`);
  }

  return data || [];
}

export async function verificarActividad(
  actividadId: number
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("actividades")
    .select("id")
    .eq("id", actividadId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    logError(error || new Error("Actividad no encontrada"), {
      endpoint: "/api/actividades/verificar",
      actividadId,
    });
    return false;
  }

  return true;
}

/**
 * Actualiza una actividad en la base de datos junto con sus relaciones
 * Sin usar transacciones, actualiza cada parte por separado
 */
/**
 * Actualiza una actividad en la base de datos junto con sus relaciones
 * Maneja elementos existentes (con ID) vs nuevos (sin ID)
 * Elimina elementos que ya no están en la actualización
 */
export async function updateActividad(id: number, updateData: any) {
  const supabase = await createClient();
  const detalles = updateData.detalles || {};
  const now = new Date().toISOString();

  try {
    /* 1️⃣  Datos básicos --------------------------------------------------- */
    // Build update object only with provided fields
    const updateObject: any = {
      updated_at: now,
    };

    // Only include fields that are actually provided in updateData
    if (updateData.titulo !== undefined)
      updateObject.titulo = updateData.titulo;
    if (updateData.titulo_en !== undefined)
      updateObject.titulo_en = updateData.titulo_en;
    if (updateData.descripcion !== undefined)
      updateObject.descripcion = updateData.descripcion;
    if (updateData.descripcion_en !== undefined)
      updateObject.descripcion_en = updateData.descripcion_en;
    if (updateData.es_privada !== undefined)
      updateObject.es_privada = updateData.es_privada;
    if (updateData.imagen !== undefined)
      updateObject.imagen = updateData.imagen;
    if (updateData.estado !== undefined)
      updateObject.estado = updateData.estado;
    if (updateData.iframe_code !== undefined)
      updateObject.iframe_code = updateData.iframe_code;
    if (updateData.ubicacion !== undefined)
      updateObject.ubicacion = updateData.ubicacion;

    // Handle detalles fields
    if (detalles.minimo_reserva !== undefined)
      updateObject.minimo_personas_reserva = detalles.minimo_reserva;
    if (detalles.limite_reserva_minutos !== undefined)
      updateObject.limite_reserva_minutos = detalles.limite_reserva_minutos;
    if (detalles.umbral_limite_personas !== undefined)
      updateObject.umbral_limite_personas = detalles.umbral_limite_personas;
    if (detalles.umbral_limite_minutos !== undefined)
      updateObject.umbral_limite_minutos = detalles.umbral_limite_minutos;
    if (detalles.umbral_limite_tipo !== undefined)
      updateObject.umbral_limite_tipo = detalles.umbral_limite_tipo;

    const { error: actividadError } = await supabase
      .from("actividades")
      .update(updateObject)
      .eq("id", id);

    if (actividadError) throw actividadError;

    /* 2️⃣  Tarifas -------------------------------------------------------- */
    if (updateData.tarifas) {
      await syncTarifas(supabase, id, updateData.tarifas, now);
    }

    /* 3️⃣  Relaciones pivot ---------------------------------------------- */
    if (updateData.adicionales) {
      await syncPivot(
        supabase,
        "actividad_adicionales",
        "adicionales_id",
        id,
        updateData.adicionales
      );
    }

    if (updateData.transportes) {
      await syncPivot(
        supabase,
        "actividad_transporte",
        "transporte_id",
        id,
        updateData.transportes
      );
    }

    if (updateData.descuentos) {
      await syncPivot(
        supabase,
        "actividad_descuento",
        "descuento_id",
        id,
        updateData.descuentos
      );
    }

    /* 4️⃣  Devolver la actividad completa ------------------------------- */
    const { data: actividadCompleta, error: fetchError } = await supabase
      .from("actividades")
      .select("*")
      .eq("id", id)
      .single();

    //extaer agencia_id y hacer horarios si existe cronograma
    if (actividadCompleta && updateData.cronograma) {
      const agencia_id = actividadCompleta.agencia_id;
      if (updateData.cronograma) {
        await syncCronograma(supabase, id, updateData.cronograma, agencia_id);
      }
    }

    if (fetchError) throw fetchError;

    return actividadCompleta;
  } catch (error) {
    logError(error as Error, {
      endpoint: "updateActividadService",
      actividadId: id,
      error: (error as Error).message,
    });
    throw error;
  }
}
export async function updateEstadoActividad(
  id: number,
  estadoData: { estado: string } | string
) {
  const supabase = await createClient();

  // Handle both string and object parameter formats
  const estado =
    typeof estadoData === "string" ? estadoData : estadoData.estado;

  const { error } = await supabase
    .from("actividades")
    .update({ estado })
    .eq("id", id);

  if (error) {
    logError(error, {
      endpoint: "updateEstadoActividad",
      actividadId: id,
      estado: estado,
      error: error.message,
    });
    throw error;
  }

  // Return the updated activity
  const { data } = await supabase
    .from("actividades")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

/**
 * Elimina lógicamente una actividad
 */
export async function softDeleteActividadService(id: number) {
  const supabase = await createClient();

  try {
    // Procedemos directamente con el soft delete de la actividad
    const { error } = await supabase
      .from("actividades")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    // Borrar turnos asociados a la actividad
    await deleteTurnosByActividad(id);

    return { error: null };
  } catch (error) {
    console.error("Error en softDeleteActividadService:", error);
    return {
      error: {
        message: "Error al intentar eliminar la actividad",
        details: error,
      },
    };
  }
}
