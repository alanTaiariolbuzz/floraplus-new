import { logError, logInfo } from "@/utils/error/logger";
import { NextRequest, NextResponse } from "next/server";
import stripeClient from "@/utils/stripe/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("payment_intent_id");

    if (!paymentIntentId) {
      return NextResponse.json(
        {
          code: 400,
          message: "Missing payment_intent_id parameter",
        },
        { status: 400 }
      );
    }

    logInfo("Retrieving payment intent", { paymentIntentId });

    const stripeResult = stripeClient();

    if (!stripeResult.success) {
      const errorMessage =
        stripeResult.error || "Stripe client not initialized";
      logError("Failed to initialize Stripe client", { error: errorMessage });
      return NextResponse.json(
        {
          code: 500,
          message: "Failed to initialize Stripe client",
        },
        { status: 500 }
      );
    }

    const stripe = stripeResult.data;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    logInfo("Payment intent retrieved", {
      paymentIntentId,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    return NextResponse.json({
      code: 200,
      message: "Payment intent retrieved successfully",
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_status:
          paymentIntent.status === "succeeded" ? "paid" : "unpaid",
        amount_total: paymentIntent.amount,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error) {
    logError("Error retrieving payment intent", error);
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
