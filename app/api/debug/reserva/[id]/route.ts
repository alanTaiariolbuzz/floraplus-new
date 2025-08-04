import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logInfo } from "@/utils/error/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const reservaId = parseInt(id);

    if (!reservaId || isNaN(reservaId)) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de reserva inválido",
        },
        { status: 400 }
      );
    }

    logInfo("Debug: Buscando reserva", { reservaId });

    const supabase = await createClient();

    // Buscar la reserva
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error) {
      logInfo("Debug: Error buscando reserva", { reservaId, error });
      return NextResponse.json(
        {
          code: 404,
          message: "Reserva no encontrada",
          details: error.message,
          error: error,
        },
        { status: 404 }
      );
    }

    logInfo("Debug: Reserva encontrada", { reservaId, reserva });

    return NextResponse.json({
      code: 200,
      message: "Reserva encontrada",
      data: reserva,
    });
  } catch (error) {
    logInfo("Debug: Error inesperado", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
