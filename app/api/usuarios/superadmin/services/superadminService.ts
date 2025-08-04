import { createClient } from "@/utils/supabase/server";
import { logError } from "@/utils/error/logger";

const getSupabase = async () => await createClient();

export async function getSuperAdminUsers() {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("rol_id", "1");

    if (error) {
      logError("Error al obtener usuarios superadmin", {
        context: "usuarios:superadmin:getSuperAdminUsers",
        error: error.message,
      });
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    logError("Error en getSuperAdminUsers", {
      context: "usuarios:superadmin:getSuperAdminUsers",
      error: (error as Error).message,
    });
    throw error;
  }
}

export async function updateSuperAdminUser(
  id: string,
  userData: { nombre: string; email: string }
) {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .update({
        nombre: userData.nombre,
        email: userData.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("rol_id", "1")
      .select("*")
      .single();

    if (error) {
      logError("Error al actualizar usuario superadmin", {
        context: "usuarios:superadmin:updateSuperAdminUser",
        error: error.message,
        userId: id,
      });
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    logError("Error en updateSuperAdminUser", {
      context: "usuarios:superadmin:updateSuperAdminUser",
      error: (error as Error).message,
      userId: id,
    });
    throw error;
  }
}
