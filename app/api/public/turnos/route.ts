import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTurnosFiltrados } from '../../turnos/controllers/turnoController';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Obtener todos los parámetros de consulta
    const params: Record<string, string | number | boolean> = {};
    
    // Parámetros numéricos
    const numericParams = ['id', 'actividad_id', 'horario_id', 'agencia_id', 'page', 'limit'];
    numericParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        params[param] = parseInt(value, 10);
      }
    });

    // Parámetros de fecha
    const dateParams = ['fecha_desde', 'fecha_hasta'];
    dateParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        params[param] = value;
      }
    });

    // Parámetros booleanos
    const booleanParams = ['solo_disponibles', 'bloquear'];
    booleanParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        params[param] = value === 'true';
      }
    });

    // Validar que al menos haya un filtro
    if (Object.keys(params).length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un parámetro de búsqueda' },
        { status: 400 }
      );
    }

    // Llamar al controlador
    const result = await getTurnosFiltrados(params);
    
    // Si hay un error en el controlador, devolverlo
    if (result.code >= 400) {
      return NextResponse.json(
        { error: result.message, ...(result.errorId && { errorId: result.errorId }) },
        { status: result.code }
      );
    }

    // Devolver los datos exitosamente
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en /api/public/turnos:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        errorId: new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5)
      },
      { status: 500 }
    );
  }
}
