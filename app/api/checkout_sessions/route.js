import { NextResponse } from "next/server";
import { headers } from "next/headers";
import stripeClient from "@/utils/stripe/client";
import { createClient } from "@/utils/supabase/server";

export async function POST(request) {
  const result = stripeClient();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  const stripe = result.data;

  try {
    const headersList = await headers();
    const origin = headersList.get("origin");

    const {
      name,
      total,
      currency = "usd",
      agencia_id,
      customer,
      reserva_id, // <-- Asegúrate de recibirlo en el body
    } = await request.json();

    const supabase = await createClient();

    const { data: operador, error } = await supabase
      .from("agencias")
      .select("stripe_account_id, convenience_fee_fijo_valor")
      .eq("id", agencia_id)
      .single();

    if (
      error ||
      !operador?.stripe_account_id ||
      operador.convenience_fee_fijo_valor == null
    ) {
      return NextResponse.json(
        { error: "Operador sin Stripe Connect o comisión configurada" },
        { status: 400 }
      );
    }

    const totalCents = Math.round(total * 100);

    if (totalCents < 50) {
      return NextResponse.json(
        { error: "El monto mínimo para procesar el pago es $0.50" },
        { status: 400 }
      );
    }

    const comision = Math.floor(
      totalCents * operador.convenience_fee_fijo_valor
    );

    // Crear PaymentIntent
    const paymentIntentData = {
      amount: totalCents,
      currency,
      payment_method_types: ["card"],
      application_fee_amount: comision,
      transfer_data: {
        destination: operador.stripe_account_id,
      },
      metadata: {
        name,
        agencia_id: String(agencia_id),
        reserva_id: reserva_id ? String(reserva_id) : undefined, // Guardar en metadata
        customer_name: customer?.name,
        customer_email: customer?.email,
        customer_phone: customer?.phone,
      },
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    // Guardar el PaymentIntent en la tabla pagos
    const { error: insertError } = await supabase.from("pagos").insert({
      reserva_id,
      agencia_id,
      stripe_payment_intent_id: paymentIntent.id,
      status: "pending", // Estado interno inicial
      external_status: paymentIntent.status, // Estado Stripe
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      receipt_url: null, // Se puede actualizar luego con el webhook
    });
    if (insertError) {
      console.error(
        "[checkout_sessions] Error guardando pago en BD:",
        insertError
      );
      return NextResponse.json(
        { error: "Error guardando pago en BD" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("[checkout_sessions] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
