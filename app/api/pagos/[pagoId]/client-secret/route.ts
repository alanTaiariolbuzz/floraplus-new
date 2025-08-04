import { NextRequest, NextResponse } from "next/server";
import { logError, logInfo } from "@/utils/error/logger";
import { createClient } from "@/utils/supabase/server";
import stripeClient from "@/utils/stripe/client";

/**
 * @swagger
 * /api/pagos/{pagoId}/client-secret:
 *   get:
 *     summary: Recupera el client_secret de Stripe para un pago
 *     description: Permite al frontend recuperar un nuevo client_secret desde Stripe cuando lo ha perdido, sin exponer la clave secreta de API
 *     parameters:
 *       - in: path
 *         name: pagoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: client_secret devuelto correctamente
 *       400:
 *         description: Pago cerrado o en estado no válido
 *       404:
 *         description: Pago no encontrado
 *       500:
 *         description: Error interno
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pagoId: string }> }
) {
  const { pagoId } = await params;

  // 1. Stripe
  const stripeResult = stripeClient();
  if (!stripeResult.success) {
    return NextResponse.json(
      { code: "stripe_connection_error", message: stripeResult.error },
      { status: 500 }
    );
  }
  const stripe = stripeResult.data;

  // 2. Supabase
  const supabase = await createClient();

  // 3. Pago + permisos
  const { data: pago, error } = await supabase
    .from("pagos")
    .select("stripe_session_id, external_status")
    .eq("id", pagoId)
    .single();

  if (error || !pago) {
    logError(error ?? new Error("Pago no encontrado"), {
      context: "pagos:client-secret",
      pagoId,
    });
    return NextResponse.json(
      { code: "payment_not_found", message: "Pago no encontrado" },
      { status: 404 }
    );
  }

  if (!pago.stripe_session_id) {
    return NextResponse.json(
      {
        code: "no_session",
        message: "No se encontró sesión de Stripe para este pago",
      },
      { status: 400 }
    );
  }

  // 4. Estado válido
  const estadosPermitidos = [
    "requires_payment_method",
    "processing",
    "requires_confirmation",
  ];
  if (!estadosPermitidos.includes(pago.external_status)) {
    return NextResponse.json(
      { code: "payment_closed", message: "El pago ya está cerrado" },
      { status: 400 }
    );
  }

  try {
    // 5. Obtener la sesión de checkout
    const session = await stripe.checkout.sessions.retrieve(
      pago.stripe_session_id
    );

    if (!session.payment_intent) {
      return NextResponse.json(
        {
          code: "no_payment_intent",
          message: "No se encontró PaymentIntent en la sesión",
        },
        { status: 400 }
      );
    }

    // 6. Obtener el PaymentIntent
    const intent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );

    logInfo("Client secret recuperado", {
      pagoId,
      sessionId: pago.stripe_session_id,
      paymentIntentId: session.payment_intent,
    });

    // 7. Response
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err: any) {
    logError(err, {
      context: "pagos:client-secret",
      pagoId,
      message: err.message,
    });
    return NextResponse.json(
      { code: "stripe_retrieve_error", message: err.message },
      { status: 500 }
    );
  }
}
