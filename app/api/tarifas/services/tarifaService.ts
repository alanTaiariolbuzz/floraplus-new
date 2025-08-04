import { createClient } from '@/utils/supabase/server';
import { logError, logInfo } from '@/utils/error/logger';
import { Tarifa } from '../schemas/tarifaSchema';
import { verificarActividad } from '../../actividades/services/actividadService';


// Obtener el cliente de Supabase centralizado
export const getSupabase = async () => await createClient();

/**
 * Obtiene una tarifa por su ID
 * @param id ID de la tarifa
 * @returns Datos de la tarifa o null si no existe
 */
export async function getTarifaById(id: number) {
  const supabase = await getSupabase();
  
  const { data, error } = await supabase
    .from('tarifas')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
    
  if (error) {
    logError(error, { 
      service: 'tarifaService', 
      method: 'getTarifaById', 
      id 
    });
    return null;
  }
  
  return data;
}

/**
 * Obtiene todas las tarifas con filtros opcionales
 * @param filtros Filtros a aplicar
 * @returns Lista de tarifas
 */
export async function getTarifas(filtros: {
  actividad_id?: number;
  id?: number;
  es_principal?: boolean;
  activa?: boolean;
}) {
  const supabase = await getSupabase();
  
  // Construir la consulta base
  let query = supabase
    .from('tarifas')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false, nullsFirst: false });
  
  // Aplicar filtros si están presentes
  if (filtros.actividad_id) {
    query = query.eq('actividad_id', filtros.actividad_id);
  }
  
  if (filtros.id) {
    query = query.eq('id', filtros.id);
  }
  
  if (filtros.es_principal !== undefined) {
    query = query.eq('es_principal', filtros.es_principal);
  }
  
  if (filtros.activa !== undefined) {
    query = query.eq('activa', filtros.activa);
  }
  
  // Ejecutar la consulta
  const { data, error } = await query;
  
  if (error) {
    logError(error, { 
      service: 'tarifaService', 
      method: 'getTarifas', 
      filtros
    });
    return [];
  }
  
  return data || [];
}

/**
 * Crea una nueva tarifa
 * @param tarifaData Datos de la tarifa a crear
 * @returns Tarifa creada o error
 */
export async function createTarifa(tarifaData: Tarifa) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();
  
  // Verificar que la actividad existe
  const actividadExiste = await verificarActividad(tarifaData.actividad_id);
  if (!actividadExiste) {
    return { error: 'Actividad no encontrada o no pertenece a esta agencia' };
  }
  
  // Si es principal, asegurarse de que no haya otra tarifa principal para esta actividad
  if (tarifaData.es_principal) {
    const { data: existingPrincipal } = await supabase
      .from('tarifas')
      .select('id')
      .eq('actividad_id', tarifaData.actividad_id)
      .eq('es_principal', true)
      .maybeSingle();
      
    if (existingPrincipal) {
      // Actualizar la tarifa principal existente para que no sea principal
      await supabase
        .from('tarifas')
        .update({ es_principal: false, updated_at: now })
        .eq('id', existingPrincipal.id);
    }
  }
  
  // Insertar la nueva tarifa
  const { data, error } = await supabase
    .from('tarifas')
    .insert({
      actividad_id: tarifaData.actividad_id,
      nombre: tarifaData.nombre,
      nombre_en: tarifaData.nombre_en || null,
      precio: tarifaData.precio,
      es_principal: tarifaData.es_principal,
      activa: tarifaData.activa !== undefined ? tarifaData.activa : true,
      created_at: now,
      updated_at: now
    })
    .select('*')
    .single();
    
  if (error) {
    logError(error, { 
      service: 'tarifaService', 
      method: 'createTarifa', 
      data: tarifaData
    });
    return { error: error.message };
  }
  
  logInfo('Tarifa creada exitosamente', { id: data.id });
  
  return { data };
}

/**
 * Actualiza una tarifa existente
 * @param id ID de la tarifa a actualizar
 * @param tarifaData Datos de la tarifa
 * @returns Tarifa actualizada o error
 */
export async function updateTarifa(id: number, tarifaData: Tarifa) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();
  
  // Verificar que la tarifa existe
  const tarifaExistente = await getTarifaById(id);
  if (!tarifaExistente) {
    return { error: 'Tarifa no encontrada' };
  }
  
  // Verificar que la actividad existe
  const actividadExiste = await verificarActividad(tarifaData.actividad_id);
  if (!actividadExiste) {
    return { error: 'Actividad no encontrada o no pertenece a esta agencia' };
  }
  
  // Si se cambia a principal, asegurarse de que no haya otra tarifa principal para esta actividad
  if (tarifaData.es_principal && (!tarifaExistente.es_principal || tarifaExistente.actividad_id !== tarifaData.actividad_id)) {
    const { data: existingPrincipal } = await supabase
      .from('tarifas')
      .select('id')
      .eq('actividad_id', tarifaData.actividad_id)
      .eq('es_principal', true)
      .neq('id', id)
      .maybeSingle();
      
    if (existingPrincipal) {
      // Actualizar la tarifa principal existente para que no sea principal
      await supabase
        .from('tarifas')
        .update({ es_principal: false, updated_at: now })
        .eq('id', existingPrincipal.id);
    }
  }
  
  // Actualizar la tarifa
  const { data, error } = await supabase
    .from('tarifas')
    .update({
      actividad_id: tarifaData.actividad_id,
      nombre: tarifaData.nombre,
      nombre_en: tarifaData.nombre_en || null,
      precio: tarifaData.precio,
      es_principal: tarifaData.es_principal,
      activa: tarifaData.activa,
      updated_at: now
    })
    .eq('id', id)
    .select('*')
    .single();
    
  if (error) {
    logError(error, { 
      service: 'tarifaService', 
      method: 'updateTarifa', 
      id, 
      data: tarifaData
    });
    return { error: error.message };
  }
  
  logInfo('Tarifa actualizada exitosamente', { id });
  
  return { data };
}

/**
 * Elimina una tarifa (soft delete)
 * @param id ID de la tarifa a eliminar
 * @returns Datos de la tarifa eliminada o error
 */
export async function deleteTarifa(id: number) {
  const supabase = await getSupabase();
  
  // Verificar que la tarifa existe
  const tarifaExistente = await getTarifaById(id);
  if (!tarifaExistente) {
    return { error: 'Tarifa no encontrada' };
  }
  
  // Realizar soft delete
  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('tarifas')
    .update({
      activa: false,
      deleted_at: deletedAt
    })
    .eq('id', id)
    .select('id, deleted_at')
    .single();
    
  if (error) {
    logError(error, { 
      service: 'tarifaService', 
      method: 'deleteTarifa', 
      id
    });
    return { error: error.message };
  }
  
  logInfo('Tarifa marcada como eliminada', { id, deleted_at: deletedAt });
  
  return { data };
}
