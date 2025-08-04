import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { horario_id, fecha_desde, fecha_hasta } = body;

    const supabase = await createClient();

    // 1. Verificar turnos en el rango de fechas
    const { data: turnos, error: errorTurnos } = await supabase
      .from("turnos")
      .select("id, fecha, hora_inicio, cupo_total, cupo_disponible, horario_id")
      .eq("horario_id", horario_id)
      .gte("fecha", fecha_desde)
      .lte("fecha", fecha_hasta)
      .is("deleted_at", null)
      .order("fecha");

    if (errorTurnos) {
      console.error("Error obteniendo turnos:", errorTurnos);
      return NextResponse.json(
        {
          code: 500,
          message: "Error al obtener turnos",
          error: errorTurnos.message,
        },
        { status: 500 }
      );
    }

    // 2. Verificar modificaciones temporales activas
    const { data: modificaciones, error: errorModificaciones } = await supabase
      .from("modificaciones_temporarias")
      .select("*")
      .eq("horario_id", horario_id)
      .eq("activo", true)
      .gte("fecha_desde", fecha_desde)
      .lte("fecha_hasta", fecha_hasta);

    if (errorModificaciones) {
      console.error("Error obteniendo modificaciones:", errorModificaciones);
      return NextResponse.json(
        {
          code: 500,
          message: "Error al obtener modificaciones",
          error: errorModificaciones.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: 200,
      message: "Verificación completada",
      data: {
        turnos: turnos || [],
        modificaciones: modificaciones || [],
        resumen: {
          totalTurnos: turnos?.length || 0,
          totalModificaciones: modificaciones?.length || 0,
          turnosConCupoDisponible:
            turnos?.filter((t) => t.cupo_disponible > 0).length || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error en verificación:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Error interno en la verificación",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
