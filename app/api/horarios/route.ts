import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logError } from '../../../utils/error/logger';
import { 
  getHorariosFiltrados,
  crearHorario, 
  actualizarHorario, 
  eliminarHorario 
} from './controllers/horarioController';

/**
 * @swagger
 * /api/horarios:
 *   get:
 *     tags:
 *       - Horarios
 *     summary: Obtener lista de horarios
 *     description: Obtiene una lista de horarios, opcionalmente filtrados por actividad
 *     parameters:
 *       - name: actividad_id
 *         in: query
 *         description: ID de la actividad (opcional)
 *         schema:
 *           type: integer
 *       - name: id
 *         in: query
 *         description: ID del horario (opcional)
 *         schema:
 *           type: integer
 *       - name: habilitada
 *         in: query
 *         description: Filtrar por horarios habilitados/deshabilitados (opcional)
 *         schema:
 *           type: boolean
 *       - name: fecha_desde
 *         in: query
 *         description: Fecha desde para filtrar horarios (formato YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: fecha_hasta
 *         in: query
 *         description: Fecha hasta para filtrar horarios (formato YYYY-MM-DD)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Horarios obtenidos exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       actividad_id:
 *                         type: integer
 *                       fecha_inicio:
 *                         type: string
 *                         format: date
 *                       dias:
 *                         type: array
 *                         items:
 *                           type: integer
 *                           minimum: 1
 *                           maximum: 7
 *                       dia_completo:
 *                         type: boolean
 *                       hora_inicio:
 *                         type: string
 *                         format: time
 *                       hora_fin:
 *                         type: string
 *                         format: time
 *                       cupo:
 *                         type: integer
 *                       habilitada:
 *                         type: boolean
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET: Obtener horarios
/**
 * GET: Obtener horarios con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agenciaIdHeader = request.headers.get('x-agencia-id');
    agenciaIdHeader ? searchParams.append("agencia_id",String(agenciaIdHeader)) : undefined;
    const respuesta = await getHorariosFiltrados(searchParams);
    
    return NextResponse.json(respuesta);
  } catch (err) {
    return NextResponse.json({
      code: 500,
      message: 'Error al obtener horarios'
    }, { status: 500 });
  }
}



/**
 * @swagger
 * /api/horarios:
 *   post:
 *     tags:
 *       - Horarios
 *     summary: Crear un nuevo horario
 *     description: Crea un nuevo horario con los datos proporcionados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actividad_id:
 *                 type: integer
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 description: Fecha de inicio en formato YYYY-MM-DD
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *                 description: Fecha de fin en formato YYYY-MM-DD
 *               dias:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 7
 *                 description: Array de días de la semana (1=lunes, 7=domingo)
 *               dia_completo:
 *                 type: boolean
 *                 default: false
 *                 description: Indica si el horario cubre el día completo
 *               hora_inicio:
 *                 type: string
 *                 format: time
 *                 description: Hora de inicio en formato HH:MM (requerido si no es día completo)
 *               hora_fin:
 *                 type: string
 *                 format: time
 *                 description: Hora de fin en formato HH:MM (requerido si no es día completo)
 *               cupo:
 *                 type: integer
 *                 default: 0
 *                 description: Cupo máximo de personas
 *               habilitada:
 *                 type: boolean
 *                 default: true
 *                 description: Indica si el horario está habilitado
 *     responses:
 *       201:
 *         description: Horario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Horario creado exitosamente"
 *                 data:
 *                   type: object
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 */
/**
 * POST: Crear un nuevo horario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agenciaId = request.headers.get('x-agencia-id');
    
    if (!agenciaId) {
      return NextResponse.json(
        { code: 401, message: 'Agencia no especificada' },
        { status: 401 }
      );
    }
    
    const respuesta = await crearHorario(body, parseInt(agenciaId, 10));
    
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    if (err.code && err.code >= 200 && err.code <= 599) {
      return NextResponse.json(err, { status: err.code });
    }
    
    logError(err, { endpoint: '/api/horarios/POST' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/horarios:
 *   put:
 *     tags:
 *       - Horarios
 *     summary: Modificar un horario existente
 *     description: Actualiza los datos de un horario existente
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID del horario a modificar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actividad_id:
 *                 type: integer
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               dias:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 7
 *                 description: Array de días de la semana (1=lunes, 7=domingo)
 *               dia_completo:
 *                 type: boolean
 *               hora_inicio:
 *                 type: string
 *                 format: time
 *               hora_fin:
 *                 type: string
 *                 format: time
 *               cupo:
 *                 type: integer
 *               habilitada:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Horario modificado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Horario modificado exitosamente"
 *                 data:
 *                   type: object
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Horario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
/**
 * PUT: Modificar un horario existente
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam) : null;
    if (!id) {
      return NextResponse.json({
        code: 400,
        message: 'ID de horario no válido'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const respuesta = await actualizarHorario(id, body);
    
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    if (err.code && err.code >= 200 && err.code <= 599) {
      return NextResponse.json(err, { status: err.code });
    }
    
    logError(err, { endpoint: '/api/horarios/PUT' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/horarios:
 *   delete:
 *     tags:
 *       - Horarios
 *     summary: Eliminar un horario (soft delete)
 *     description: Marca un horario como eliminado (soft delete)
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID del horario a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Horario marcado como eliminado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Horario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
/**
 * DELETE: Eliminar un horario (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam) : null;
    if (!id) {
      return NextResponse.json({
        code: 400,
        message: 'ID de horario no válido'
      }, { status: 400 });
    }
    
    const respuesta = await eliminarHorario(id);
    
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    if (err.code && err.code >= 200 && err.code <= 599) {
      return NextResponse.json(err, { status: err.code });
    }
    
    logError(err, { endpoint: '/api/horarios/DELETE' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
