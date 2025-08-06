import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Buscar reservas con estado inconsistente
    const { data: inconsistentReservations, error: fetchError } = await supabase
      .from("reservas")
      .select(
        "id, estado, cancelled_at, codigo_reserva, created_at, updated_at"
      )
      .eq("estado", "confirmada")
      .not("cancelled_at", "is", null);

    if (fetchError) {
      return NextResponse.json(
        {
          success: false,
          error: "Error buscando reservas inconsistentes",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    // Buscar reservas canceladas sin cancelled_at
    const { data: cancelledWithoutDate, error: fetchError2 } = await supabase
      .from("reservas")
      .select(
        "id, estado, cancelled_at, codigo_reserva, created_at, updated_at"
      )
      .in("estado", ["cancelled", "cancelada"])
      .is("cancelled_at", null);

    if (fetchError2) {
      return NextResponse.json(
        {
          success: false,
          error: "Error buscando reservas canceladas sin fecha",
          details: fetchError2.message,
        },
        { status: 500 }
      );
    }

    // Obtener estadísticas generales
    const { data: stats, error: statsError } = await supabase
      .from("reservas")
      .select("estado, cancelled_at");

    if (statsError) {
      return NextResponse.json(
        {
          success: false,
          error: "Error obteniendo estadísticas",
          details: statsError.message,
        },
        { status: 500 }
      );
    }

    // Calcular estadísticas
    const totalReservas = stats?.length || 0;
    const reservasConfirmadas =
      stats?.filter((r) => r.estado === "confirmada").length || 0;
    const reservasCanceladas =
      stats?.filter((r) => r.estado === "cancelled" || r.estado === "cancelada")
        .length || 0;
    const reservasConCancelledAt =
      stats?.filter((r) => r.cancelled_at !== null).length || 0;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalReservas,
        reservasConfirmadas,
        reservasCanceladas,
        reservasConCancelledAt,
        inconsistencias: {
          confirmadasConCancelledAt: inconsistentReservations?.length || 0,
          canceladasSinCancelledAt: cancelledWithoutDate?.length || 0,
        },
      },
      inconsistentReservations: inconsistentReservations || [],
      cancelledWithoutDate: cancelledWithoutDate || [],
    });
  } catch (error) {
    console.error("Error verificando consistencia de reservas:", error);

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
