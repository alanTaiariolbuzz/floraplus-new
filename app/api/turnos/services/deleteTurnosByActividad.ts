import { getSupabase } from "./turnoService";
import { logError, logInfo } from "@/utils/error/logger";

/**
 * Elimina todos los turnos asociados a una actividad (soft delete)
 * @param actividadId ID de la actividad cuyos turnos serán eliminados
 * @returns Número de turnos eliminados
 */
export async function deleteTurnosByActividad(actividadId: number) {
  try {
    const supabase = await getSupabase();

    // Realizar soft delete para todos los turnos de la actividad
    const { data, error, count } = await supabase
      .from("turnos")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("actividad_id", actividadId)
      .is("deleted_at", null); // Solo afectar registros no eliminados previamente

    if (error) {
      throw error;
    }

    logInfo(
      `Se eliminaron ${count || 0} turnos asociados a la actividad ${actividadId}`,
      {
        service: "turnoService",
        method: "deleteTurnosByActividad",
      }
    );

    return count || 0;
  } catch (error) {
    logError(error, {
      service: "turnoService",
      method: "deleteTurnosByActividad",
      actividadId,
    });
    throw error;
  }
}
