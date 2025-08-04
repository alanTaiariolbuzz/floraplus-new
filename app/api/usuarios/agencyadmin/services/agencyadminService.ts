import { createClient } from "@/utils/supabase/server";
import { logError } from "@/utils/error/logger";

const getSupabase = async () => await createClient();

export async function getUsuariosbyAgencia(agenciaId?: number) {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("agencia_id", agenciaId);

    if (error) {
      logError(error, { context: "usuarios:superadmin:getUsuariosbyAgencia" });
      throw new Error(`Error al obtener usuarios de agencia: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logError(error, { context: "usuarios:superadmin:getUsuariosbyAgencia" });
    throw error;
  }
}