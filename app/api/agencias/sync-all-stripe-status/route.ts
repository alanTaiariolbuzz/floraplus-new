import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { syncAgencyStatusWithStripe } from "@/utils/stripe/sync";
import { logError, logInfo } from "@/utils/error/logger";

/**
 * POST /api/agencias/sync-all-stripe-status
 * Sincroniza el estado de Stripe de todas las agencias que tengan stripe_account_id
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener todas las agencias que tengan stripe_account_id
    const { data: agencies, error: agenciesError } = await supabase
      .from("agencias")
      .select("id, nombre_comercial, stripe_account_id, activa")
      .not("stripe_account_id", "is", null);

    if (agenciesError) {
      logError("Error al obtener agencias con stripe_account_id", {
        error: agenciesError,
      });
      return NextResponse.json(
        {
          code: 500,
          message: "Error al obtener agencias",
        },
        { status: 500 }
      );
    }

    if (!agencies || agencies.length === 0) {
      return NextResponse.json({
        code: 200,
        message: "No hay agencias con cuentas de Stripe para sincronizar",
        data: {
          total: 0,
          successful: 0,
          failed: 0,
          results: [],
        },
      });
    }

    // Sincronizar cada agencia
    const syncResults = await Promise.allSettled(
      agencies.map((agency) =>
        syncAgencyStatusWithStripe(agency.stripe_account_id)
      )
    );

    // Procesar resultados
    const results = syncResults.map((result, index) => {
      const agency = agencies[index];
      if (result.status === "fulfilled") {
        return {
          agencyId: agency.id,
          agencyName: agency.nombre_comercial,
          stripeAccountId: agency.stripe_account_id,
          success: result.value.success,
          error: result.value.error,
          previousStatus: agency.activa,
          newStatus: result.value.data?.isActive,
        };
      } else {
        return {
          agencyId: agency.id,
          agencyName: agency.nombre_comercial,
          stripeAccountId: agency.stripe_account_id,
          success: false,
          error: result.reason?.message || "Error desconocido",
          previousStatus: agency.activa,
          newStatus: null,
        };
      }
    });

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const statusChanges = results.filter(
      (r) => r.success && r.previousStatus !== r.newStatus
    ).length;

    logInfo("Sincronización masiva de estados de Stripe completada", {
      total: agencies.length,
      successful,
      failed,
      statusChanges,
    });

    return NextResponse.json({
      code: 200,
      message: `Sincronización completada. ${successful} exitosas, ${failed} fallidas, ${statusChanges} cambios de estado`,
      data: {
        total: agencies.length,
        successful,
        failed,
        statusChanges,
        results,
      },
    });
  } catch (error: any) {
    logError(error, {
      endpoint: "/api/agencias/sync-all-stripe-status",
      context: "Error al sincronizar estados de Stripe masivamente",
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor al sincronizar estados de Stripe",
      },
      { status: 500 }
    );
  }
}
