import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import stripeClient from "@/utils/stripe/client";
import { logError, logInfo } from "@/utils/error/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agenciaId = parseInt(id);

    if (isNaN(agenciaId)) {
      return NextResponse.json(
        { error: "ID de agencia inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar permisos - el usuario debe pertenecer a la agencia o ser admin
    const { data: userData } = await supabase
      .from("usuarios")
      .select("rol_id, agencia_id")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.rol_id === 1; // Asumiendo que rol_id=1 es admin

    if (!isAdmin && userData?.agencia_id !== agenciaId) {
      return NextResponse.json(
        { error: "No autorizado para acceder a esta agencia" },
        { status: 403 }
      );
    }

    // Obtener la agencia y su cuenta de Stripe
    const { data: agencia, error: agenciaError } = await supabase
      .from("agencias")
      .select("id, stripe_account_id")
      .eq("id", agenciaId)
      .single();

    if (agenciaError || !agencia) {
      return NextResponse.json(
        { error: "Agencia no encontrada" },
        { status: 404 }
      );
    }

    if (!agencia.stripe_account_id) {
      return NextResponse.json(
        { error: "La agencia no tiene una cuenta de Stripe configurada" },
        { status: 400 }
      );
    }

    // Obtener información de Stripe
    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      return NextResponse.json(
        { error: "Error al inicializar Stripe" },
        { status: 500 }
      );
    }

    const stripe = stripeResult.data;

    // Obtener el saldo de la cuenta
    const balance = await stripe.balance.retrieve({
      stripeAccount: agencia.stripe_account_id,
    });

    // Calcular saldo disponible (available + pending) por moneda
    const balanceByCurrency: {
      [key: string]: { available: number; pending: number; total: number };
    } = {};

    // Procesar balance disponible
    balance.available.forEach((balanceItem) => {
      const currency = balanceItem.currency.toUpperCase();
      if (!balanceByCurrency[currency]) {
        balanceByCurrency[currency] = { available: 0, pending: 0, total: 0 };
      }
      balanceByCurrency[currency].available += balanceItem.amount;
    });

    // Procesar balance pendiente
    balance.pending.forEach((balanceItem) => {
      const currency = balanceItem.currency.toUpperCase();
      if (!balanceByCurrency[currency]) {
        balanceByCurrency[currency] = { available: 0, pending: 0, total: 0 };
      }
      balanceByCurrency[currency].pending += balanceItem.amount;
    });

    // Calcular total por moneda
    Object.keys(balanceByCurrency).forEach((currency) => {
      balanceByCurrency[currency].total =
        balanceByCurrency[currency].available +
        balanceByCurrency[currency].pending;
    });

    // Convertir todo a USD para mostrar en el frontend
    // Tasa de cambio aproximada CRC a USD (se puede hacer dinámica después)
    const CRC_TO_USD_RATE = 0.0019; // 1 CRC = 0.0019 USD (aproximadamente)

    let totalUSD = 0;
    let availableUSD = 0;
    let pendingUSD = 0;

    Object.keys(balanceByCurrency).forEach((currency) => {
      const balance = balanceByCurrency[currency];
      if (currency === "USD") {
        totalUSD += balance.total;
        availableUSD += balance.available;
        pendingUSD += balance.pending;
      } else if (currency === "CRC") {
        // Convertir CRC a USD
        totalUSD += balance.total * CRC_TO_USD_RATE;
        availableUSD += balance.available * CRC_TO_USD_RATE;
        pendingUSD += balance.pending * CRC_TO_USD_RATE;
      } else {
        // Para otras monedas, asumir 1:1 con USD por ahora
        totalUSD += balance.total;
        availableUSD += balance.available;
        pendingUSD += balance.pending;
      }
    });

    // Redondear a centavos de USD
    totalUSD = Math.round(totalUSD);
    availableUSD = Math.round(availableUSD);
    pendingUSD = Math.round(pendingUSD);

    // Obtener la moneda principal (la que tiene más balance)
    const primaryCurrency = Object.keys(balanceByCurrency).reduce((a, b) =>
      balanceByCurrency[a].total > balanceByCurrency[b].total ? a : b
    );

    const primaryBalance = balanceByCurrency[primaryCurrency];

    // Obtener la configuración de payout
    const account = await stripe.accounts.retrieve(agencia.stripe_account_id);
    const payoutSchedule = account.settings?.payouts?.schedule;

    // Calcular próxima fecha de payout
    let nextPayoutDate = null;
    let estimatedAmount = totalUSD;

    if (payoutSchedule?.interval && payoutSchedule.interval !== "manual") {
      const now = new Date();
      let nextDate = new Date(now);

      switch (payoutSchedule.interval) {
        case "daily":
          // Para daily, el próximo payout es mañana + delay_days
          nextDate.setDate(now.getDate() + 1);
          break;
        case "weekly":
          // Para weekly, calcular el próximo día de la semana + delay_days
          const daysUntilNext = getDaysUntilNextWeekday(
            payoutSchedule.weekly_anchor || "monday"
          );
          nextDate.setDate(now.getDate() + daysUntilNext);
          break;
        case "monthly":
          // Para monthly, el próximo mes en el día especificado + delay_days
          const nextMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            payoutSchedule.monthly_anchor || 1
          );
          nextDate = nextMonth;
          break;
      }

      // Agregar delay_days
      if (payoutSchedule.delay_days) {
        nextDate.setDate(nextDate.getDate() + payoutSchedule.delay_days);
      }

      // Solo mostrar la fecha si es en el futuro
      if (nextDate > now) {
        nextPayoutDate = nextDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      }
    }

    // Obtener el último payout para mostrar información adicional
    const payouts = await stripe.payouts.list(
      { limit: 1 },
      { stripeAccount: agencia.stripe_account_id }
    );

    const lastPayout = payouts.data[0];

    const response = {
      balance: {
        available: availableUSD,
        pending: pendingUSD,
        total: totalUSD,
        currency: "USD",
      },
      balances_by_currency: balanceByCurrency,
      next_payout: {
        date: nextPayoutDate,
        estimated_amount: estimatedAmount,
        interval: payoutSchedule?.interval || "manual",
      },
      last_payout: lastPayout
        ? {
            id: lastPayout.id,
            amount: lastPayout.amount,
            status: lastPayout.status,
            created: lastPayout.created,
            arrival_date: lastPayout.arrival_date,
          }
        : null,
    };

    logInfo("Información de payout obtenida", {
      agenciaId,
      stripeAccountId: agencia.stripe_account_id,
      balance: response.balance,
      nextPayout: response.next_payout,
    });

    return NextResponse.json(response);
  } catch (error) {
    logError(error, {
      context: "payout-info-get",
      agenciaId: (await params).id,
      message: "Error al obtener información de payout",
    });

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Función auxiliar para calcular días hasta el próximo día de la semana
function getDaysUntilNextWeekday(targetDay: string): number {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = new Date().getDay();
  const targetIndex = days.indexOf(targetDay.toLowerCase());

  if (targetIndex === -1) return 1; // Default to monday

  let daysUntil = targetIndex - today;
  if (daysUntil <= 0) {
    daysUntil += 7; // Next week
  }

  return daysUntil;
}
