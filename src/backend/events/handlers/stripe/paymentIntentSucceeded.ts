import { logInfo, logWarn, logError } from "@/utils/error/logger";
import { handleReservaConfirmada } from "@/src/backend/events/handlers/reserva/reservaConfirmada";
import { EventHandlerResult } from "../../index";
import { sendEmail } from "@/utils/email/service";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import stripeClient from "@/utils/stripe/client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function handlePaymentIntentSucceeded(
  evt: Stripe.Event
): Promise<EventHandlerResult> {
  // Solo reaccionamos al evento correcto
  if (evt.type !== "payment_intent.succeeded") {
    return { success: false, message: "Tipo de evento inesperado" };
  }

  const paymentIntent = evt.data.object as Stripe.PaymentIntent;
  logInfo("payment_intent.succeeded", { paymentIntentId: paymentIntent.id });

  const paymentStatus = paymentIntent.status as Stripe.PaymentIntent.Status;

  //cambiar estado del pago en la db
  if (paymentStatus !== "succeeded") {
    logWarn("Pago no exitoso", {
      paymentIntentId: paymentIntent.id,
      status: paymentStatus,
    });
    return { success: true, message: "Pago no exitoso" };
  }
  logInfo("Pago exitoso", { paymentIntentId: paymentIntent.id });

  // Impactar la base de datos
  try {
    // Obtener el cliente Stripe
    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      logError("Error obteniendo cliente Stripe", {
        error: stripeResult.error,
      });
      return { success: false, message: "Error obteniendo cliente Stripe" };
    }
    const stripe = stripeResult.data;

    // Buscar sesiones de checkout que contengan este payment_intent
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1,
    });

    if (!sessions.data || sessions.data.length === 0) {
      logWarn("No se encontró sesión de checkout para payment_intent", {
        paymentIntentId: paymentIntent.id,
      });
      return {
        success: true,
        message: "Pago recibido pero no se encontró sesión de checkout",
      };
    }

    const session = sessions.data[0];

    // Aquí deberías actualizar el estado del pago en tu base de datos
    const supabase = await createClient();
    const { data, error, count } = await supabase
      .from("pagos")
      .update({ status: "succeeded" })
      .eq("stripe_session_id", session.id)
      .select("*");
    if (error) {
      logError("Error actualizando el pago", {
        error,
        paymentIntentId: paymentIntent.id,
        sessionId: session.id,
      });
      return { success: false, message: "Error actualizando el pago" };
    }

    if (!data || data.length === 0) {
      logWarn("No se encontró registro para actualizar", {
        paymentIntentId: paymentIntent.id,
        sessionId: session.id,
        data,
        count,
      });
      return {
        success: true,
        message: "Pago recibido pero no se encontró registro para actualizar",
      };
    }

    logInfo("Pago actualizado en la base de datos", {
      paymentIntentId: paymentIntent.id,
      sessionId: session.id,
      data,
      recordsUpdated: data.length,
    });
  } catch (error) {
    logError("Error al actualizar el pago en la base de datos", {
      error,
      paymentIntent,
    });
    return {
      success: true,
      message: "Error al actualizar el pago en la base de datos",
    };
  }

  return { success: true, message: "Pago recibido" };
}
