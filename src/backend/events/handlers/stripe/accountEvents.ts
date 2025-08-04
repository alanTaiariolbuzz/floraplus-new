import { logInfo, logError } from "@/utils/error/logger";
import { syncAgencyStatusWithStripe } from "@/utils/stripe/sync";
import Stripe from "stripe";
import { EventHandlerResult } from "../../index";

export async function handleAccountUpdated( evt: Stripe.Event): Promise<EventHandlerResult> {
 
    
    const account = evt.data.object as Stripe.Account;
    try {


    logInfo("Processing account.updated webhook", {
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });

    // Sincronizar el estado de la agencia con Stripe
    const syncResult = await syncAgencyStatusWithStripe(account.id);

    if (syncResult.success) {
      logInfo("Account status synced successfully", {
        accountId: account.id,
        syncResult: syncResult.data,
      });
    } else {
      logError("Failed to sync account status", {
        accountId: account.id,
        error: syncResult.error,
      });
    }
    return { success: true, message: "Account updated processed successfully" };
  } catch (error) {
    logError(error, {
      context: "handleAccountUpdated",
      accountId: account.id,
    });
    return {
      success: false,
      message: "Error processing account updated",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function handleAccountDeauthorized( evt: Stripe.Event): Promise<EventHandlerResult> {
        const account = evt.data.object as Stripe.Account;
  try {
    logInfo("Processing account.application.deauthorized webhook", {
      accountId: account.id,
    });

    // Marcar la agencia como inactiva cuando se desautoriza la aplicación
    const syncResult = await syncAgencyStatusWithStripe(account.id);

    if (syncResult.success) {
      logInfo("Account deauthorization processed successfully", {
        accountId: account.id,
        syncResult: syncResult.data,
      });
    } else {
      logError("Failed to process account deauthorization", {
        accountId: account.id,
        error: syncResult.error,
      });
    }

    return { success: true, message: "Account deauthorized processed successfully" };
  } catch (error) {
    logError(error, {
      context: "handleAccountDeauthorized",
      accountId: account.id,
    });
    return {
      success: false,
      message: "Error processing account deauthorized",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function handleAccountAuthorized( evt: Stripe.Event): Promise<EventHandlerResult> {
        const account = evt.data.object as Stripe.Account;
  try {

    logInfo("Processing account.application.authorized webhook", {
      accountId: account.id,
    });

    // Sincronizar el estado cuando se autoriza la aplicación
    const syncResult = await syncAgencyStatusWithStripe(account.id);

    if (syncResult.success) {
      logInfo("Account authorization processed successfully", {
        accountId: account.id,
        syncResult: syncResult.data,
      });
    } else {
      logError("Failed to process account authorization", {
        accountId: account.id,
        error: syncResult.error,
      });
    }
    return { success: true, message: "Account authorized processed successfully" };
  } catch (error) {
    logError(error, {
      context: "handleAccountAuthorized",
      accountId: account.id,
    });
    return {
      success: false,
      message: "Error processing account authorized",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Configuración para no analizar el cuerpo de la solicitud como JSON
// Esto es necesario porque Stripe requiere el cuerpo raw para verificar la firma
export const config = {
  api: {
    bodyParser: false,
  },
};
