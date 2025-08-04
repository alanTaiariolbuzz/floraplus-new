import { createClient } from "@/utils/supabase/server";
import stripeClient from "@/utils/stripe/client";
import { logInfo, logError } from "@/utils/error/logger";

async function configurePayoutsForAllAgencies() {
  try {
    logInfo("Starting payout configuration for all agencies");

    // Obtener todas las agencias con stripe_account_id
    const supabase = await createClient();
    const { data: agencias, error } = await supabase
      .from("agencias")
      .select("id, stripe_account_id")
      .not("stripe_account_id", "is", null);

    if (error) {
      logError("Error fetching agencies", error);
      return;
    }

    if (!agencias || agencias.length === 0) {
      logInfo("No agencies with Stripe accounts found");
      return;
    }

    logInfo(`Found ${agencias.length} agencies with Stripe accounts`);

    // Configurar payout para cada agencia
    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      logError("Failed to initialize Stripe client", stripeResult.error);
      return;
    }

    const stripe = stripeResult.data;

    for (const agencia of agencias) {
      try {
        logInfo(`Configuring payout for agency ${agencia.id}`, {
          stripeAccountId: agencia.stripe_account_id,
        });

        // Actualizar la cuenta conectada
        const account = await stripe.accounts.update(
          agencia.stripe_account_id!,
          {
            settings: {
              payouts: {
                schedule: {
                  interval: "weekly",
                  weekly_anchor: "monday", // Los pagos se procesan los lunes
                  delay_days: 7, // 7 días de delay
                },
              },
            },
          }
        );

        logInfo(`Payout configured successfully for agency ${agencia.id}`, {
          stripeAccountId: agencia.stripe_account_id,
          payoutSchedule: account.settings?.payouts?.schedule,
        });
      } catch (stripeError) {
        logError(
          `Error configuring payout for agency ${agencia.id}`,
          stripeError
        );
      }
    }

    logInfo("Payout configuration completed for all agencies");
  } catch (error) {
    logError("Error in configurePayoutsForAllAgencies", error);
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  configurePayoutsForAllAgencies()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

export { configurePayoutsForAllAgencies };
