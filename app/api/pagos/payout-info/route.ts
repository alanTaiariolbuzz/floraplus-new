import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import stripeClient from "@/utils/stripe/client";
import { logError, logInfo } from "@/utils/error/logger";
import { addDays, format } from "date-fns";

// Tasa de cambio aproximada CRC a USD (esto debería actualizarse regularmente)

const CRC_TO_USD_RATE = 0.001998920583; // 1 CRC = 0.0019 USD 500.127 CRC (aproximadamente)

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la agencia del usuario logueado
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("agencia_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.agencia_id) {
      return NextResponse.json(
        { error: "Usuario no tiene agencia asignada" },
        { status: 400 }
      );
    }

    // Obtener el stripe_account_id de la agencia
    const { data: agencia, error: agenciaError } = await supabase
      .from("agencias")
      .select("stripe_account_id")
      .eq("id", userData.agencia_id)
      .single();

    if (agenciaError || !agencia?.stripe_account_id) {
      return NextResponse.json(
        { error: "Agencia no tiene cuenta Stripe configurada" },
        { status: 400 }
      );
    }

    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      return NextResponse.json(
        { error: "Error al inicializar Stripe" },
        { status: 500 }
      );
    }

    const stripe = stripeResult.data;

    // Obtener información de la cuenta Stripe
    const account = await stripe.accounts.retrieve(agencia.stripe_account_id);

    // Obtener balance de la cuenta
    const balance = await stripe.balance.retrieve({
      stripeAccount: agencia.stripe_account_id,
    });

    // Calcular fecha del próximo payout (7 días desde hoy)
    const nextPayoutDate = addDays(new Date(), 7);
    const formattedNextPayoutDate = format(nextPayoutDate, "dd/MM/yyyy");

    // Calcular monto pendiente separando por moneda
    let totalPendingUSD = 0;

    balance.pending.forEach((balanceItem) => {
      const amountInCurrency = balanceItem.amount / 100; // Convertir de centavos

      if (balanceItem.currency === "usd") {
        totalPendingUSD += amountInCurrency;
      } else if (balanceItem.currency === "crc") {
        // Convertir CRC a USD
        totalPendingUSD += amountInCurrency * CRC_TO_USD_RATE;
      }
      // Puedes agregar más monedas aquí si es necesario
    });

    const pendingAmountFormatted = totalPendingUSD.toFixed(2);

    logInfo("Información de payout obtenida", {
      agenciaId: userData.agencia_id,
      stripeAccountId: agencia.stripe_account_id,
      nextPayoutDate: formattedNextPayoutDate,
      pendingAmount: pendingAmountFormatted,
      currency: "usd",
      balanceDetails: balance.pending.map((item) => ({
        currency: item.currency,
        amount: item.amount / 100,
      })),
    });

    return NextResponse.json({
      success: true,
      data: {
        nextPayoutDate: formattedNextPayoutDate,
        pendingAmount: pendingAmountFormatted,
        currency: "usd",
      },
    });
  } catch (error) {
    logError(error, {
      context: "payout-info",
      method: "GET",
    });
    return NextResponse.json(
      { error: "Error al obtener información del payout" },
      { status: 500 }
    );
  }
}
