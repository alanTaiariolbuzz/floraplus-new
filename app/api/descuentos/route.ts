import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { createClient } from '../../../utils/supabase/server';
import { logError, logInfo } from '../../../utils/error/logger';
import { buildRelationMap, formatDescuentosResponse } from '../../../utils/data/mappers';

// Obtener el cliente de Supabase centralizado
const getSupabase = async () => await createClient();

/**
 * @swagger
 * /api/descuentos:
 *   get:
 *     tags:
 *       - Descuentos
 *     summary: Obtener lista de descuentos
 *     description: Obtiene una lista de descuentos, opcionalmente filtrados por actividad o por ID
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID del descuento (opcional). Si se especifica, retorna un descuento específico
 *         schema:
 *           type: integer
 *       - name: actividad_id
 *         in: query
 *         description: ID de la actividad (opcional). Retorna descuentos asociados a la actividad
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
 *                   example: "Descuentos obtenidos exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       agencia_id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                         enum: [monto, porcentaje]
 *                       valor:
 *                         type: number
 *                       alcance:
 *                         type: string
 *                         enum: [global, actividad]
 *                       valido_desde:
 *                         type: string
 *                         format: date
 *                       valido_hasta:
 *                         type: string
 *                         format: date
 *                       activo:
 *                         type: boolean
 *                       uso_maximo:
 *                         type: integer
 *                       usos_hechos:
 *                         type: integer
 *                       moneda:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       deleted_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       actividad_ids:
 *                         type: array
 *                         items:
 *                           type: integer
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET: Obtener la lista de descuentos
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { searchParams } = new URL(request.url);
    const actividadIdParam = searchParams.get('actividad_id');
    const idParam = searchParams.get('id');
    let descuentos = [];

    if (idParam) {
      // Buscar un descuento específico por ID
      const id = Number(idParam);
      const { data } = await supabase
        .from('descuentos')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      descuentos = data ? [data] : [];
    } else if (actividadIdParam) {
      const actividadId = Number(actividadIdParam);
      // IDs de descuentos asociados a la actividad dada
      const { data: links } = await supabase
        .from('actividad_descuento')
        .select('descuento_id')
        .eq('actividad_id', actividadId);
      const idsDescuentos = links?.map((l: any) => l.descuento_id) ?? [];
      
      // Descuentos específicos de esa actividad
      const { data: descEspecificos } = await supabase
        .from('descuentos')
        .select('*')
        .is('deleted_at', null)
        .in('id', idsDescuentos)
        .order('updated_at', { ascending: false, nullsFirst: false });
      
      // Global discount logic removed based on MEMORY[c49e4c6f-f1e9-4137-9d7e-3446df47b901]
      // const { data: allLinks } = await supabase
      //   .from('actividad_descuento')
      //   .select('descuento_id');
      // const linkedIds = allLinks?.map((l: any) => l.descuento_id) ?? [];
      
      // // Usar safeNotInFilter para manejar de forma segura listas vacías
      // let globalesQuery = supabase
      //   .from('descuentos')
      //   .select('*')
      //   .eq('alcance', 'global')
      //   .is('deleted_at', null);
      
      // globalesQuery = safeNotInFilter(globalesQuery, 'id', linkedIds);
      // const { data: descGlobales } = await globalesQuery;
      
      descuentos = [...(descEspecificos||[])]; // Only specific discounts now
    } else {
      // Obtener todos los descuentos
      const { data: allDesc } = await supabase
        .from('descuentos')
        .select('*')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false, nullsFirst: false });
      descuentos = allDesc || [];
    }

    // Mapear cada descuento con sus actividad_ids usando la función utilitaria
    const { data: relaciones } = await supabase
      .from('actividad_descuento')
      .select('*');
    
    const mapActividades = buildRelationMap(relaciones, 'descuento_id', 'actividad_id');
    
    // Formatear la respuesta usando la función utilitaria
    const result = formatDescuentosResponse(descuentos, mapActividades);

    logInfo('Descuentos obtenidos exitosamente', { count: result.length });
    return NextResponse.json({ code: 200, data: result }, { status: 200 });
  } catch (err) {
    logError(err, { endpoint: '/api/descuentos/GET' });
    return NextResponse.json({
      code: 500,
      message: 'Error al obtener descuentos'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/descuentos:
 *   put:
 *     tags:
 *       - Descuentos
 *     summary: Modificar un descuento existente
 *     description: Actualiza un descuento existente y sus relaciones con actividades
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID del descuento a modificar
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
 *               tipo:
 *                 type: string
 *                 enum: [monto, porcentaje]
 *               valor:
 *                 type: number
 *               alcance:
 *                 type: string
 *                 enum: [global, actividad]
 *               valido_desde:
 *                 type: string
 *                 format: date
 *               valido_hasta:
 *                 type: string
 *                 format: date
 *               activo:
 *                 type: boolean
 *               uso_maximo:
 *                 type: integer
 *               actividad_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Descuento modificado exitosamente
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
 *                   example: "Descuento modificado exitosamente"
 *                 data:
 *                   type: object
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Descuento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
// PUT: Modificar un descuento existente
export async function PUT(request: NextRequest) {
  try {
    // Obtener el ID del descuento de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam) : null;
    if (!id) {
      return NextResponse.json({
        code: 400,
        message: 'ID de descuento no válido'
      }, { status: 400 });
    }
    
    logInfo('Modificando descuento', { id });
    
    const supabase = await getSupabase();
    const body = await request.json();
    const data = descuentoSchema.parse(body);
    
    // Verificar que el descuento existe y no está eliminado
    const { data: existingDesc, error: checkError } = await supabase
      .from('descuentos')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (checkError || !existingDesc) {
      logError(checkError || new Error('Descuento no encontrado'), { 
        endpoint: '/api/descuentos/PUT', 
        context: 'verificar existencia' 
      });
      return NextResponse.json({
        code: 404,
        message: 'Descuento no encontrado'
      }, { status: 404 });
    }
    
    // Actualizar datos básicos del descuento
    const { data: updatedDesc, error: updateError } = await supabase
      .from('descuentos')
      .update({
        titulo: data.titulo,
        tipo: data.tipo,
        valor: data.valor,
        alcance: data.alcance || 'global',
        valido_desde: data.valido_desde || null,
        valido_hasta: data.valido_hasta || null,
        activo: data.activo !== undefined ? data.activo : true,
        uso_maximo: data.uso_maximo || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
      
    if (updateError) {
      logError(updateError, { endpoint: '/api/descuentos/PUT', context: 'actualizar descuento' });
      throw updateError;
    }
    
    // Si cambia el alcance o actividad_ids, actualizar relaciones
    if (data.alcance || data.actividad_ids) {
      // Eliminar todas las relaciones existentes primero
      const { error: deleteRelError } = await supabase
        .from('actividad_descuento')
        .delete()
        .eq('descuento_id', id);
        
      if (deleteRelError) {
        logError(deleteRelError, { endpoint: '/api/descuentos/PUT', context: 'eliminar relaciones existentes' });
        throw deleteRelError;
      }
      
      // Si el alcance es por actividad y se especifican actividad_ids, crear las relaciones
      if (data.alcance === 'actividad' && data.actividad_ids && data.actividad_ids.length > 0) {
        const relaciones = data.actividad_ids.map(actId => ({
          actividad_id: actId,
          descuento_id: id
        }));
        
        const { error: insertError } = await supabase
          .from('actividad_descuento')
          .insert(relaciones);
          
        if (insertError) {
          logError(insertError, { endpoint: '/api/descuentos/PUT', context: 'insertar relaciones' });
          throw insertError;
        }
        
        logInfo(`Descuento ${id} actualizado para aplicar a actividades específicas`, { 
          endpoint: '/api/descuentos/PUT',
          actividades: data.actividad_ids
        });
      } else {
        // Si el alcance es global, no se crean relaciones
        logInfo(`Descuento ${id} actualizado con alcance global`, { 
          endpoint: '/api/descuentos/PUT'
        });
      }
    }
    
    return NextResponse.json({
      code: 200,
      message: 'Descuento modificado exitosamente',
      data: updatedDesc
    });
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { endpoint: '/api/descuentos/PUT', errorType: 'validationError' });
      return NextResponse.json({
        code: 400,
        message: 'Datos de descuento inválidos',
        errors: err.errors
      }, { status: 400 });
    }
    logError(err, { endpoint: '/api/descuentos/PUT' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/descuentos:
 *   delete:
 *     tags:
 *       - Descuentos
 *     summary: Eliminar un descuento (soft delete)
 *     description: Marca un descuento como eliminado (soft delete) y elimina sus relaciones con actividades
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID del descuento a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Descuento eliminado exitosamente
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
 *                   example: "Descuento marcado como eliminado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Descuento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
// DELETE: Eliminar un descuento (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Obtener el ID del descuento de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam) : null;
    if (!id) {
      return NextResponse.json({
        code: 400,
        message: 'ID de descuento no válido'
      }, { status: 400 });
    }
    
    logInfo('Eliminando descuento (soft delete)', { id });
    
    const supabase = await getSupabase();
    
    // Verificar que el descuento existe y no está ya eliminado
    const { data: existingDesc, error: checkError } = await supabase
      .from('descuentos')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (checkError || !existingDesc) {
      logError(checkError || new Error('Descuento no encontrado'), { 
        endpoint: '/api/descuentos/DELETE', 
        context: 'verificar existencia' 
      });
      return NextResponse.json({
        code: 404,
        message: 'Descuento no encontrado'
      }, { status: 404 });
    }
    
    // Eliminar relaciones con actividades
    const { error: delRelError } = await supabase
      .from('actividad_descuento')
      .delete()
      .eq('descuento_id', id);
      
    if (delRelError) {
      logError(delRelError, { endpoint: '/api/descuentos/DELETE', context: 'eliminar relaciones' });
      throw delRelError;
    }
    
    logInfo(`Relaciones eliminadas para descuento ${id}`, { endpoint: '/api/descuentos/DELETE' });
    
    // Realizar soft delete (marcar como inactivo y agregar timestamp de eliminación)
    const { data: updatedDesc, error: delError } = await supabase
      .from('descuentos')
      .update({
        activo: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, titulo, deleted_at')
      .single();
      
    if (delError) {
      logError(delError, { endpoint: '/api/descuentos/DELETE', context: 'soft delete descuento' });
      throw delError;
    }
    
    logInfo(`Descuento ${id} marcado como eliminado (soft delete)`, { 
      endpoint: '/api/descuentos/DELETE',
      deleted_at: updatedDesc.deleted_at
    });
    
    return NextResponse.json({
      code: 200,
      message: 'Descuento marcado como eliminado exitosamente',
      data: {
        id: updatedDesc.id,
        titulo: updatedDesc.titulo,
        deleted_at: updatedDesc.deleted_at
      }
    });
  } catch (err) {
    logError(err, { endpoint: '/api/descuentos/DELETE' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/descuentos:
 *   post:
 *     tags:
 *       - Descuentos
 *     summary: Crear un nuevo descuento
 *     description: Crea un nuevo descuento con los datos proporcionados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título o nombre del descuento
 *               tipo:
 *                 type: string
 *                 enum: [monto, porcentaje]
 *                 description: Tipo de descuento (monto fijo o porcentaje)
 *               valor:
 *                 type: number
 *                 description: Valor del descuento (monto o porcentaje)
 *               alcance:
 *                 type: string
 *                 enum: [global, actividad]
 *                 description: Si aplica a todas las actividades (global) o a actividades específicas
 *               valido_desde:
 *                 type: string
 *                 format: date
 *                 description: Fecha desde la que el descuento es válido
 *               valido_hasta:
 *                 type: string
 *                 format: date
 *                 description: Fecha hasta la que el descuento es válido
 *               uso_maximo:
 *                 type: integer
 *                 description: Número máximo de veces que se puede utilizar el descuento
 *               actividad_ids:
 *                 type: array
 *                 description: IDs de actividades a las que aplicar el descuento (cuando alcance=actividad)
 *                 items:
 *                   type: integer
 *             required:
 *               - titulo
 *               - tipo
 *               - valor
 *               - alcance
 *     responses:
 *       201:
 *         description: Descuento creado exitosamente
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
 *                   example: "Descuento creado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     descripcion:
 *                       type: string
 *                     precio:
 *                       type: number
 *       400:
 *         description: Datos de entrada inválidos
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
// Esquema de validación para crear un descuento
const descuentoSchema = z.object({
  titulo: z.string(),
  tipo: z.enum(['monto', 'porcentaje']),
  valor: z.number().positive('El valor debe ser positivo'),
  alcance: z.enum(['global', 'actividad']).optional(),
  valido_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  valido_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  uso_maximo: z.number().int().optional(),
  activo: z.boolean().optional(),
  actividad_ids: z.array(z.number().int()).optional()
}).superRefine((data, ctx) => {
  // Verificar que si el alcance es por actividad, se proporcionen IDs de actividades
  if (data.alcance === 'actividad' || !data.alcance) {
    if (!data.actividad_ids || data.actividad_ids.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Proporcione actividad_ids si el alcance es por actividad',
        path: ['actividad_ids']
      });
    }
  }
  
  // Validar que la fecha de fin sea posterior a la de inicio
  if (data.valido_desde && data.valido_hasta) {
    const desde = new Date(data.valido_desde);
    const hasta = new Date(data.valido_hasta);
    if (desde > hasta) {
      ctx.addIssue({
        code: 'custom',
        message: 'La fecha de fin debe ser posterior a la fecha de inicio',
        path: ['valido_hasta']
      });
    }
  }
});

// POST: Crear un nuevo descuento
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const body = await request.json();
    const data = descuentoSchema.parse(body);
    
    // Obtener el ID de la agencia del header
    const agenciaId = request.headers.get('x-agencia-id');
    
    if (!agenciaId) {
      return NextResponse.json(
        { code: 401, message: 'Agencia no especificada' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();
    
    // Insertar el nuevo descuento
    const { data: nuevoDesc, error } = await supabase
      .from('descuentos')
      .insert({
        agencia_id: parseInt(agenciaId, 10),
        titulo: data.titulo,
        tipo: data.tipo,
        valor: data.valor,
        alcance: data.alcance,
        valido_desde: data.valido_desde || null,
        valido_hasta: data.valido_hasta || null,
        uso_maximo: data.uso_maximo || null,
        usos_hechos: 0,
        activo: true,
        created_at: now,
        updated_at: now
      })
      .select('id, titulo, tipo, valor, alcance, valido_desde, valido_hasta, activo, uso_maximo, usos_hechos')
      .single();
      
    if (error) throw error;

    // Asociar el descuento a actividades si es de alcance por actividad
    if (data.alcance === 'actividad' && data.actividad_ids && data.actividad_ids.length > 0) {
      for (const actId of data.actividad_ids) {
        const { error: linkErr } = await supabase
          .from('actividad_descuento')
          .insert({
            actividad_id: actId,
            descuento_id: nuevoDesc.id
          });
        if (linkErr) throw new Error(`Error asociando descuento: ${linkErr.message}`);
      }
    }

    return NextResponse.json({
      code: 201,
      message: 'Descuento creado exitosamente',
      data: {
        id: nuevoDesc.id,
        titulo: nuevoDesc.titulo,
        tipo: nuevoDesc.tipo,
        valor: nuevoDesc.valor,
        alcance: nuevoDesc.alcance,
        valido_desde: nuevoDesc.valido_desde,
        valido_hasta: nuevoDesc.valido_hasta,
        activo: nuevoDesc.activo,
        uso_maximo: nuevoDesc.uso_maximo,
        usos_hechos: nuevoDesc.usos_hechos
      }
    }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { endpoint: '/api/descuentos/POST', errorType: 'validationError' });
      return NextResponse.json({
        code: 400,
        message: 'Datos de descuento inválidos',
        errors: err.errors
      }, { status: 400 });
    }
    logError(err, { endpoint: '/api/descuentos/POST' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}