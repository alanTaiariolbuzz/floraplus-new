import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logError } from '../../../utils/error/logger';
import { 
  getClientesFiltrados,
  crearCliente, 
  actualizarCliente, 
  eliminarCliente 
} from './controllers/clienteController';

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     tags:
 *       - Clientes
 *     summary: Obtener lista de clientes
 *     description: Obtiene un listado de clientes
 *     parameters:
 *       - name: id
 *         in: query
 *         description: Filtrar por ID del cliente
 *         required: false
 *         schema:
 *           type: string
 *       - name: email
 *         in: query
 *         description: Filtrar por email del cliente (búsqueda parcial)
 *         required: false
 *         schema:
 *           type: string
 *       - name: telefono
 *         in: query
 *         description: Filtrar por telefono del cliente
 *         required: false
 *         schema:
 *           type: string
 *       - name: activo
 *         in: query
 *         description: Filtrar por cliente activos/inactivos
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de cliente
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
 *                   example: Cliente obtenidos exitosamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Clientes'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET: Obtener cliente con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const respuesta = await getClientesFiltrados(searchParams);

    if (respuesta.code === 404) {
      return NextResponse.json(respuesta, { status: 404 });
    }
    
    return NextResponse.json(respuesta);
  } catch (err) {
    return NextResponse.json({
      code: 500,
      message: 'Error al obtener cliente'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     tags:
 *       - Clientes
 *     summary: Crear un nuevo cliente
 *     description: Registra un nuevo cliente en el sistema. Si se proporciona un ID de reserva, el cliente será asociado con esa reserva. Si el cliente ya existe (mismo email), se devolverá el cliente existente y se actualizará la reserva con el ID del cliente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - email
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del cliente
 *               apellido:
 *                 type: string
 *                 description: Apellido del cliente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del cliente
 *               telefono:
 *                 type: string
 *                 description: Teléfono del cliente (opcional)
 *               activo:
 *                 type: string
 *                 description: Estado del cliente (opcional)
 *               reserva_id:
 *                 type: integer
 *                 description: ID de la reserva a asociar con este cliente (opcional)
 *     responses:
 *       200:
 *         description: Cliente creado o encontrado exitosamente
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
 *                   example: Cliente creado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     nombre:
 *                       type: string
 *                       example: Juan
 *                     apellido:
 *                       type: string
 *                       example: Pérez
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: juan.perez@example.com
 *                     telefono:
 *                       type: string
 *                       example: +123456789
 *                     activo:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                 reservaActualizada:
 *                   type: boolean
 *                   description: Indica si se actualizó una reserva con el ID del cliente
 *                   example: true
 *                 isExisting:
 *                   type: boolean
 *                   description: Indica si el cliente ya existía en el sistema
 *                   example: true
 *                 warning:
 *                   type: string
 *                   description: Mensaje de advertencia opcional
 *                   example: El cliente ya existía en el sistema
 *       400:
 *         description: Datos de cliente inválidos
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
 *                   example: Datos de cliente inválidos
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
 * POST: Crear un nuevo cliente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const respuesta = await crearCliente(body);
    
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    if (err.code) {
      return NextResponse.json(err, { status: err.code });
    }
    
    logError(err, { endpoint: '/api/clientes/POST' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/clientes:
 *   put:
 *     tags:
 *       - Clientes
 *     summary: Modificar un cliente existente
 *     description: Actualiza un cliente existente
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID del cliente a actualizar
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - email
 *               - telefono
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del cliente
 *               apellido:
 *                 type: string
 *                 description: Apellido del cliente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del cliente (debe ser único)
 *               telefono:
 *                 type: string
 *                 description: Teléfono de contacto del cliente
 *               activo:
 *                 type: string
 *                 description: Indica si el cliente está activo, por defecto "pending"
 *                 default: pending
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
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
 *                   example: Cliente modificado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: Datos inválidos o email ya en uso
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
 *                   example: Datos de cliente inválidos
 *       404:
 *         description: Cliente no encontrado
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
 *                   example: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
/**
 * PUT: Modificar un cliente existente
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({
        code: 400,
        message: 'ID de cliente no válido'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const respuesta = await actualizarCliente(id, body);
    
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    if (err.code) {
      return NextResponse.json(err, { status: err.code });
    }
    
    logError(err, { endpoint: '/api/clientes/PUT' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/clientes:
 *   delete:
 *     tags:
 *       - Clientes
 *     summary: Eliminar un cliente (soft delete)
 *     description: Elimina un cliente (soft delete)
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID del cliente a eliminar
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente eliminado exitosamente
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
 *                   example: Cliente marcado como eliminado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Cliente no encontrado
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
 *                   example: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
/**
 * DELETE: Eliminar un cliente (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({
        code: 400,
        message: 'ID de cliente no válido'
      }, { status: 400 });
    }
    
    const respuesta = await eliminarCliente(id);
    
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err) {
    logError(err, { endpoint: '/api/clientes/DELETE' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
