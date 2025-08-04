// Ruta manual para regenerar turnos
// Permite regenerar turnos bajo demanda para pruebas o mantenimiento

import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '../../../../utils/error/logger';
import { createClient } from '../../../../utils/supabase/server';
  
/**
 * @swagger
 * /api/turnos/generar:
 *   post:
 *     summary: Regenerar turnos para una actividad o un horario específico
 *     tags: [Turnos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actividad_id:
 *                 type: integer
 *                 description: ID de la actividad para regenerar todos sus turnos
 *               horario_id:
 *                 type: integer
 *                 description: ID del horario específico para regenerar sus turnos
 *               fecha_desde:
 *                 type: string
 *                 format: date
 *                 description: Fecha desde la cual se regenerarán los turnos
 *     responses:
 *       200:
 *         description: Turnos regenerados exitosamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Actividad o horario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export async function POST(request: NextRequest) {
  try {
    // Leer parámetros del cuerpo de la solicitud
    const body = await request.json();
    const actividadId = body.actividad_id ? body.actividad_id.toString() : null;
    const horarioId = body.horario_id ? body.horario_id.toString() : null;
    const fechaDesde = body.fecha_desde || null;

    // Validar entrada - necesitamos al menos un parámetro de filtro
    if (!actividadId && !horarioId) {
      logInfo('Solicitud inválida: se requiere actividad_id o horario_id', {
        endpoint: '/api/turnos/generar/POST',
        params: { actividadId, horarioId }
      });

      return NextResponse.json({
        code: 400,
        message: 'Se requiere especificar actividad_id o horario_id'
      }, { status: 400 });
    }

    let resultado;

    // Importar los servicios necesarios dinámicamente
    const { generarTurnosDesdeActividad, generarTurnosDesdeHorario } = 
      await import('../../../services/turnoGenerator');
    
    // Si se especifica horario_id, regenerar turnos para ese horario
    if (horarioId) {
      const supabase = await createClient();
      // Obtener el horario
      const { data: horario, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('id', horarioId)
        .is('deleted_at', null)
        .single();

      if (error || !horario) {
        logInfo(`Horario ${horarioId} no encontrado`, {
          endpoint: '/api/turnos/generar/POST',
          horarioId,
          error
        });

        return NextResponse.json({
          code: 404,
          message: `Horario ${horarioId} no encontrado`
        }, { status: 404 });
      }

      // Si el horario no está habilitado, no se generan turnos
      if (!horario.habilitada) {
        return NextResponse.json({
          code: 400,
          message: `El horario ${horarioId} no está habilitado, no se pueden generar turnos`
        }, { status: 400 });
      }

      // Generar turnos para este horario
      logInfo(`Iniciando generación manual para horario ${horarioId}`, {
        endpoint: '/api/turnos/generar/POST',
        horarioId,
        fechaDesde
      });

      resultado = await generarTurnosDesdeHorario(horario);
    }
    // Si se especifica actividad_id, regenerar turnos para todos los horarios de la actividad
    else if (actividadId) {
      const supabase = await createClient();

      // Verificar que la actividad existe
      const { data: actividad, error } = await supabase
        .from('actividades')
        .select('id, titulo')
        .eq('id', actividadId)
        .is('deleted_at', null)
        .single();

      if (error || !actividad) {
        logInfo(`Actividad ${actividadId} no encontrada`, {
          endpoint: '/api/turnos/generar/POST',
          actividadId,
          error
        });

        return NextResponse.json({
          code: 404,
          message: `Actividad ${actividadId} no encontrada`
        }, { status: 404 });
      }

      // Generar turnos para esta actividad
      logInfo(`Iniciando generación manual para actividad ${actividadId}`, {
        endpoint: '/api/turnos/generar/POST',
        actividadId,
        fechaDesde
      });

      resultado = await generarTurnosDesdeActividad(Number(actividadId));
    }

    // Registrar resultado
    logInfo('Generación completada', {
      endpoint: '/api/turnos/generar/POST',
      actividad_id: actividadId,
      horario_id: horarioId,
      resultado
    });

    return NextResponse.json({
      code: 200,
      message: 'Turnos generados exitosamente',
      resultado
    }, { status: 200 });
    
  } catch (err: any) {
    logError(err, { endpoint: '/api/turnos/generar/POST' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    }, { status: 500 });
  }
}
