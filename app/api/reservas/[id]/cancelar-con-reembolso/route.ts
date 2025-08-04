import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logInfo, logError } from "@/utils/error/logger";
import { sendEmail, getCorreoConfig } from "@/utils/email/service";
import { getRefundDataForEmail } from "@/src/backend/services/email/Service";
import {
  createRefundWithFallback,
  getPaymentIntent,
  getConnectedAccountBalance,
  calculateNetRefundAmount,
} from "@/utils/stripe/refunds";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservaId = parseInt(id, 10);

    if (isNaN(reservaId)) {
      return NextResponse.json(
        { code: 400, message: "ID de reserva inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { refundAmount, reason } = body;

    // 1. Verificar autenticación y obtener usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { code: 401, message: "No autorizado" },
        { status: 401 }
      );
    }

    // 2. Obtener datos del usuario y su agencia
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("agencia_id, rol_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.agencia_id) {
      return NextResponse.json(
        { code: 400, message: "Usuario no tiene agencia asignada" },
        { status: 400 }
      );
    }

    // Verificar que el usuario tiene permisos para crear reembolsos
    // AGENCY_ADMIN (rol_id: 2) y AGENCY_USER (rol_id: 3) pueden crear reembolsos
    if (userData.rol_id !== 2 && userData.rol_id !== 3) {
      return NextResponse.json(
        { code: 403, message: "No tienes permisos para crear reembolsos" },
        { status: 403 }
      );
    }

    // 3. Verificar que la reserva existe y pertenece a la agencia
    const { data: reserva, error: reservaError } = await supabase
      .from("reservas_detalle")
      .select(
        `
        *,
        codigo_reserva,
        turno:turnos (
          agencia_id
        ),
        cliente:clientes (
          nombre,
          apellido,
          email
        )
      `
      )
      .eq("id", reservaId)
      .single();

    if (reservaError || !reserva) {
      return NextResponse.json(
        { code: 404, message: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la reserva pertenece a la agencia del usuario
    if (reserva.turno?.agencia_id !== userData.agencia_id) {
      return NextResponse.json(
        { code: 403, message: "No tienes permisos para cancelar esta reserva" },
        { status: 403 }
      );
    }

    // 4. Verificar que la reserva no esté cancelada
    if (reserva.estado === "cancelled") {
      return NextResponse.json(
        { code: 400, message: "La reserva ya está cancelada" },
        { status: 400 }
      );
    }

    // 5. Buscar pago válido para esta reserva
    let pago = null;

    // Primero intentar con estados válidos
    const { data: pagoValido } = await supabase
      .from("pagos")
      .select("*")
      .eq("reserva_id", reservaId)
      .in("external_status", ["paid", "succeeded", "complete"])
      .single();

    if (pagoValido) {
      pago = pagoValido;
    } else {
      // Si no hay pago válido, buscar cualquier pago y verificar con Stripe
      const { data: todosLosPagos } = await supabase
        .from("pagos")
        .select("id, status, external_status, amount, stripe_session_id")
        .eq("reserva_id", reservaId)
        .order("created_at", { ascending: false });

      if (todosLosPagos && todosLosPagos.length > 0) {
        // Verificar cada pago con Stripe
        for (const pagoInfo of todosLosPagos) {
          if (pagoInfo.stripe_session_id) {
            try {
              const { getStripeOrThrow } = await import(
                "@/utils/stripe/helpers"
              );
              const stripe = getStripeOrThrow();

              const session = await stripe.checkout.sessions.retrieve(
                pagoInfo.stripe_session_id
              );

              // Si la sesión está completa y pagada, usar este pago
              if (
                session.status === "complete" &&
                session.payment_status === "paid" &&
                session.payment_intent
              ) {
                // Actualizar el estado del pago en la BD
                await supabase
                  .from("pagos")
                  .update({
                    external_status: "paid",
                    status: "confirmed",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", pagoInfo.id);

                // Obtener el pago actualizado
                const { data: pagoActualizado } = await supabase
                  .from("pagos")
                  .select("*")
                  .eq("id", pagoInfo.id)
                  .single();

                if (pagoActualizado) {
                  pago = pagoActualizado;
                  break;
                }
              }
            } catch (stripeError) {
              // Continuar con el siguiente pago
            }
          }
        }
      }
    }

    if (!pago) {
      return NextResponse.json(
        {
          code: 400,
          message: "No se encontró un pago válido para esta reserva",
        },
        { status: 400 }
      );
    }

    if (!pago.stripe_session_id) {
      return NextResponse.json(
        {
          code: 400,
          message:
            "No se encontró una sesión de Stripe válida para esta reserva",
        },
        { status: 400 }
      );
    }

    // 6. Obtener información de la agencia
    const { data: agencia, error: agenciaError } = await supabase
      .from("agencias")
      .select("stripe_account_id, fee")
      .eq("id", userData.agencia_id)
      .single();

    if (agenciaError || !agencia?.stripe_account_id) {
      return NextResponse.json(
        { code: 400, message: "Agencia no tiene cuenta Stripe configurada" },
        { status: 400 }
      );
    }

    // 7. Obtener el PaymentIntent desde la sesión de Stripe
    const { getStripeOrThrow } = await import("@/utils/stripe/helpers");
    const stripe = getStripeOrThrow();

    const session = await stripe.checkout.sessions.retrieve(
      pago.stripe_session_id
    );

    if (!session.payment_intent) {
      return NextResponse.json(
        {
          code: 400,
          message: "No se encontró PaymentIntent para esta reserva",
        },
        { status: 400 }
      );
    }

    const paymentIntent = await getPaymentIntent(
      session.payment_intent as string
    );

    // 8. Verificar que el PaymentIntent está en estado válido para reembolso
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        {
          code: 400,
          message: "El pago no está en estado válido para reembolso",
        },
        { status: 400 }
      );
    }

    // 9. Consultar el saldo del operador en Stripe
    const operadorBalance = await getConnectedAccountBalance(
      agencia.stripe_account_id
    );

    // 10. Calcular el monto neto a reembolsar
    const totalAmount = pago.amount;
    const floraFeePercentage = agencia.fee || 0;
    const stripeFeeAmount = 0;

    const netRefundAmount = refundAmount
      ? Math.min(refundAmount, totalAmount)
      : calculateNetRefundAmount(
          totalAmount,
          floraFeePercentage,
          stripeFeeAmount
        );

    // 11. Verificar que el operador tiene saldo suficiente
    if (operadorBalance < netRefundAmount) {
      return NextResponse.json(
        {
          code: 400,
          message: "Saldo insuficiente para realizar el reembolso",
          data: {
            operadorBalance,
            netRefundAmount,
            requiredBalance: netRefundAmount,
          },
        },
        { status: 400 }
      );
    }

    // 12. Crear el reembolso en Stripe con fallback automático
    const refundResult = await createRefundWithFallback(
      session.payment_intent as string,
      refundAmount || null,
      true,
      agencia.stripe_account_id
    );

    const { refund, usedFallback, fallbackReason } = refundResult;

    // 13. Actualizar la reserva como cancelada
    const { error: updateReservaError } = await supabase
      .from("reservas")
      .update({
        estado: "cancelled",
        updated_at: new Date().toISOString(),
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", reservaId);

    if (updateReservaError) {
      logError(updateReservaError, {
        context: "cancelar-con-reembolso",
        reservaId,
        message: "Error al actualizar estado de reserva",
      });
    }

    // 14. Crear registro en tabla refunds
    const { error: insertRefundError } = await supabase.from("refunds").insert({
      reserva_id: reservaId,
      stripe_refund_id: refund.id,
      amount: refund.amount,
      status: "completed",
      processed_by: user.id,
    });

    if (insertRefundError) {
      logError(insertRefundError, {
        context: "cancelar-con-reembolso",
        reservaId,
        refundId: refund.id,
        message: "Error al guardar registro de reembolso",
      });
    }

    // 15. Enviar notificación al cliente
    if (reserva.cliente?.email) {
      try {
        // Determinar si es reembolso completo o parcial
        const esReembolsoCompleto = !refundAmount;
        const tipoReembolso = esReembolsoCompleto ? "Completo" : "Parcial";

        // Obtener datos para el email usando el servicio
        const refundData = await getRefundDataForEmail(
          reservaId.toString(),
          refund.amount,
          reason,
          tipoReembolso
        );

        // Obtener configuración de correos de la agencia
        let correoConfig: {
          emailFrom?: string;
          emailReplyTo?: string;
          logoUrl?: string;
        } = {};

        try {
          const { data: correoData } = await supabase
            .from("correos")
            .select("email_from, email_reply_to, logo_url, logo_filename")
            .eq("agencia_id", userData.agencia_id)
            .single();

          if (correoData) {
            correoConfig = {
              logoUrl: correoData.logo_url,
              emailFrom: correoData.email_from,
              emailReplyTo: correoData.email_reply_to,
            };
          }
        } catch (correoError) {
          logError(correoError, {
            context: "cancelar-con-reembolso",
            reservaId,
            agenciaId: userData.agencia_id,
            message: "Error al obtener configuración de correos para email",
          });
        }

        await sendEmail({
          to: reserva.cliente.email,
          subject: `${tipoReembolso === "Completo" ? "Reembolso Completo" : "Reembolso Parcial"} procesado - Reserva ${reserva.codigo_reserva}`,
          template: "refund-processed",
          replyTo: correoConfig.emailReplyTo,
          fromName: correoConfig.emailFrom || refundData.nombreComercial,
          agencia_id: userData.agencia_id,
          reserva_id: reservaId,
          template_name: "refund-processed",
          data: {
            ...refundData,
            usedFallback,
            fallbackReason,
            ...correoConfig,
          },
        });

        logInfo("Email de reembolso enviado exitosamente", {
          reservaId,
          email: reserva.cliente.email,
          tipoReembolso,
          montoReembolsado: refund.amount,
          usedFallback,
        });
      } catch (emailError) {
        logError(emailError, {
          context: "cancelar-con-reembolso",
          reservaId,
          message: "Error al enviar email de notificación",
        });
      }
    }

    logInfo("Reembolso procesado exitosamente", {
      reservaId,
      refundId: refund.id,
      amount: refund.amount,
      usedFallback,
      fallbackReason,
      authorizedBy: user.id,
      agenciaId: userData.agencia_id,
    });

    return NextResponse.json({
      code: 200,
      message: usedFallback
        ? "Reembolso procesado exitosamente (sin reversión de transferencia)"
        : "Reembolso procesado exitosamente",
      data: {
        refundId: refund.id,
        amount: refund.amount,
        refundType: refundAmount ? "partial" : "full",
        reservaEstado: "cancelled",
        usedFallback,
        fallbackReason,
      },
    });
  } catch (error) {
    logError(error, {
      context: "cancelar-con-reembolso",
      message: "Error al procesar reembolso",
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
