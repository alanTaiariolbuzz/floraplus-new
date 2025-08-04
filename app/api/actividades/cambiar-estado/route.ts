import { NextRequest, NextResponse } from "next/server";
import { cambiarEstadoActividad } from "../controllers/actividadController";

/**
 * Endpoint PATCH para cambiar el estado de una actividad
 * @param request Request con el nuevo estado en el body
 * @returns Respuesta con el resultado de la operación
 */
export async function PATCH(request: NextRequest) {
  try {
    // Obtener el ID de la URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { code: 400, message: 'Se requiere el parámetro id en la URL' },
        { status: 400 }
      );
    }

    // Obtener el nuevo estado del body
    const body = await request.json();
    const { estado } = body;

    if (!estado || (estado !== 'borrador' && estado !== 'publicado')) {
      return NextResponse.json(
        { 
          code: 400, 
          message: 'Se requiere el campo "estado" en el body con valor "borrador" o "publicado"',
          isValidationError: true 
        },
        { status: 400 }
      );
    }

    // Cambiar el estado de la actividad
    const result = await cambiarEstadoActividad(parseInt(id), estado);
    
    // Devolver la respuesta apropiada
    if (result.code === 200) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(
        { code: result.code, message: result.message, error: (result as any).error },
        { status: result.code }
      );
    }
  } catch (error) {
    console.error('Error en PATCH /api/actividades/cambiar-estado:', error);
    return NextResponse.json(
      { 
        code: 500, 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
