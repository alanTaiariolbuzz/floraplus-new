import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logError } from "../../../utils/error/logger";
import {
  getTurnosFiltrados,
  crearTurno,
  actualizarTurno,
  eliminarTurno,
} from "./controllers/turnoController";

/**
 * @swagger
 * /api/turnos:
 *   get:
 *     tags:
 *       - Turnos
 *     summary: Obtener lista de turnos
 *     description: Obtiene una lista de turnos, opcionalmente filtrados por actividad, horario, agencia o fecha
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID del turno (opcional)
 *         schema:
 *           type: integer
 *       - name: actividad_id
 *         in: query
 *         description: ID de la actividad (opcional)
 *         schema:
 *           type: integer
 *       - name: horario_id
 *         in: query
 *         description: ID del horario (opcional)
 *         schema:
 *           type: integer
 *       - name: agencia_id
 *         in: query
 *         description: ID de la agencia (opcional)
 *         schema:
 *           type: integer
 *       - name: fecha_desde
 *         in: query
 *         description: Fecha desde para filtrar turnos (formato YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: fecha_hasta
 *         in: query
 *         description: Fecha hasta para filtrar turnos (formato YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: solo_disponibles
 *         in: query
 *         description: Si es true, muestra solo turnos con cupo disponible y no bloqueados
 *         schema:
 *           type: boolean
 *       - name: incluir_borrados
 *         in: query
 *         description: Si es true, incluye turnos marcados como eliminados
 *         schema:
 *           type: boolean
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
 *                   example: "Turnos obtenidos exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Turno'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     errorId:
 *                       type: string
 *                       description: Identificador único del error para facilitar su seguimiento
 *                       example: "ldcbn4kz89a3"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Convertir parámetros de búsqueda a los tipos adecuados
    const filtros: any = {};

    // Convertir IDs a números
    if (searchParams.has("id")) {
      filtros.id = Number(searchParams.get("id"));
    }
    
    if (searchParams.has("actividad_id")) {
      filtros.actividad_id = Number(searchParams.get("actividad_id"));
    }

    if (searchParams.has("horario_id")) {
      filtros.horario_id = Number(searchParams.get("horario_id"));
    }

    const agenciaIdHeader = request.headers.get('x-agencia-id');
    
    if (agenciaIdHeader) {
      filtros.agencia_id = agenciaIdHeader ? Number(agenciaIdHeader) : undefined;
    }

    // Mantener fechas como strings
    if (searchParams.has("fecha_desde")) {
      filtros.fecha_desde = searchParams.get("fecha_desde");
    }

    if (searchParams.has("fecha_hasta")) {
      filtros.fecha_hasta = searchParams.get("fecha_hasta");
    }

    if (searchParams.has("incluir_borrados")) {
      filtros.incluir_borrados =
        searchParams.get("incluir_borrados") === "true";
    }


    if (searchParams.has('solo_disponibles')) {
      filtros.solo_disponibles = searchParams.get('solo_disponibles');
    }
    
    const response = await getTurnosFiltrados(filtros);

    return NextResponse.json(response, { status: response.code });
  } catch (error) {
    // Generar un ID de error único para facilitar el seguimiento
    const errorId =
      new Date().getTime().toString(36) +
      Math.random().toString(36).substr(2, 5);
    logError(error, { route: "GET /api/turnos", errorId });

    const pgError = error as any;
    if (pgError.code) {
      // Si es un error de PostgreSQL/Supabase, proporcionar más detalles
      return NextResponse.json(
        {
          code: 500,
          message: "Error al consultar turnos",
          errorId,
          detail:
            process.env.NODE_ENV === "development"
              ? pgError.details
              : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        errorId,
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/turnos:
 *   post:
 *     tags:
 *       - Turnos
 *     summary: Crear un nuevo turno
 *     description: Crea un nuevo turno con los datos proporcionados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               horario_id:
 *                 type: integer
 *                 description: ID del horario asociado
 *               actividad_id:
 *                 type: integer
 *                 description: ID de la actividad asociada
 *               agencia_id:
 *                 type: integer
 *                 description: ID de la agencia asociada
 *               cupo_disponible:
 *                 type: integer
 *                 description: Cantidad de cupos disponibles
 *               fecha:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha del turno
 *               hora_inicio:
 *                 type: string
 *                 format: time
 *                 description: Hora de inicio del turno
 *               hora_fin:
 *                 type: string
 *                 format: time
 *                 description: Hora de fin del turno
 *               bloquear:
 *                 type: boolean
 *                 description: Indica si el turno está bloqueado
 *               cupo_total:
 *                 type: integer
 *                 description: Capacidad total del turno
 *     responses:
 *       201:
 *         description: Turno creado exitosamente
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
 *                   example: "Turno creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Turno'
 *       400:
 *         description: Datos inválidos o parámetros faltantes
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorValidacion'
 *                 - type: object
 *                   properties:
 *                     code:
 *                       type: integer
 *                       example: 400
 *                     message:
 *                       type: string
 *                       example: "Referencia inválida: El horario especificado no existe"
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                             example: "foreign_key_violation"
 *                           field:
 *                             type: string
 *                             example: "horario_id"
 *                           message:
 *                             type: string
 *                             example: "El ID proporcionado no existe en la tabla de horarios"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     errorId:
 *                       type: string
 *                       description: Identificador único del error para facilitar su seguimiento
 *                       example: "ldcbn4kz89a3"
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await crearTurno(body);

    return NextResponse.json(response, { status: response.code });
  } catch (error) {
    // Si el controlador ya manejo el error y devolvio una respuesta estructurada
    if ((error as any).code && (error as any).message) {
      return NextResponse.json(error, { status: (error as any).code });
    }

    // Generar un ID de error único para facilitar el seguimiento
    const errorId =
      new Date().getTime().toString(36) +
      Math.random().toString(36).substr(2, 5);
    logError(error, { route: "POST /api/turnos", errorId });

    return NextResponse.json(
      {
        code: 500,
        message: "Error al crear el turno",
        errorId,
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/turnos:
 *   put:
 *     tags:
 *       - Turnos
 *     summary: Actualizar un turno existente
 *     description: Actualiza un turno existente identificado por su ID
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         example: 1
 *         description: ID del turno a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               horario_id:
 *                 type: integer
 *                 description: ID del horario asociado
 *               actividad_id:
 *                 type: integer
 *                 description: ID de la actividad asociada
 *               agencia_id:
 *                 type: integer
 *                 description: ID de la agencia asociada
 *               cupo_disponible:
 *                 type: integer
 *                 description: Cantidad de cupos disponibles
 *               fecha:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha del turno
 *               hora_inicio:
 *                 type: string
 *                 format: time
 *                 description: Hora de inicio del turno
 *               hora_fin:
 *                 type: string
 *                 format: time
 *                 description: Hora de fin del turno
 *               bloquear:
 *                 type: boolean
 *                 description: Indica si el turno está bloqueado
 *               cupo_total:
 *                 type: integer
 *                 description: Capacidad total del turno
 *     responses:
 *       200:
 *         description: Turno actualizado exitosamente
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
 *                   example: "Turno modificado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Turno'
 *       400:
 *         description: Datos inválidos o parámetros faltantes
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorValidacion'
 *                 - type: object
 *                   properties:
 *                     code:
 *                       type: integer
 *                       example: 400
 *                     message:
 *                       type: string
 *                       example: "Referencia inválida: El horario especificado no existe"
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                             example: "foreign_key_violation"
 *                           field:
 *                             type: string
 *                             example: "horario_id"
 *                           message:
 *                             type: string
 *                             example: "El ID proporcionado no existe en la tabla de horarios"
 *       404:
 *         description: Turno no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "Turno no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     errorId:
 *                       type: string
 *                       description: Identificador único del error para facilitar su seguimiento
 *                       example: "ldcbn4kz89a3"
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          code: 400,
          message: "Se requiere un ID para actualizar un turno",
          errors: [
            {
              code: "missing_parameter",
              field: "id",
              message: "El parámetro id es obligatorio en la URL",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de turno inválido",
          errors: [
            {
              code: "invalid_parameter",
              field: "id",
              message: "El ID debe ser un número válido",
            },
          ],
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const response = await actualizarTurno(parseInt(id), body);

    return NextResponse.json(response, { status: response.code });
  } catch (error) {
    // Si el controlador ya manejo el error y devolvio una respuesta estructurada
    if ((error as any).code && (error as any).message) {
      return NextResponse.json(error, { status: (error as any).code });
    }

    // Generar un ID de error único para facilitar el seguimiento
    const errorId =
      new Date().getTime().toString(36) +
      Math.random().toString(36).substr(2, 5);
    logError(error, { route: "PUT /api/turnos", errorId });

    return NextResponse.json(
      {
        code: 500,
        message: "Error al actualizar el turno",
        errorId,
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/turnos:
 *   delete:
 *     tags:
 *       - Turnos
 *     summary: Eliminar un turno
 *     description: Marca un turno como eliminado (soft delete)
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         example: 1
 *         description: ID del turno a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Turno eliminado exitosamente
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
 *                   example: "Turno marcado como eliminado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Turno no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "Turno no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     errorId:
 *                       type: string
 *                       description: Identificador único del error para facilitar su seguimiento
 *                       example: "ldcbn4kz89a3"
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          code: 400,
          message: "Se requiere un ID para eliminar un turno",
          errors: [
            {
              code: "missing_parameter",
              field: "id",
              message: "El parámetro id es obligatorio en la URL",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de turno inválido",
          errors: [
            {
              code: "invalid_parameter",
              field: "id",
              message: "El ID debe ser un número válido",
            },
          ],
        },
        { status: 400 }
      );
    }

    const response = await eliminarTurno(parseInt(id));

    return NextResponse.json(response, { status: response.code });
  } catch (error) {
    // Si el controlador ya manejo el error y devolvio una respuesta estructurada
    if ((error as any).code && (error as any).message) {
      return NextResponse.json(error, { status: (error as any).code });
    }

    // Generar un ID de error único para facilitar el seguimiento
    const errorId =
      new Date().getTime().toString(36) +
      Math.random().toString(36).substr(2, 5);
    logError(error, { route: "DELETE /api/turnos", errorId });

    return NextResponse.json(
      {
        code: 500,
        message: "Error al eliminar el turno",
        errorId,
      },
      { status: 500 }
    );
  }
}
