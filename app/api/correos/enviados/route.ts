import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getEmailsSentByAgency,
  getEmailStatsByAgency,
} from "@/utils/email/tracking";
import { logError } from "@/utils/error/logger";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { code: 401, message: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener datos del usuario y su agencia
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("agencia_id, rol_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.agencia_id) {
      return NextResponse.json(
        { code: 400, message: "Usuario no tiene agencia asignada" },
        { status: 400 }
      );
    }

    const agenciaId = userData.agencia_id;

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;
    const template_name = searchParams.get("template_name") || undefined;
    const status = searchParams.get("status") || undefined;
    const date_from = searchParams.get("date_from") || undefined;
    const date_to = searchParams.get("date_to") || undefined;
    const include_stats = searchParams.get("include_stats") === "true";

    // Obtener correos enviados
    const emails = await getEmailsSentByAgency(agenciaId, {
      limit,
      offset,
      template_name,
      status,
      date_from,
      date_to,
    });

    // Obtener estadísticas si se solicita
    let stats = null;
    if (include_stats) {
      stats = await getEmailStatsByAgency(agenciaId);
    }

    return NextResponse.json({
      code: 200,
      message: "Correos enviados obtenidos exitosamente",
      data: {
        emails,
        stats,
        pagination: {
          limit,
          offset,
          total: emails.length, // En el futuro, obtener el total real
        },
      },
    });
  } catch (error) {
    logError("Error obteniendo correos enviados", {
      context: "correos-enviados-api",
      error,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
