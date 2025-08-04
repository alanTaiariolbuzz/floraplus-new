import { NextRequest, NextResponse } from "next/server";
import { logInfo } from "@/utils/error/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservaId, language = "es" } = body;

    if (!reservaId) {
      return NextResponse.json(
        {
          code: 400,
          message: "reservaId es requerido",
        },
        { status: 400 }
      );
    }

    logInfo("Simulando pago exitoso para reserva", { reservaId });

    // Simular el evento checkout.session.completed
    const mockEvent = {
      type: "checkout.session.completed",
      id: "evt_test_" + Date.now(),
      data: {
        object: {
          id: "cs_test_" + Date.now(),
          payment_status: "paid",
          status: "complete",
          metadata: {
            reservaId: reservaId.toString(),
            language: language,
          },
        },
      },
    };

    // Importar y ejecutar el handler directamente
    const { handleCheckoutSessionCompleted } = await import(
      "@/src/backend/events/handlers/stripe/checkoutSessionCompleted"
    );

    const result = await handleCheckoutSessionCompleted(mockEvent as any);

    logInfo("Resultado de la simulación", { result });

    return NextResponse.json({
      code: 200,
      message: "Pago simulado exitosamente",
      data: {
        result,
        reservaId,
        eventType: mockEvent.type,
      },
    });
  } catch (error) {
    logInfo("Error en simulación de pago", { error });
    return NextResponse.json(
      {
        code: 500,
        message: "Error en simulación",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
