import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { aplicarModificacionTemporaria } from "@/app/services/modificacionTemporaria";
import { TipoModificacionTemporaria } from "@/app/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modificacion_id } = body;


    const supabase = await createClient();

    // 1. Obtener la modificación temporal
    const { data: modificacion, error: errorModificacion } = await supabase
      .from("modificaciones_temporarias")
      .select("*")
      .eq("id", modificacion_id)
      .eq("activo", true)
      .single();

    if (errorModificacion || !modificacion) {
      console.error("Error obteniendo modificación:", errorModificacion);
      return NextResponse.json(
        {
          code: 404,
          message: "Modificación temporal no encontrada o inactiva",
          error: errorModificacion?.message,
        },
        { status: 404 }
      );
    }


    // 2. Convertir al formato esperado por aplicarModificacionTemporaria
    const modificacionParaAplicar = {
      tipo: modificacion.tipo_modificacion as TipoModificacionTemporaria,
      horario_id: modificacion.horario_id || undefined,
      actividad_id: modificacion.actividad_id || undefined,
      fecha_desde: modificacion.fecha_desde,
      fecha_hasta: modificacion.fecha_hasta,
      hora_inicio: modificacion.hora_inicio_nueva || undefined,
      hora_fin: undefined,
      cupo_total: modificacion.nuevos_cupos_totales || undefined,
      motivo: undefined,
    };



    // 3. Aplicar la modificación
    const resultado = await aplicarModificacionTemporaria(
      modificacionParaAplicar
    );



    return NextResponse.json({
      code: 200,
      message: "Modificación temporal aplicada exitosamente",
      data: {
        modificacion: modificacion,
        resultado: resultado,
      },
    });
  } catch (error) {
    console.error("Error aplicando modificación:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Error interno al aplicar la modificación",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
