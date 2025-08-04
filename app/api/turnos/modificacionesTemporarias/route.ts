import { NextRequest, NextResponse } from 'next/server';
import { logError } from '../../../../utils/error/logger';
import {
  guardarModificacionTemporaria,
  obtenerModificacionesTemporarias,
  actualizarModificacionTemporaria,
  eliminarModificacionTemporaria,
} from './controllers/modificacionTemporariaController';

/**
 * @swagger
 * /api/turnos/modificacionesTemporarias:
 *   get:
 *     tags:
 *       - Modificaciones Temporarias
 *     summary: Obtener lista de modificaciones temporarias
 *     description: Obtiene un listado de modificaciones temporarias con filtros opcionales
 *     parameters:
 *       - name: agencia_id
 *         in: query
 *         description: Filtrar por ID de la agencia
 *         required: false
 *         schema:
 *           type: integer
 *       - name: tipo
 *         in: query
 *         description: Filtrar por tipo de modificación
 *         required: false
 *         schema:
 *           type: string
 *           enum: [CAMBIAR_HORA_INICIO, CAMBIAR_CUPOS, BLOQUEAR_HORARIO, BLOQUEAR_ACTIVIDAD, BLOQUEAR_TODAS]
 *       - name: actividad_id
 *         in: query
 *         description: Filtrar por ID de la actividad
 *         required: false
 *         schema:
 *           type: integer
 *       - name: fecha_desde
 *         in: query
 *         description: Filtrar por fecha de inicio
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: fecha_hasta
 *         in: query
 *         description: Filtrar por fecha de fin
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de modificaciones temporarias obtenida exitosamente
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
 *                   example: Modificaciones temporarias obtenidas exitosamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModificacionTemporaria'
 *       500:
 *         description: Error interno del servidor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agenciaIdHeader = request.headers.get('x-agencia-id');
    agenciaIdHeader ? searchParams.set('agencia_id', agenciaIdHeader) : undefined;
    const respuesta = await obtenerModificacionesTemporarias(searchParams);

    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err) {
    logError(err, { endpoint: '/api/turnos/modificacionesTemporarias/GET' });
    return NextResponse.json(
      {
        code: 500,
        message: 'Error interno al obtener modificaciones temporarias',
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/turnos/modificacionesTemporarias:
 *   post:
 *     tags:
 *       - Modificaciones Temporarias
 *     summary: Crear una nueva modificación temporaria
 *     description: Registra una nueva modificación temporaria en el sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_modificacion
 *               - fecha_desde
 *               - fecha_hasta
 *             properties:
 *               actividad_id:
 *                 type: integer
 *                 description: ID de la actividad asociada
 *               agencia_id:
 *                 type: integer
 *                 description: ID de la agencia asociada (opcional)
 *               turno_id:
 *                 type: integer
 *                 description: ID del turno asociado (opcional)
 *               fecha_desde:
 *                 type: string
 *                 format: date
 *                 description: Fecha de inicio de la modificación
 *               fecha_hasta:
 *                 type: string
 *                 format: date
 *                 description: Fecha de fin de la modificación
 *               tipo_modificacion:
 *                 type: string
 *                 enum: [CAMBIAR_HORA_INICIO, CAMBIAR_CUPOS, BLOQUEAR_HORARIO, BLOQUEAR_ACTIVIDAD, BLOQUEAR_TODAS]
 *                 description: Tipo de modificación a realizar
 *               hora_inicio_actual:
 *                 type: string
 *                 format: time
 *                 description: Hora de inicio original (opcional)
 *               hora_inicio_nueva:
 *                 type: string
 *                 format: time
 *                 description: Nueva hora de inicio (opcional)
 *               horario_bloquear:
 *                 type: string
 *                 format: time
 *                 description: Hora a bloquear (opcional)
 *               cupo_actual:
 *                 type: integer
 *                 description: Cantidad de cupos original (opcional)
 *               nuevos_cupos_totales:
 *                 type: integer
 *                 description: Cantidad de cupos modificada (opcional)
 *     responses:
 *       201:
 *         description: Modificación temporaria creada exitosamente
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
 *                   example: Modificación temporaria creada exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/ModificacionTemporaria'
 *       400:
 *         description: Solicitud incorrecta (ej. tipo de modificación no reconocido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflicto (ej. reservas existentes en el período)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Datos inválidos (validación fallida)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Si el header x-agencia-id está presente, lo agregamos al body. De lo contrario, queda en el valor que se le pase o undefined.
    const agenciaIdHeader = request.headers.get('x-agencia-id');
    if (agenciaIdHeader){
      body.agencia_id = parseInt(agenciaIdHeader, 10);
    }
    const respuesta = await guardarModificacionTemporaria(body);

    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    logError(err, { endpoint: '/api/turnos/modificacionesTemporarias/POST' });
    return NextResponse.json(
      {
        code: 500,
        message: 'Error interno al guardar la modificación temporaria',
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/turnos/modificacionesTemporarias:
 *   put:
 *     tags:
 *       - Modificaciones Temporarias
 *     summary: Modificar una modificación temporaria existente
 *     description: Actualiza una modificación temporaria existente
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID de la modificación temporaria a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModificacionTemporaria'
 *     responses:
 *       200:
 *         description: Modificación temporaria actualizada exitosamente
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
 *                   example: Modificación temporaria actualizada exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/ModificacionTemporaria'
 *       400:
 *         description: Solicitud incorrecta (ej. tipo de modificación no reconocido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflicto (ej. reservas existentes en el período)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Datos inválidos (validación fallida)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Modificación temporaria no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        {
          code: 400,
          message: 'ID de modificación temporaria no válido',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    // Si el header x-agencia-id está presente, lo agregamos al body. De lo contrario, queda en el valor que se le pase o undefined.
    const agenciaIdHeader = request.headers.get('x-agencia-id');
     if (agenciaIdHeader){
      body.agencia_id = parseInt(agenciaIdHeader, 10);
    }

    const respuesta = await actualizarModificacionTemporaria(parseInt(id, 10), body);

    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    logError(err, { endpoint: '/api/turnos/modificacionesTemporarias/PUT' });
    return NextResponse.json(
      {
        code: 500,
        message: 'Error interno al actualizar la modificación temporaria',
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/turnos/modificacionesTemporarias:
 *   delete:
 *     tags:
 *       - Modificaciones Temporarias
 *     summary: Eliminar una modificación temporaria (soft delete)
 *     description: Elimina una modificación temporaria (soft delete)
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID de la modificación temporaria a eliminar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Modificación temporaria eliminada exitosamente
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
 *                   example: Modificación temporaria eliminada exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Modificación temporaria no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        {
          code: 400,
          message: 'ID de modificación temporaria no válido',
        },
        { status: 400 }
      );
    }

    const respuesta = await eliminarModificacionTemporaria(parseInt(id, 10));

    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    logError(err, { endpoint: '/api/turnos/modificacionesTemporarias/DELETE' });
    return NextResponse.json(
      {
        code: 500,
        message: 'Error interno al eliminar la modificación temporaria',
      },
      { status: 500 }
    );
  }
}