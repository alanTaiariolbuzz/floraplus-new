import { createClient } from "../../../../utils/supabase/server";
import { logError, logInfo } from "../../../../utils/error/logger";
import { Usuario } from "../schemas/usuarioSchema";
import { ROLES } from "@/utils/auth/roles";

// Obtener el cliente de Supabase centralizado
export const getSupabase = async () => await createClient();

/**
 * Obtiene un usuario por su ID
 * @param id ID del usuario
 * @returns Datos del usuario o null si no existe
 */
export async function getUsuarioById(id: string) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    logError(error, {
      service: "usuarioService",
      method: "getUsuarioById",
      id,
    });
    return null;
  }

  return data;
}

/**
 * Verifica si un rol existe
 * @param rolId ID del rol
 * @returns true si el rol existe, false en caso contrario
 */
export async function verificarRol(rolId: number) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("roles")
    .select("id")
    .eq("id", rolId)
    .single();

  if (error || !data) {
    logError(error || new Error("Rol no encontrado"), {
      service: "usuarioService",
      method: "verificarRol",
      rolId,
    });
    return false;
  }

  return true;
}

/**
 * Verifica si una agencia existe
 * @param agenciaId ID de la agencia
 * @returns true si la agencia existe, false en caso contrario
 */
export async function verificarAgencia(agenciaId: number) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("agencias")
    .select("id")
    .eq("id", agenciaId)
    .single();

  if (error || !data) {
    logError(error || new Error("Agencia no encontrada"), {
      service: "usuarioService",
      method: "verificarAgencia",
      agenciaId,
    });
    return false;
  }

  return true;
}

/**
 * Verifica si ya existe un usuario con el mismo email
 * @param email Email a verificar
 * @param excludeId ID de usuario a excluir de la verificación (para actualizaciones)
 * @returns true si el email ya existe, false en caso contrario
 */
export async function verificarEmailExistente(
  email: string,
  excludeId?: string
) {
  const supabase = await getSupabase();

  let query = supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    logError(error, {
      service: "usuarioService",
      method: "verificarEmailExistente",
      email,
      excludeId,
    });
    return false;
  }

  return data && data.length > 0;
}

/**
 * Obtiene todos los usuarios con filtros opcionales
 * @param filtros Filtros a aplicar
 * @returns Lista de usuarios
 */
export async function getUsuarios(filtros: {
  agencia_id?: number;
  rol_id?: number;
  email?: string;
  activo?: boolean;
  id?: string;
}) {
  const supabase = await getSupabase();

  // Construir la consulta base
  let query = supabase
    .from("usuarios")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false });

  // Aplicar filtros si están presentes
  if (filtros.agencia_id) {
    query = query.eq("agencia_id", filtros.agencia_id);
  }

  if (filtros.rol_id) {
    query = query.eq("rol_id", filtros.rol_id);
  }

  if (filtros.email) {
    query = query.ilike("email", `%${filtros.email}%`);
  }

  if (filtros.activo !== undefined) {
    query = query.eq("activo", filtros.activo);
  }

  if (filtros.id) {
    query = query.eq("id", filtros.id);
  }

  // Ejecutar la consulta
  const { data, error } = await query;

  if (error) {
    logError(error, {
      service: "usuarioService",
      method: "getUsuarios",
      filtros,
    });
    return [];
  }

  return data || [];
}

/**
 * Crea un nuevo usuario
 * @param usuarioData Datos del usuario a crear
 * @returns Usuario creado o error
 */
export async function createUsuario(usuarioData: Usuario) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();

  // Verificar que el rol existe
  const rolExiste = await verificarRol(usuarioData.rol_id);
  if (!rolExiste) {
    return { error: "Rol no encontrado" };
  }

  // Si no es admin verificar que la agencia existe
  if (usuarioData.rol_id !== ROLES.ADMIN) {
    if (!usuarioData.agencia_id)
      return { error: "Debe especificar una agencia" };
    const agenciaExiste = await verificarAgencia(usuarioData.agencia_id);
    if (!agenciaExiste) {
      return { error: "Para este rol debe especificar una agencia existente" };
    }
  }

  // Verificar que el email no esté en uso
  const emailExiste = await verificarEmailExistente(usuarioData.email);
  if (emailExiste) {
    return { error: "El email ya está en uso por otro usuario" };
  }

  // Insertar el nuevo usuario
  const { data, error } = await supabase
    .from("usuarios")
    .insert({
      id: usuarioData.id, // 👈 clave
      agencia_id: usuarioData.agencia_id,
      rol_id: usuarioData.rol_id,
      nombre: usuarioData.nombre,
      apellido: usuarioData.apellido,
      email: usuarioData.email,
      telefono: usuarioData.telefono,
      activo: usuarioData.activo !== undefined ? usuarioData.activo : false,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    logError(error, {
      service: "usuarioService",
      method: "createUsuario",
      data: usuarioData,
    });
    return { error: error.message };
  }

  logInfo("Usuario creado exitosamente", { id: data.id });

  return { data };
}

/**
 * Actualiza un usuario existente
 * @param id ID del usuario a actualizar
 * @param usuarioData Datos del usuario
 * @returns Usuario actualizado o error
 */
export async function updateUsuario(id: string, usuarioData: Usuario) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();

  // Verificar que el usuario existe
  const usuarioExistente = await getUsuarioById(id);
  if (!usuarioExistente) {
    return { error: "Usuario no encontrado" };
  }

  // Verificar que el rol existe
  const rolExiste = await verificarRol(usuarioData.rol_id);
  if (!rolExiste) {
    return { error: "Rol no encontrado" };
  }

  // Verificar que la agencia existe
  // Si no es admin verificar que la agencia existe
  if (usuarioData.rol_id !== ROLES.ADMIN) {
    if (!usuarioData.agencia_id)
      return { error: "Debe especificar una agencia" };
    const agenciaExiste = await verificarAgencia(usuarioData.agencia_id);
    if (!agenciaExiste) {
      return { error: "Para este rol debe especificar una agencia existente" };
    }
  }

  // Verificar que el email no esté en uso por otro usuario
  const emailExiste = await verificarEmailExistente(usuarioData.email, id);
  if (emailExiste) {
    return { error: "El email ya está en uso por otro usuario" };
  }

  // Actualizar el usuario
  const { data, error } = await supabase
    .from("usuarios")
    .update({
      agencia_id: usuarioData.agencia_id,
      rol_id: usuarioData.rol_id,
      nombre: usuarioData.nombre,
      apellido: usuarioData.apellido,
      email: usuarioData.email,
      telefono: usuarioData.telefono,
      activo: usuarioData.activo,
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    logError(error, {
      service: "usuarioService",
      method: "updateUsuario",
      id,
      data: usuarioData,
    });
    return { error: error.message };
  }

  logInfo("Usuario actualizado exitosamente", { id });

  return { data };
}

/**
 * Elimina un usuario (soft delete)
 * @param id ID del usuario a eliminar
 * @returns Datos del usuario eliminado o error
 */
export async function deleteUsuario(id: string) {
  const supabase = await getSupabase();

  // Verificar que el usuario existe
  const usuarioExistente = await getUsuarioById(id);
  if (!usuarioExistente) {
    return { error: "Usuario no encontrado" };
  }

  // Realizar soft delete
  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("usuarios")
    .update({
      activo: false,
      deleted_at: deletedAt,
    })
    .eq("id", id)
    .select("id, deleted_at")
    .single();

  if (error) {
    logError(error, {
      service: "usuarioService",
      method: "deleteUsuario",
      id,
    });
    return { error: error.message };
  }

  logInfo("Usuario marcado como eliminado", { id, deleted_at: deletedAt });

  return { data };
}

export async function updateUsuarioActivo(id: string) {
  const supabase = await getSupabase();

  // Verificar que el usuario existe
  const usuarioExistente = await getUsuarioById(id);
  if (!usuarioExistente) {
    return { error: "Usuario no encontrado" };
  }

  const { data, error } = await supabase
    .from("usuarios")
    .update({
      activo: true,
    })
    .eq("id", id)
    .single();

  if (error) {
    logError(error, {
      service: "usuarioService",
      method: "updateUsuarioActivo",
      id,
    });
    return { error: error.message };
  }

  logInfo("Usuario marcado como activo", { id });

  return { data };
}
