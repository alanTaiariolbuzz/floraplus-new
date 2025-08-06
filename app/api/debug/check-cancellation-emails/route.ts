import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Buscar reservas que fueron canceladas recientemente (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentCancellations, error: fetchError } = await supabase
      .from("reservas")
      .select(
        `
        id, 
        estado, 
        cancelled_at, 
        codigo_reserva, 
        created_at, 
        updated_at,
        cliente:clientes (
          nombre,
          apellido,
          email
        ),
        agencia:agencias (
          nombre
        )
      `
      )
      .in("estado", ["cancelled", "cancelada"])
      .gte("cancelled_at", yesterday.toISOString())
      .order("cancelled_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        {
          success: false,
          error: "Error buscando cancelaciones recientes",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    // Buscar reservas con estado inconsistente
    const { data: inconsistentReservations, error: fetchError2 } =
      await supabase
        .from("reservas")
        .select(
          `
        id, 
        estado, 
        cancelled_at, 
        codigo_reserva, 
        created_at, 
        updated_at,
        cliente:clientes (
          nombre,
          apellido,
          email
        ),
        agencia:agencias (
          nombre
        )
      `
        )
        .eq("estado", "confirmada")
        .not("cancelled_at", "is", null)
        .order("cancelled_at", { ascending: false });

    if (fetchError2) {
      return NextResponse.json(
        {
          success: false,
          error: "Error buscando reservas inconsistentes",
          details: fetchError2.message,
        },
        { status: 500 }
      );
    }

    // Buscar en logs de correos enviados (si existe la tabla)
    let emailLogs = [];
    try {
      const { data: logs, error: logsError } = await supabase
        .from("correos_enviados")
        .select("*")
        .gte("created_at", yesterday.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      if (!logsError && logs) {
        emailLogs = logs;
      }
    } catch (error) {
      // La tabla puede no existir, no es crítico
      console.log("Tabla correos_enviados no encontrada o error:", error);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        cancelacionesRecientes: recentCancellations?.length || 0,
        reservasInconsistentes: inconsistentReservations?.length || 0,
        emailsEnviados: emailLogs.length,
      },
      recentCancellations: recentCancellations || [],
      inconsistentReservations: inconsistentReservations || [],
      emailLogs: emailLogs,
    });
  } catch (error) {
    console.error("Error verificando emails de cancelación:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
