import Stripe from "stripe";
import { logError, logInfo } from "../error/logger";
import { logWarning } from "../error/logWarning";
import stripeClient from "./client";
import { createClient } from "../supabase/server";
import { notifyTeam } from "../notifications/service";
import { sendEmail } from "../email/service";

// Exportar el último tipo de evento para facilitar el testing
export let lastVerifiedEventType: string | null = null;

/**
 * Verifica la firma del webhook de Stripe
 * @param payload El cuerpo del request en formato raw (buffer)
 * @param signature La firma del webhook proporcionada en los headers
 * @param endpointSecret El secreto del endpoint configurado en Stripe
 * @param tolerance Tiempo máximo en segundos para considerar válida la firma (por defecto 300s/5min)
 * @returns El evento de Stripe construido si la verificación es exitosa
 * @throws Error si la verificación falla
 */
export const verifyStripeWebhookSignature = (
  payload: Buffer,
  signature: string,
  endpointSecret: string,
  tolerance: number = 300 // 5 minutos por defecto
): Stripe.Event => {
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    throw new Error(
      `Error al obtener el cliente Stripe: ${stripeResult.error}`
    );
  }
  const stripe = stripeResult.data;

  try {
    // Usar el Buffer directamente y aceptar tolerancia configurable
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      endpointSecret,
      tolerance
    );

    // Almacenar y exponer el tipo de evento para facilitar testing
    lastVerifiedEventType = event.type;

    logInfo("Webhook verificado correctamente", {
      eventType: event.type,
      eventId: event.id,
    });

    if (!event) {
      logWarning("No se recibió evento en el webhook de Stripe", {
        context: "stripe-webhook",
      });
    }

    return event;
  } catch (err: any) {
    logError(err, {
      context: "verifyStripeWebhookSignature",
      message: `Error verificando webhook: ${err.message}`,
    });
    throw new Error(`Webhook Error: ${err.message}`);
  }
};

/**
 * Manejador para el evento payout.failed
 * @param payout Objeto de payout fallido
 * @param connectedAccountId ID de la cuenta conectada (si aplica)
 */
export const handleFailedPayout = async (
  payout: Stripe.Payout,
  connectedAccountId?: string
): Promise<void> => {
  // Registrar información del payout fallido
  logError(new Error(`Payout fallido: ${payout.failure_message}`), {
    context: "handleFailedPayout",
    payoutId: payout.id,
    amount: payout.amount,
    currency: payout.currency,
    status: payout.status,
    failure_code: payout.failure_code,
    failure_message: payout.failure_message,
    connectedAccountId: connectedAccountId || "cuenta principal",
  });

  try {
    // 1. Marcar el payout como fallido en la base de datos
    const supabase = await createClient();
    if (connectedAccountId) {
      // Buscar la agencia asociada con esta cuenta
      const { data: agency } = await supabase
        .from("agencias")
        .select("id, nombre, email_contacto")
        .eq("stripe_account_id", connectedAccountId)
        .single();

      if (agency) {
        // Registrar el payout fallido
        await supabase.from("stripe_payouts").insert([
          {
            payout_id: payout.id,
            agencia_id: agency.id,
            amount: payout.amount,
            currency: payout.currency,
            status: "failed",
            failure_code: payout.failure_code,
            failure_message: payout.failure_message,
            stripe_account_id: connectedAccountId,
            created_at: new Date().toISOString(),
          },
        ]);

        // 2. Enviar notificación por email a los operadores y a la agencia
        await sendEmail({
          to: agency.email_contacto,
          subject: "Alerta: Problema con pago a tu cuenta bancaria",
          template: "failed-payout",
          data: {
            agencyName: agency.nombre,
            amount: payout.amount / 100, // Convertir centavos a unidades
            currency: payout.currency.toUpperCase(),
            failureMessage: payout.failure_message,
            failureCode: payout.failure_code,
            payoutId: payout.id,
          },
        });

        // Notificar también al equipo interno de soporte
        await sendEmail({
          to: process.env.SUPPORT_EMAIL || "manuel@labba.studio",
          subject: `Payout fallido - Agencia: ${agency.nombre}`,
          template: "internal-payout-alert",
          data: {
            agencyId: agency.id,
            agencyName: agency.nombre,
            payoutDetails: payout,
          },
        });

        // 3. Marcar la agencia para revisión si es necesario
        if (
          payout.failure_code === "bank_account_restricted" ||
          payout.failure_code === "account_closed" ||
          payout.failure_code === "bank_account_unusable"
        ) {
          await supabase
            .from("agencias")
            .update({
              requiere_revision: true,
              estado_pago: "problema_banco",
              updated_at: new Date().toISOString(),
            })
            .eq("id", agency.id);

          // Notificar al equipo interno
          await notifyTeam("agencia_problema_banco", {
            agencyId: agency.id,
            agencyName: agency.nombre,
            payoutIssue: payout.failure_code,
            payoutId: payout.id,
            amount: payout.amount,
            currency: payout.currency,
          });
        }
      }
    } else {
      // Payout fallido en la cuenta principal
      await supabase.from("system_alerts").insert([
        {
          type: "payout_failed",
          severity: "high",
          details: {
            payoutId: payout.id,
            amount: payout.amount,
            currency: payout.currency,
            failure_code: payout.failure_code,
            failure_message: payout.failure_message,
          },
          resolved: false,
          created_at: new Date().toISOString(),
        },
      ]);

      // Notificar al equipo financiero
      await notifyTeam("finance_team", {
        alert: "payout_failed",
        payoutId: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        failureCode: payout.failure_code,
        failureMessage: payout.failure_message,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logError(error, {
      context: "handleFailedPayout_procesamiento",
      payoutId: payout.id,
      connectedAccountId,
    });
  }
};
