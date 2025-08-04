import stripeClient from "./client";
import { logError, logInfo } from "../error/logger";
import { StripeError } from "../domain/errors/StripeError";
import Stripe from "stripe";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/* -------------------------------------------------------------
 * Helper – garantiza que siempre devolvemos un objeto Stripe
 * -----------------------------------------------------------*/
function getStripeOrThrow(): Stripe {
  const res = stripeClient();
  if (!res.success)
    throw new Error(res.error || "Stripe client not initialized");
  return res.data;
}

/* -------------------------------------------------------------
 * 1. Crear Checkout Session  (Destination Charge)
 *    • El cliente paga:           amount + fee + tax  (ej. 105 USD)
 *    • application_fee_amount:   fee               +   tarifa Stripe
 *    • Resultado neto            operador = total – (fee + tarifa)
 * -----------------------------------------------------------*/
export async function createEmbeddedCheckoutSession(params: {
  agenciaId: number;
  reservaId: number;
  codigo_reserva: string;
  amount: number; // precio base de la reserva (ej. 200)
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  stripeAccountId: string; // cuenta conectada, obligatorio
  final_fee: number; // fee Flora Plus (monto absoluto, ej. 5)
  final_tax?: number; // impuestos que cobra la agencia
  fee_flora_plus?: number; // fee porcentual de Flora Plus
  language?: string;
}) {
  const stripe = getStripeOrThrow();

  /* --- cálculos en centavos ------------------------------------ */
  const amountCents = Math.round(params.amount * 100); // precio base (ej. 20000)
  const feeCents = Math.round(params.final_fee * 100); // fee fijo Flora Plus (ej. 500)
  const taxCents = Math.round((params.final_tax || 0) * 100); // impuestos agencia

  // Cliente paga el TOTAL (amount + fee + tax)
  const totalAmountCents = amountCents + feeCents + taxCents; // 22248 (200 + 16 + 6.48)

  // Fee Flora Plus sobre el TOTAL que paga el cliente
  const feeFloraPlusCents = Math.round(
    (totalAmountCents * (params.fee_flora_plus || 0)) / 100
  );

  // Tarifa Stripe sobre el TOTAL cobrado (2,9 % + 30 ¢)
  const stripeFeeCents = Math.round(totalAmountCents * 0.029) + 30;

  // Flora Plus cobra: fee + tarifa Stripe completa
  const floraPlusTotalCents = feeFloraPlusCents + stripeFeeCents;

  // Application fee = fee Flora Plus + tarifa Stripe completa
  const applicationFeeCents = floraPlusTotalCents;
  /* ------------------------------------------------------------- */

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "custom",
    payment_method_types: ["card"],
    return_url: "https://dummy-confirmation-url.com",

    line_items: [
      {
        price_data: {
          currency: params.currency || "usd",
          product_data: {
            name: "Reserva",
            description: `Código de reserva: #${params?.codigo_reserva}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: params.currency || "usd",
          product_data: { name: "Fees y Taxes" },
          unit_amount: feeCents + taxCents, // fee + tax que paga el cliente
        },
        quantity: 1,
      },
    ],

    customer_email: params.customerEmail,

    metadata: {
      agenciaId: params.agenciaId.toString(),
      reservaId: params.reservaId.toString(),
      stripeAccountId: params.stripeAccountId,
      feeFloraPlusCents: feeFloraPlusCents.toString(),
      stripeFeeCents: stripeFeeCents.toString(),
      applicationFeeCents: applicationFeeCents.toString(),
      floraPlusStripeFeeCents: stripeFeeCents.toString(), // Flora Plus paga toda la tarifa Stripe
      language: params.language || "es",
    },

    payment_intent_data: {
      application_fee_amount: applicationFeeCents, // fee Flora Plus + tarifa Stripe completa
      transfer_data: { destination: params.stripeAccountId },
    },
  });

  logInfo("Checkout Session created", {
    sessionId: session.id,
    totalCharged: totalAmountCents / 100,
    applicationFee: applicationFeeCents / 100,
    feeFloraPlus: feeFloraPlusCents / 100,
    stripeFee: stripeFeeCents / 100,
    connectedAccountReceives: (totalAmountCents - applicationFeeCents) / 100,
    floraPlusNeto: feeFloraPlusCents / 100, // Flora Plus neto (sin tarifa Stripe)
    floraPlusStripeFee: stripeFeeCents / 100, // Tarifa Stripe que paga Flora Plus
  });

  if (!session.client_secret)
    throw new Error("Missing client_secret from Checkout");

  // Guardar pago en la base de datos
  try {
    const { savePago } = await import("./checkout.db");
    await savePago({
      reservaId: params.reservaId,
      agenciaId: params.agenciaId,
      customerId: null, // No tenemos customerId en este flujo
      status: "open",
      amount: totalAmountCents / 100, // Guardar en dólares
      currency: params.currency || "usd",
      receiptUrl: session.url || null,
      externalStatus: session.payment_status,
      stripeSessionId: session.id,
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : null,
      customerEmail: session.customer_email || params.customerEmail || null,
      customerName: params.customerName || null,
      paymentMethod: session.payment_method_types?.[0] || null,
      netAmount: amountCents / 100, // Guardar en dólares
      clientReferenceId: session.client_reference_id || null,
      final_tax: params.final_tax || 0,
      final_fee: params.final_fee || 0,
      fee_flora_plus: params.fee_flora_plus || 0,
    });

    logInfo("Pago guardado en base de datos", {
      sessionId: session.id,
      reservaId: params.reservaId,
      amount: totalAmountCents / 100,
    });
  } catch (error) {
    logError(error, {
      context: "stripe:createEmbeddedCheckoutSession",
      message: "Error guardando pago en base de datos",
      sessionId: session.id,
      reservaId: params.reservaId,
    });
    // No lanzamos error aquí para no interrumpir el flujo de checkout
  }

  return { sessionId: session.id, clientSecret: session.client_secret };
}

/* -------------------------------------------------------------
 * 2. Obtener estado del checkout
 * -----------------------------------------------------------*/
export async function getCheckoutStatus(sessionId: string) {
  const stripe = getStripeOrThrow();
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    logError(e, { context: "stripe:getCheckoutStatus", sessionId });
    throw new StripeError(
      "Error retrieving checkout session status",
      e as Error,
      { sessionId }
    );
  }
}

/* ----------------------------------------------------------------
 * 3. Stub para compatibilidad: Destination Charge ya liquida solo
 * ----------------------------------------------------------------*/
export async function processAutomaticPayout() {
  return {
    status: "no_op",
    note: "Destination Charge: payout automático",
  } as const;
}
