import { createClient } from '../../../../utils/supabase/server';
import { buildRelationMap, formatAdicionalesResponse } from '../../../../utils/data/mappers';
import { logError, logInfo } from '../../../../utils/error/logger';

/**
 * Obtiene todos los adicionales activos
 */
export async function getAdicionales(filters: { aplica_a_todas?: boolean, agencia_id?: number } = {}) {
  const supabase = await createClient();
  
  try {
    let query = supabase
      .from('adicionales')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false, nullsFirst: false });
    
    // Aplicar filtro de aplica_a_todas si se proporciona
    if (filters.aplica_a_todas !== undefined) {
      query = query.eq('aplica_a_todas', filters.aplica_a_todas);
    }

    if (filters.agencia_id !== undefined) {
      query = query.eq('agencia_id', filters.agencia_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logError(error, {
        service: 'adicionalService',
        context: 'Error al obtener adicionales',
        data: { filters }
      });
      throw error;
    }
    
    // Obtener las relaciones con actividades para cada adicional
    const adicionalesIds = data.map(adicional => adicional.id);
    
    if (adicionalesIds.length > 0) {
      const { data: relaciones, error: relacionesError } = await supabase
        .from('actividad_adicionales')
        .select('*')
        .in('adicionales_id', adicionalesIds);
      
      if (relacionesError) {
        logError(relacionesError, {
          service: 'adicionalService',
          context: 'Error al obtener relaciones de adicionales',
          data: { adicionalesIds }
        });
        throw relacionesError;
      }
      
      // Construir mapa de relaciones y formatear respuesta
      const relacionMap = buildRelationMap(relaciones || [], 'adicionales_id', 'actividad_id');
      return formatAdicionalesResponse(data, relacionMap);
    }
    
    return data || [];
  } catch (err) {
    logError(err, {
      service: 'adicionalService',
      context: 'Error en getAdicionales',
      data: { filters }
    });
    throw {
      code: err && typeof err === 'object' && 'code' in err ? err.code : 500,
      message: err && typeof err === 'object' && 'message' in err ? err.message : 'Error al obtener adicionales'
    };
  }
}

/**
 * Obtiene adicionales por ID de actividad
 */
export async function getAdicionalesByActividadId(actividadId: number) {
  const supabase = await createClient();

  try {
    // Primero obtener los IDs de adicionales relacionados con esta actividad
    const { data: relaciones, error: relacionesError } = await supabase
      .from('actividad_adicionales')
      .select('adicionales_id, actividad_id')
      .eq('actividad_id', actividadId);

    if (relacionesError) {
      logError(relacionesError, {
        service: 'adicionalService',
        context: 'Error al obtener relaciones de actividad-adicionales',
        data: { actividadId }
      });
      throw relacionesError;
    }
    
    // Si no hay relaciones o están vacías, aún debemos devolver adicionales globales
    const adicionalesIds = relaciones ? relaciones.map(rel => rel.adicionales_id).filter(Boolean) : [];
    
    // Consulta para obtener adicionales: los relacionados con la actividad + los globales
    let query = supabase
      .from('adicionales')
      .select('*')
      .is('deleted_at', null);
    
    // Si hay ids específicos, filtramos por ellos o por los globales
    if (adicionalesIds.length > 0) {
      query = query.or(`id.in.(${adicionalesIds.join(',')}),aplica_a_todas.eq.true`);
    } else {
      // Si no hay IDs específicos, solo traemos los globales
      query = query.eq('aplica_a_todas', true);
    }
    
    const { data: adicionales, error: adicionalesError } = await query;
    
    if (adicionalesError) {
      logError(adicionalesError, {
        service: 'adicionalService',
        context: 'Error al obtener adicionales por actividad',
        data: { actividadId, adicionalesIds }
      });
      throw adicionalesError;
    }
    
    // Crear mapa de relaciones con los parámetros correctos
    const relacionMap: Record<number, number[]> = {};
    
    // TypeScript necesita saber que las relaciones tienen estas propiedades
    if (relaciones && relaciones.length > 0) {
      for (const rel of relaciones) {
        // Verificamos que las propiedades existan antes de usarlas
        const adicionalId = rel.adicionales_id as number;
        const actividadId = rel.actividad_id as number;
        
        if (adicionalId) {
          if (!relacionMap[adicionalId]) {
            relacionMap[adicionalId] = [];
          }
          
          if (actividadId) {
            relacionMap[adicionalId].push(actividadId);
          }
        }
      }
    }
    
    return formatAdicionalesResponse(adicionales || [], relacionMap);
  } catch (err) {
    logError(err, {
      service: 'adicionalService',
      context: 'Error en getAdicionalesByActividadId',
      data: { actividadId }
    });
    throw {
      code: err && typeof err === 'object' && 'code' in err ? err.code : 500,
      message: err && typeof err === 'object' && 'message' in err ? err.message : 'Error al obtener adicionales por actividad'
    };
  }
}

/**
 * Obtiene un adicional por ID
 */
export async function getAdicionalById(id: number) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('adicionales')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      // Verificar si el error es porque no se encontró el registro
      if (error.code === 'PGRST116') {
        logInfo(`Adicional con ID ${id} no encontrado`, {
          service: 'adicionalService',
          context: 'getAdicionalById - no encontrado',
          data: { adicionalId: id }
        });
        
        // Lanzar un error personalizado con código 404
        throw {
          code: 404,
          message: `Adicional con ID ${id} no encontrado`
        };
      }
      
      // Otros errores de base de datos
      logError(error, {
        service: 'adicionalService',
        context: 'Error al obtener adicional por ID',
        data: { adicionalId: id }
      });
      throw error;
    }
    
    if (!data) {
      logInfo(`Adicional con ID ${id} no encontrado`, {
        service: 'adicionalService',
        context: 'getAdicionalById - no datos',
        data: { adicionalId: id }
      });
      
      throw {
        code: 404,
        message: `Adicional con ID ${id} no encontrado`
      };
    }
    
    // Obtener las relaciones con actividades para este adicional
    const { data: relaciones, error: relacionesError } = await supabase
      .from('actividad_adicionales')
      .select('*')
      .eq('adicionales_id', id);
    
    if (relacionesError) {
      logError(relacionesError, {
        service: 'adicionalService',
        context: 'Error al obtener relaciones para adicional por ID',
        data: { adicionalId: id }
      });
      throw relacionesError;
    }
    
    // Construir mapa de relaciones y formatear respuesta
    const relacionMap = buildRelationMap(relaciones || [], 'adicionales_id', 'actividad_id');
    const [formattedAdicional] = formatAdicionalesResponse([data], relacionMap);
    
    return formattedAdicional;
  } catch (err) {
    // Propagar error con código personalizado si existe
    if (err && typeof err === 'object' && 'code' in err) {
      throw err;
    }
    
    // Error genérico con código 500
    logError(err, {
      service: 'adicionalService',
      context: 'Error inesperado en getAdicionalById',
      data: { adicionalId: id }
    });
    
    throw {
      code: 500,
      message: 'Error al obtener el adicional solicitado'
    };
  }
}

/**
 * Crea un nuevo adicional
 */
export async function createAdicional(data: any) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  
  try {
    // Datos base del adicional ajustados a la estructura real de la tabla
    const adicionalData = {
      titulo: data.titulo,
      titulo_en: data.titulo_en || null,
      descripcion: data.descripcion,
      descripcion_en: data.descripcion_en || null,
      precio: data.precio,
      moneda: data.moneda || 'USD',
      imagen: data.imagen || null,
      aplica_a_todas: data.aplica_a_todas || false,
      agencia_id: data.agencia_id,
      activo: data.activo !== undefined ? data.activo : true,
      created_at: now,
      updated_at: now
    };
    
    // Insertar el adicional - primero realizamos la inserción sin select
    const { error: insertError } = await supabase
      .from('adicionales')
      .insert(adicionalData);
    
    if (insertError) {
      logError(insertError, {
        service: 'adicionalService',
        context: 'Error al insertar adicional',
        data: adicionalData
      });
      throw insertError;
    }
    
    // Ahora obtenemos el registro insertado en una consulta separada
    // Buscamos por los campos únicos que acabamos de insertar
    const { data: adicionalInsertado, error } = await supabase
      .from('adicionales')
      .select('*')
      .eq('titulo', data.titulo)
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      logError(error, {
        service: 'adicionalService',
        context: 'Error al obtener el adicional insertado',
        data: adicionalData
      });
      throw error;
    }
    
    if (!adicionalInsertado) {
      throw new Error('No se pudo recuperar el adicional creado');
    }
    
    // Gestionar las relaciones del adicional con actividades
    let actividadIds: number[] = [];
    
    // Si aplica a todas, obtener IDs de todas las actividades de la agencia
    if (data.aplica_a_todas) {
      const { data: actividades, error: actividadesError } = await supabase
        .from('actividades')
        .select('id')
        .is('deleted_at', null);
      
      if (actividadesError) {
        logError(actividadesError, {
          service: 'adicionalService',
          context: 'Error al obtener actividades de la agencia (caso de aplica_a_todas)',
        });
        throw actividadesError;
      }
      
      actividadIds = actividades.map(act => act.id);
      
      logInfo('Aplicando adicional a todas las actividades', {
        service: 'adicionalService',
        context: 'Creación de adicional',
        data: { adicionalId: adicionalInsertado.id, totalActividades: actividadIds.length }
      });
    } 
    // Si no aplica a todas pero se proporcionaron IDs específicas
    else if (data.actividad_ids && data.actividad_ids.length > 0) {
      actividadIds = data.actividad_ids;
    }
    
    // Si hay actividades para vincular
    if (actividadIds.length > 0) {
      const relaciones = actividadIds.map(actividadId => ({
        actividad_id: actividadId,
        adicionales_id: adicionalInsertado.id
      }));
      
      const { error: relacionesError } = await supabase
        .from('actividad_adicionales')
        .insert(relaciones);
      
      if (relacionesError) {
        logError(relacionesError, {
          service: 'adicionalService',
          context: 'Error al crear relaciones del adicional',
          data: { adicionalId: adicionalInsertado.id, cantidadActividades: actividadIds.length }
        });
        throw relacionesError;
      }
    }
    
    // Preparar la respuesta
    let actividadIdsRespuesta = data.actividad_ids || [];
    
    // Si aplica a todas, devolver la lista completa de IDs de actividades
    if (data.aplica_a_todas) {
      // Obtener los IDs de todas las actividades que acabamos de vincular
      const { data: actividadesVinculadas, error: vinculadasError } = await supabase
        .from('actividad_adicionales')
        .select('actividad_id')
        .eq('adicionales_id', adicionalInsertado.id);
      
      if (!vinculadasError && actividadesVinculadas) {
        actividadIdsRespuesta = actividadesVinculadas.map(rel => rel.actividad_id);
      }
    }
    
    return {
      ...adicionalInsertado,
      actividad_ids: actividadIdsRespuesta,
      aplica_a_todas: data.aplica_a_todas
    };
  } catch (err) {
    logError(err, {
      service: 'adicionalService',
      context: 'Error en createAdicional',
      data: { input: data }
    });
    throw err;
  }
}

/**
 * Actualiza un adicional existente
 */
export async function updateAdicional(id: number, data: any) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  
  // Verificar que el adicional existe y pertenece a la agencia
  const { data: existingAdicional, error: existingError } = await supabase
    .from('adicionales')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  
  if (existingError || !existingAdicional) {
    throw new Error('Adicional no encontrado');
  }
  
  // Datos de actualización
  const updateData: any = {
    updated_at: now
  };
  
  if (data.titulo !== undefined) updateData.titulo = data.titulo;
  if (data.titulo_en !== undefined) updateData.titulo_en = data.titulo_en;
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
  if (data.descripcion_en !== undefined) updateData.descripcion_en = data.descripcion_en;
  if (data.precio !== undefined) updateData.precio = data.precio;
  if (data.moneda !== undefined) updateData.moneda = data.moneda;
  if (data.imagen !== undefined) updateData.imagen = data.imagen;
  if (data.aplica_a_todas !== undefined) updateData.aplica_a_todas = data.aplica_a_todas;
  if (data.activo !== undefined) updateData.activo = data.activo;
  
  // Actualizar el adicional
  const { data: updatedAdicional, error } = await supabase
    .from('adicionales')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) throw error;
  
  // Gestionar las relaciones del adicional con actividades
  let nuevasRelacionesCreadas = false;

  // Si cambia a aplica_a_todas=true, vincular con todas las actividades de la agencia
  if (data.aplica_a_todas === true && existingAdicional.aplica_a_todas === false) {
    // Obtener todas las actividades de la agencia
    const { data: actividades, error: actividadesError } = await supabase
      .from('actividades')
      .select('id')
      .is('deleted_at', null);
    
    if (actividadesError) {
      logError(actividadesError, {
        service: 'adicionalService',
        context: 'Error al obtener actividades de la agencia para update',
        data: { adicionalId: id }
      });
      throw actividadesError;
    }

    if (actividades && actividades.length > 0) {
      // Obtener las actividades que ya están vinculadas
      const { data: actividadesVinculadas, error: vinculadasError } = await supabase
        .from('actividad_adicionales')
        .select('actividad_id')
        .eq('adicionales_id', id);

      if (vinculadasError) {
        logError(vinculadasError, {
          service: 'adicionalService',
          context: 'Error al obtener actividades vinculadas',
          data: { adicionalId: id }
        });
        throw vinculadasError;
      }

      // Filtrar solo las actividades que aún no están vinculadas
      const actividadesVinculadasIds = actividadesVinculadas?.map(av => av.actividad_id) || [];
      const nuevasActividades = actividades
        .map(act => act.id)
        .filter(actId => !actividadesVinculadasIds.includes(actId));

      // Si hay nuevas actividades para vincular
      if (nuevasActividades.length > 0) {
        const relaciones = nuevasActividades.map(actividadId => ({
          actividad_id: actividadId,
          adicionales_id: id
        }));
        
        const { error: insertError } = await supabase
          .from('actividad_adicionales')
          .insert(relaciones);
        
        if (insertError) {
          logError(insertError, {
            service: 'adicionalService',
            context: 'Error al crear nuevas relaciones para adicional',
            data: { adicionalId: id, cantidadNuevasActividades: nuevasActividades.length }
          });
          throw insertError;
        }

        nuevasRelacionesCreadas = true;
        logInfo('Adicional actualizado a aplicar a todas las actividades', {
          service: 'adicionalService',
          context: 'Actualización de adicional',
          data: { adicionalId: id, nuevasActividades: nuevasActividades.length }
        });
      }
    }
  }
  // Si se proporcionaron actividad_ids específicos, actualizar esas relaciones
  else if (data.actividad_ids !== undefined && data.actividad_ids.length > 0) {
    // Primero, verificar qué actividades ya están vinculadas
    const { data: actividadesVinculadas, error: vinculadasError } = await supabase
      .from('actividad_adicionales')
      .select('actividad_id')
      .eq('adicionales_id', id);

    if (vinculadasError) {
      logError(vinculadasError, {
        service: 'adicionalService',
        context: 'Error al obtener actividades vinculadas',
        data: { adicionalId: id }
      });
      throw vinculadasError;
    }

    // Determinar qué actividades son nuevas y cuáles deben eliminarse
    const actividadesVinculadasIds = actividadesVinculadas?.map(av => av.actividad_id) || [];
    const nuevasActividades = data.actividad_ids.filter(
      (actId: number) => !actividadesVinculadasIds.includes(actId)
    );
    const actividadesAEliminar = actividadesVinculadasIds.filter(
      (actId: number) => !data.actividad_ids.includes(actId)
    );

    // Eliminar relaciones que ya no se desean mantener
    if (actividadesAEliminar.length > 0) {
      // En esta tabla la clave primaria es la combinación de actividad_id y adicionales_id
      for (const actividadId of actividadesAEliminar) {
        const { error: deleteError } = await supabase
          .from('actividad_adicionales')
          .delete()
          .eq('adicionales_id', id)
          .eq('actividad_id', actividadId);
        
        if (deleteError) {
          logError(deleteError, {
            service: 'adicionalService',
            context: 'Error al eliminar relación obsoleta del adicional',
            data: { adicionalId: id, actividadId }
          });
          throw deleteError;
        }
      }
      
      logInfo('Relaciones eliminadas correctamente', {
        service: 'adicionalService',
        context: 'Actualización de relaciones de adicional',
        data: { adicionalId: id, relacionesEliminadas: actividadesAEliminar.length }
      });
    }

    // Crear las nuevas relaciones
    if (nuevasActividades.length > 0) {
      const relaciones = nuevasActividades.map((actividadId: number) => ({
        actividad_id: actividadId,
        adicionales_id: id
      }));
      
      const { error: insertError } = await supabase
        .from('actividad_adicionales')
        .insert(relaciones);
      
      if (insertError) {
        logError(insertError, {
          service: 'adicionalService',
          context: 'Error al crear nuevas relaciones para adicional',
          data: { adicionalId: id, cantidadNuevasActividades: nuevasActividades.length }
        });
        throw insertError;
      }

      logInfo('Nuevas relaciones creadas correctamente', {
        service: 'adicionalService',
        context: 'Actualización de relaciones de adicional',
        data: { adicionalId: id, nuevasRelaciones: nuevasActividades.length }
      });
      nuevasRelacionesCreadas = true;
    }
  }
  
  // Obtener las relaciones actualizadas
  const { data: relaciones, error: relacionesError } = await supabase
    .from('actividad_adicionales')
    .select('*')
    .eq('adicionales_id', id);
  
  if (relacionesError) {
    logError(relacionesError, {
      service: 'adicionalService',
      context: 'Error al obtener relaciones actualizadas',
      data: { adicionalId: id }
    });
    throw relacionesError;
  }
  
  // Construir mapa de relaciones y formatear respuesta
  const relacionMap = buildRelationMap(relaciones || [], 'adicionales_id', 'actividad_id');
  const [formattedAdicional] = formatAdicionalesResponse([updatedAdicional], relacionMap);
  
  return formattedAdicional;
}

/**
 * Elimina (soft delete) un adicional
 */
export async function deleteAdicional(id: number) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  
  // Verificar que el adicional existe y pertenece a la agencia
  const { data: existingAdicional, error: existingError } = await supabase
    .from('adicionales')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .is('deleted_at', null)
    .single();
  
  if (existingError || !existingAdicional) {
    throw new Error('Adicional no encontrado');
  }
  
  // Marcar como eliminado (soft delete)
  const { error } = await supabase
    .from('adicionales')
    .update({
      activo: false,
      deleted_at: now,
      updated_at: now
    })
    .eq('id', id);
  
  if (error) throw error;
  
  return existingAdicional;
}
