import { inviteAgencyAdminUser } from "@/utils/auth/invite";
import { createAgencia, updateAgencia } from "./service";
import { CreateNuevaAgenciaInput } from "./schema";
import { logError, logInfo } from "@/utils/error/logger";
import { createAdminClient } from "@/utils/supabase/admin";
import { createAccount } from "@/utils/stripe/accounts";
export type PrefillData = {
  id: number;
  nombre: string;
  pais: string;
  email_contacto: string;
  telefono: string;
  direccion: string;
  web: string;
  nombre_comercial?: string;
  cedula?: string;
  fee?: number;
  nombre_representante?: string;
  dob_representante?: string;
  businessType?: string;
}
/**
 * Crea una nueva agencia, invitando al usuario administrador y configurando los datos iniciales
 * @param agenciaData Datos de la agencia a crear
 * @returns La agencia creada o un Error si falló la creación
 */
export const createNuevaAgencia = async (
  agenciaData: CreateNuevaAgenciaInput
) => {
  try {
    logInfo(
      `Iniciando proceso de creación de agencia: ${agenciaData.agencia.nombre_sociedad}`,
      {
        context: "controller:createNuevaAgencia",
      }
    );

    // Validar que el email no esté registrado antes de crear la agencia
    const supabase = createAdminClient();
    const { data: existingUser, error: userCheckError } =
      await supabase.auth.admin.listUsers();

    if (userCheckError) {
      logError(userCheckError, {
        context: "controller:createNuevaAgencia",
        phase: "email_validation",
      });
      return new Error("Error al validar el email");
    }

    // Filtrar usuarios por email
    const userWithEmail = existingUser?.users.find(
      (user) => user.email === agenciaData.usuario_administrador.mail
    );

    if (userWithEmail) {
      logInfo(
        `Email ya registrado: ${agenciaData.usuario_administrador.mail}`,
        {
          context: "controller:createNuevaAgencia",
          phase: "email_validation",
        }
      );
      return new Error("Este email ya ha sido registrado");
    }

    // Crear la agencia primero
    logInfo("Creando registro de agencia", {
      context: "controller:createNuevaAgencia",
    });

    const agencia = await createAgencia({ agenciaData });
    if (agencia instanceof Error) {
      logError(agencia, {
        context: "controller:createNuevaAgencia",
      });
      return agencia;
    }

    // Ahora invitar al usuario administrador con el ID real de la agencia
    logInfo(
      `Invitando usuario administrador: ${agenciaData.usuario_administrador.mail}`,
      {
        context: "controller:createNuevaAgencia",
      }
    );

    const r = await inviteAgencyAdminUser({
      email: agenciaData.usuario_administrador.mail,
      nombre: agenciaData.usuario_administrador.nombre,
      telefono: agenciaData.usuario_administrador.telefono,
      agencia_id: agencia.id,
      is_onboarding: true, // Indicar que es parte del onboarding
    });

    if (r instanceof Error) {
      logError(r, {
        context: "controller:createNuevaAgencia",
      });
      return r;
    }

    // //crea la cuenta de stripe
    const account = await createAccount(
      agenciaData.agencia.pais ?? "CR",
      agencia.id,
      agenciaData.agencia.businessType
    );

if (account instanceof Error) {
  return account;
}

// asigna la cuenta a la agencia
const r2 = await updateAgencia({
  id: agencia.id,
  stripe_account_id: account.id,
});
if (r2 instanceof Error) {
  return r2;
}

    logInfo(`Agencia creada exitosamente: ${agencia.id}`, {
      context: "controller:createNuevaAgencia",
    });

    return agencia;
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Error desconocido");
    logError(errorObj, {
      context: "controller:createNuevaAgencia",
    });
    return errorObj;
  }
};
