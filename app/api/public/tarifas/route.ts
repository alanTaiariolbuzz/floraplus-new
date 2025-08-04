import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTarifasFiltradas } from '../../tarifas/controllers/tarifaController';

/**
 * Endpoint público para obtener tarifas
 * Permite filtrar por actividad_id, es_principal y activa
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetros de consulta
    const params: Record<string, any> = {};
    
    // Parámetros numéricos
    const id = searchParams.get('id');
    const actividadId = searchParams.get('actividad_id');
    
    if (id) params.id = parseInt(id, 10);
    if (actividadId) params.actividad_id = parseInt(actividadId, 10);
    
    // Parámetros booleanos
    const esPrincipal = searchParams.get('es_principal');
    const activa = searchParams.get('activa');
    
    if (esPrincipal !== null) params.es_principal = esPrincipal === 'true';
    if (activa !== null) params.activa = activa === 'true';

    // Validar que al menos haya un parámetro
    if (Object.keys(params).length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un parámetro de búsqueda' },
        { status: 400 }
      );
    }

    // Llamar al controlador con los searchParams originales
    const response = await getTarifasFiltradas(searchParams);
    return NextResponse.json(response, { status: response.code });
  } catch (error) {
    console.error('Error en /api/public/tarifas:', error);
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
