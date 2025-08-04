import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { logError, logInfo } from '../../../utils/error/logger';
import { getRolesFiltrados } from './controllers/rolController';
import { createClient } from '../../../utils/supabase/server';

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Obtener lista de roles
 *     description: Obtiene una lista de roles o un rol específico por ID
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID del rol (opcional)
 *         schema:
 *           type: integer
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
 *                   example: "Roles obtenidos exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Rol no encontrado
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET: Obtener roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam) : undefined;
    
    // Utilizar el controlador para obtener los roles filtrados
    const resultado = await getRolesFiltrados({ id });
    
    logInfo(`Roles obtenidos exitosamente`, { endpoint: '/api/roles/GET' });
    return NextResponse.json(resultado);
  } catch (err: any) {
    logError({
      message: 'Error al obtener roles',
      error: err,
      endpoint: '/api/roles/GET'
    });
    
    return NextResponse.json({
      code: err.code || 500,
      message: err.message || 'Error al obtener roles'
    }, { status: err.code || 500 });
  }
}

/**
 * @swagger
 * /api/roles:
 *   post:
 *     tags:
 *       - Roles
 *     summary: Crear un nuevo rol
 *     description: Crea un nuevo rol con los datos proporcionados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del rol
 *             required:
 *               - nombre
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
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
 *                   example: "Rol creado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
// Esquema de validación para crear un rol
const rolSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido')
});

// POST: Crear un rol
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const data = rolSchema.parse(body);

    const now = new Date().toISOString();

    // Insertar el nuevo rol
    const { data: nuevoRol, error } = await supabase
      .from('roles')
      .insert({
        nombre: data.nombre,
        created_at: now,
        updated_at: now
      })
      .select('*')
      .single();

    if (error) throw error;

    logInfo(`Rol creado exitosamente: ${nuevoRol.nombre}`, { endpoint: '/api/roles/POST' });
    return NextResponse.json({
      code: 201,
      message: 'Rol creado exitosamente',
      data: nuevoRol
    }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { endpoint: '/api/roles/POST', errorType: 'validationError' });
      return NextResponse.json({
        code: 400,
        message: 'Datos de rol inválidos',
        errors: err.errors
      }, { status: 400 });
    }
    logError(err, { endpoint: '/api/roles/POST' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/roles:
 *   put:
 *     tags:
 *       - Roles
 *     summary: Actualizar un rol existente
 *     description: Actualiza los datos de un rol existente
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID del rol a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del rol
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Rol no encontrado
 *       500:
 *         description: Error interno del servidor
 */
// Esquema de validación para actualizar un rol
const rolUpdateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').optional()
});

// PUT: Actualizar un rol
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({
        code: 400,
        message: 'Se requiere el parámetro ID'
      }, { status: 400 });
    }

    const id = Number(idParam);
    const body = await request.json();
    const data = rolUpdateSchema.parse(body);

    const now = new Date().toISOString();

    // Verificar que el rol exista
    const { data: rolExistente, error: errorBusqueda } = await supabase
      .from('roles')
      .select('id')
      .eq('id', id)
      .single();

    if (errorBusqueda || !rolExistente) {
      logError(errorBusqueda || new Error('Rol no encontrado'), { endpoint: '/api/roles/PUT', id });
      return NextResponse.json({
        code: 404,
        message: 'Rol no encontrado'
      }, { status: 404 });
    }

    // Actualizar el rol
    const updateData: any = {
      updated_at: now
    };

    if (data.nombre !== undefined) updateData.nombre = data.nombre;

    const { data: rolActualizado, error } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    logInfo(`Rol actualizado exitosamente: ${rolActualizado.nombre}`, { endpoint: '/api/roles/PUT', id });
    return NextResponse.json({
      code: 200,
      message: 'Rol actualizado exitosamente',
      data: rolActualizado
    });
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { endpoint: '/api/roles/PUT', errorType: 'validationError' });
      return NextResponse.json({
        code: 400,
        message: 'Datos de rol inválidos',
        errors: err.errors
      }, { status: 400 });
    }
    logError(err, { endpoint: '/api/roles/PUT' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/roles:
 *   delete:
 *     tags:
 *       - Roles
 *     summary: Eliminar un rol
 *     description: Elimina permanentemente un rol
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID del rol a eliminar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rol eliminado exitosamente
 *       404:
 *         description: Rol no encontrado
 *       500:
 *         description: Error interno del servidor
 */
// DELETE: Eliminar un rol (eliminación física)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({
        code: 400,
        message: 'Se requiere el parámetro ID'
      }, { status: 400 });
    }

    const id = Number(idParam);

    // Verificar que el rol exista
    const { data: rolExistente, error: errorBusqueda } = await supabase
      .from('roles')
      .select('id, nombre')
      .eq('id', id)
      .single();

    if (errorBusqueda || !rolExistente) {
      logError(errorBusqueda || new Error('Rol no encontrado'), { endpoint: '/api/roles/DELETE', id });
      return NextResponse.json({
        code: 404,
        message: 'Rol no encontrado'
      }, { status: 404 });
    }

    // Eliminar el rol (eliminación física)
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logInfo(`Rol eliminado exitosamente: ${rolExistente.nombre}`, { endpoint: '/api/roles/DELETE', id });
    return NextResponse.json({
      code: 200,
      message: 'Rol eliminado exitosamente'
    });
  } catch (err) {
    logError(err, { endpoint: '/api/roles/DELETE' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
