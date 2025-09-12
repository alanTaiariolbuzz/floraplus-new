import { createAdminClient } from "@/utils/supabase/admin";
import { logError, logInfo } from "../error/logger";
import Stripe from "stripe";

/**
 * Guarda una cuenta Stripe en la base de datos y actualiza la agencia
 */
export const saveStripeAccountToDB = async (
  stripeAccount: Stripe.Account,
  agencyId: number,
  country: string
) => {
  const supabase = await createAdminClient();
  try {
    // Insertar en stripe_accounts
    const { error: dbError, data: dbData } = await supabase
      .from("stripe_accounts")
      .insert([
        {
          agencia_id: agencyId,
          stripe_account_id: stripeAccount.id,
          account_status: "pending",
          country: country,
          business_type: stripeAccount.business_type || null,
          charges_enabled: stripeAccount.charges_enabled || false,
          payouts_enabled: stripeAccount.payouts_enabled || false,
          requirements_currently_due:
            stripeAccount.requirements?.currently_due || [],
          requirements_eventually_due:
            stripeAccount.requirements?.eventually_due || [],
          requirements_past_due: stripeAccount.requirements?.past_due || [],
          requirements_disabled_reason:
            stripeAccount.requirements?.disabled_reason || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (dbError) {
      logError(dbError, {
        service: "stripeDB",
        method: "saveStripeAccountToDB",
        agencyId,
        stripeAccountId: stripeAccount.id,
        errorMessage: dbError.message,
      });
      return { dbError, dbData };
    }
    // Actualizar agencia
    const { error: updateError } = await supabase
      .from("agencias")
      .update({
        stripe_account_id: stripeAccount.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId);
    if (updateError) {
      logError(updateError, {
        service: "stripeDB",
        method: "saveStripeAccountToDB",
        agencyId,
        stripeAccountId: stripeAccount.id,
        errorMessage: updateError.message,
      });
      return { dbError: updateError, dbData };
    }
    return { dbError: null, dbData };
  } catch (err: any) {
    logError(err, {
      service: "stripeDB",
      method: "saveStripeAccountToDB",
      agencyId,
      stripeAccountId: stripeAccount.id,
      errorMessage: err.message,
    });
    return { dbError: err, dbData: null };
  }
};

/**
 * Actualiza la información de una cuenta Stripe en la tabla stripe_accounts
 * agencyId no se usa, solo update por stripe_account_id
 */
export const updateStripeAccountInDB = async (
  stripeAccount: Stripe.Account
) => {
  const supabase = await createAdminClient();
  try {
    // Buscar si ya existe
    const { data: existing, error: queryError } = await supabase
      .from("stripe_accounts")
      .select("id")
      .eq("stripe_account_id", stripeAccount.id)
      .single();
    if (!existing) {
      const errorMsg = "No existe registro en stripe_accounts para update";
      logError(errorMsg, {
        service: "stripeDB",
        method: "updateStripeAccountInDB",
        stripeAccountId: stripeAccount.id,
      });
      return { error: errorMsg, data: null };
    }
    const accountData = {
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
    const result = await supabase
      .from("stripe_accounts")
      .update(accountData)
      .eq("id", existing.id)
      .select()
      .single();
    if (result.error) {
      logError(result.error, {
        service: "stripeDB",
        method: "updateStripeAccountInDB",
        stripeAccountId: stripeAccount.id,
        errorMessage: result.error.message,
      });
    }
    return result;
  } catch (err: any) {
    logError(err, {
      service: "stripeDB",
      method: "updateStripeAccountInDB",
      stripeAccountId: stripeAccount.id,
      errorMessage: err.message,
    });
    return { error: err, data: null };
  }
};

/**
 * Verifica si ya existe una cuenta Stripe en la base de datos para la agencia
 */
export const getStripeAccountFromDB = async (agencyId: number) => {
  const supabase = await createAdminClient();
  try {
    const { data, error } = await supabase
      .from("stripe_accounts")
      .select("*")
      .eq("agencia_id", agencyId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No se encontró registro
        logInfo("No se encontró cuenta Stripe en DB para la agencia", {
          service: "stripeDB",
          method: "getStripeAccountFromDB",
          agencyId,
        });
        return { error: null, data: null };
      }
      logError(error, {
        service: "stripeDB",
        method: "getStripeAccountFromDB",
        agencyId,
        errorMessage: error.message,
      });
      return { error, data: null };
    }

    logInfo("Cuenta Stripe encontrada en DB", {
      service: "stripeDB",
      method: "getStripeAccountFromDB",
      agencyId,
      stripeAccountId: data.stripe_account_id,
      status: data.account_status,
    });

    return { error: null, data };
  } catch (err: any) {
    logError(err, {
      service: "stripeDB",
      method: "getStripeAccountFromDB",
      agencyId,
      errorMessage: err.message,
    });
    return { error: err, data: null };
  }
};

export const getagencyPrefillData = async (agencyId: number) => {
  const supabase = await createAdminClient();
  try {
    const { data, error } = await supabase
      .from("agencias")
      .select(
        "id, nombre, pais, email_contacto, telefono, direccion, web, nombre_comercial, cedula, fee, nombre_representante, dob_representante"
      )
      .eq("id", agencyId)
      .single();
    if (error) {
      logError(error, {
        service: "stripeDB",
        method: "getagencyPrefillData",
        agencyId,
        errorMessage: error.message,
      });
      return { error, data: null };
    }
    //retornar datos prellenados
    return {
      error: null,
      data: {
        id: data.id,
        nombre: data.nombre,
        pais: data.pais,
        email_contacto: data.email_contacto,
        telefono: data.telefono,
        direccion: data.direccion,
        web: data.web,
        nombre_comercial: data.nombre_comercial,
        cedula: data.cedula,
        fee: data.fee,
        nombre_representante: data.nombre_representante,
        dob_representante: data.dob_representante,
      },
    };
  } catch (err: any) {
    logError(err, {
      service: "stripeDB",
      method: "getagencyPrefillData",
      agencyId,
      errorMessage: err.message,
    });
    return { error: err, data: null };
  }
};

/**
 * Actualiza el estado de una reserva a 'confirmed' en la tabla reservas
 * Si la reserva no existe en reservas, busca en abandoned_cart y la recupera
 */
export const updateReservaToConfirmed = async (reservaId: number | string) => {
  const db = await createAdminClient();

  // Primero intentar actualizar en la tabla reservas
  const { data: existingReservation, error: updateError } = await db
    .from("reservas")
    .update({
      estado: "confirmed",
      cancelled_at: null, // Limpiar cancelled_at cuando se confirma la reserva
    })
    .eq("id", reservaId)
    .select()
    .single();

  if (updateError) {
    // Si no existe en reservas, buscar en abandoned_cart
    logInfo(
      "Reserva no encontrada en tabla principal, buscando en abandoned_cart",
      { reservaId }
    );

    const { data: abandonedReservation, error: fetchError } = await db
      .from("abandoned_cart")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (fetchError || !abandonedReservation) {
      logError("Reserva no encontrada ni en reservas ni en abandoned_cart", {
        reservaId,
        error: updateError,
      });
      throw new Error("Reserva no encontrada");
    }

    // Recuperar la reserva desde abandoned_cart
    const reservationData = {
      turno_id: abandonedReservation.turno_id,
      agencia_id: abandonedReservation.agencia_id,
      cliente_id: abandonedReservation.cliente_id,
      monto_total: abandonedReservation.monto_total,
      pago_referencia: abandonedReservation.pago_referencia,
      created_at: abandonedReservation.created_at,
      updated_at: new Date().toISOString(),
      estado: "confirmed", // Cambiar a confirmada
      expires_at: abandonedReservation.expires_at,
      payment_intent_id: abandonedReservation.payment_intent_id,
      actividad_id: abandonedReservation.actividad_id,
      pago_id: abandonedReservation.pago_id,
      codigo_reserva: abandonedReservation.codigo_reserva,
    };

    // Insertar en reservas
    const { data: newReservation, error: insertError } = await db
      .from("reservas")
      .insert(reservationData)
      .select()
      .single();

    if (insertError) {
      logError("Error restaurando reserva desde abandoned_cart", {
        reservaId,
        error: insertError,
      });
      throw new Error("Error restaurando reserva desde abandoned_cart");
    }

    // Eliminar de abandoned_cart
    const { error: deleteError } = await db
      .from("abandoned_cart")
      .delete()
      .eq("id", abandonedReservation.id);

    if (deleteError) {
      logError("Error eliminando de abandoned_cart", {
        reservaId,
        error: deleteError,
      });
      // No lanzamos error aquí porque la reserva ya se restauró
    }

    logInfo("Reserva recuperada desde abandoned_cart y confirmada", {
      reservaId,
      codigoReserva: abandonedReservation.codigo_reserva,
    });

    return newReservation;
  }

  if (typeof logInfo === "function") {
    logInfo("Reserva actualizada a confirmed", { reservaId });
  }

  return existingReservation;
};
