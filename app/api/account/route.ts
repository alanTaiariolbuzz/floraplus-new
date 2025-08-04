import { NextRequest, NextResponse } from "next/server";
import { createAccount } from "utils/stripe/accounts";
import { logError, logInfo } from "utils/error/logger";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { country, clientIp, agencyId, userAgent } = body;

  if (!country) {
    return NextResponse.json({ error: "country is required" }, { status: 400 });
  }
  if (!agencyId) {
    return NextResponse.json(
      { error: "agencyId is required" },
      { status: 400 }
    );
  }

  const hdrs = request.headers;
  const Ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    hdrs.get("x-real-ip") ??
    "127.0.0.1";

  logInfo("Creating Stripe account", {
    country,
    clientIp: Ip,
    agencyId,
    userAgent,
  });

  try {
    const account = await createAccount(country, agencyId, Ip, userAgent);

    return NextResponse.json({ account: account.id });
  } catch (err) {
    console.error("stripe account create error", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
