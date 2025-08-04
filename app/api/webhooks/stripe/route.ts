import { NextRequest, NextResponse } from "next/server";
import { logError, logInfo } from "@/utils/error/logger";
import { verifyStripeWebhookSignature } from "@/utils/firma_stripe";
import { publicarEvento } from "@/app/api/publicar-evento";
import { eventHandlers } from "@/src/backend/events/index";
/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Webhook para recibir eventos de Stripe
 *     description: Endpoint para recibir y procesar eventos de Stripe como pagos, payouts, etc.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Evento recibido y procesado correctamente
 *       400:
 *         description: Error en la verificación del webhook
 */
export async function POST(request: NextRequest) {
  const headersList = request.headers;
  const sig = headersList.get("stripe-signature");

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    logError("STRIPE_WEBHOOK_SECRET no está definido", {
      context: "stripe-webhook",
    });
    return NextResponse.json(
      { error: "Webhook secret no configurado" },
      { status: 500 }
    );
  }

  try {
    // Obtener la firma del webhook de los headers
    const signature = await request.headers.get("stripe-signature");
    if (!signature) {
      logError("No se proporcionó la firma del webhook", {
        context: "stripe-webhook",
      });
      return NextResponse.json(
        { error: "Firma del webhook no proporcionada" },
        { status: 400 }
      );
    }

    // Obtener el cuerpo del request como ArrayBuffer para evitar problemas con los saltos de línea
    const arrayBuffer = await request.arrayBuffer();
    const rawBody = Buffer.from(arrayBuffer);

    // Verificar la firma del webhook con tolerancia personalizable (5 minutos por defecto)
    const event = verifyStripeWebhookSignature(
      rawBody,
      signature,
      endpointSecret,
      300 // 5 minutos de tolerancia
    );

    await publicarEvento("stripe", event.type, event, event.id);

    // Procesar el evento utilizando los handlers registrados
    const handlers = eventHandlers[event.type];
    if (handlers && handlers.length > 0) {
      for (const handler of handlers) {
        try {
          const result = await handler(event);
          if (
            result &&
            typeof result === "object" &&
            "success" in result &&
            !result.success
          ) {
            logError(`Handler falló para el evento ${event.type}`, {
              context: "stripe-webhook",
              error: result.error || "Error desconocido",
            });
          }
        } catch (handlerError) {
          logError(`Error en handler para el evento ${event.type}`, {
            context: "stripe-webhook",
            error: handlerError,
          });
        }
      }

      logInfo(`Handlers ejecutados para el evento ${event.type}`, {
        context: "stripe-webhook",
      });
      return NextResponse.json(
        { message: `Handlers ejecutados para el evento ${event.type}` },
        { status: 200 }
      );
    } else {
      logInfo(`No hay handlers registrados para el evento ${event.type}`, {
        context: "stripe-webhook",
      });
      return NextResponse.json(
        { message: `No hay handlers registrados para el evento ${event.type}` },
        { status: 200 }
      );
    }

    logInfo("Evento de Stripe almacenado", { tipo: event.type, id: event.id });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    const err = error as any;

    logError({
      message: err.message,
      stack: err.stack,
      name: err.name,
      raw: err,
      context: "stripe-webhook",
      // Add more context if needed
    });
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 400 }
    );
  }
}

// Configuración para no analizar el cuerpo de la solicitud como JSON
// Esto es necesario porque Stripe requiere el cuerpo raw para verificar la firma
export const config = {
  api: {
    bodyParser: false,
  },
};
