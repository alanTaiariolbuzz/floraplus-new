import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getActividad } from '../../actividades/controllers/actividadController';

/**
 * Endpoint público para obtener actividades
 * Permite filtrar por id y agencia_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetros de consulta
    const id = searchParams.get('id');
    const agenciaId = searchParams.get('agencia_id');

    // Validar que al menos haya un parámetro
    if (!id && !agenciaId) {
      return NextResponse.json(
        { error: 'Se requiere al menos un parámetro de búsqueda (id o agencia_id)' },
        { status: 400 }
      );
    }

    // Llamar al controlador y devolver la respuesta directamente
    const response = await getActividad(
      id ? parseInt(id, 10) : null,
      agenciaId ? parseInt(agenciaId, 10) : null
    );
    
    return NextResponse.json(response, { status: response.code });
  } catch (error) {
    console.error('Error en /api/public/actividades:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        errorId: new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5)
      },
      { status: 500 }
    );
  }
}

// Solo permitir el método GET
export async function POST() {
  return new NextResponse('Método no permitido', { status: 405 });
}

export async function PUT() {
  return new NextResponse('Método no permitido', { status: 405 });
}

export async function DELETE() {
  return new NextResponse('Método no permitido', { status: 405 });
}
