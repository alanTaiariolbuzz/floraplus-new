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

    // Obtener la configuración de payout desde Stripe
    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      return NextResponse.json(
        { error: "Error al inicializar Stripe" },
        { status: 500 }
      );
    }

    const stripe = stripeResult.data;

    // Obtener la cuenta de Stripe con información de payout
    const account = await stripe.accounts.retrieve(agencia.stripe_account_id, {
      expand: ["external_accounts"],
    });

    // Obtener la configuración de payout schedule
    const payoutSchedule = account.settings?.payouts?.schedule;

    // Obtener información de la cuenta bancaria
    let bankAccount = null;
    if (
      account.external_accounts &&
      "data" in account.external_accounts &&
      account.external_accounts.data &&
      account.external_accounts.data.length > 0
    ) {
      const externalAccount = account.external_accounts.data[0] as any;
      bankAccount = {
        last4: externalAccount.last4,
        bank_name: externalAccount.bank_name,
        currency: externalAccount.currency,
        country: externalAccount.country,
        routing_number: externalAccount.routing_number,
      };
    }

    const response = {
      payout_schedule: {
        interval: payoutSchedule?.interval || "manual",
        delay_days: payoutSchedule?.delay_days || 0,
        weekly_anchor: payoutSchedule?.weekly_anchor || null,
        monthly_anchor: payoutSchedule?.monthly_anchor || null,
      },
      bank_account: bankAccount,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
    };

    logInfo("Configuración de payout obtenida", {
      agenciaId,
      stripeAccountId: agencia.stripe_account_id,
      payoutSchedule: response.payout_schedule,
    });

    return NextResponse.json(response);
  } catch (error) {
    logError(error, {
      context: "payout-settings-get",
      agenciaId: (await params).id,
      message: "Error al obtener configuración de payout",
    });

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Validación de seguridad para producción
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const userAgent = request.headers.get("user-agent");

    // En producción, verificar que la petición viene de nuestro dominio
    if (process.env.NODE_ENV === "production") {
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_SITE_URL,
        "https://tuagencia.com", // Reemplaza con tu dominio real
        "https://www.tuagencia.com",
      ].filter(Boolean);

      if (origin && !allowedOrigins.includes(origin)) {
        logError(new Error("Origen no permitido"), {
          context: "payout-settings-post",
          agenciaId: (await params).id,
          origin,
          referer,
          userAgent,
        });
        return NextResponse.json(
          { error: "Origen no permitido" },
          { status: 403 }
        );
      }

      // Verificar que la petición viene de nuestro frontend
      if (!referer || !referer.includes(allowedOrigins[0] || "")) {
        logError(new Error("Referer no válido"), {
          context: "payout-settings-post",
          agenciaId: (await params).id,
          referer,
          userAgent,
        });
        return NextResponse.json(
          { error: "Referer no válido" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { interval, delay_days, weekly_anchor, monthly_anchor } = body;

    // Validar parámetros requeridos
    if (!interval) {
      return NextResponse.json(
        { error: "El intervalo es requerido" },
        { status: 400 }
      );
    }

    if (!["manual", "daily", "weekly", "monthly"].includes(interval)) {
      return NextResponse.json(
        {
          error: "Intervalo inválido. Debe ser manual, daily, weekly o monthly",
        },
        { status: 400 }
      );
    }

    if (interval === "weekly" && !weekly_anchor) {
      return NextResponse.json(
        { error: "weekly_anchor es requerido para intervalos semanales" },
        { status: 400 }
      );
    }

    if (interval === "monthly" && !monthly_anchor) {
      return NextResponse.json(
        { error: "monthly_anchor es requerido para intervalos mensuales" },
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

    // Actualizar la configuración de payout en Stripe
    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      return NextResponse.json(
        { error: "Error al inicializar Stripe" },
        { status: 500 }
      );
    }

    const stripe = stripeResult.data;

    // Construir el objeto de configuración de payout
    const payoutSchedule: any = {
      interval,
      delay_days: delay_days || 0,
    };

    if (interval === "weekly" && weekly_anchor) {
      payoutSchedule.weekly_anchor = weekly_anchor;
    }

    if (interval === "monthly" && monthly_anchor) {
      payoutSchedule.monthly_anchor = monthly_anchor;
    }

    // Actualizar la cuenta de Stripe
    const updatedAccount = await stripe.accounts.update(
      agencia.stripe_account_id,
      {
        settings: {
          payouts: {
            schedule: payoutSchedule,
          },
        },
      }
    );

    logInfo("Configuración de payout actualizada", {
      agenciaId,
      stripeAccountId: agencia.stripe_account_id,
      payoutSchedule,
    });

    return NextResponse.json(
      {
        success: true,
        payout_schedule: {
          interval: updatedAccount.settings?.payouts?.schedule?.interval,
          delay_days: updatedAccount.settings?.payouts?.schedule?.delay_days,
          weekly_anchor:
            updatedAccount.settings?.payouts?.schedule?.weekly_anchor,
          monthly_anchor:
            updatedAccount.settings?.payouts?.schedule?.monthly_anchor,
        },
      },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      }
    );
  } catch (error: any) {
    // Manejar errores específicos de Stripe
    if (error.type === "StripeInvalidRequestError") {
      let userMessage = "Error al actualizar la configuración";

      // Mensajes específicos para errores comunes
      if (error.param === "settings[payouts][schedule][delay_days]") {
        if (
          error.message?.includes("lower") &&
          error.message?.includes("delay")
        ) {
          userMessage =
            "No se puede reducir el retraso de payout por debajo del mínimo permitido por Stripe";
        } else if (
          error.message?.includes("higher") &&
          error.message?.includes("delay")
        ) {
          userMessage =
            "El retraso de payout no puede exceder el máximo permitido por Stripe";
        } else {
          userMessage = "El valor de días de retraso no es válido";
        }
      } else if (error.param === "settings[payouts][schedule][interval]") {
        userMessage = "El intervalo de payout seleccionado no es válido";
      } else if (error.param === "settings[payouts][schedule][weekly_anchor]") {
        userMessage = "El día de la semana seleccionado no es válido";
      } else if (
        error.param === "settings[payouts][schedule][monthly_anchor]"
      ) {
        userMessage = "El día del mes seleccionado no es válido";
      }

      logError(error, {
        context: "payout-settings-post",
        agenciaId: (await params).id,
        message: "Error de validación de Stripe",
        stripeError: error.message,
        stripeParam: error.param,
      });

      return NextResponse.json({ error: userMessage }, { status: 400 });
    }

    logError(error, {
      context: "payout-settings-post",
      agenciaId: (await params).id,
      message: "Error al actualizar configuración de payout",
    });

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
