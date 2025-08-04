import Stripe from "stripe";
import stripeClient from "./client";
import { logError, logInfo } from "../error/logger";

/**
 * UTILIDADES PARA REEMBOLSOS CON STRIPE CONNECT
 *
 * Este módulo maneja reembolsos en un entorno de Stripe Connect donde los operadores
 * reciben pagos a través de transfer_data.destination.
 *
 * MEJORES PRÁCTICAS:
 *
 * 1. VERIFICACIÓN PREVIA DE SALDO:
 *    - Siempre verificar el saldo disponible antes de intentar un reembolso con reverse_transfer
 *    - Usar getConnectedAccountBalance() para consultar el saldo
 *    - Usar canProcessRefund() para verificar si se puede procesar el reembolso
 *
 * 2. MANEJO DE FONDOS INSUFICIENTES:
 *    - Stripe rechazará automáticamente reembolsos con reverse_transfer si no hay saldo suficiente
 *    - Usar createRefundWithFallback() para manejar automáticamente estos casos
 *    - El fallback crea un reembolso sin reverse_transfer (el dinero sale de la cuenta principal)
 *
 * 3. CÓDIGOS DE ERROR COMUNES:
 *    - insufficient_funds: Saldo insuficiente en cuenta conectada
 *    - account_invalid: Cuenta conectada no configurada correctamente
 *    - transfer_reversal_failed: Fallo en la reversión de transferencia
 *
 * 4. FLUJO RECOMENDADO:
 *    a) Verificar saldo con canProcessRefund()
 *    b) Si hay saldo suficiente: usar createRefund() con reverse_transfer
 *    c) Si no hay saldo: usar createRefundWithFallback() para manejo automático
 *    d) Registrar el resultado y notificar al operador si se usó fallback
 *
 * 5. CONSIDERACIONES IMPORTANTES:
 *    - Los reembolsos sin reverse_transfer afectan el saldo de la cuenta principal
 *    - Es responsabilidad del operador mantener fondos suficientes
 *    - Considerar implementar alertas cuando el saldo sea bajo
 *    - Documentar claramente cuando se usa fallback para auditoría
 */

/**
 * Obtiene el saldo disponible de una cuenta conectada de Stripe
 * @param stripeAccountId - ID de la cuenta conectada de Stripe
 * @returns Promise con el saldo disponible (available + pending)
 */
export async function getConnectedAccountBalance(
  stripeAccountId: string
): Promise<number> {
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    throw new Error(
      `Error al obtener el cliente Stripe: ${stripeResult.error}`
    );
  }

  const stripe = stripeResult.data;

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    });

    // Calcular saldo total disponible (available + pending)
    const availableBalance = balance.available.reduce((total, balanceItem) => {
      return total + balanceItem.amount;
    }, 0);

    const pendingBalance = balance.pending.reduce((total, balanceItem) => {
      return total + balanceItem.amount;
    }, 0);

    const totalBalance = availableBalance + pendingBalance;

    logInfo("Saldo de cuenta conectada obtenido", {
      stripeAccountId,
      availableBalance,
      pendingBalance,
      totalBalance,
    });

    return totalBalance;
  } catch (error) {
    logError(error, {
      context: "getConnectedAccountBalance",
      stripeAccountId,
      message: "Error al obtener saldo de cuenta conectada",
    });
    throw new Error(
      `Error al obtener saldo de cuenta conectada: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Verifica si se puede realizar un reembolso basado en el saldo disponible
 * @param stripeAccountId - ID de la cuenta conectada de Stripe
 * @param refundAmount - Monto a reembolsar en centavos
 * @param paymentIntentId - ID del PaymentIntent (opcional, para logging)
 * @returns Promise con el resultado de la verificación
 */
export async function canProcessRefund(
  stripeAccountId: string,
  refundAmount: number,
  paymentIntentId?: string
): Promise<{
  canProcess: boolean;
  availableBalance: number;
  requiredAmount: number;
  deficit?: number;
  error?: string;
}> {
  try {
    const availableBalance = await getConnectedAccountBalance(stripeAccountId);
    const canProcess = availableBalance >= refundAmount;
    const deficit = canProcess ? 0 : refundAmount - availableBalance;

    logInfo("Verificación de capacidad de reembolso", {
      stripeAccountId,
      paymentIntentId,
      availableBalance,
      refundAmount,
      canProcess,
      deficit: canProcess ? 0 : deficit,
    });

    return {
      canProcess,
      availableBalance,
      requiredAmount: refundAmount,
      deficit: canProcess ? undefined : deficit,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logError(error, {
      context: "canProcessRefund",
      stripeAccountId,
      paymentIntentId,
      refundAmount,
      message: "Error al verificar capacidad de reembolso",
    });

    return {
      canProcess: false,
      availableBalance: 0,
      requiredAmount: refundAmount,
      error: errorMessage,
    };
  }
}

/**
 * Obtiene información detallada del saldo de una cuenta conectada
 * @param stripeAccountId - ID de la cuenta conectada de Stripe
 * @returns Promise con información detallada del saldo
 */
export async function getDetailedBalance(stripeAccountId: string): Promise<{
  available: Array<{ currency: string; amount: number }>;
  pending: Array<{ currency: string; amount: number }>;
  totalAvailable: number;
  totalPending: number;
  totalBalance: number;
}> {
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    throw new Error(
      `Error al obtener el cliente Stripe: ${stripeResult.error}`
    );
  }

  const stripe = stripeResult.data;

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    });

    const available = balance.available.map((item) => ({
      currency: item.currency,
      amount: item.amount,
    }));

    const pending = balance.pending.map((item) => ({
      currency: item.currency,
      amount: item.amount,
    }));

    const totalAvailable = available.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalPending = pending.reduce((sum, item) => sum + item.amount, 0);
    const totalBalance = totalAvailable + totalPending;

    return {
      available,
      pending,
      totalAvailable,
      totalPending,
      totalBalance,
    };
  } catch (error) {
    logError(error, {
      context: "getDetailedBalance",
      stripeAccountId,
      message: "Error al obtener saldo detallado de cuenta conectada",
    });
    throw new Error(
      `Error al obtener saldo detallado: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Crea un reembolso en Stripe
 * @param paymentIntentId - ID del PaymentIntent a reembolsar
 * @param amount - Monto a reembolsar en centavos (null para reembolso completo)
 * @param refundAppFee - Si se debe reembolsar la aplicación fee
 * @param reverseTransfer - Si se debe revertir la transferencia
 * @param stripeAccountId - ID de la cuenta conectada (requerido si reverseTransfer es true)
 * @returns Promise con el objeto Refund de Stripe
 */
export async function createRefund(
  paymentIntentId: string,
  amount: number | null = null,
  refundAppFee: boolean = true,
  reverseTransfer: boolean = true,
  stripeAccountId?: string
): Promise<Stripe.Refund> {
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    throw new Error(
      `Error al obtener el cliente Stripe: ${stripeResult.error}`
    );
  }

  const stripe = stripeResult.data;

  try {
    // Primero obtener el PaymentIntent para verificar si tiene transferencia
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verificar si el PaymentIntent tiene transferencia asociada
    const hasTransfer =
      paymentIntent.transfer_data && paymentIntent.transfer_data.destination;

    // Verificar si el PaymentIntent tiene application fee
    const hasApplicationFee =
      paymentIntent.application_fee_amount &&
      paymentIntent.application_fee_amount > 0;

    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    // Solo agregar refund_application_fee si hay una application fee y se solicita
    if (refundAppFee && hasApplicationFee) {
      refundData.refund_application_fee = true;
    } else if (refundAppFee && !hasApplicationFee) {
      logInfo(
        "No se puede reembolsar application fee - no hay application fee asociada",
        {
          paymentIntentId,
          hasApplicationFee,
        }
      );
    }

    // Solo agregar reverse_transfer si hay una transferencia y se solicita
    if (reverseTransfer && hasTransfer) {
      refundData.reverse_transfer = true;

      // Verificar saldo antes de intentar el reembolso con reverse_transfer
      if (stripeAccountId) {
        const refundAmount = amount || paymentIntent.amount;
        const balanceCheck = await canProcessRefund(
          stripeAccountId,
          refundAmount,
          paymentIntentId
        );

        if (!balanceCheck.canProcess) {
          throw new Error(
            `Saldo insuficiente para realizar el reembolso. Saldo disponible: $${(balanceCheck.availableBalance / 100).toFixed(2)}, Monto requerido: $${(balanceCheck.requiredAmount / 100).toFixed(2)}, Déficit: $${(balanceCheck.deficit! / 100).toFixed(2)}`
          );
        }

        logInfo("Verificación de saldo exitosa antes del reembolso", {
          paymentIntentId,
          stripeAccountId,
          availableBalance: balanceCheck.availableBalance,
          refundAmount,
        });
      } else {
        logInfo(
          "No se proporcionó stripeAccountId para verificación de saldo",
          {
            paymentIntentId,
            reverseTransfer,
          }
        );
      }
    } else if (reverseTransfer && !hasTransfer) {
      logInfo(
        "No se puede revertir transferencia - no hay transferencia asociada",
        {
          paymentIntentId,
          hasTransfer,
        }
      );
    }

    // Si se especifica un monto, agregarlo al reembolso
    if (amount !== null) {
      refundData.amount = amount;
    }

    const refund = await stripe.refunds.create(refundData);

    logInfo("Reembolso creado exitosamente", {
      refundId: refund.id,
      paymentIntentId,
      amount: refund.amount,
      refundAppFee: refundData.refund_application_fee || false,
      reverseTransfer: refundData.reverse_transfer || false,
      hasTransfer,
      hasApplicationFee,
      stripeAccountId,
    });

    return refund;
  } catch (error) {
    logError(error, {
      context: "createRefund",
      paymentIntentId,
      amount,
      refundAppFee,
      reverseTransfer,
      stripeAccountId,
      message: "Error al crear reembolso",
    });
    throw new Error(
      `Error al crear reembolso: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Calcula el monto neto a reembolsar restando las comisiones
 * @param totalAmount - Monto total en centavos
 * @param floraFeePercentage - Porcentaje de comisión de Flora Plus
 * @param stripeFeeAmount - Monto de comisión de Stripe en centavos
 * @returns Monto neto a reembolsar en centavos
 */
export function calculateNetRefundAmount(
  totalAmount: number,
  floraFeePercentage: number,
  stripeFeeAmount: number
): number {
  const floraFeeAmount = Math.floor(totalAmount * (floraFeePercentage / 100));
  const netAmount = totalAmount - floraFeeAmount - stripeFeeAmount;

  logInfo("Cálculo de monto neto para reembolso", {
    totalAmount,
    floraFeePercentage,
    floraFeeAmount,
    stripeFeeAmount,
    netAmount,
  });

  return Math.max(0, netAmount); // No permitir montos negativos
}

/**
 * Obtiene información detallada de un PaymentIntent
 * @param paymentIntentId - ID del PaymentIntent
 * @returns Promise con el objeto PaymentIntent de Stripe
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    throw new Error(
      `Error al obtener el cliente Stripe: ${stripeResult.error}`
    );
  }

  const stripe = stripeResult.data;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    logInfo("PaymentIntent obtenido", {
      paymentIntentId,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    return paymentIntent;
  } catch (error) {
    logError(error, {
      context: "getPaymentIntent",
      paymentIntentId,
      message: "Error al obtener PaymentIntent",
    });
    throw new Error(
      `Error al obtener PaymentIntent: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Crea un reembolso sin reverse_transfer cuando el saldo es insuficiente
 * Esta función se usa como fallback cuando la cuenta conectada no tiene fondos suficientes
 * @param paymentIntentId - ID del PaymentIntent a reembolsar
 * @param amount - Monto a reembolsar en centavos (null para reembolso completo)
 * @param refundAppFee - Si se debe reembolsar la aplicación fee
 * @returns Promise con el objeto Refund de Stripe
 */
export async function createRefundWithoutReverseTransfer(
  paymentIntentId: string,
  amount: number | null = null,
  refundAppFee: boolean = true
): Promise<Stripe.Refund> {
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    throw new Error(
      `Error al obtener el cliente Stripe: ${stripeResult.error}`
    );
  }

  const stripe = stripeResult.data;

  try {
    // Obtener el PaymentIntent para verificar si tiene application fee
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const hasApplicationFee =
      paymentIntent.application_fee_amount &&
      paymentIntent.application_fee_amount > 0;

    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    // Solo agregar refund_application_fee si hay una application fee y se solicita
    if (refundAppFee && hasApplicationFee) {
      refundData.refund_application_fee = true;
    }

    // Si se especifica un monto, agregarlo al reembolso
    if (amount !== null) {
      refundData.amount = amount;
    }

    // NO incluir reverse_transfer
    const refund = await stripe.refunds.create(refundData);

    logInfo("Reembolso creado sin reverse_transfer", {
      refundId: refund.id,
      paymentIntentId,
      amount: refund.amount,
      refundAppFee: refundData.refund_application_fee || false,
      reverseTransfer: false,
      hasApplicationFee,
      note: "Este reembolso no revierte la transferencia a la cuenta conectada",
    });

    return refund;
  } catch (error) {
    logError(error, {
      context: "createRefundWithoutReverseTransfer",
      paymentIntentId,
      amount,
      refundAppFee,
      message: "Error al crear reembolso sin reverse_transfer",
    });
    throw new Error(
      `Error al crear reembolso sin reverse_transfer: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Intenta crear un reembolso con reverse_transfer, y si falla por saldo insuficiente,
 * crea un reembolso sin reverse_transfer como fallback
 * @param paymentIntentId - ID del PaymentIntent a reembolsar
 * @param amount - Monto a reembolsar en centavos (null para reembolso completo)
 * @param refundAppFee - Si se debe reembolsar la aplicación fee
 * @param stripeAccountId - ID de la cuenta conectada
 * @returns Promise con el objeto Refund de Stripe y un flag indicando si se usó fallback
 */
export async function createRefundWithFallback(
  paymentIntentId: string,
  amount: number | null = null,
  refundAppFee: boolean = true,
  stripeAccountId: string
): Promise<{
  refund: Stripe.Refund;
  usedFallback: boolean;
  fallbackReason?: string;
}> {
  try {
    // Intentar reembolso normal con reverse_transfer
    const refund = await createRefund(
      paymentIntentId,
      amount,
      refundAppFee,
      true,
      stripeAccountId
    );

    return {
      refund,
      usedFallback: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";

    // Verificar si el error es por saldo insuficiente
    if (
      errorMessage.includes("Saldo insuficiente") ||
      errorMessage.includes("insufficient_funds")
    ) {
      logInfo(
        "Saldo insuficiente detectado, usando fallback sin reverse_transfer",
        {
          paymentIntentId,
          stripeAccountId,
          error: errorMessage,
        }
      );

      try {
        // Crear reembolso sin reverse_transfer como fallback
        const fallbackRefund = await createRefundWithoutReverseTransfer(
          paymentIntentId,
          amount,
          refundAppFee
        );

        return {
          refund: fallbackRefund,
          usedFallback: true,
          fallbackReason: "Saldo insuficiente en cuenta conectada",
        };
      } catch (fallbackError) {
        logError(fallbackError, {
          context: "createRefundWithFallback",
          paymentIntentId,
          stripeAccountId,
          message: "Error en fallback sin reverse_transfer",
        });
        throw new Error(
          `Error en reembolso con fallback: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`
        );
      }
    }

    // Si no es error de saldo insuficiente, re-lanzar el error original
    throw error;
  }
}

/**
 * EJEMPLO DE USO:
 *
 * ```typescript
 * // 1. Verificación previa de saldo
 * const balanceCheck = await canProcessRefund(
 *   stripeAccountId,
 *   refundAmount,
 *   paymentIntentId
 * );
 *
 * if (!balanceCheck.canProcess) {
 *   console.log(`Saldo insuficiente: ${balanceCheck.deficit} centavos`);
 *   // Manejar el caso de saldo insuficiente
 * }
 *
 * // 2. Reembolso con fallback automático (RECOMENDADO)
 * const refundResult = await createRefundWithFallback(
 *   paymentIntentId,
 *   refundAmount,
 *   true, // refundAppFee
 *   stripeAccountId
 * );
 *
 * if (refundResult.usedFallback) {
 *   console.log(`Se usó fallback: ${refundResult.fallbackReason}`);
 *   // Notificar al operador sobre el fallback
 * }
 *
 * // 3. Reembolso directo (solo si estás seguro del saldo)
 * const refund = await createRefund(
 *   paymentIntentId,
 *   refundAmount,
 *   true, // refundAppFee
 *   true, // reverseTransfer
 *   stripeAccountId
 * );
 * ```
 *
 * EJEMPLO DE EMAIL DE REEMBOLSO:
 *
 * ```typescript
 * // Enviar email de reembolso
 * await sendEmail({
 *   to: clienteEmail,
 *   template: "refund-processed", // o "refund-processed.en" para inglés
 *   data: {
 *     reservaId: "12345",
 *     clienteNombre: "Juan Pérez",
 *     montoReembolsado: "150.00",
 *     montoOriginal: "200.00", // solo para reembolsos parciales
 *     fechaReembolso: "lunes, 15 de enero de 2024, 14:30",
 *     motivo: "Cancelación por parte del cliente",
 *     tipoReembolso: "parcial", // "completo" o "parcial"
 *     actividad: "Tour por la Ciudad",
 *     fechaActividad: "viernes, 20 de enero de 2024",
 *     horaActividad: "09:00",
 *   },
 * });
 * ```
 */
