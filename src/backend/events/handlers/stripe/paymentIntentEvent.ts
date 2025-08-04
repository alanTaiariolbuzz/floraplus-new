import { logInfo } from "@/utils/error/logger";
import { createAdminClient } from "@/utils/supabase/admin";
import { EventHandlerResult } from "../../index";
import stripeClient from "@/utils/stripe/client";

/**
 * Actualiza el estado externo de un pago en la tabla pagos según el evento de Stripe recibido.
 * Este handler es genérico para cualquier evento de payment_intent.*
 *
 * NOTA: Como usamos stripe_session_id en la tabla pagos, necesitamos
 * buscar las sesiones de checkout que contengan este payment_intent.
 */
export async function handlePaymentIntentEvent(
  payload: any
): Promise<EventHandlerResult> {
  logInfo("Procesando evento payment_intent", {
    id: payload.id,
    status: payload.status,
  });
  const supabase = createAdminClient();

  try {
    // Obtener el cliente Stripe
    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      logInfo("Error obteniendo cliente Stripe", { error: stripeResult.error });
      return { success: false, message: "Error obteniendo cliente Stripe" };
    }
    const stripe = stripeResult.data;

    // Buscar sesiones de checkout que contengan este payment_intent
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: payload.id,
      limit: 1,
    });

    if (!sessions.data || sessions.data.length === 0) {
      logInfo("No se encontró sesión de checkout para payment_intent", {
        paymentIntentId: payload.id,
      });
      return { success: false, message: "No se encontró sesión de checkout" };
    }

    const session = sessions.data[0];

    // Actualizar el pago usando el stripe_session_id
    const { error } = await supabase
      .from("pagos")
      .update({
        external_status: payload.status,
        receipt_url: payload.charges?.data?.[0]?.receipt_url || null,
      })
      .eq("stripe_session_id", session.id);

    if (error) {
      logInfo("Error actualizando pagos con payment_intent", {
        paymentIntentId: payload.id,
        sessionId: session.id,
        error,
      });
      return { success: false, message: "Error actualizando pagos", error };
    }

    logInfo("Pago actualizado exitosamente", {
      paymentIntentId: payload.id,
      sessionId: session.id,
      status: payload.status,
    });

    return { success: true, message: "Pago actualizado" };
  } catch (error) {
    logInfo("Error en handlePaymentIntentEvent", {
      paymentIntentId: payload.id,
      error,
    });
    return { success: false, message: "Error procesando evento", error };
  }
}
