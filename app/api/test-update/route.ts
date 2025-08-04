import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logInfo, logError } from "@/utils/error/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservaId } = body;

    if (!reservaId) {
      return NextResponse.json(
        {
          code: 400,
          message: "reservaId es requerido",
        },
        { status: 400 }
      );
    }

    logInfo("Test: Intentando update simple", { reservaId });

    const supabase = await createClient();

    // 1. Primero verificar que la reserva existe
    const { data: reserva, error: fetchError } = await supabase
      .from("reservas")
      .select("id, estado")
      .eq("id", reservaId)
      .single();

    if (fetchError) {
      logError("Test: Error buscando reserva", {
        reservaId,
        error: fetchError,
      });
      return NextResponse.json(
        {
          code: 404,
          message: "Reserva no encontrada",
          details: fetchError.message,
        },
        { status: 404 }
      );
    }

    logInfo("Test: Reserva encontrada", { reservaId, estado: reserva.estado });

    // 2. Intentar un update simple
    const { data: updateResult, error: updateError } = await supabase
      .from("reservas")
      .update({
        estado: "test_update",
      })
      .eq("id", reservaId)
      .select();

    if (updateError) {
      logError("Test: Error en update", { reservaId, error: updateError });
      return NextResponse.json(
        {
          code: 500,
          message: "Error en update de prueba",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    logInfo("Test: Update exitoso", {
      reservaId,
      updateResult,
      count: updateResult?.length,
    });

    // 3. Revertir el cambio
    const { data: revertResult, error: revertError } = await supabase
      .from("reservas")
      .update({
        estado: reserva.estado, // Volver al estado original
      })
      .eq("id", reservaId)
      .select();

    if (revertError) {
      logError("Test: Error revertiendo cambio", {
        reservaId,
        error: revertError,
      });
    } else {
      logInfo("Test: Cambio revertido", { reservaId });
    }

    return NextResponse.json({
      code: 200,
      message: "Test de update exitoso",
      data: {
        reservaId,
        estadoOriginal: reserva.estado,
        updateResult,
        revertResult,
      },
    });
  } catch (error) {
    logError("Test: Error inesperado", error);
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
