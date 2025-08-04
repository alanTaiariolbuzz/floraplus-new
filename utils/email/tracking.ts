import { createAdminClient } from "@/utils/supabase/admin";
import { logError, logInfo } from "@/utils/error/logger";

export interface EmailTrackingData {
  agencia_id: number;
  reserva_id?: number;
  template_name: string;
  email_to: string;
  email_from?: string;
  subject: string;
  status?: "enviado" | "fallido" | "pendiente";
  error_message?: string;
  metadata?: Record<string, any>;
  usuario_id?: string;
}

/**
 * Registra un correo enviado en la base de datos
 */
export async function trackEmailSent(
  trackingData: EmailTrackingData
): Promise<void> {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase.from("correos_enviados").insert([
      {
        agencia_id: trackingData.agencia_id,
        reserva_id: trackingData.reserva_id || null,
        destinatario: trackingData.email_to,
        asunto: trackingData.subject,
        template: trackingData.template_name,
        tipo_correo: trackingData.template_name,
        estado: trackingData.status || "enviado",
        metadata: trackingData.metadata || null,
        usuario_id: trackingData.usuario_id || null,
      },
    ]);

    if (error) {
      logError("Error registrando correo enviado", {
        context: "trackEmailSent",
        error,
        trackingData,
      });
      throw error;
    }

    logInfo("Correo enviado registrado exitosamente", {
      agencia_id: trackingData.agencia_id,
      template_name: trackingData.template_name,
      email_to: trackingData.email_to,
    });
  } catch (error) {
    logError("Error en trackEmailSent", {
      context: "trackEmailSent",
      error,
      trackingData,
    });
    // No lanzamos el error para no interrumpir el envío del email
  }
}

/**
 * Obtiene los correos enviados de una agencia
 */
export async function getEmailsSentByAgency(
  agenciaId: number,
  options: {
    limit?: number;
    offset?: number;
    template_name?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  } = {}
): Promise<any[]> {
  try {
    const supabase = await createAdminClient();

    let query = supabase
      .from("correos_enviados")
      .select(
        `
        *,
        reserva:reservas (
          id,
          codigo_reserva,
          estado,
          actividad:actividades (
            id,
            titulo
          ),
          cliente:clientes (
            nombre,
            apellido,
            email
          )
        ),
        agencia:agencias (
          id,
          nombre,
          nombre_comercial
        )
      `
      )
      .eq("agencia_id", agenciaId)
      .order("enviado_en", { ascending: false });

        // Aplicar filtros
    if (options.template_name) {
      query = query.eq("tipo_correo", options.template_name);
    }
    
    if (options.status) {
      query = query.eq("estado", options.status);
    }
    
    if (options.date_from) {
      query = query.gte("enviado_en", options.date_from);
    }
    
    if (options.date_to) {
      query = query.lte("enviado_en", options.date_to);
    }

    // Aplicar paginación
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      logError("Error obteniendo correos enviados", {
        context: "getEmailsSentByAgency",
        error,
        agenciaId,
        options,
      });
      throw error;
    }

    return data || [];
  } catch (error) {
    logError("Error en getEmailsSentByAgency", {
      context: "getEmailsSentByAgency",
      error,
      agenciaId,
      options,
    });
    throw error;
  }
}

/**
 * Obtiene estadísticas de correos enviados por agencia
 */
export async function getEmailStatsByAgency(agenciaId: number): Promise<{
  total_sent: number;
  total_failed: number;
  by_template: Record<string, number>;
  by_status: Record<string, number>;
}> {
  try {
    const supabase = await createAdminClient();

    // Total de correos enviados
    const { count: totalSent } = await supabase
      .from("correos_enviados")
      .select("*", { count: "exact", head: true })
      .eq("agencia_id", agenciaId)
      .eq("estado", "enviado");

    // Total de correos fallidos
    const { count: totalFailed } = await supabase
      .from("correos_enviados")
      .select("*", { count: "exact", head: true })
      .eq("agencia_id", agenciaId)
      .eq("estado", "fallido");

    // Por template
    const { data: byTemplate } = await supabase
      .from("correos_enviados")
      .select("tipo_correo, estado")
      .eq("agencia_id", agenciaId);

    const templateStats: Record<string, number> = {};
    byTemplate?.forEach((email) => {
      templateStats[email.tipo_correo] =
        (templateStats[email.tipo_correo] || 0) + 1;
    });

    // Por status
    const { data: byStatus } = await supabase
      .from("correos_enviados")
      .select("estado")
      .eq("agencia_id", agenciaId);

    const statusStats: Record<string, number> = {};
    byStatus?.forEach((email) => {
      statusStats[email.estado] = (statusStats[email.estado] || 0) + 1;
    });

    return {
      total_sent: totalSent || 0,
      total_failed: totalFailed || 0,
      by_template: templateStats,
      by_status: statusStats,
    };
  } catch (error) {
    logError("Error obteniendo estadísticas de correos", {
      context: "getEmailStatsByAgency",
      error,
      agenciaId,
    });
    throw error;
  }
}
