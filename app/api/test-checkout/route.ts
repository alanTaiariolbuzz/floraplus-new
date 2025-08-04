import { NextRequest, NextResponse } from "next/server";
import { logInfo, logError } from "@/utils/error/logger";
import { createEmbeddedCheckoutSession } from "@/utils/stripe/checkout";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount = 200, agenciaId = 25 } = body;

    logInfo("Iniciando test de checkout", { amount, agenciaId });

    // Datos de prueba basados en la agencia Testing LLC
    const testData = {
      agenciaId: agenciaId,
      reservaId: 999, // ID de prueba
      codigo_reserva: "TEST-001",
      amount: amount, // $200 USD
      currency: "usd",
      customerEmail: "test@example.com",
      customerName: "Test User",
      stripeAccountId: "acct_1Rnh4KPxg2uUDBj1", // De la agencia Testing LLC
      final_fee: 16.0, // 8% de $200
      final_tax: 6.48, // 3% de ($200 + $16)
      fee_flora_plus: 10.0, // 5% de $200
      language: "es",
    };

    logInfo("Datos de prueba para checkout", testData);

    // Crear la sesión de checkout
    const result = await createEmbeddedCheckoutSession(testData);

    logInfo("Checkout session creada exitosamente", {
      sessionId: result.sessionId,
      hasClientSecret: !!result.clientSecret,
    });

    // Calcular el desglose detallado
    const amountCents = Math.round(amount * 100);
    const feeCents = Math.round(testData.final_fee * 100);
    const taxCents = Math.round(testData.final_tax * 100);
    const feeFloraPlusCents = Math.round(testData.fee_flora_plus * 100);

    const totalAmountCents = amountCents; // Cliente paga solo el amount base
    const stripeFeeCents = Math.round(amountCents * 0.029) + 30;
    const applicationFeeCents = feeFloraPlusCents + stripeFeeCents;
    const connectedAccountReceives = totalAmountCents - applicationFeeCents;

    const desglose = {
      cliente: {
        paga: amount,
        desglose: {
          amount_base: amount,
          convenience_fee: testData.final_fee,
          tax: testData.final_tax,
          total_visual: amount + testData.final_fee + testData.final_tax,
        },
      },
      fees: {
        fee_flora_plus: testData.fee_flora_plus,
        tarifa_stripe: stripeFeeCents / 100,
        application_fee_total: applicationFeeCents / 100,
      },
      distribucion: {
        connected_account_recibe: connectedAccountReceives / 100,
        flora_plus_recibe_neto: testData.fee_flora_plus,
        stripe_recibe: stripeFeeCents / 100,
      },
      verificacion: {
        total_cobrado: amount,
        total_distribuido:
          connectedAccountReceives / 100 +
          testData.fee_flora_plus +
          stripeFeeCents / 100,
        balance:
          amount -
          (connectedAccountReceives / 100 +
            testData.fee_flora_plus +
            stripeFeeCents / 100),
      },
    };

    return NextResponse.json({
      code: 200,
      message: "Test de checkout exitoso",
      data: {
        sessionId: result.sessionId,
        clientSecret: result.clientSecret,
        desglose,
        testData,
      },
    });
  } catch (error) {
    logError("Error en test de checkout", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Error en test de checkout",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
