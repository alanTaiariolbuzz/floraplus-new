import { NextRequest, NextResponse } from "next/server";
import { revertirModificacionTemporaria } from "@/app/services/modificacionTemporaria";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modificacion_id } = body;

    if (!modificacion_id) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de modificación temporal requerido",
        },
        { status: 400 }
      );
    }

    const resultado = await revertirModificacionTemporaria(modificacion_id);

    return NextResponse.json(
      {
        code: 200,
        message: `Modificación temporal revertida exitosamente. ${resultado.turnosModificados} turnos revertidos.`,
        data: resultado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al revertir modificación temporal:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Error interno al revertir la modificación temporal",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
