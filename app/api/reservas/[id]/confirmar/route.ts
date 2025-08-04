import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { logError, logInfo } from "@/utils/error/logger";

// Configurar para que no requiera autenticación
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(
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

    logInfo("Confirmando reserva", { reservaId });

    const supabase = await createAdminClient();

    // Primero verificar si la reserva existe
    logInfo("Buscando reserva en base de datos", { reservaId });

    const { data: existingReservas, error: fetchError } = await supabase
      .from("reservas")
      .select("id, estado")
      .eq("id", reservaId);

    if (fetchError) {
      logError("Error buscando reserva", { reservaId, error: fetchError });
      return NextResponse.json(
        {
          code: 404,
          message: "Reserva no encontrada",
          details: fetchError.message,
        },
        { status: 404 }
      );
    }

    logInfo("Resultado de búsqueda", {
      reservaId,
      count: existingReservas?.length,
      data: existingReservas,
    });

    if (!existingReservas || existingReservas.length === 0) {
      return NextResponse.json(
        {
          code: 404,
          message: "Reserva no encontrada",
        },
        { status: 404 }
      );
    }

    if (existingReservas.length > 1) {
      logError("Múltiples reservas encontradas", {
        reservaId,
        count: existingReservas.length,
      });
      return NextResponse.json(
        {
          code: 500,
          message: "Error: Múltiples reservas encontradas",
        },
        { status: 500 }
      );
    }

    const existingReserva = existingReservas[0];

    // Verificar si ya está confirmada
    if (existingReserva.estado === "confirmed") {
      logInfo("Reserva ya confirmada", { reservaId });
      return NextResponse.json({
        code: 200,
        message: "Reserva ya confirmada",
        data: {
          id: existingReserva.id,
          estado: existingReserva.estado,
          numero_reserva: `RES-${existingReserva.id}`,
        },
      });
    }

    // Actualizar el estado de la reserva a confirmed (sin condición de estado)
    logInfo("Intentando actualizar reserva sin condición de estado", {
      reservaId,
      estadoActual: existingReserva.estado,
      tipoId: typeof reservaId,
      valorId: reservaId,
    });

    // Probar primero sin condición de estado
    const { data: updatedReservas, error: updateError } = await supabase
      .from("reservas")
      .update({
        estado: "confirmed",
      })
      .eq("id", reservaId)
      .select();

    if (updateError) {
      logError("Error actualizando reserva", {
        reservaId,
        error: updateError,
        errorCode: updateError.code,
        errorMessage: updateError.message,
        errorDetails: updateError.details,
      });
      return NextResponse.json(
        {
          code: 500,
          message: "Error al confirmar la reserva",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    logInfo("Resultado del update", {
      reservaId,
      updatedReservas,
      count: updatedReservas?.length,
      error: updateError,
    });

    if (!updatedReservas || updatedReservas.length === 0) {
      logError("No se pudo actualizar la reserva (0 filas afectadas)", {
        reservaId,
        existingReserva,
        updateError,
      });
      return NextResponse.json(
        {
          code: 500,
          message:
            "Error al confirmar la reserva: No se pudo actualizar (0 filas afectadas)",
        },
        { status: 500 }
      );
    }

    const reserva = updatedReservas[0];

    logInfo("Reserva confirmada exitosamente", {
      reservaId,
      estado: reserva.estado,
    });

    return NextResponse.json({
      code: 200,
      message: "Reserva confirmada exitosamente",
      data: {
        id: reserva.id,
        estado: reserva.estado,
        numero_reserva: `RES-${reserva.id}`,
      },
    });
  } catch (error) {
    logError("Error confirmando reserva", error);
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
