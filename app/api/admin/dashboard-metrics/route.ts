import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import stripeClient from "@/utils/stripe/client";
import { logError, logInfo } from "@/utils/error/logger";
import { DashboardMetrics, AccountMetrics } from "@/types/dashboard";

/**
 * Obtiene todas las connected accounts activas desde la base de datos
 */
async function getAllConnectedAccounts(): Promise<string[]> {
  const supabase = await createClient();

  const { data: accounts, error } = await supabase
    .from("stripe_accounts")
    .select("stripe_account_id")
    .eq("account_status", "active")
    .eq("charges_enabled", true);

  if (error) {
    logError(error, {
      context: "dashboard-metrics",
      message: "Error al obtener connected accounts desde la BD",
    });
    throw new Error("Error al obtener connected accounts");
  }

  return accounts?.map((account) => account.stripe_account_id) || [];
}

/**
 * Obtiene las métricas de una connected account específica para hoy
 */
async function getAccountMetrics(
  stripeAccountId: string
): Promise<AccountMetrics> {
  const stripeResult = stripeClient();
  if (!stripeResult.success) {
    throw new Error(`Error al inicializar Stripe: ${stripeResult.error}`);
  }
  const stripe = stripeResult.data;

  // Obtener fecha de hoy en timestamp de Unix (inicio y fin del día)
  const today = new Date();
  const startOfDay = Math.floor(
    new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() /
      1000
  );
  const endOfDay = Math.floor(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    ).getTime() / 1000
  );

  try {
    // Obtener PaymentIntents de hoy para esta cuenta
    const paymentIntents = await stripe.paymentIntents.list(
      {
        created: { gte: startOfDay, lte: endOfDay },
        limit: 100, // Stripe tiene un límite de 100 por página
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    // Obtener Charges de hoy para esta cuenta (para total transaccionado)
    const charges = await stripe.charges.list(
      {
        created: { gte: startOfDay, lte: endOfDay },
        limit: 100,
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    // Calcular métricas
    let ingresosHoy = 0;
    let totalTransaccionado = 0;
    let cantidadVentasHoy = 0;

    // Procesar PaymentIntents exitosos
    for (const pi of paymentIntents.data) {
      if (pi.status === "succeeded") {
        // El total transaccionado es el monto del PaymentIntent
        totalTransaccionado += pi.amount;
        cantidadVentasHoy++;

        // Calcular comisión de Flora Plus (asumiendo un porcentaje fijo)
        // TODO: Obtener el porcentaje de comisión desde la configuración de la agencia
        const comisionPorcentaje = 0.1; // 10% - esto debería venir de la configuración
        const comision = Math.round(pi.amount * comisionPorcentaje);
        ingresosHoy += comision;
      }
    }

    // También procesar Charges para asegurar que no perdemos nada
    for (const charge of charges.data) {
      if (charge.status === "succeeded" && charge.paid) {
        // Si el charge no está asociado a un PaymentIntent ya procesado
        if (
          !charge.payment_intent ||
          !paymentIntents.data.find((pi) => pi.id === charge.payment_intent)
        ) {
          totalTransaccionado += charge.amount;
          cantidadVentasHoy++;

          const comisionPorcentaje = 0.1; // 10% - esto debería venir de la configuración
          const comision = Math.round(charge.amount * comisionPorcentaje);
          ingresosHoy += comision;
        }
      }
    }

    return {
      ingresosHoy,
      totalTransaccionado,
      cantidadVentasHoy,
    };
  } catch (error) {
    logError(error, {
      context: "dashboard-metrics",
      message: `Error al obtener métricas para cuenta ${stripeAccountId}`,
      stripeAccountId,
    });

    // Retornar valores en 0 si hay error en esta cuenta específica
    return {
      ingresosHoy: 0,
      totalTransaccionado: 0,
      cantidadVentasHoy: 0,
    };
  }
}

/**
 * GET /api/admin/dashboard-metrics
 * Obtiene las métricas del dashboard para todas las connected accounts
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el usuario es admin
    const { data: userData } = await supabase
      .from("usuarios")
      .select("rol_id")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.rol_id === 1; // Asumiendo que rol_id=1 es admin
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Solo administradores pueden acceder a estas métricas" },
        { status: 403 }
      );
    }

    // Obtener todas las connected accounts activas
    const connectedAccounts = await getAllConnectedAccounts();

    if (connectedAccounts.length === 0) {
      return NextResponse.json({
        ingresosHoy: 0,
        totalTransaccionado: 0,
        cantidadVentasHoy: 0,
        promedioReservaHoy: 0,
      });
    }

    // Obtener métricas de todas las cuentas en paralelo
    const metricsPromises = connectedAccounts.map((accountId) =>
      getAccountMetrics(accountId)
    );
    const allMetrics = await Promise.allSettled(metricsPromises);

    // Sumar todas las métricas
    let totalIngresosHoy = 0;
    let totalTransaccionado = 0;
    let totalCantidadVentasHoy = 0;

    for (const result of allMetrics) {
      if (result.status === "fulfilled") {
        const metrics = result.value;
        totalIngresosHoy += metrics.ingresosHoy;
        totalTransaccionado += metrics.totalTransaccionado;
        totalCantidadVentasHoy += metrics.cantidadVentasHoy;
      }
    }

    // Calcular promedio de reserva
    const promedioReservaHoy =
      totalCantidadVentasHoy > 0
        ? Math.round(totalTransaccionado / totalCantidadVentasHoy)
        : 0;

    // Convertir de centavos a dólares
    const dashboardMetrics: DashboardMetrics = {
      ingresosHoy: Math.round(totalIngresosHoy / 100),
      totalTransaccionado: Math.round(totalTransaccionado / 100),
      cantidadVentasHoy: totalCantidadVentasHoy,
      promedioReservaHoy: Math.round(promedioReservaHoy / 100),
    };

    logInfo("Métricas del dashboard calculadas", {
      connectedAccountsCount: connectedAccounts.length,
      metrics: dashboardMetrics,
    });

    return NextResponse.json(dashboardMetrics);
  } catch (error) {
    const err = error as any;
    logError(err, {
      context: "dashboard-metrics",
      message: "Error al calcular métricas del dashboard",
    });

    return NextResponse.json(
      { error: "Error al calcular métricas del dashboard" },
      { status: 500 }
    );
  }
}
