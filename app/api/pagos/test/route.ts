import { logError, logInfo } from "@/utils/error/logger";
import { NextRequest, NextResponse } from "next/server";
import stripeClient from "@/utils/stripe/client";

export async function GET(request: NextRequest) {
  try {
    logInfo("Testing Stripe configuration");

    // Verificar variables de entorno
    const envVars = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_SITE_URL:
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    };

    logInfo("Environment variables", envVars);

    // Verificar cliente de Stripe
    const stripeResult = stripeClient();

    if (!stripeResult.success) {
      logError("Stripe client failed", { error: stripeResult.error });
      return NextResponse.json(
        {
          code: 500,
          message: "Stripe client failed",
          error: stripeResult.error,
          envVars,
        },
        { status: 500 }
      );
    }

    const stripe = stripeResult.data;

    // Probar una operación simple de Stripe
    try {
      const account = await stripe.accounts.retrieve();
      logInfo("Stripe account retrieved", { accountId: account.id });

      return NextResponse.json({
        code: 200,
        message: "Stripe configuration is working",
        accountId: account.id,
        envVars,
      });
    } catch (stripeError) {
      logError("Stripe API test failed", stripeError);
      return NextResponse.json(
        {
          code: 500,
          message: "Stripe API test failed",
          error:
            stripeError instanceof Error
              ? stripeError.message
              : "Unknown error",
          envVars,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logError("Error testing Stripe configuration", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Error testing Stripe configuration",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
