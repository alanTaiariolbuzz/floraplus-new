#!/usr/bin/env tsx

import { createAdminClient } from "../supabase/admin";
import { syncAgencyStatusWithStripe } from "../stripe/sync";
import { logInfo, logError } from "../error/logger";

/**
 * Script para sincronizar el estado de Stripe de todas las agencias existentes
 * Uso: npx tsx utils/scripts/sync-all-agencies-stripe-status.ts
 */
async function syncAllAgenciesStripeStatus() {
  try {
    const supabase = await createAdminClient();

    // Obtener todas las agencias que tengan stripe_account_id
    const { data: agencies, error: agenciesError } = await supabase
      .from("agencias")
      .select("id, nombre_comercial, stripe_account_id, activa")
      .not("stripe_account_id", "is", null);

    if (agenciesError) {
      process.exit(1);
    }

    if (!agencies || agencies.length === 0) {
      return;
    }

    // Sincronizar cada agencia
    const results = [];
    let successful = 0;
    let failed = 0;
    let statusChanges = 0;

    for (const agency of agencies) {
      try {
        const syncResult = await syncAgencyStatusWithStripe(
          agency.stripe_account_id
        );

        if (syncResult.success) {
          successful++;
          const statusChanged = agency.activa !== syncResult.data?.isActive;
          if (statusChanged) {
            statusChanges++;
          }

          results.push({
            agencyId: agency.id,
            agencyName: agency.nombre_comercial,
            stripeAccountId: agency.stripe_account_id,
            success: true,
            previousStatus: agency.activa,
            newStatus: syncResult.data?.isActive,
          });
        } else {
          failed++;

          results.push({
            agencyId: agency.id,
            agencyName: agency.nombre_comercial,
            stripeAccountId: agency.stripe_account_id,
            success: false,
            error: syncResult.error,
            previousStatus: agency.activa,
            newStatus: null,
          });
        }
      } catch (error) {
        failed++;

        results.push({
          agencyId: agency.id,
          agencyName: agency.nombre_comercial,
          stripeAccountId: agency.stripe_account_id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          previousStatus: agency.activa,
          newStatus: null,
        });
      }
    }

    // Mostrar resumen

    if (statusChanges > 0) {
      results
        .filter((r) => r.success && r.previousStatus !== r.newStatus)
        .forEach((r) => {});
    }

    if (failed > 0) {
      results.filter((r) => !r.success).forEach((r) => {});
    }

    // Log del resumen
    logInfo("Sincronización masiva de estados de Stripe completada", {
      total: agencies.length,
      successful,
      failed,
      statusChanges,
      results,
    });
  } catch (error) {
    logError(error, {
      context: "sync-all-agencies-stripe-status-script",
      message: "Error fatal durante sincronización masiva",
    });
    process.exit(1);
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  syncAllAgenciesStripeStatus()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

export { syncAllAgenciesStripeStatus };
