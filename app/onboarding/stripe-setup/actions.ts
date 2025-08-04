"use server";

/* Esta ruta esta deprecada, se debe usar la ruta /onboarding/stripe-setup */

import { createClient } from "@/utils/supabase/server";
import { logError, logInfo } from "@/utils/error/logger";
import stripeClient from "@/utils/stripe/client";
import { headers } from "next/headers"; // ← nuevo
import {
  createAccount,
  updateAccount,
  getCurrentlyDue,
} from "@/utils/stripe/accounts";
import Stripe from "stripe";

/**
 * Crea una cuenta de Stripe para la agencia y actualiza la agencia con el ID de cuenta
 */
export async function createStripeAccountAction(
  agencyId: number,
  countryCode: string
): Promise<{
  success?: boolean;
  stripeAccountId?: string;
  requiredFields?: string[];
  stripeRequirements?: {
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
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Obtener datos de la agencia para verificar permisos
    const { data: agency, error: agencyError } = await supabase
      .from("agencias")
      .select("id, pais, nombre, email_contacto")
      .eq("id", agencyId)
      .single();

    if (agencyError) {
      logError(agencyError, {
        service: "stripeSetupActions",
        method: "createStripeAccountAction",
        agencyId,
        errorMessage: agencyError.message,
      });
      return {
        error: `Error al obtener datos de la agencia: ${agencyError.message}`,
      };
    }

    // 2. Crear cuenta de Stripe
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
      hdrs.get("x-real-ip") ||
      "1.1.1.1";

    try {
      const stripeAccount = await createAccount(countryCode, agencyId, ip);

      // 3. Actualizar la agencia con el ID de cuenta de Stripe
      const { error: updateError } = await supabase
        .from("agencias")
        .update({
          stripe_account_id: stripeAccount.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agencyId);

      if (updateError) {
        logError(updateError, {
          service: "stripeSetupActions",
          method: "createStripeAccountAction",
          agencyId,
          stripeAccountId: stripeAccount.id,
          errorMessage: updateError.message,
        });
        return {
          error: `Error al actualizar la agencia con el ID de Stripe: ${updateError.message}`,
        };
      }

      // 4. Guardar información detallada en la tabla stripe_accounts
      const { error: stripeAccountError } = await supabase
        .from("stripe_accounts")
        .insert([
          {
            agencia_id: agencyId,
            stripe_account_id: stripeAccount.id,
            account_status: "pending",
            country: countryCode,
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
        ]);

      if (stripeAccountError) {
        logError(stripeAccountError, {
          service: "stripeSetupActions",
          method: "createStripeAccountAction",
          agencyId,
          stripeAccountId: stripeAccount.id,
          errorMessage: stripeAccountError.message,
        });
        // No devolvemos error porque la agencia ya se actualizó correctamente
        // Solo registramos el error para investigarlo posteriormente
      }

      // 4. Determinar campos requeridos basados en el país
      const requiredFields = await getRequiredFieldsByCountry(stripeAccount.id);

      // 5. Obtener los requisitos pendientes directamente de Stripe
      const currentlyDue = await getCurrentlyDue(stripeAccount.id);

      logInfo("Cuenta Stripe creada exitosamente para agencia", {
        agencyId,
        stripeAccountId: stripeAccount.id,
        countryCode,
        stripeRequirements: currentlyDue,
      });

      return {
        success: true,
        stripeAccountId: stripeAccount.id,
        requiredFields,
        stripeRequirements: currentlyDue, // El objeto completo de requisitos
      };
    } catch (stripeError: any) {
      logError(stripeError, {
        service: "stripeSetupActions",
        method: "createStripeAccountAction",
        agencyId,
        errorMessage: stripeError.message,
      });
      return {
        error: `Error al crear cuenta de Stripe: ${stripeError.message}`,
      };
    }
  } catch (e: any) {
    logError(e, {
      service: "stripeSetupActions",
      method: "createStripeAccountAction",
      agencyId,
      unexpectedError: true,
      errorMessage: e.message,
    });
    return { error: e.message || "Error inesperado al crear cuenta de Stripe" };
  }
}

/**
 * Completa la configuración de la cuenta de Stripe y activa la agencia
 */
export async function completeStripeSetupAction(
  agencyId: number,
  stripeAccountId: string,
  accountDetails: {
    [key: string]: any;
  }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Obtener datos de la agencia para verificar permisos
    const { data: agency, error: agencyError } = await supabase
      .from("agencias")
      .select("id, pais, stripe_account_id")
      .eq("id", agencyId)
      .single();

    if (agencyError) {
      logError(agencyError, {
        service: "stripeSetupActions",
        method: "completeStripeSetupAction",
        agencyId,
        errorMessage: agencyError.message,
      });
      return {
        error: `Error al obtener datos de la agencia: ${agencyError.message}`,
      };
    }

    if (agency.stripe_account_id !== stripeAccountId) {
      return {
        error:
          "El ID de cuenta de Stripe no coincide con el registrado para esta agencia",
      };
    }

    // 2. Actualizar la cuenta de Stripe con los detalles de negocio y los requisitos pendientes
    try {
      // Construir el objeto de actualización base
      const updateData: any = {
        business_profile: {
          name: accountDetails.businessName,
          url: accountDetails.website || null,
          mcc: "5734",
          product_description: "Servicios de agencia de viajes",
        },
        business_type: "company",
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: accountDetails.tos_acceptance_ip || "127.0.0.1",
        },
        email: accountDetails.representative?.email,
        company: {
          name: accountDetails.businessName,
          tax_id: accountDetails.taxId || accountDetails.cedula,
          phone: accountDetails.representative?.phone,
          address: {
            line1: accountDetails.representative?.address.line1,
            line2: accountDetails.representative?.address.line2 || "",
            city: accountDetails.representative?.address.city,
            state: accountDetails.representative?.address.state,
            postal_code: accountDetails.representative?.address.postal_code,
            country: accountDetails.representative?.address.country,
          },
        },
      };

      // Validar que el tax_id esté presente
      if (!updateData.company.tax_id) {
        throw new Error(
          "El número de identificación fiscal (cédula) es requerido"
        );
      }

      // Manejar external_account si se proporciona
      if (accountDetails.external_account) {
        let bankToken: string | undefined;
        let bankCurrency: string | undefined;

        try {
          // Intentar parsear si es un string JSON
          const externalAccountData =
            typeof accountDetails.external_account === "string"
              ? JSON.parse(accountDetails.external_account)
              : accountDetails.external_account;

          // Extraer el token y la moneda
          bankToken = externalAccountData.token;
          bankCurrency = externalAccountData.currency?.toLowerCase();

          // Validar que el token tenga el formato correcto
          if (!bankToken || !bankToken.startsWith("btok_")) {
            throw new Error("Token bancario inválido o mal formateado");
          }

          // Validar la moneda
          if (!bankCurrency || !["crc", "usd"].includes(bankCurrency)) {
            throw new Error("Moneda no soportada. Debe ser 'crc' o 'usd'");
          }

          // Validar que el país sea CR
          if (externalAccountData.country?.toLowerCase() !== "cr") {
            throw new Error("El país debe ser Costa Rica (CR)");
          }
        } catch (error) {
          // Si el parseo falla, asumimos que es el token directo
          bankToken = accountDetails.external_account;

          // Validar que el token directo tenga el formato correcto
          if (!bankToken || !bankToken.startsWith("btok_")) {
            throw new Error("Token bancario inválido o mal formateado");
          }
        }

        // Asignar solo el token al external_account
        updateData.external_account = bankToken;
      } else if (accountDetails.bank_token) {
        let token: string;
        let currency: string | undefined;

        // Manejar diferentes formatos posibles del token
        if (
          typeof accountDetails.bank_token === "object" &&
          accountDetails.bank_token !== null
        ) {
          // Si es un objeto, intentar extraer el token y la moneda
          if ("token" in accountDetails.bank_token) {
            token = accountDetails.bank_token.token;
            currency = accountDetails.bank_token.currency?.toLowerCase();
          } else {
            throw new Error("Objeto bank_token no contiene el campo 'token'");
          }
        } else if (typeof accountDetails.bank_token === "string") {
          // Si es un string, intentar parsear si es JSON
          try {
            const parsed = JSON.parse(accountDetails.bank_token);
            token = parsed.token || accountDetails.bank_token;
            currency = parsed.currency?.toLowerCase();
          } catch {
            // Si no es JSON válido, usar el string directamente
            token = accountDetails.bank_token;
          }
        } else {
          throw new Error("Formato de bank_token no válido");
        }

        // Validar el formato del token
        if (!token || !token.startsWith("btok_")) {
          console.error("[completeStripeSetupAction] Token inválido:", {
            token,
            originalValue: accountDetails.bank_token,
          });
          throw new Error("Token bancario inválido o mal formateado");
        }

        // Validar la moneda si está presente
        if (currency && !["crc", "usd"].includes(currency)) {
          throw new Error("Moneda no soportada. Debe ser 'crc' o 'usd'");
        }

        updateData.external_account = token;
      } else {
        throw new Error("No se proporcionó token bancario");
      }

      // Validar que todos los campos requeridos estén presentes
      const requiredFields = [
        "business_profile.name",
        "company.name",
        "company.tax_id",
        "external_account",
      ];

      const missingFields = requiredFields.filter((field) => {
        const value = field
          .split(".")
          .reduce((obj, key) => obj?.[key], updateData);
        return value === undefined || value === null || value === "";
      });

      if (missingFields.length > 0) {
        throw new Error(
          `Faltan campos requeridos: ${missingFields.join(", ")}`
        );
      }

      // Registrar los datos que se enviarán a Stripe

      // Obtener IP real para tos_acceptance de la actualización
      const hdrs = await headers();
      const ip =
        hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
        hdrs.get("x-real-ip") ||
        "1.1.1.1";

      const updatedAccount = await updateAccount(
        stripeAccountId,
        updateData,
        ip
      );

      // Si hay información del representante legal, crear un person
      if (accountDetails.representative) {
        const { representative } = accountDetails;
        const stripeResult = stripeClient();
        if (!stripeResult.success) {
          throw new Error(
            stripeResult.error || "Cliente Stripe no inicializado"
          );
        }
        const stripe = stripeResult.data;

        try {
          // Crear el person para el representante legal
          const person = await stripe.accounts.createPerson(stripeAccountId, {
            first_name: representative.firstName,
            last_name: representative.lastName,
            email: representative.email,
            phone: representative.phone,
            dob: {
              day: representative.dob.day,
              month: representative.dob.month,
              year: representative.dob.year,
            },
            address: {
              line1: representative.address.line1,
              line2: representative.address.line2 || "",
              city: representative.address.city,
              state: representative.address.state,
              postal_code: representative.address.postal_code,
              country: representative.address.country,
            },
            relationship: {
              representative: true,
              title: "Representante Legal",
              owner: true,
              executive: true,
            },
            verification: {
              // Si tienes archivo subido, pasar file_id aquí:
              // id_number: representative.identificationNumber, // NO va aquí fuera
              // document: { front: fileIdFront, back: fileIdBack }, // Opcional si tienes archivos
            },
            id_number: representative.identificationNumber, // Este campo puede ir aquí o dentro de verification.id_number (depende de API)
          });

         

          // Para dejar claro que la persona es el representante legal
          await stripe.accounts.update(stripeAccountId, {
            tos_acceptance: {
              date: Math.floor(Date.now() / 1000),
              ip: "1.2.3.4", // IP del usuario, si la tienes
            },
          });


        } catch (personError: any) {
          console.error("[completeStripeSetupAction] Error al crear persona:", {
            error: personError,
            stripeAccountId,
            representative: {
              name: `${representative.firstName} ${representative.lastName}`,
              email: representative.email,
            },
          });
          throw new Error(
            `Error al crear representante legal: ${personError.message}`
          );
        }
      }

      // 3. Actualizar la información de la cuenta Stripe en nuestra base de datos
      const stripeResult = stripeClient();
      if (!stripeResult.success) {
        throw new Error(stripeResult.error || "Cliente Stripe no inicializado");
      }
      const stripe = stripeResult.data;

      const stripeAccountData = await stripe.accounts.retrieve(
        stripeAccountId,
        {
          expand: ["external_accounts"],
        }
      );

      // Extraer información de la cuenta bancaria si existe
      let externalAccountData = {};
      if (
        stripeAccountData.external_accounts?.data &&
        stripeAccountData.external_accounts.data.length > 0
      ) {
        const bankAccount = stripeAccountData.external_accounts
          .data[0] as Stripe.BankAccount;
        externalAccountData = {
          external_account_last4: bankAccount.last4,
          external_account_bank_name: bankAccount.bank_name || null,
          external_account_currency: bankAccount.currency,
        };
      }

      // Actualizar la información en nuestra tabla
      const { error: stripeAccountUpdateError } = await supabase
        .from("stripe_accounts")
        .update({
          account_status: stripeAccountData.charges_enabled
            ? "active"
            : "pending",
          business_type: stripeAccountData.business_type,
          charges_enabled: stripeAccountData.charges_enabled,
          payouts_enabled: stripeAccountData.payouts_enabled,
          requirements_currently_due:
            stripeAccountData.requirements?.currently_due || [],
          requirements_eventually_due:
            stripeAccountData.requirements?.eventually_due || [],
          requirements_past_due: stripeAccountData.requirements?.past_due || [],
          requirements_disabled_reason:
            stripeAccountData.requirements?.disabled_reason,
          ...externalAccountData,
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        })
        .eq("stripe_account_id", stripeAccountId);

      if (stripeAccountUpdateError) {
        logError(stripeAccountUpdateError, {
          service: "stripeSetupActions",
          method: "completeStripeSetupAction",
          agencyId,
          stripeAccountId,
          errorMessage: stripeAccountUpdateError.message,
        });
        // Continuamos aunque haya error en esta actualización
      }

      // 4. Marcar la agencia como activa
      const { error: updateError } = await supabase
        .from("agencias")
        .update({
          activa: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agencyId);

      if (updateError) {
        logError(updateError, {
          service: "stripeSetupActions",
          method: "completeStripeSetupAction",
          agencyId,
          stripeAccountId,
          errorMessage: updateError.message,
        });
        return { error: `Error al activar la agencia: ${updateError.message}` };
      }

      logInfo("Configuración de Stripe completada y agencia activada", {
        agencyId,
        stripeAccountId,
      });

      return { success: true };
    } catch (stripeError: any) {
      logError(stripeError, {
        service: "stripeSetupActions",
        method: "completeStripeSetupAction",
        agencyId,
        stripeAccountId,
        errorMessage: stripeError.message,
      });
      return {
        error: `Error al actualizar cuenta de Stripe: ${stripeError.message}`,
      };
    }
  } catch (e: any) {
    logError(e, {
      service: "stripeSetupActions",
      method: "completeStripeSetupAction",
      agencyId,
      unexpectedError: true,
      errorMessage: e.message,
    });
    return {
      error:
        e.message || "Error inesperado al completar la configuración de Stripe",
    };
  }
}

/**
 * Determina los campos requeridos para el formulario de onboarding según el país
 * @param accountId ID de la cuenta Stripe
 * @returns Lista de nombres de campos que deben mostrarse en el formulario
 */
async function getRequiredFieldsByCountry(
  accountId: string
): Promise<string[]> {
  // Obtenemos la cuenta para saber el país
  //const stripe = stripeClient();
  const stripeResult = stripeClient();
  if (!stripeResult.success) {
    throw new Error(stripeResult.error);
  }
  const stripe = stripeResult.data;
  if (!stripe) {
    logError(new Error("Stripe client not initialized"), {
      context: "getRequiredFieldsByCountry",
    });
    return ["businessName", "businessType", "email", "phone"]; // Devolvemos campos básicos si hay error
  }

  // @ts-ignore
  const account = await stripe.accounts.retrieve(accountId);
  const countryCode = account.country || "US";

  // Campos base requeridos para todos los países
  const requiredFields = ["businessName", "businessType", "email", "phone"];

  // Campos adicionales según el país
  if (["US", "MX", "BR", "CL", "CO", "AR"].includes(countryCode)) {
    requiredFields.push("taxId"); // ID fiscal requerido en estos países
  }

  if (["US"].includes(countryCode)) {
    requiredFields.push("website"); // Sitio web requerido en US
  }

  // Además, podemos consultar los requisitos pendientes de Stripe para información
  const currentlyDue = await getCurrentlyDue(accountId);
  logInfo("Requisitos actuales de Stripe", { accountId, currentlyDue });

  return requiredFields;
}
