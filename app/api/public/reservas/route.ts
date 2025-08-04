import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getReservas, createReserva } from '../../reservas/controllers/reservaController';

/**
 * Endpoint público para obtener reservas
 * Permite filtrar por id, actividad_id, turno_id y agencia_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetros de consulta
    const id = searchParams.get('id');
    const actividadId = searchParams.get('actividad_id');
    const turnoId = searchParams.get('turno_id');
    const agenciaId = searchParams.get('agencia_id');

    // Validar que al menos haya un parámetro
    if (!id && !actividadId && !turnoId && !agenciaId) {
      return NextResponse.json(
        { 
          code: 400, 
          message: 'Se requiere al menos un parámetro de búsqueda (id, actividad_id, turno_id o agencia_id)' 
        },
        { status: 400 }
      );
    }

    // Preparar filtros
    const filtros = {
      id: id ? parseInt(id, 10) : undefined,
      actividad_id: actividadId ? parseInt(actividadId, 10) : undefined,
      turno_id: turnoId ? parseInt(turnoId, 10) : undefined,
      agencia_id: agenciaId ? parseInt(agenciaId, 10) : undefined,
    };

    // Llamar al controlador y devolver la respuesta directamente
    const response = await getReservas(filtros);
    return NextResponse.json(response, { status: response.code });
  } catch (error) {
    console.error('Error en /api/public/reservas:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        errorId: new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5)
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint público para crear una nueva reserva
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar que se haya enviado el cuerpo
    if (!body) {
      return NextResponse.json(
        { error: 'Se requiere un cuerpo en la solicitud' },
        { status: 400 }
      );
    }

    // Llamar al controlador
    const result = await createReserva(body);
    
    // Devolver la respuesta del controlador
    return NextResponse.json(result, { status: result.code });
  } catch (error) {
    console.error('Error en /api/public/reservas (POST):', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        errorId: new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5)
      },
      { status: 500 }
    );
  }
}

// Solo permitir los métodos GET y POST
export async function PUT() {
  return new NextResponse('Método no permitido', { status: 405 });
}

export async function DELETE() {
  return new NextResponse('Método no permitido', { status: 405 });
}
