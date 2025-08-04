import { logError, logInfo } from "@/utils/error/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCheckoutStatus } from "@/utils/stripe/checkout";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        {
          code: 400,
          message: "Missing sessionId parameter",
        },
        { status: 400 }
      );
    }

    logInfo("Getting checkout status", { sessionId });

    const session = await getCheckoutStatus(sessionId);

    logInfo("Checkout status retrieved", { sessionId, status: session.status });

    if (session.status === "open") {
      return NextResponse.json({
        code: 400,
        message: "Session not ready for payout - still open",
        data: { status: session.status },
      });
    }

    if (session.status === "expired") {
      return NextResponse.json({
        code: 400,
        message: "Session expired",
        data: { status: session.status },
      });
    }

    if (session.status !== "complete") {
      return NextResponse.json({
        code: 400,
        message: "Session not complete",
        data: { status: session.status },
      });
    }

    return NextResponse.json({
      code: 200,
      message: "Checkout session status retrieved successfully",
      data: { 
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency
      },
    });
  } catch (error) {
    logError("Error processing payout", error);
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
