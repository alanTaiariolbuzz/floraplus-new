import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { syncAgencyStatusWithStripe } from "@/utils/stripe/sync";
import { logError, logInfo } from "@/utils/error/logger";

/**
 * POST /api/agencias/[id]/sync-stripe-status
 * Sincroniza el estado de Stripe de una agencia específica
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agencyId = parseInt(id);

    if (isNaN(agencyId)) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de agencia inválido",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que la agencia existe y obtener su stripe_account_id
    const { data: agency, error: agencyError } = await supabase
      .from("agencias")
      .select("id, nombre_comercial, stripe_account_id, activa")
      .eq("id", agencyId)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json(
        {
          code: 404,
          message: "Agencia no encontrada",
        },
        { status: 404 }
      );
    }

    if (!agency.stripe_account_id) {
      return NextResponse.json(
        {
          code: 400,
          message: "Esta agencia no tiene una cuenta de Stripe asociada",
        },
        { status: 400 }
      );
    }

    // Sincronizar el estado de Stripe
    const syncResult = await syncAgencyStatusWithStripe(
      agency.stripe_account_id
    );

    if (!syncResult.success) {
      logError("Error al sincronizar estado de Stripe", {
        agencyId,
        stripeAccountId: agency.stripe_account_id,
        error: syncResult.error,
      });

      return NextResponse.json(
        {
          code: 500,
          message: `Error al sincronizar estado de Stripe: ${syncResult.error}`,
        },
        { status: 500 }
      );
    }

    // Obtener el estado actualizado de la agencia
    const { data: updatedAgency, error: updateError } = await supabase
      .from("agencias")
      .select("id, nombre_comercial, activa, stripe_account_id")
      .eq("id", agencyId)
      .single();

    if (updateError) {
      logError("Error al obtener agencia actualizada", {
        agencyId,
        error: updateError,
      });
    }

    logInfo("Estado de agencia sincronizado exitosamente", {
      agencyId,
      stripeAccountId: agency.stripe_account_id,
      previousStatus: agency.activa,
      newStatus: updatedAgency?.activa,
      syncResult: syncResult.data,
    });

    return NextResponse.json({
      code: 200,
      message: "Estado de agencia sincronizado exitosamente",
      data: {
        agencyId,
        stripeAccountId: agency.stripe_account_id,
        previousStatus: agency.activa,
        currentStatus: updatedAgency?.activa,
        syncDetails: syncResult.data,
      },
    });
  } catch (error: any) {
    logError(error, {
      endpoint: "/api/agencias/[id]/sync-stripe-status",
      context: "Error al sincronizar estado de Stripe",
      agencyId: params ? (await params).id : "unknown",
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor al sincronizar estado de Stripe",
      },
      { status: 500 }
    );
  }
}
