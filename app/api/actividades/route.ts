import { NextRequest, NextResponse } from "next/server";
import {
  createActividadCompleta,
  getActividad,
  softDeleteActividad,
  updateActividad,
} from "./controllers/actividadController";
import { putActividad } from './handlers/putActividad';

// Importación de documentación Swagger
import "./docs/swagger";

/**
 * Punto de entrada para el endpoint GET de actividades.
 * Maneja solicitudes para obtener todas las actividades o una actividad específica por ID.
 * La lógica de negocio se ha delegado al controlador de actividades.
 */
export async function GET(request: NextRequest) {
  // Obtener parámetros de la URL
  const { searchParams } = new URL(request.url);
  const actividadId = searchParams.get("id");
  const agenciaId = request.headers.get('x-agencia-id');
  const includeDeleted = searchParams.get("include_deleted") === "true";

  // Obtener actividad(es) a través del controlador
  const response = await getActividad(
    actividadId ? parseInt(actividadId) : null,
    agenciaId ? parseInt(agenciaId) : null,
    includeDeleted
  );

  return NextResponse.json(response, { status: response.code });
}

/**
 * Punto de entrada para el endpoint POST de actividades.
 * Maneja solicitudes para crear una nueva actividad.
 * La lógica de negocio se ha delegado al controlador de actividades.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

    const agenciaHeader = request.headers.get('x-agencia-id');
    const payload = {
        ...body,
        agencia_id: agenciaHeader ? parseInt(agenciaHeader, 10) : undefined
    };
  const response = await createActividadCompleta(payload);

  // Si hay errores de validación, incluirlos en la respuesta
  if ("isValidationError" in response && response.isValidationError) {
    return NextResponse.json(
      {
        code: response.code,
        message: response.message,
        errors: response.errors,
      },
      { status: response.code }
    );
  }

  return NextResponse.json(response, { status: response.code });
}

/**
 * Punto de entrada para el endpoint DELETE de actividades.
 * Maneja solicitudes para eliminar lógicamente una actividad por su ID.
 */
export async function DELETE(request: NextRequest) {
  // Obtener parámetros de la URL
  const { searchParams } = new URL(request.url);
  const actividadId = searchParams.get("id");

  if (!actividadId) {
    return NextResponse.json(
      { message: "Se requiere el ID de la actividad" },
      { status: 400 }
    );
  }

  try {
    const response = await softDeleteActividad(parseInt(actividadId));
    return NextResponse.json(response, { status: response.code });
  } catch (error) {
    console.error('Error en DELETE /api/actividades:', error);
    return NextResponse.json(
      { message: "Error al eliminar la actividad" },
      { status: 500 }
    );
  }
}


/**
 * Punto de entrada para el endpoint PUT de actividades.
 * Maneja solicitudes para actualizar una actividad por su ID.
 */
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { code: 400, message: 'Se requiere el ID de la actividad' },
      { status: 400 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { code: 400, message: 'Error al procesar el cuerpo de la solicitud. Asegúrate de enviar un JSON válido.' },
      { status: 400 }
    );
  }
  const result = await putActividad(Number(id), body);

  return NextResponse.json(result, { status: result.code });
}
