import { logError } from "@/utils/error/logger";
import { Transporte } from "../schemas/actividadSchema";
import { createClient } from "@/utils/supabase/server";

export async function getTransportesByActividadId(
  actividadId: number
): Promise<Transporte[]> {
  const supabase = await createClient();

  // Obtener transportes relacionados
  const { data: transportesRel, error: transportesRelError } = await supabase
    .from("actividad_transporte")
    .select("transporte_id")
    .eq("actividad_id", actividadId);

  let transportes: Transporte[] = [];
  if (!transportesRelError && transportesRel && transportesRel.length > 0) {
    const transportesIds = transportesRel.map((rel) => rel.transporte_id);
    const { data: transportesData, error: transportesError } = await supabase
      .from("transportes")
      .select("*")
      .in("id", transportesIds);

    if (!transportesError && transportesData) {
      transportesData.map((t) => {
        let detalle = { salida: "00:00", llegada: "00:00" };
        try {
          if (t.detalle) detalle = JSON.parse(t.detalle);
        } catch (e) {
          logError(e, {
            endpoint: "/api/actividades/GET",
            message: "Error parsing transporte detalle",
          });
        }

        // Si hay ubicacion en la base de datos, parsearlo
        let ubicacion = undefined;
        try {
          if (t.ubicacion) ubicacion = JSON.parse(t.ubicacion);
        } catch (e) {
          logError(e, {
            endpoint: "/api/actividades/GET",
            message: "Error parsing transporte ubicacion",
          });
        }

        return {
          id: t.id,
          titulo: t.titulo,
          descripcion: t.descripcion,
          direccion: t.direccion,
          precio: t.precio,
          moneda: "USD", // Valor por defecto
          hora_salida: t.horarios?.[0]?.hora_salida || "08:30",
          hora_llegada: t.horarios?.[0]?.hora_llegada || "10:00",

          cupo: t.cupo_maximo,
          ubicacion: ubicacion,
          limite_horario: t.limite_horario,
          limite_horas: t.limite_horas,
          mensaje: t.mensaje,
          activo: t.activo,
          created_at: t.created_at,
          updated_at: t.updated_at,
        };
      });
    } else if (transportesError) {
      logError(transportesError, {
        endpoint: "/api/actividades/GET",
        actividadId,
      });
    }
  }

  return transportes;
}
