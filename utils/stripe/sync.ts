import { createClient } from "@/utils/supabase/server";
import stripeClient from "./client";
import { logError, logInfo } from "../error/logger";
import { logWarning } from "../error/logWarning";
import { StripeError } from "../domain/errors/StripeError";
import Stripe from "stripe";
import { id } from "date-fns/locale";

/**
 * Sincroniza el estado de la tabla agencias basándose en el estado real de Stripe
 * @param stripeAccountId ID de la cuenta en Stripe
 */
export async function syncAgencyStatusWithStripe(stripeAccountId: string) {
  try {
    const supabase = await createClient();
    const stripeResult = stripeClient();

    if (!stripeResult.success) {
      throw new Error(stripeResult.error || "Cliente Stripe no inicializado");
    }
    const stripe = stripeResult.data;

    // Buscar la agencia asociada a este stripe_account_id
    const { data: agency, error: agencyError } = await supabase
      .from("agencias")
      .select("id, activa")
      .eq("stripe_account_id", stripeAccountId)
      .single();

    if (agencyError || !agency) {
      return {
        success: false,
        error: "No existe una agencia asociada a esta cuenta Stripe",
      };
    }

    // Obtener detalles actualizados de la cuenta desde Stripe
    const stripeAccount = await stripe.accounts.retrieve(stripeAccountId);

    // Determinar si la agencia debería estar activa basándose en el estado de Stripe
    const shouldBeActive =
      stripeAccount.charges_enabled &&
      stripeAccount.details_submitted &&
      !stripeAccount.requirements?.disabled_reason;

    // Solo actualizar si el estado es diferente
    if (agency.activa !== shouldBeActive) {
      const { error: updateError } = await supabase
        .from("agencias")
        .update({
          activa: shouldBeActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agency.id);

      if (updateError) {
        logError(updateError, {
          service: "stripeSync",
          method: "syncAgencyStatusWithStripe",
          stripeAccountId,
          agencyId: agency.id,
          errorMessage: updateError.message,
        });
        return { success: false, error: updateError.message };
      }

      logInfo("Estado de agencia sincronizado con Stripe", {
        stripeAccountId,
        agencyId: agency.id,
        previousStatus: agency.activa,
        newStatus: shouldBeActive,
        chargesEnabled: stripeAccount.charges_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
        disabledReason: stripeAccount.requirements?.disabled_reason,
      });
    }

    return {
      success: true,
      data: { agencyId: agency.id, isActive: shouldBeActive },
    };
  } catch (error) {
    logError(error, {
      service: "stripeSync",
      method: "syncAgencyStatusWithStripe",
      stripeAccountId,
      message: "Error al sincronizar estado de agencia con Stripe",
    });
    return {
      success: false,
      error: "Error al sincronizar estado de agencia con Stripe",
    };
  }
}

/**
 * Sincroniza la información de una cuenta Stripe con nuestra base de datos
 * @param stripeAccountId ID de la cuenta en Stripe
 */
export async function syncStripeAccount(stripeAccountId: string) {
  try {
    const supabase = await createClient();
    const stripeResult = stripeClient();

    if (!stripeResult.success) {
      throw new Error(stripeResult.error || "Cliente Stripe no inicializado");
    }
    const stripe = stripeResult.data;

    // Buscar la agencia asociada a este stripe_account_id
    const { data: agency, error: agencyError } = await supabase
      .from("agencias")
      .select("id")
      .eq("stripe_account_id", stripeAccountId)
      .single();

    if (agencyError || !agency) {
      return {
        success: false,
        error: "No existe una agencia asociada a esta cuenta Stripe",
      };
    }

    const agencyId = agency.id;

    // Obtener detalles actualizados de la cuenta desde Stripe
    const stripeAccount = await stripe.accounts.retrieve(stripeAccountId, {
      expand: ["external_accounts"],
    });

    // Extraer información relevante para almacenar
    const accountData = {
      agencia_id: agencyId,
      stripe_account_id: stripeAccount.id,
      account_status: stripeAccount.requirements?.disabled_reason
        ? "restricted"
        : stripeAccount.charges_enabled
          ? "active"
          : "pending",
      country: stripeAccount.country,
      business_type: stripeAccount.business_type,
      charges_enabled: stripeAccount.charges_enabled,
      payouts_enabled: stripeAccount.payouts_enabled,
      requirements_currently_due:
        stripeAccount.requirements?.currently_due || [],
      requirements_eventually_due:
        stripeAccount.requirements?.eventually_due || [],
      requirements_past_due: stripeAccount.requirements?.past_due || [],
      requirements_disabled_reason: stripeAccount.requirements?.disabled_reason,
      updated_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
    };

    // Si hay información de cuenta bancaria, extraer los últimos 4 dígitos y el banco
    if (
      stripeAccount.external_accounts &&
      "data" in stripeAccount.external_accounts &&
      stripeAccount.external_accounts.data &&
      stripeAccount.external_accounts.data.length > 0
    ) {
      const bankAccount = stripeAccount.external_accounts
        .data[0] as Stripe.BankAccount;
      // @ts-ignore
      accountData["external_account_last4"] = bankAccount.last4;
      // @ts-ignore
      accountData["external_account_bank_name"] = bankAccount.bank_name || null;
      // @ts-ignore
      accountData["external_account_currency"] = bankAccount.currency;
    }

    // Buscar si ya existe un registro para esta cuenta
    const { data: existingAccount, error: queryError } = await supabase
      .from("stripe_accounts")
      .select("id")
      .eq("stripe_account_id", stripeAccountId)
      .single();

    if (queryError && queryError.code !== "PGRST116") {
      // PGRST116 = no se encontraron resultados
      throw queryError;
    }

    let result;
    if (existingAccount) {
      // Actualizar el registro existente
      result = await supabase
        .from("stripe_accounts")
        .update(accountData)
        .eq("id", existingAccount.id)
        .select()
        .single();
    } else {
      // Crear un nuevo registro
      result = await supabase
        .from("stripe_accounts")
        .insert([accountData])
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    // Sincronizar también el estado de la agencia
    await syncAgencyStatusWithStripe(stripeAccountId);

    logInfo("Cuenta Stripe sincronizada exitosamente", {
      stripeAccountId,
      agencyId,
      status: accountData.account_status,
    });

    return { success: true, data: result.data };
  } catch (error) {
    logError(
      new StripeError("Error al sincronizar cuenta Stripe", error, {
        stripeAccountId,
      })
    );
    return { success: false, error: "Error al sincronizar cuenta Stripe" };
  }
}

/**
 * Obtiene el estado actual de una cuenta Stripe desde nuestra base de datos
 * @param stripeAccountId ID de la cuenta en Stripe
 */
export async function getStripeAccountStatus(stripeAccountId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("stripe_accounts")
      .select(
        `
        id,
        agencia_id,
        account_status,
        charges_enabled,
        payouts_enabled,
        requirements_currently_due,
        requirements_past_due,
        requirements_disabled_reason,
        last_sync_at
      `
      )
      .eq("stripe_account_id", stripeAccountId)
      .single();

    if (error) {
      throw error;
    }

    // Si los datos tienen más de 1 día, sincronizar con Stripe
    const lastSyncDate = new Date(data.last_sync_at);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    if (lastSyncDate < oneDayAgo) {
      // Sincronizar en segundo plano sin esperar el resultado
      syncStripeAccount(stripeAccountId)
        .then(() =>
          logInfo("Sincronización en segundo plano completada", {
            stripeAccountId,
          })
        )
        .catch((err) =>
          logError(err, { context: "background-sync", stripeAccountId })
        );
    }

    return { success: true, data };
  } catch (error) {
    const err = error as any;
    logError(err, {
      context: "stripe-sync-syncStripeAccount",
      stripeAccountId,
      message: "Error al sincronizar cuenta Stripe",
    });
    return { success: false, error: err.message || String(err) };
  }
}
