import { logError, logInfo } from "@/utils/error/logger";
import { NextRequest, NextResponse } from "next/server";
import stripeClient from "@/utils/stripe/client";
import { updatePago } from "./db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      logError("Missing session_id parameter");
      return NextResponse.json(
        {
          code: 400,
          message: "Missing session_id parameter",
        },
        { status: 400 }
      );
    }

    logInfo("Retrieving checkout session status", { sessionId });

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

    // Para Checkout Sessions, usar checkout.sessions.retrieve
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    logInfo("Checkout session retrieved", {
      sessionId,
      status: session.status ?? "",
      paymentStatus: session.payment_status,
    });

    //actualizar el pago en la base de datos

    await updatePago({
      stripe_session_id: sessionId,
      customerId: typeof session.customer === "string" ? session.customer : (session.customer && "id" in session.customer ? session.customer.id : null),
      status: session.status ?? "",
      externalStatus: session.payment_status ?? null,
      clientReferenceId: session.client_reference_id ?? null,
    });

    return NextResponse.json({
      code: 200,
      message: "Checkout session retrieved successfully",
      data: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        customer_email: session.customer_email,
        metadata: session.metadata,
      },
    });
  } catch (error) {
    logError("Error retrieving checkout session", error);
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
