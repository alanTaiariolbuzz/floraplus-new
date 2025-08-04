import { createAdminClient } from "@/utils/supabase/admin";
import { ROLES } from "@/utils/auth/roles";
import { logError, logInfo } from "@/utils/error/logger";

/**
 * Parámetros para invitar usuarios
 */
type InviteUserParams = {
  email: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  agencia_id?: number;
  is_onboarding?: boolean;
};

/**
 * Invita a un usuario como administrador de sistema
 * @param params Datos del usuario administrador
 * @returns Mensaje de éxito o error
 */
export async function inviteAdminUser({
  email,
  nombre,
  apellido,
}: InviteUserParams): Promise<any> {
  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    // 1) Invitación
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/admin-complete`,
      data: { role: "SUPER_ADMIN" } // user_metadata
    });

    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error("No se obtuvo user de Supabase");
    // 2) Seteá el rol en app_metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { role: "SUPER_ADMIN" }
    });
    
    if (updateError) throw updateError;
    // 3) Insert en tu tabla
    const { error: insertError } = await supabase.from("usuarios").insert({
      id: user.id,
      rol_id: ROLES.ADMIN,
      email,
      nombre: nombre,
      apellido: apellido,
      activo: false,
    });

    if (insertError) throw insertError;

    logInfo(`Invitación enviada a ${email}`, {
      context: "auth:inviteAdminUser",
    });

    return `Invitación enviada a ${email}`;
  } catch (err: any) {
    logError(err, {
      context: "auth:inviteAdminUser",
      details: { email },
    });
    return err;
  }
}

/**
 * Invita a un usuario como administrador de agencia
 * @param params Datos del usuario administrador
 * @returns Mensaje de éxito o error
 */
export async function inviteAgencyAdminUser({
  email,
  nombre,
  apellido,
  telefono,
  agencia_id,
  is_onboarding = false,
}: InviteUserParams): Promise<any> {
  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    // Determinar la URL de redirección según sea onboarding o no
    const redirectUrl = is_onboarding
      ? `${siteUrl}/auth/onboarding/complete` // URL para completar onboarding
      : `${siteUrl}/auth/agencyadmin-complete`; // URL normal para admin adicional

    // 1) Invitación
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        role: "AGENCY_ADMIN",
        agencia: agencia_id,
        is_onboarding: is_onboarding,
      }, // user_metadata
    });

    if (error) throw error;

    const user = data.user; // v2 SDK
    if (!user) throw new Error("No se obtuvo user de Supabase");

    // 2) Insert en tu tabla
    const { error: insertError } = await supabase.from("usuarios").insert({
      id: user.id,
      rol_id: ROLES.AGENCY_ADMIN,
      email,
      nombre: nombre,
      apellido: apellido,
      telefono: telefono,
      agencia_id: agencia_id,
      activo: false,
    });

    if (insertError) throw insertError;

    logInfo(`Invitación enviada a ${email}`, {
      context: "auth:inviteAgencyAdminUser",
    });

    return `Invitación enviada a ${email}`;
  } catch (err: any) {
    logError(err, {
      context: "auth:inviteAdminUser",
      details: { email },
    });
    return err;
  }
}

/**
 * Invita a un usuario regular (no administrador) de agencia
 * @param params Datos del usuario a invitar
 * @returns Mensaje de éxito o error
 */
export async function inviteAgencyUser({
  email,
  nombre,
  apellido,
  agencia_id,
}: InviteUserParams): Promise<any> {
  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    // 1) Invitación
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/agencyuser-complete`,
      data: { role: "AGENCY_USER", agencia: agencia_id }, // user_metadata
    });

    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error("No se obtuvo user de Supabase");

    // 2) Insert en la tabla usuarios
    const { error: insertError } = await supabase.from("usuarios").insert({
      id: user.id,
      rol_id: ROLES.AGENCY_USER,
      email,
      nombre,
      apellido,
      agencia_id,
      activo: false,
    });

    if (insertError) throw insertError;

    logInfo(`Invitación enviada a ${email}`, {
      context: "auth:inviteAgencyUser",
      details: { email, agencia_id },
    });

    return `Invitación enviada a ${email}`;
  } catch (err: any) {
    logError(err, {
      context: "auth:inviteAgencyUser",
      details: { email, agencia_id },
    });
    return err;
  }
}

export async function createAdminUserWithPassword({
  email,
  nombre = '',
  apellido = '',
  password = "prueba1234",
}: {
  email: string,
  nombre?: string,
  apellido?: string,
  password?: string,
}): Promise<any> {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "SUPER_ADMIN" },
      user_metadata: { nombre, apellido }
    });
    if (error) throw error;
    const { error: insertError } = await supabase.from("usuarios").insert({
      id: data.user.id,
      rol_id: ROLES.ADMIN,
      email,
      nombre: nombre,
      apellido: apellido,
      activo: false,
    });

    if (insertError) throw insertError;
    return data;
  } catch (err) {
    throw err;
  }
}