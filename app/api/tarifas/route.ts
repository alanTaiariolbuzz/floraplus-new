import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logError } from "../../../utils/error/logger";
import {
  getTarifasFiltradas,
  crearTarifa,
  actualizarTarifa,
  eliminarTarifa,
} from "./controllers/tarifaController";

/**
 * @swagger
 * /api/tarifas:
 *   get:
 *     tags:
 *       - Tarifas
 *     summary: Obtener lista de tarifas
 *     description: Obtiene un listado de tarifas
 *     parameters:
 *       - name: id
 *         in: query
 *         description: Filtrar por ID de la tarifa
 *         required: false
 *         schema:
 *           type: integer
 *       - name: actividad_id
 *         in: query
 *         description: Filtrar por ID de la actividad asociada
 *         required: false
 *         schema:
 *           type: integer
 *       - name: es_principal
 *         in: query
 *         description: Filtrar por tarifas principales
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: activa
 *         in: query
 *         description: Filtrar por tarifas activas/inactivas
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de tarifas
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
 *                   example: Tarifas obtenidas exitosamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tarifa'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET: Obtener tarifas con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const respuesta = await getTarifasFiltradas(searchParams);

    return NextResponse.json(respuesta);
  } catch (err) {
    return NextResponse.json(
      {
        code: 500,
        message: "Error al obtener tarifas",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/tarifas:
 *   post:
 *     tags:
 *       - Tarifas
 *     summary: Crear una nueva tarifa
 *     description: Crea una nueva tarifa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actividad_id
 *               - nombre
 *               - precio
 *             properties:
 *               actividad_id:
 *                 type: integer
 *                 description: ID de la actividad asociada
 *               nombre:
 *                 type: string
 *                 description: Nombre de la tarifa
 *               nombre_en:
  *                 type: string
  *                 description: Nombre de la tarifa en inglés
 *               precio:
 *                 type: number
 *                 format: float
 *                 description: Precio de la tarifa
 *               es_principal:
 *                 type: boolean
 *                 description: Indica si es la tarifa principal
 *                 default: false
 *               activa:
 *                 type: boolean
 *                 description: Indica si la tarifa está activa
 *                 default: true
 *     responses:
 *       201:
 *         description: Tarifa creada exitosamente
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
 *                   example: Tarifa creada exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Tarifa'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Datos de tarifa inválidos
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *       500:
 *         description: Error interno del servidor
 */
/**
 * POST: Crear una nueva tarifa
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const respuesta = await crearTarifa(body);

    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    if (err.code) {
      return NextResponse.json(err, { status: err.code });
    }

    logError(err, { endpoint: "/api/tarifas/POST" });
    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/tarifas:
 *   put:
 *     tags:
 *       - Tarifas
 *     summary: Modificar una tarifa existente
 *     description: Actualiza una tarifa existente
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID de la tarifa a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actividad_id
 *               - nombre
 *               - precio
 *             properties:
 *               actividad_id:
 *                 type: integer
 *                 description: ID de la actividad asociada
 *               nombre:
 *                 type: string
 *                 description: Nombre de la tarifa
 *               nombre_en:
 *                 type: string
 *                 description: Nombre de la tarifa en inglés
 *               precio:
 *                 type: number
 *                 format: float
 *                 description: Precio de la tarifa
 *               es_principal:
 *                 type: boolean
 *                 description: Indica si es la tarifa principal
 *               activa:
 *                 type: boolean
 *                 description: Indica si la tarifa está activa
 *     responses:
 *       200:
 *         description: Tarifa actualizada exitosamente
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
 *                   example: Tarifa modificada exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Tarifa'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Datos de tarifa inválidos
 *       404:
 *         description: Tarifa no encontrada
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
 *                   example: Tarifa no encontrada
 *       500:
 *         description: Error interno del servidor
 */
/**
 * PUT: Modificar una tarifa existente
 */
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '');
    if (!id) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de tarifa no válido",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const respuesta = await actualizarTarifa(id, body);

    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    if (err.code) {
      return NextResponse.json(err, { status: err.code });
    }

    logError(err, { endpoint: "/api/tarifas/PUT" });
    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/tarifas:
 *   delete:
 *     tags:
 *       - Tarifas
 *     summary: Eliminar una tarifa (soft delete)
 *     description: Elimina una tarifa (soft delete)
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID de la tarifa a eliminar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tarifa eliminada exitosamente
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
 *                   example: Tarifa marcada como eliminada exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Tarifa no encontrada
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
 *                   example: Tarifa no encontrada
 *       500:
 *         description: Error interno del servidor
 */
/**
 * DELETE: Eliminar una tarifa (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '');
    if (!id) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de tarifa no válido",
        },
        { status: 400 }
      );
    }

    const respuesta = await eliminarTarifa(id);

    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err) {
    logError(err, { endpoint: "/api/tarifas/DELETE" });
    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
