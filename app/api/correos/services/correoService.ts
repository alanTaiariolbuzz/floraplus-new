import { createClient } from "../../../../utils/supabase/server";
import { logError, logInfo } from "../../../../utils/error/logger";
import { logWarning } from "../../../../utils/error/logWarning";
import { CorreoData, FiltrosCorreo } from "../types";

export async function getCorreos(filtros: FiltrosCorreo = {}) {
  const supabase = await createClient();
  const { agencia_id } = filtros;

  try {
    let query = supabase
      .from("correos")
      .select("*")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("id");

    // Aplicar filtros si existen
    if (agencia_id !== undefined) {
      logInfo("Filtrando correos por agencia_id", { agencia_id });
      query = query.eq("agencia_id", agencia_id);
    }

    const { data, error } = await query;

    if (error) {
      logWarning("Error recibido de Supabase al obtener correos", { error });
      throw error;
    }

    logInfo("Correos obtenidos exitosamente", {
      count: data?.length || 0,
      filtros,
    });
    return data;
  } catch (error) {
    logError("Error al obtener correos", {
      context: "getCorreos",
      error,
      filtros,
    });
    throw error;
  }
}

export async function getCorreoByAgenciaId(agenciaId: number) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("correos")
      .select("*")
      .eq("agencia_id", agenciaId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No se encontró el registro
        return null;
      }
      logWarning(
        "Error recibido de Supabase al obtener correo por agencia_id",
        {
          error,
          agenciaId,
        }
      );
      throw error;
    }

    logInfo("Correo obtenido exitosamente por agencia_id", { agenciaId });
    return data;
  } catch (error) {
    logError("Error al obtener correo por agencia_id", {
      context: "getCorreoByAgenciaId",
      error,
      agenciaId,
    });
    throw error;
  }
}

export async function createCorreo(correoData: CorreoData) {
  const supabase = await createClient();

  try {
    logInfo("Creando o actualizando configuración de correos", {
      agencia_id: correoData.agencia_id,
      email_from: correoData.email_from,
    });

    const now = new Date().toISOString();

    const correoInsert = {
      agencia_id: correoData.agencia_id,
      email_from: correoData.email_from,
      email_reply_to: correoData.email_reply_to,
      logo_url: correoData.logo_url || null,
      logo_filename: correoData.logo_filename || null,
      updated_at: now,
    };

    // Usar upsert para crear o actualizar
    const { data, error } = await supabase
      .from("correos")
      .upsert(correoInsert, {
        onConflict: "agencia_id",
        ignoreDuplicates: false,
      })
      .select("*")
      .single();

    if (error) {
      logWarning("Error recibido de Supabase al crear/actualizar correo", {
        error,
        agencia_id: correoData.agencia_id,
      });
      throw error;
    }

    logInfo("Configuración de correos creada/actualizada exitosamente", {
      id: data.id,
      agencia_id: data.agencia_id,
    });
    return data;
  } catch (error) {
    logError("Error al crear/actualizar configuración de correos", {
      context: "createCorreo",
      error,
      agencia_id: correoData.agencia_id,
    });
    throw error;
  }
}

export async function updateCorreo(
  agenciaId: number,
  correoData: Partial<CorreoData>
) {
  const supabase = await createClient();

  try {
    logInfo("Actualizando configuración de correos", {
      agencia_id: agenciaId,
      updateFields: Object.keys(correoData),
    });

    // Verificar que la configuración exista
    const { data: correoExistente, error: errorBusqueda } = await supabase
      .from("correos")
      .select("id")
      .eq("agencia_id", agenciaId)
      .single();

    if (errorBusqueda || !correoExistente) {
      logWarning(
        "Intento de actualizar configuración de correos no existente",
        {
          agencia_id: agenciaId,
        }
      );
      throw {
        code: 404,
        message: "Configuración de correos no encontrada",
      };
    }

    const now = new Date().toISOString();

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: now,
    };

    // Solo incluir campos que estén definidos
    if (correoData.email_from !== undefined)
      updateData.email_from = correoData.email_from;
    if (correoData.email_reply_to !== undefined)
      updateData.email_reply_to = correoData.email_reply_to;
    if (correoData.logo_url !== undefined)
      updateData.logo_url = correoData.logo_url;
    if (correoData.logo_filename !== undefined)
      updateData.logo_filename = correoData.logo_filename;

    // Actualizar la configuración
    const { data, error } = await supabase
      .from("correos")
      .update(updateData)
      .eq("agencia_id", agenciaId)
      .select("*")
      .single();

    if (error) {
      logWarning("Error recibido de Supabase al actualizar correo", {
        error,
        agencia_id: agenciaId,
      });
      throw error;
    }

    logInfo("Configuración de correos actualizada exitosamente", {
      agencia_id: agenciaId,
    });
    return data;
  } catch (error) {
    logError("Error al actualizar configuración de correos", {
      context: "updateCorreo",
      error,
      agencia_id: agenciaId,
    });
    throw error;
  }
}

export async function deleteCorreo(agenciaId: number) {
  const supabase = await createClient();

  try {
    logInfo("Eliminando configuración de correos", { agencia_id: agenciaId });

    const { error } = await supabase
      .from("correos")
      .delete()
      .eq("agencia_id", agenciaId);

    if (error) {
      logWarning("Error recibido de Supabase al eliminar correo", {
        error,
        agencia_id: agenciaId,
      });
      throw error;
    }

    logInfo("Configuración de correos eliminada exitosamente", {
      agencia_id: agenciaId,
    });
    return { success: true };
  } catch (error) {
    logError("Error al eliminar configuración de correos", {
      context: "deleteCorreo",
      error,
      agencia_id: agenciaId,
    });
    throw error;
  }
}
