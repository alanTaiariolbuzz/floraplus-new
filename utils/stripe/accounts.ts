import Stripe from "stripe";
import stripeClient from "./client";
import { logError, logInfo } from "../error/logger";
import { logWarning } from "../error/logWarning";
import { StripeError } from "../domain/errors/StripeError";
import { v4 as uuidv4 } from "uuid";
import {
  saveStripeAccountToDB,
  updateStripeAccountInDB,
  getStripeAccountFromDB,
  getagencyPrefillData
} from "./db";
import { PrefillData } from "@/app/api/agencias/onboarding/invitar/controller";
import { log } from "console";
// import { getagencyPrefillData } from "@/utils/stripe/db";




/**
 * Parsea una dirección completa en componentes para Stripe
 */
const parseAddress = (direccion: string) => {
  // Ejemplo: "1010 Metros Oeste Multiplaza, 27, San José Province, San José, 10203, Costa Rica"
  const parts = direccion.split(",").map((part) => part.trim());

  if (parts.length >= 5) {
    return {
      line1: parts[0] + ", " + parts[1], // "1010 Metros Oeste Multiplaza, 27"
      city: parts[3], // "San José"
      state: parts[2], // "San José Province"
      postal_code: parts[4], // "10203"
    };
  } else if (parts.length >= 3) {
    return {
      line1: parts[0],
      city: parts[1],
      state: parts[2],
      postal_code: parts[3] || "",
    };
  } else {
    return {
      line1: direccion,
      city: "",
      state: "",
      postal_code: "",
    };
  }
};

/**
 * Verifica si ya existe una cuenta Stripe para la agencia
 * @param agencyId ID de la agencia
 * @returns La cuenta existente si existe, null si no
 */
export const getExistingAccountForAgency = async (
  agencyId: number
): Promise<Stripe.Account | null> => {
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    logError({
      context: "stripe:getExistingAccountForAgency",
      message: "Failed to initialize Stripe client",
      error: stripeResult.error,
      agencyId,
    });
    return null;
  }

  const stripe = stripeResult.data;

  try {
    // Buscar cuentas existentes para esta agencia
    const existingAccounts = await stripe.accounts.list({
      limit: 100, // Aumentar el límite para buscar más cuentas
    });

    const existingAccount = existingAccounts.data.find(
      (acc) => acc.metadata?.agency_id === String(agencyId)
    );

    if (existingAccount) {
      logInfo("Cuenta existente encontrada para la agencia", {
        accountId: existingAccount.id,
        agencyId,
        country: existingAccount.country,
        status: existingAccount.charges_enabled,
      });
      return existingAccount;
    }

    logInfo("No se encontró cuenta existente para la agencia", {
      agencyId,
      totalAccountsChecked: existingAccounts.data.length,
    });

    return null;
  } catch (error) {
    const err = error as any;
    logError(err, {
      context: "stripe-accounts-getExistingAccountForAgency",
      agencyId,
      message: "Error al buscar cuenta existente para la agencia",
    });
    return null;
  }
};

/**
 * Crea una cuenta Stripe Custom para la agencia y la guarda en la DB.
 *  – Sin defaults: solo se envía a Stripe la info que realmente exista en `agencias`.
 */
export const createAccount = async (
  country: string,
  agencyId: number,
  businessType: string,
  clientIp?: string,
  userAgent?: string

) => {
  // 1 – Stripe client listo
  console.log("entro createAccount");
  
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    const errorMessage = stripeResult.error || "Stripe client not initialized";
    logError({
      context: "stripe:createAccount",
      message: errorMessage,
      country,
      agencyId,
    });
    throw new Error(errorMessage);
  }
  const stripe = stripeResult.data;
  console.log("stripe");
  console.log(stripe);
  
  // 2 – Verificar si ya existe una cuenta en la base de datos
  const { data: existingDBAccount } = await getStripeAccountFromDB(agencyId);
  if (existingDBAccount) {
    logInfo("Cuenta existente encontrada en DB, recuperando de Stripe", {
      agencyId,
      stripeAccountId: existingDBAccount.stripe_account_id,
    });

    try {
      // Recuperar la cuenta actualizada de Stripe
      const stripeAccount = await stripe.accounts.retrieve(
        existingDBAccount.stripe_account_id
      );
      return stripeAccount;
    } catch (retrieveError) {
      logError(retrieveError, {
        context: "stripe-accounts-retrieve-existing",
        agencyId,
        stripeAccountId: existingDBAccount.stripe_account_id,
        message: "Error al recuperar cuenta existente de Stripe",
      });
      // Si no se puede recuperar de Stripe, continuar con la creación
    }
  }

  // 3 – Verificar si ya existe una cuenta en Stripe (búsqueda por metadata)
  const existingStripeAccount = await getExistingAccountForAgency(agencyId);
  if (existingStripeAccount) {
    logInfo("Cuenta existente encontrada en Stripe, guardando en DB", {
      accountId: existingStripeAccount.id,
      agencyId,
      country: existingStripeAccount.country,
    });

    // Guardar en DB si no existe
    if (!existingDBAccount) {
      await saveStripeAccountToDB(existingStripeAccount, agencyId, country);
    }

    return existingStripeAccount;
  }

  // 4 – Datos de la agencia para pre-llenar
  const { data } = await getagencyPrefillData(agencyId);
  const prefill = data as PrefillData;
  if (!prefill) throw new Error("Agencia no encontrada");

  try {
    /** ------------------------------------------------------------------
     * 5 – Payload base (sin defaults). Vamos agregando secciones solo
     *     cuando exista información real en `prefill`.
     * ------------------------------------------------------------------*/
    const safeIp = (ip?: string) => {
      if (ip && ip !== "127.0.0.1") return ip;
      return "8.8.8.8"; // IP de fallback para pruebas locales
    };
    const userIp = safeIp(clientIp);
    const accountData: Stripe.AccountCreateParams = {
      country, // NO se pone valor por defecto
      business_type: businessType as Stripe.AccountCreateParams.BusinessType,
      capabilities: { transfers: { requested: true } },
      controller: {
        stripe_dashboard: { type: "none" },
        fees: {
          payer: "application",
        },
        losses: { payments: "application" },
        requirement_collection: "application",
      },
      metadata: { agency_id: String(agencyId) },
      settings: {
        payouts: {
          schedule: {
            interval: "weekly", // Cambiar de "daily" a "manual" por defecto
            delay_days: 5,
            weekly_anchor: "monday", // Requerido para intervalos semanales
          },
        },
      },
      tos_acceptance:
        country === "US"
          ? {
            date: Math.floor(Date.now() / 1000),
            ip: userIp,
            user_agent: userAgent ?? "unknown",
          }
          : country === "CR"
            ? {
              date: Math.floor(Date.now() / 1000),
              ip: userIp,
              service_agreement: "recipient",
            }
            : {
              date: Math.floor(Date.now() / 1000),
              ip: userIp,
            },
    };

    /* ---------- business_profile ---------- */
    if (
      prefill.nombre ||
      prefill.web ||
      prefill.email_contacto ||
      prefill.telefono
    ) {
      accountData.business_profile = {};
      if (prefill.nombre) {
        accountData.business_profile.name = prefill.nombre;
      }
      if (prefill.web) accountData.business_profile.url = prefill.web;
      if (prefill.email_contacto) {
        accountData.business_profile.support_email = prefill.email_contacto;
      }
      if (prefill.telefono) {
        accountData.business_profile.support_phone = prefill.telefono;
      }
    }

    if (prefill.email_contacto) {
      accountData.email = prefill.email_contacto;
    }
    if (prefill.nombre || prefill.web || prefill.email_contacto || prefill.telefono) {
      accountData.business_profile = {
        ...(prefill.nombre && { name: prefill.nombre }),
        ...(prefill.web && { url: prefill.web }),
        ...(prefill.email_contacto && { support_email: prefill.email_contacto }),
        ...(prefill.telefono && { support_phone: prefill.telefono }),
      };
    }

    // Email principal de la cuenta
    if (prefill.email_contacto) accountData.email = prefill.email_contacto;

    // Diferenciar por tipo de cuenta
    if (businessType === "individual") {
      accountData.individual = {
        ...(prefill.nombre_representante && {
          first_name: prefill.nombre_representante.split(" ")[0],
          last_name: prefill.nombre_representante.split(" ").slice(1).join(" "),
        }),
        ...(prefill.email_contacto && { email: prefill.email_contacto }),
        ...(prefill.telefono && { phone: prefill.telefono }),
        ...(prefill.dob_representante && {
          dob: (() => {
            const dob = new Date(prefill.dob_representante);
            return { day: dob.getDate(), month: dob.getMonth() + 1, year: dob.getFullYear() };
          })(),
        }),
        ...(prefill.direccion && { address: parseAddress(prefill.direccion) }),
      };
    } else {
      accountData.company = {
        ...(prefill.nombre_comercial && { name: prefill.nombre_comercial }),
        ...(prefill.cedula && { tax_id: String(prefill.cedula) }),
        ...(prefill.telefono && { phone: prefill.telefono }),
        ...(prefill.direccion && { address: { ...parseAddress(prefill.direccion), country: prefill.pais || country } }),
      };
    }

    // 6 – Crear la cuenta con idempotency key mejorado
    // Usar timestamp para evitar conflictos de idempotencia
    const timestamp = Date.now();
    const idempotencyKey = `acct_${agencyId}_${timestamp}`;

    logInfo("Intentando crear cuenta Stripe", {
      agencyId,
      country,
      idempotencyKey,
      hasPrefillData: !!prefill,
    });

    const account = await stripe.accounts.create(accountData, {
      idempotencyKey,
    });

    logInfo("Cuenta Stripe creada", {
      accountId: account.id,
      country: account.country,
      agencyId,
    });

    await saveStripeAccountToDB(account, agencyId, country);
    if ((businessType === "company" || businessType === "non_profit") && prefill.nombre_representante && prefill.dob_representante) {
      try {
        const dob = new Date(prefill.dob_representante);
        const personData: Stripe.AccountCreatePersonParams = {
          first_name: prefill.nombre_representante.split(" ")[0],
          last_name: prefill.nombre_representante.split(" ").slice(1).join(" "),
          dob: {
            day: dob.getDate(),
            month: dob.getMonth() + 1,
            year: dob.getFullYear(),
          },
          // Asocia el representante con el negocio
          relationship: {
            owner: true,
            director: true,
            representative: true,
          },
          email: prefill.email_contacto,
          phone: prefill.telefono,
          // Puedes agregar otros campos como `address` si es necesario
        };

        await stripe.accounts.createPerson(account.id, personData);
        logInfo("Objeto Person creado exitosamente para el representante", {
          accountId: account.id,
          representativeName: prefill.nombre_representante,
        });

      } catch (personError) {
        logError(personError, {
          context: "stripe-accounts-create-person",
          accountId: account.id,
          agencyId,
          message: "Error al crear el objeto Person para el representante",
        });
        // Aquí podrías decidir si quieres lanzar un error o continuar.
        // Lo ideal es notificar al usuario que se necesita completar la información.
      }
    }

    return account;
  } catch (err: any) {
    // Manejo específico para errores de idempotencia
    if (err.type === "StripeIdempotencyError") {
      logWarning("Error de idempotencia detectado", {
        context: "stripe-accounts-create",
        agencyId,
        country,
        errorType: err.type,
        message: err.message,
      });

      // Si es un error de idempotencia, intentar recuperar la cuenta existente
      try {
        const existingAccount = await getExistingAccountForAgency(agencyId);
        if (existingAccount) {
          return existingAccount;
        }
      } catch (recoveryError) {
        logError(recoveryError, {
          context: "stripe-accounts-recovery",
          agencyId,
          message: "Error al intentar recuperar cuenta existente",
        });
      }
    }

    logError(err, {
      context: "stripe-accounts-create",
      country,
      agencyId,
      errorType: err.type,
      errorMessage: err.message,
    });

    throw new StripeError("Error al crear cuenta de Stripe", err, {
      country,
      agencyId,
      errorType: err.type,
    });
  }
};

/**
 * Actualiza una cuenta de Stripe con los datos proporcionados
 * @param accountId ID de la cuenta Stripe a actualizar
 * @param data Datos para actualizar la cuenta, incluyendo los requisitos pendientes
 * @returns Cuenta Stripe actualizada
 */
export const updateAccount = async (
  accountId: string,
  data: Stripe.AccountUpdateParams,
  clientIp?: string
) => {
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    const errorMessage = stripeResult.error || "Stripe client not initialized";
    logError({
      context: "stripe:createAccount",
      message: "Failed to initialize Stripe client",
      error: errorMessage,
    });
    throw new Error(errorMessage);
  }
  const stripe = stripeResult.data;

  try {
    // Preparar los datos para incluir los requisitos específicos
    const updateData: Stripe.AccountUpdateParams = { ...data };

    // Manejar datos específicos para los requisitos comunes
    if (data.business_type) {
      updateData.business_type = data.business_type;
    }
 const safeIp = (ip?: string) => {
      if (ip && ip !== "127.0.0.1") return ip;
      return "8.8.8.8"; // IP de fallback para pruebas locales
    };
    const userIp = safeIp(clientIp);
   
    if (data.tos_acceptance) {
      // Asegurar que siempre usamos una IP válida
      if (!data.tos_acceptance.ip || data.tos_acceptance.ip === "127.0.0.1") {
        logInfo("Reemplazando IP no válida para tos_acceptance", {
          accountId,
          originalIp: data.tos_acceptance.ip || "127.0.0.1",
          newIp: userIp,
        });
      }

      updateData.tos_acceptance = {
        date: data.tos_acceptance.date ?? Math.floor(Date.now() / 1000),
        ip: safeIp(data.tos_acceptance.ip) || userIp,
      };
    }

    // Generar idempotency key para prevenir actualizaciones duplicadas
    const idempotencyKey = `update_account_${accountId}_${Date.now()}`;

    // Actualizar la cuenta con los datos preparados
    const account = await stripe.accounts.update(accountId, updateData, {
      idempotencyKey,
    });

    logInfo("Cuenta Stripe actualizada exitosamente", {
      accountId,
      updatedFields: Object.keys(updateData),
    });

    return account;
  } catch (error) {
    const err = error as any;
    logError(err, {
      context: "stripe-accounts-update",
      accountId,
      errorData: data,
      message: "Error al actualizar la cuenta de Stripe",
    });
    throw new StripeError("Error al actualizar la cuenta de Stripe", err, {
      accountId,
      updateFields: Object.keys(data),
    });
  }
};

/**
 * Obtiene los requisitos pendientes de una cuenta Stripe
 * @param accountId ID de la cuenta Stripe
 * @returns Objeto con los diferentes tipos de requisitos pendientes
 */
export const getCurrentlyDue = async (
  accountId: string
): Promise<{
  currently_due: string[];
  eventually_due: string[];
  past_due: string[];
  pending_verification: string[];
  future_requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
}> => {
  const stripeResult = stripeClient();

  if (!stripeResult.success) {
    logError({
      context: "stripe:getCurrentlyDue",
      message: "Failed to initialize Stripe client",
      error: stripeResult.error,
      accountId,
    });
    // Return empty arrays to prevent UI from breaking
    return {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
    };
  }

  const stripe = stripeResult.data;

  try {
    // Obtener los requisitos pendientes usando la API específica para ello
    const accountRequirements = await stripe.accounts.retrieve(accountId, {
      expand: ["requirements", "future_requirements"],
    });

    // Estructura para devolver todos los tipos de requisitos
    const requirements: {
      currently_due: string[];
      eventually_due: string[];
      past_due: string[];
      pending_verification: string[];
      future_requirements?: {
        currently_due: string[];
        eventually_due: string[];
        past_due: string[];
        pending_verification: string[];
      };
    } = {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
    };

    // La información de requisitos pendientes está en requirements
    if (accountRequirements.requirements) {
      // Requisitos actuales
      requirements.currently_due =
        (accountRequirements.requirements.currently_due as string[]) || [];
      requirements.eventually_due =
        (accountRequirements.requirements.eventually_due as string[]) || [];
      requirements.past_due =
        (accountRequirements.requirements.past_due as string[]) || [];
      requirements.pending_verification =
        (accountRequirements.requirements.pending_verification as string[]) ||
        [];
    }

    // Requisitos futuros (si existen) - Están a nivel del objeto account, no dentro de requirements
    if (accountRequirements.future_requirements) {
      requirements.future_requirements = {
        currently_due:
          accountRequirements.future_requirements.currently_due || [],
        eventually_due:
          accountRequirements.future_requirements.eventually_due || [],
        past_due: accountRequirements.future_requirements.past_due || [],
        pending_verification:
          accountRequirements.future_requirements.pending_verification || [],
      };
    }

    // Manejar paginación para requirements si fuera necesario
    // Este código se deja como comentario ya que normalmente los arrays
    // de requisitos no se paginan, pero es bueno tenerlo en cuenta
    /*
    if (accountRequirements.requirements?.currently_due?.has_more) {
      // Aquí implementar lógica para obtener todos los items paginados
      // Para requirements, esto no suele ser necesario en la mayoría de los casos
    }
    */

    return requirements;
  } catch (error) {
    const err = error as any;
    logError(err, {
      context: "stripe-accounts-getCurrentlyDue",
      accountId,
      message: "Error al obtener requisitos pendientes de la cuenta Stripe",
    });
    throw new StripeError(
      "Error al obtener requisitos pendientes de la cuenta Stripe",
      err,
      { accountId }
    );
  }
};
