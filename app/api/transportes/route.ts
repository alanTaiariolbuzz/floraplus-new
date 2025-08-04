import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { createClient } from '../../../utils/supabase/server';
import { logError, logInfo } from '../../../utils/error/logger';

// Obtener el cliente de Supabase centralizado
const getSupabase = async () => await createClient();

/**
 * @swagger
 * /api/transportes:
 *   get:
 *     tags:
 *       - Transportes
 *     summary: Obtener lista de transportes
 *     description: Obtiene una lista de transportes, opcionalmente filtrados por actividad
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID del transporte (opcional)
 *         schema:
 *           type: integer
 *       - name: actividad_id
 *         in: query
 *         description: ID de la actividad (opcional)
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
 *                   example: "Transportes obtenidos exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                         description: Título del transporte
 *                       direccion:
 *                         type: string
 *                         description: Dirección o punto de partida del transporte 
 *                       precio:
 *                         type: number
 *                         description: Precio del transporte
 *                       cupo_maximo:
 *                         type: integer
 *                         description: Capacidad máxima del transporte
 *                       limite_horario:
 *                         type: boolean
 *                         description: Indica si el transporte tiene límite de horario
 *                       limite_horas:
 *                         type: number
 *                         description: Horas límite del transporte si aplica
 *                       mensaje:
 *                         type: string
 *                         description: Mensaje o información adicional del transporte
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
// GET: Obtener transportes
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { searchParams } = new URL(request.url);

    // Obtener parámetros de búsqueda
    const filtros: any = {};
    if (searchParams.has('id')) { 
      filtros.id = Number(searchParams.get('id'));
    }
    if (searchParams.has('actividad_id')) {
      filtros.actividad_id = Number(searchParams.get('actividad_id'));
    }

    //Llamar a la función RPC para obtener los transportes
    const { data, error } = await supabase.rpc('get_transportes', {
      p_id: filtros.id || null,
      p_actividad_id: filtros.actividad_id || null
    });

    logInfo('Transportes obtenidos exitosamente', { count: data.length });
    return NextResponse.json({ code: 200, data }, { status: 200 });
  } catch (err) {
    logError(err, { endpoint: '/api/transportes/GET' });
    return NextResponse.json({
      code: 500,
      message: 'Error al obtener transportes'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/transportes:
 *   post:
 *     tags:
 *       - Transportes
 *     summary: Crear un nuevo transporte
 *     description: Crea un nuevo transporte con los datos proporcionados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título o nombre del transporte
 *               direccion:
 *                 type: string
 *                 description: Dirección o punto de partida del transporte
 *               precio:
 *                 type: number
 *                 description: Precio del transporte
 *               cupo_maximo:
 *                 type: integer
 *                 description: Capacidad máxima del transporte
 *               limite_horario:
 *                 type: boolean
 *                 description: Indica si el transporte tiene límite de horario
 *               limite_horas:
 *                 type: number
 *                 description: Horas límite del transporte si aplica
 *               mensaje:
 *                 type: string
 *                 description: Mensaje o información adicional del transporte
 *               actividad_ids:
 *                 type: array
 *                 description: IDs de las actividades asociadas al transporte
 *                 items:
 *                   type: integer
 *               horarios:
 *                 type: array
 *                 description: Horarios disponibles para el transporte
 *                 items:
 *                   type: object
 *                   properties:
 *                     hora_salida:
 *                       type: string
 *                       description: Hora de salida en formato HH:MM
 *                     hora_llegada:
 *                       type: string
 *                       description: Hora de llegada en formato HH:MM (opcional)
 *             required:
 *               - titulo
 *               - precio
 *               - cupo_maximo
 *               - actividad_ids
 *     responses:
 *       201:
 *         description: Transporte creado exitosamente
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
 *                   example: "Transporte creado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     direccion:
 *                       type: string
 *                     precio:
 *                       type: number
 *                     cupo_maximo:
 *                       type: integer
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
// Esquema para validar un horario de transporte
const horarioSchema = z.object({
  id: z.number().int().optional(),
  hora_salida: z.string(),
  hora_llegada: z.string().optional()
});

// Esquema de validación para crear un nuevo transporte
const transporteCreateSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  direccion: z.string().optional(),
  precio: z.number().nonnegative('El precio debe ser un valor no negativo'),
  cupo_maximo: z.number().int().positive('El cupo máximo debe ser un número positivo'),
  limite_horario: z.boolean().optional().default(false),
  limite_horas: z.number().nullable().optional(),
  mensaje: z.string().optional(),
  activo: z.boolean().optional(),
  actividad_ids: z.array(z.number().int()).optional().default([]),
  horarios: z.array(horarioSchema).optional()
});

// Esquema para actualizar un transporte (todos los campos son opcionales)
const transporteUpdateSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').optional(),
  direccion: z.string().optional(),
  precio: z.number().nonnegative('El precio debe ser un valor no negativo').optional(),
  cupo_maximo: z.number().int().positive('El cupo máximo debe ser un número positivo').optional(),
  limite_horario: z.boolean().optional(),
  limite_horas: z.number().nullable().optional(),
  mensaje: z.string().optional(),
  activo: z.boolean().optional(),
  actividad_ids: z.array(z.number().int()).optional(),
  horarios: z.array(horarioSchema).optional()
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const body = await request.json();
    const data = transporteCreateSchema.parse(body);
    
    // Obtener el ID de la agencia del header
    const agenciaId = request.headers.get('x-agencia-id');
    
    if (!agenciaId) {
      return NextResponse.json(
        { code: 401, message: 'Agencia no especificada' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    // Insertar nuevo transporte
    const { data: nuevoTransp, error } = await supabase
      .from('transportes')
      .insert({
        agencia_id: parseInt(agenciaId, 10),
        titulo: data.titulo,
        direccion: data.direccion || null,
        precio: data.precio,
        cupo_maximo: data.cupo_maximo,
        activo: true,
        created_at: now,
        updated_at: now,
        limite_horario: data.limite_horario,
        limite_horas: data.limite_horas || null,
        mensaje: data.mensaje || null
      })
      .select('id, titulo, direccion, precio, cupo_maximo, limite_horario, limite_horas, mensaje, activo, created_at, updated_at')
      .single();

    if (error) throw error;

    // Asociar transporte a las actividades indicadas
    for (const actividadId of data.actividad_ids) {
      const { error: linkErr } = await supabase
        .from('actividad_transporte')
        .insert({
          actividad_id: actividadId,
          transporte_id: nuevoTransp.id
        });
      if (linkErr) throw new Error(`Error asociando transporte a actividad ${actividadId}: ${linkErr.message}`);
    }
    
    // Obtener todas las asociaciones para incluir en la respuesta
    const { data: asociaciones } = await supabase
      .from('actividad_transporte')
      .select('actividad_id')
      .eq('transporte_id', nuevoTransp.id);
      
    const actividad_ids = asociaciones?.map(a => a.actividad_id) || [];
    
    // Crear los horarios asociados al transporte si se proporcionaron
    let horarios = [];
    if (data.horarios && data.horarios.length > 0) {
      logInfo('Creando horarios para el transporte', { 
        transporteId: nuevoTransp.id,
        cantidadHorarios: data.horarios.length 
      });
      
      for (const horario of data.horarios) {
        const { data: nuevoHorario, error: horarioErr } = await supabase
          .from('transportes_horarios')
          .insert({
            transporte_id: nuevoTransp.id,
            hora_salida: horario.hora_salida,
            hora_llegada: horario.hora_llegada || null,
            activo: true,
            created_at: now,
            updated_at: now
          })
          .select('id, hora_salida, hora_llegada')
          .single();
          
        if (horarioErr) {
          logError(horarioErr, { 
            endpoint: '/api/transportes/POST', 
            operacion: 'insertar_horario',
            transporte_id: nuevoTransp.id
          });
          // Continuamos con los demás horarios aunque falle uno
          continue;
        }
        
        horarios.push(nuevoHorario);
      }
    }

    return NextResponse.json({
      code: 201,
      message: 'Transporte creado exitosamente',
      data: {
        id: nuevoTransp.id,
        titulo: nuevoTransp.titulo,
        direccion: nuevoTransp.direccion,
        precio: nuevoTransp.precio,
        cupo_maximo: nuevoTransp.cupo_maximo,
        limite_horario: nuevoTransp.limite_horario,
        limite_horas: nuevoTransp.limite_horas,
        mensaje: nuevoTransp.mensaje,
        activo: nuevoTransp.activo,
        created_at: nuevoTransp.created_at,
        updated_at: nuevoTransp.updated_at,
        actividad_ids: actividad_ids,
        horarios: horarios
      }
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      logError(err, { endpoint: '/api/transportes/POST', errorType: 'validationError' });
      return NextResponse.json({
        code: 400,
        message: 'Datos de transporte inválidos',
        errors: err.errors
      }, { status: 400 });
    }
    logError(err, { endpoint: '/api/transportes/POST' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}



/**
 * @swagger
 * /api/transportes:
 *   put:
 *     tags:
 *       - Transportes
 *     summary: Modificar un transporte existente
 *     description: Actualiza los datos de un transporte y sus relaciones con actividades
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID del transporte a modificar
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
 *                 description: Título o nombre del transporte
 *               direccion:
 *                 type: string
 *                 description: Dirección o punto de partida del transporte
 *               precio:
 *                 type: number
 *                 description: Precio del transporte
 *               cupo_maximo:
 *                 type: integer
 *                 description: Capacidad máxima del transporte
 *               limite_horario:
 *                 type: boolean
 *                 description: Indica si el transporte tiene límite de horario
 *               limite_horas:
 *                 type: number
 *                 description: Horas límite del transporte si aplica
 *               mensaje:
 *                 type: string
 *                 description: Mensaje o información adicional del transporte
 *               activo:
 *                 type: boolean
 *                 description: Estado activo del transporte
 *               actividad_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               horarios:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID del horario (solo para actualizar horarios existentes)
 *                     hora_salida:
 *                       type: string
 *                       description: Hora de salida (formato HH:MM)
 *                     hora_llegada:
 *                       type: string
 *                       description: Hora de llegada (formato HH:MM)
 *     responses:
 *       200:
 *         description: Transporte modificado exitosamente
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
 *                   example: "Transporte modificado exitosamente"
 *                 data:
 *                   type: object
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Transporte no encontrado
 *       500:
 *         description: Error interno del servidor
 */
// PUT: Modificar un transporte existente
export async function PUT(request: NextRequest) {
  try {
    // Obtener el ID del transporte de los query params
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam) : null;
    if (!id) {
      return NextResponse.json({
        code: 400,
        message: 'ID de transporte no válido'
      }, { status: 400 });
    }
    
    logInfo('Modificando transporte', { id });
    
    const supabase = await getSupabase();
    const body = await request.json();
    const data = transporteUpdateSchema.parse(body);
    
    // Verificar que el transporte existe y no está eliminado
    const { data: existingTransp, error: checkError } = await supabase
      .from('transportes')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (checkError || !existingTransp) {
      logError(checkError || new Error('Transporte no encontrado'), { 
        endpoint: '/api/transportes/PUT', 
        context: 'verificar existencia' 
      });
      return NextResponse.json({
        code: 404,
        message: 'Transporte no encontrado'
      }, { status: 404 });
    }
    
    // Actualizar datos básicos del transporte
    const now = new Date().toISOString();
    const { data: updatedTransp, error: updateError } = await supabase
      .from('transportes')
      .update({
        titulo: data.titulo,
        direccion: data.direccion,
        precio: data.precio,
        cupo_maximo: data.cupo_maximo,
        limite_horario: data.limite_horario,
        limite_horas: data.limite_horas || null,
        mensaje: data.mensaje || null,
        activo: data.activo !== undefined ? data.activo : true,
        updated_at: now
      })
      .eq('id', id)
      .select('id, titulo, direccion, precio, cupo_maximo, limite_horario, limite_horas, mensaje, activo, created_at, updated_at')
      .single();
      
    if (updateError) {
      logError(updateError, { endpoint: '/api/transportes/PUT', context: 'actualizar transporte' });
      throw updateError;
    }
    
    // Actualizar relaciones con actividades si se proporcionaron
    if (data.actividad_ids && data.actividad_ids.length > 0) {
      // Eliminar relaciones existentes
      const { error: delRelError } = await supabase
        .from('actividad_transporte')
        .delete()
        .eq('transporte_id', id);
      
      if (delRelError) {
        logError(delRelError, { endpoint: '/api/transportes/PUT', context: 'eliminar relaciones antiguas' });
        throw delRelError;
      }
      
      // Crear nuevas relaciones
      for (const actividadId of data.actividad_ids) {
        const { error: linkErr } = await supabase
          .from('actividad_transporte')
          .insert({
            actividad_id: actividadId,
            transporte_id: id
          });
        if (linkErr) {
          logError(linkErr, { endpoint: '/api/transportes/PUT', context: `asociar a actividad ${actividadId}` });
          throw linkErr;
        }
      }
    }
    
    // Actualizar horarios si se proporcionaron
    if (data.horarios && data.horarios.length > 0) {
      // Obtener horarios existentes
      const { data: existingHorarios } = await supabase
        .from('transportes_horarios')
        .select('id')
        .eq('transporte_id', id);
      
      const existingIds = existingHorarios?.map(h => h.id) || [];
      const newHorariosData = data.horarios.filter(h => !h.id);
      const updateHorariosData = data.horarios.filter(h => h.id);
      
      // IDs de horarios que debemos eliminar (los que existen y no están en la actualización)
      const toDeleteIds = existingIds.filter(id => !updateHorariosData.some(h => h.id === id));
      
      // Eliminar horarios que ya no están en la lista
      if (toDeleteIds.length > 0) {
        const { error: delHorariosErr } = await supabase
          .from('transportes_horarios')
          .delete()
          .in('id', toDeleteIds);
          
        if (delHorariosErr) {
          logError(delHorariosErr, { endpoint: '/api/transportes/PUT', context: 'eliminar horarios' });
          // Continuamos aunque falle esta operación
        }
      }
      
      // Actualizar horarios existentes
      for (const horario of updateHorariosData) {
        const { error: updHorarioErr } = await supabase
          .from('transportes_horarios')
          .update({
            hora_salida: horario.hora_salida,
            hora_llegada: horario.hora_llegada || null,
            updated_at: now
          })
          .eq('id', horario.id)
          .eq('transporte_id', id); // Verificación adicional de seguridad
          
        if (updHorarioErr) {
          logError(updHorarioErr, { 
            endpoint: '/api/transportes/PUT', 
            context: 'actualizar horario',
            horario_id: horario.id
          });
          // Continuamos con los demás horarios aunque falle uno
        }
      }
      
      // Insertar nuevos horarios
      for (const horario of newHorariosData) {
        const { error: newHorarioErr } = await supabase
          .from('transportes_horarios')
          .insert({
            transporte_id: id,
            hora_salida: horario.hora_salida,
            hora_llegada: horario.hora_llegada || null,
            activo: true,
            created_at: now,
            updated_at: now
          });
          
        if (newHorarioErr) {
          logError(newHorarioErr, { 
            endpoint: '/api/transportes/PUT', 
            context: 'insertar nuevo horario'
          });
          // Continuamos con los demás horarios aunque falle uno
        }
      }
    }
    
    // Obtener todas las asociaciones para incluir en la respuesta
    const { data: asociaciones } = await supabase
      .from('actividad_transporte')
      .select('actividad_id')
      .eq('transporte_id', id);
      
    const actividad_ids = asociaciones?.map(a => a.actividad_id) || [];
    
    // Obtener horarios actualizados
    const { data: horarios } = await supabase
      .from('transportes_horarios')
      .select('id, hora_salida, hora_llegada')
      .eq('transporte_id', id)
      .eq('activo', true);
    
    return NextResponse.json({
      code: 200,
      message: 'Transporte modificado exitosamente',
      data: {
        ...updatedTransp,
        actividad_ids,
        horarios: horarios || []
      }
    });
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { endpoint: '/api/transportes/PUT', errorType: 'validationError' });
      return NextResponse.json({
        code: 400,
        message: 'Datos de transporte inválidos',
        errors: err.errors
      }, { status: 400 });
    }
    logError(err, { endpoint: '/api/transportes/PUT' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/transportes:
 *   delete:
 *     tags:
 *       - Transportes
 *     summary: Eliminar un transporte (soft delete)
 *     description: Marca un transporte como eliminado (soft delete) y elimina sus relaciones con actividades
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID del transporte a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transporte eliminado exitosamente
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
 *                   example: "Transporte marcado como eliminado exitosamente"
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
 *         description: Transporte no encontrado
 *       500:
 *         description: Error interno del servidor
 */
// DELETE: Eliminar un transporte (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Obtener el ID del transporte de los query params
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam) : null;
    if (!id) {
      return NextResponse.json({
        code: 400,
        message: 'ID de transporte no válido'
      }, { status: 400 });
    }
    
    logInfo('Eliminando transporte (soft delete)', { id });
    
    const supabase = await getSupabase();
    
    // Verificar que el transporte existe y no está ya eliminado
    const { data: existingTransp, error: checkError } = await supabase
      .from('transportes')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (checkError || !existingTransp) {
      logError(checkError || new Error('Transporte no encontrado'), { 
        endpoint: '/api/transportes/DELETE', 
        context: 'verificar existencia' 
      });
      return NextResponse.json({
        code: 404,
        message: 'Transporte no encontrado'
      }, { status: 404 });
    }
    
    // Eliminar relaciones con actividades
    const { error: delRelError } = await supabase
      .from('actividad_transporte')
      .delete()
      .eq('transporte_id', id);
      
    if (delRelError) {
      logError(delRelError, { endpoint: '/api/transportes/DELETE', context: 'eliminar relaciones' });
      throw delRelError;
    }
    
    logInfo(`Relaciones eliminadas para transporte ${id}`, { endpoint: '/api/transportes/DELETE' });
    
    // Realizar soft delete (marcar como inactivo y agregar timestamp de eliminación)
    const { data: updatedTransp, error: delError } = await supabase
      .from('transportes')
      .update({
        activo: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, titulo, deleted_at')
      .single();
      
    if (delError) {
      logError(delError, { endpoint: '/api/transportes/DELETE', context: 'soft delete transporte' });
      throw delError;
    }
    
    logInfo(`Transporte ${id} marcado como eliminado (soft delete)`, { 
      endpoint: '/api/transportes/DELETE',
      deleted_at: updatedTransp.deleted_at
    });
    
    return NextResponse.json({
      code: 200,
      message: 'Transporte marcado como eliminado exitosamente',
      data: {
        id: updatedTransp.id,
        titulo: updatedTransp.titulo,
        deleted_at: updatedTransp.deleted_at
      }
    });
  } catch (err) {
    logError(err, { endpoint: '/api/transportes/DELETE' });
    return NextResponse.json({
      code: 500,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}