import { NextRequest, NextResponse } from "next/server";
import { moveAbandonedReservations } from "@/utils/services/abandonedCartService";

export async function POST(request: NextRequest) {
  try {
    // Verificar que la request viene de Vercel Cron (opcional, para seguridad)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // Ejecutar el servicio de mover reservas abandonadas
    const stats = await moveAbandonedReservations();



    return NextResponse.json({
      success: true,
      message: "Abandoned reservations cleanup completed",
      stats: {
        movedCount: stats.movedCount,
        errorCount: stats.errorCount,
        totalProcessed: stats.movedCount + stats.errorCount,
      },
      errors: stats.errors.length > 0 ? stats.errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in move-abandoned-reservations cron job:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// También permitir GET para testing manual
export async function GET(request: NextRequest) {
  return POST(request);
}
