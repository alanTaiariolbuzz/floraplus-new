import { logError, logInfo } from "@/utils/error/logger";
import { NextRequest, NextResponse } from "next/server";
import stripeClient from "@/utils/stripe/client";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agenciaId } = body;

    if (!agenciaId) {
      return NextResponse.json(
        {
          code: 400,
          message: "Missing agenciaId parameter",
        },
        { status: 400 }
      );
    }

    // Obtener el stripe_account_id de la agencia
    const supabase = await createClient();
    const { data: agencia, error: agenciaError } = await supabase
      .from("agencias")
      .select("stripe_account_id")
      .eq("id", agenciaId)
      .single();

    if (agenciaError || !agencia || !agencia.stripe_account_id) {
      logError("Error fetching agency stripe account", {
        agenciaId,
        error: agenciaError,
      });
      return NextResponse.json(
        {
          code: 400,
          message: "Agency not found or no Stripe account configured",
        },
        { status: 400 }
      );
    }

    // Configurar el payout schedule
    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      return NextResponse.json(
        {
          code: 500,
          message: "Failed to initialize Stripe client",
        },
        { status: 500 }
      );
    }

    const stripe = stripeResult.data;

    try {
      // Actualizar la cuenta conectada para configurar el payout schedule
      const account = await stripe.accounts.update(agencia.stripe_account_id, {
        settings: {
          payouts: {
            schedule: {
              interval: "weekly",
              weekly_anchor: "monday", // Los pagos se procesan los lunes
              delay_days: 7, // 7 días de delay
            },
          },
        },
      });

      logInfo("Payout schedule configured successfully", {
        agenciaId,
        stripeAccountId: agencia.stripe_account_id,
        payoutSchedule: account.settings?.payouts?.schedule,
      });

      return NextResponse.json({
        code: 200,
        message: "Payout schedule configured successfully",
        data: {
          agenciaId,
          stripeAccountId: agencia.stripe_account_id,
          payoutSchedule: account.settings?.payouts?.schedule,
        },
      });
    } catch (stripeError) {
      logError("Error configuring payout schedule", stripeError);
      return NextResponse.json(
        {
          code: 500,
          message: "Error configuring payout schedule",
          details:
            stripeError instanceof Error
              ? stripeError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logError("Error processing payout configuration", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
