import Stripe from "stripe";
import { logInfo, logWarn, logError } from "@/utils/error/logger";
import { handleReservaConfirmada } from "@/src/backend/events/handlers/reserva/reservaConfirmada";
import { EventHandlerResult } from "../../index";
import { sendEmail } from "@/utils/email/service";
import { createAdminClient } from "@/utils/supabase/admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function handleCheckoutSessionCompleted(
  evt: Stripe.Event
): Promise<EventHandlerResult> {
  // Solo reaccionamos al evento correcto
  if (evt.type !== "checkout.session.completed") {
    return { success: false, message: "Tipo de evento inesperado" };
  }

  const session = evt.data.object as Stripe.Checkout.Session;
  logInfo("checkout.session.completed", { sessionId: session.id });

  const paymentStatus =
    session.payment_status as Stripe.Checkout.Session.PaymentStatus;
  const { agenciaId, reservaId, language } = (session.metadata ?? {}) as {
    agenciaId?: string;
    reservaId?: string;
    language?: string;
  };

  // ----- Pago no completado -----
  if (paymentStatus !== "paid") {
    logWarn("Pago no completado", {
      sessionId: session.id,
      reservaId,
      paymentStatus,
    });

    // Envío el correo de forma asíncrona para no bloquear el webhook
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `Pago no completado para reserva ${reservaId}`,
      template: undefined, // TODO: asignar template real
      data: {
        sessionId: session.id,
        reservaId,
        paymentStatus,
        agenciaId,
      },
    }).catch(() => {});

    return { success: false, message: "Pago no completado" };
  }

  // ----- Pago completado pero sin reserva -----
  if (!reservaId) {
    return { success: false, message: "Sin reserva_id en metadata" };
  }

  // ----- Crear registro de pago en la base de datos -----
  try {
    const supabase = createAdminClient();

    // Extraer datos del payment intent si está disponible
    const paymentIntent = session.payment_intent as string;
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;

    // Calcular montos
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const currency = session.currency || "usd";

    // Extraer fees de metadata si están disponibles
    const feeFloraPlusCents = parseInt(
      session.metadata?.feeFloraPlusCents || "0"
    );
    const finalFee = feeFloraPlusCents / 100;
    const finalTax = 0; // Por defecto, se puede calcular si es necesario

    logInfo("Creando registro de pago", {
      sessionId: session.id,
      reservaId,
      amount,
      currency,
      customerEmail,
      customerName,
      finalFee,
      finalTax,
    });

    const { data: pago, error: pagoError } = await supabase
      .from("pagos")
      .insert({
        reserva_id: parseInt(reservaId),
        agencia_id: agenciaId ? parseInt(agenciaId) : null,
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntent,
        customer_email: customerEmail,
        customer_name: customerName,
        status: "succeeded",
        external_status: session.payment_status,
        amount: amount,
        currency: currency,
        receipt_url: null, // Will be updated by payment intent event handler
        final_fee: finalFee,
        final_tax: finalTax,
        fee_flora_plus: finalFee,
      })
      .select()
      .single();

    if (pagoError) {
      logError("Error creando registro de pago", {
        sessionId: session.id,
        reservaId,
        error: pagoError,
      });
      // No fallamos aquí, continuamos con la confirmación de la reserva
    } else {
      logInfo("Registro de pago creado exitosamente", {
        sessionId: session.id,
        reservaId,
        pagoId: pago.id,
      });
    }
  } catch (error) {
    logError("Error en el proceso de crear pago", {
      sessionId: session.id,
      reservaId,
      error,
    });
    // No fallamos aquí, continuamos con la confirmación de la reserva
  }

  // ----- Confirmación de reserva -----
  await handleReservaConfirmada(reservaId, language);
  return { success: true, message: "Reserva confirmada" };
}
