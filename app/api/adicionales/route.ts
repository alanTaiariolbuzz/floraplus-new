import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { createClient } from '../../../utils/supabase/server';
import { logError, logInfo } from '../../../utils/error/logger';
import { 
  getAdicionalesFiltrados, 
  crearAdicional, 
  actualizarAdicional, 
  eliminarAdicional 
} from './controllers/adicionalController';

/**
 * @swagger
 * /api/adicionales:
 *   get:
 *     tags:
 *       - Adicionales
 *     summary: Obtener lista de adicionales
 *     description: Obtiene una lista de adicionales, opcionalmente filtrados por actividad. Por defecto solo devuelve adicionales activos y no eliminados.
 *     parameters:
 *       - name: actividad_id
 *         in: query
 *         description: ID de la actividad (opcional)
 *         schema:
 *           type: integer
 *       - name: id
 *         in: query
 *         description: ID del adicional (opcional)
 *         schema:
 *           type: integer
 *       - name: aplica_a_todas
 *         in: query
 *         description: Filtra por adicionales globales (opcional)
 *         schema:
 *           type: boolean
 *       - name: activo
 *         in: query
 *         description: Filtra por adicionales activos (opcional, por defecto true)
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
 *                   example: "Adicionales obtenidos exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       titulo_en:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *                       descripcion_en:
 *                         type: string
 *                       precio:
 *                         type: number
 *                       moneda:
 *                         type: string
 *                       activo:
 *                         type: boolean
 *                       aplica_a_todas:
 *                         type: boolean
 *                       agencia_id:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       actividad_ids:
 *                         type: array
 *                         items:
 *                           type: integer
 *       400:
 *         description: Solicitud inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET: Obtener la lista de adicionales
export async function GET(request: NextRequest) {
  try {
    logInfo('Iniciando obtención de adicionales', {
      endpoint: '/api/adicionales/GET',
      url: request.url
    });
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const actividadIdParam = searchParams.get('actividad_id');
    const aplicaTodasParam = searchParams.get('aplica_a_todas');
    const agenciaIdHeader = request.headers.get('x-agencia-id');
    
    const filtros: any = {};
    
    // Convertir parámetros si están presentes
    if (idParam) {
      const id = parseInt(idParam);
      if (isNaN(id)) {
        logError(new Error('ID de adicional inválido'), {
          endpoint: '/api/adicionales/GET',
          context: 'Validación de parámetros'
        });
        return NextResponse.json({
          code: 400,
          message: 'ID de adicional inválido'
        }, { status: 400 });
      }
      filtros.id = id;
    }
    
    if (actividadIdParam) {
      const actividadId = parseInt(actividadIdParam);
      if (isNaN(actividadId)) {
        logError(new Error('ID de actividad inválido'), {
          endpoint: '/api/adicionales/GET',
          context: 'Validación de parámetros'
        });
        return NextResponse.json({
          code: 400,
          message: 'ID de actividad inválido'
        }, { status: 400 });
      }
      filtros.actividad_id = actividadId;
    }
    
    if (aplicaTodasParam !== null) {
      filtros.aplica_a_todas = aplicaTodasParam === 'true';
    }

    agenciaIdHeader ? filtros.agencia_id = Number(agenciaIdHeader) : filtros.agencia_id = undefined;
    
    // Utilizar el controlador para obtener los adicionales filtrados
    try {
      const resultado = await getAdicionalesFiltrados(filtros);
      
      logInfo(`Adicionales obtenidos exitosamente`, { endpoint: '/api/adicionales/GET' });
      return NextResponse.json(resultado);
    } catch (controllerError: any) {
      // Determinar el código HTTP apropiado basándonos en el código del error
      const statusCode = controllerError?.code && typeof controllerError.code === 'number' 
        ? controllerError.code 
        : 500;
      
      return NextResponse.json({
        code: controllerError?.code || 500,
        message: controllerError?.message || 'Error al obtener adicionales'
      }, { status: statusCode });
    }
  } catch (err: any) {
    // Añadir log de error estructurado con detalles completos
    logError(err, {
      endpoint: '/api/adicionales/GET',
      context: 'Error al obtener adicionales',
      errorDetails: {
        message: err.message || 'Error al obtener adicionales',
        name: err.name,
        stack: err instanceof Error ? err.stack : undefined
      }
    });
    
    // Determinar el código HTTP adecuado
    const statusCode = err && typeof err === 'object' && err.code && typeof err.code === 'number'
      ? err.code
      : 500;
    
    return NextResponse.json({
      code: statusCode,
      message: err && typeof err === 'object' && err.message ? err.message : 'Error al obtener adicionales'
    }, { status: statusCode });
  }
}

/**
 * @swagger
 * /api/adicionales:
 *   post:
 *     tags:
 *       - Adicionales
 *     summary: Crear un nuevo adicional
 *     description: Crea un nuevo adicional con los datos proporcionados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título del adicional
 *               titulo_en:
 *                 type: string
 *                 description: Título del adicional en inglés (opcional)
 *               descripcion:
 *                 type: string
 *                 description: Descripción del adicional
 *               descripcion_en:
 *                 type: string
 *                 description: Descripción del adicional en inglés (opcional)
 *               precio:
 *                 type: number
 *                 description: Precio del adicional
 *               moneda:
 *                 type: string
 *                 description: Moneda del precio (default USD)
 *               imagen:
 *                 type: string
 *                 description: Url de la imagen del adicional
 *               actividad_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs de actividades a las que aplica este adicional
 *               aplica_a_todas:
 *                 type: boolean
 *                 description: Si es true, el adicional se aplicará a todas las actividades de la agencia
 *               activo:
 *                 type: boolean
 *                 description: Indica si el adicional está activo (default true)
 *             required:
 *               - titulo
 *               - descripcion
 *               - precio
 *     responses:
 *       201:
 *         description: Adicional creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
// Esquema de validación para crear un adicional
const adicionalSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  titulo_en: z.string().optional(),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  descripcion_en: z.string().optional(),
  precio: z.number().positive('El precio debe ser positivo'),
  moneda: z.string().optional().default('USD'),
  aplica_a_todas: z.boolean().optional().default(false),
  imagen: z.string().optional(),
  actividad_ids: z.array(z.number()).optional().default([]),
  activo: z.boolean().optional().default(true)
});

// POST: Crear un nuevo adicional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = adicionalSchema.parse(body);
    
    // Obtener el ID de la agencia del header
    const agenciaId = request.headers.get('x-agencia-id');
    
    if (!agenciaId) {
      return NextResponse.json(
        { code: 401, message: 'Agencia no encontrada' },
        { status: 401 }
      );
    }
    
    // Utilizar el controlador para crear el adicional
    const resultado = await crearAdicional(
      data, // Datos del body
      parseInt(agenciaId, 10) // agenciaId como número
    );
    
    logInfo('Adicional creado exitosamente', {
      endpoint: '/api/adicionales/POST',
      id: resultado.data?.id
    });
    
    return NextResponse.json(resultado, { status: 201 });
  } catch (err: any) {
    if (err instanceof ZodError) {
      // Añadir log de error para errores de validación
      logError(err, {
        endpoint: '/api/adicionales/PUT',
        context: 'Datos de adicional inválidos'
      });
      
      return NextResponse.json({
        code: 400,
        message: 'Datos de adicional inválidos',
        errors: err.errors
      }, { status: 400 });
    }
    
    // Añadir log de error estructurado
    logError(err, {
      endpoint: '/api/adicionales/POST',
      context: 'Error al crear adicional'
    });
    
    return NextResponse.json({
      code: 500,
      message: 'Error al crear adicional'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/adicionales:
 *   put:
 *     tags:
 *       - Adicionales
 *     summary: Modificar un adicional existente
 *     description: Actualiza un adicional existente y sus relaciones con actividades. Gestiona automáticamente las relaciones en la tabla actividad_adicionales.
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID del adicional a modificar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título del adicional
 *               titulo_en:
 *                 type: string
 *                 description: Título del adicional en inglés (opcional)
 *               descripcion:
 *                 type: string
 *                 description: Descripción del adicional
 *               descripcion_en:
 *                 type: string
 *                 description: Descripción del adicional en inglés (opcional)
 *               precio:
 *                 type: number
 *                 description: Precio del adicional
 *               moneda:
 *                 type: string
 *                 description: Moneda del precio
 *               aplica_a_todas:
 *                 type: boolean
 *                 description: Si es true, el adicional se aplicará a todas las actividades de la agencia
 *               actividad_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs de actividades a las que aplica este adicional
 *               activo:
 *                 type: boolean
 *                 description: Indica si el adicional está activo
 *     responses:
 *       200:
 *         description: Adicional modificado exitosamente
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
 *                   example: "Adicional actualizado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *                     precio:
 *                       type: number
 *                     moneda:
 *                       type: string
 *                     activo:
 *                       type: boolean
 *                     aplica_a_todas:
 *                       type: boolean
 *                     agencia_id:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     actividad_ids:
 *                       type: array
 *                       items:
 *                         type: integer
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Adicional no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Esquema de validación para actualizar un adicional
const adicionalUpdateSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').optional(),
  titulo_en: z.string().optional(),
  descripcion: z.string().min(1, 'La descripción es requerida').optional(),
  descripcion_en: z.string().optional(),
  precio: z.number().positive('El precio debe ser positivo').optional(),
  moneda: z.string().optional(),
  imagen: z.string().optional(),
  aplica_a_todas: z.boolean().optional(),
  actividad_ids: z.array(z.number()).optional(),
  activo: z.boolean().optional()
});

// PUT: Modificar un adicional existente
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '');
    if (isNaN(id) || !id) {
      // Log error cuando falta ID
      logError(new Error('ID de adicional no proporcionado'), {
        endpoint: '/api/adicionales/DELETE',
        context: 'Eliminación de adicional - ID no proporcionado'
      });
      return NextResponse.json({
        code: 400,
        message: 'ID de adicional no proporcionado'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const data = adicionalUpdateSchema.parse(body);
    
    // Verificar validación adicional: si no aplica a todas y se proporcionaron ids, debe tener al menos una actividad
    if (data.aplica_a_todas === false && data.actividad_ids && data.actividad_ids.length === 0) {
      return NextResponse.json({
        code: 400,
        message: 'Si el adicional no es global, debe tener al menos una actividad asociada'
      }, { status: 400 });
    }
    
    // Utilizar el controlador para actualizar el adicional
    const resultado = await actualizarAdicional(id, data);
    
    logInfo('Adicional actualizado exitosamente', {
      endpoint: '/api/adicionales/PUT',
      id
    });
    
    return NextResponse.json(resultado);
  } catch (err: any) {
    if (err instanceof ZodError) {
      // Añadir log de error para errores de validación
      logError(err, {
        endpoint: '/api/adicionales/PUT',
        context: 'Datos de adicional inválidos'
      });
      
      return NextResponse.json({
        code: 400,
        message: 'Datos de adicional inválidos',
        errors: err.errors
      }, { status: 400 });
    }
    
    if (err.message === 'Adicional no encontrado') {
      return NextResponse.json({
        code: 404,
        message: 'Adicional no encontrado'
      }, { status: 404 });
    }
    
    // Añadir log de error para errores en actualizaciones
    logError(err, {
      endpoint: '/api/adicionales/PUT',
      context: 'Error al actualizar adicional'
    });
    
    // Usar los valores del controlador o un valor por defecto, verificando que sea un código válido
    let statusCode = 500;
    if (err.code && err.code >= 200 && err.code < 600) {
      statusCode = err.code;
    }
    
    return NextResponse.json({
      code: statusCode,
      message: err.message || 'Error al actualizar adicional'
    }, { status: statusCode });
  }
}

/**
 * @swagger
 * /api/adicionales:
 *   delete:
 *     tags:
 *       - Adicionales
 *     summary: Eliminar un adicional (soft delete)
 *     description: Implementa un soft delete para adicionales. Marca el adicional como inactivo (activo=false), establece un timestamp en deleted_at, y mantiene el registro en la base de datos pero lo excluye de consultas regulares.
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID del adicional a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Adicional eliminado exitosamente (soft delete)
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
 *                   example: "Adicional eliminado exitosamente"
 *       400:
 *         description: ID de adicional no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Adicional no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE: Eliminar un adicional
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '');
    if (isNaN(id) || !id) {
      // Log error cuando falta ID
      logError(new Error('ID de adicional no proporcionado'), {
        endpoint: '/api/adicionales/DELETE',
        context: 'Eliminación de adicional - ID no proporcionado'
      });
      return NextResponse.json({
        code: 400,
        message: 'ID de adicional no proporcionado'
      }, { status: 400 });
    }
    
    // Utilizar el controlador para eliminar el adicional
    const resultado = await eliminarAdicional(id);
    
    logInfo('Adicional eliminado exitosamente', {
      endpoint: '/api/adicionales/DELETE',
      id
    });
    
    return NextResponse.json(resultado);
  } catch (err: any) {
    if (err.message === 'Adicional no encontrado') {
      return NextResponse.json({
        code: 404,
        message: 'Adicional no encontrado'
      }, { status: 404 });
    }
    
    logError({
      message: 'Error al eliminar adicional',
      error: err,
      endpoint: '/api/adicionales/DELETE'
    });
    
    // Añadir log de error para errores en eliminaciones
    logError(err, {
      endpoint: '/api/adicionales/DELETE',
      context: 'Error al eliminar adicional'
    });
    
    // Usar los valores del controlador o un valor por defecto, verificando que sea un código válido
    let statusCode = 500;
    if (err.code && err.code >= 200 && err.code < 600) {
      statusCode = err.code;
    }
    
    return NextResponse.json({
      code: statusCode,
      message: err.message || 'Error al eliminar adicional'
    }, { status: statusCode });
  }
}
