import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const hdrs = request.headers;
    const clientIp =
      hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
      hdrs.get("x-real-ip") ??
      "127.0.0.1";

    // Usar un servicio gratuito de geolocalización por IP
    const response = await fetch(`http://ip-api.com/json/${clientIp}`);
    const data = await response.json();

    if (data.status === "success") {
      return NextResponse.json({
        country: data.countryCode,
        countryName: data.country,
        region: data.regionName,
        city: data.city,
      });
    } else {
      return NextResponse.json({
        country: "US", // Fallback
        countryName: "United States",
      });
    }
  } catch (error) {
    console.error("Error detecting country:", error);
    return NextResponse.json({
      country: "US", // Fallback
      countryName: "United States",
    });
  }
}
