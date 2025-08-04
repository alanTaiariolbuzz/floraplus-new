import { createClient } from '../../../../utils/supabase/server';
import { createAdminClient } from "@/utils/supabase/admin";
import { logError, logInfo } from '../../../../utils/error/logger';
import { Cliente } from '../schemas/clienteSchema';

// Obtener el cliente de Supabase centralizado
export const getSupabase = async () => await createClient();
export const getSupabaseAdmin = async () => await createAdminClient();
/**
 * Verifica si ya existe un cliente con el mismo email
 * @param email Email a verificar
 * @param excludeId ID de cliente a excluir de la verificación (para actualizaciones)
 * @returns true si el email ya existe, false en caso contrario
 */
export async function verificarEmailExistente(email: string, excludeId?: string) {
  const supabase = await getSupabase();
  
  let query = supabase
    .from('clientes')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null);
    
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    logError(error, { 
      service: 'clienteService', 
      method: 'verificarEmailExistente', 
      email, 
      excludeId
    });
    return false;
  }
  
  return data && data.length > 0;
}

/**
 * Obtiene un cliente por su ID
 * @param id ID del cliente
 * @returns Datos del cliente o null si no existe
 */
export async function getClienteById(id: string) {
  const supabase = await getSupabase();
  
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
    
  if (error) {
    logError(error, { 
      service: 'clienteService', 
      method: 'getClienteById', 
      id 
    });
    return null;
  }
  
  return data;
}

/**
 * Obtiene todos los clientes con filtros opcionales
 * @param filtros Filtros a aplicar
 * @returns Lista de clientes
 */
export async function getClientes(filtros: {
  email?: string;
  telefono?: string;
  activo?: boolean;
  id?: string;
}) {
  const supabase = await getSupabase();
  
  // Construir la consulta base
  let query = supabase
    .from('clientes')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false, nullsFirst: false });
  
  // Aplicar filtros si están presentes
  if (filtros.email) {
    query = query.ilike('email', `%${filtros.email}%`);
  }
  
  if (filtros.telefono) {
    query = query.ilike('telefono', `%${filtros.telefono}%`);
  }
  
  if (filtros.activo !== undefined) {
    query = query.eq('activo', filtros.activo);
  }
  
  if (filtros.id) {
    query = query.eq('id', filtros.id);
  }
  
  // Ejecutar la consulta
  const { data, error } = await query;
  
  if (error) {
    logError(error, { 
      service: 'clienteService', 
      method: 'getClientes', 
      filtros
    });
    return error;
  }

  // Manejo de errores si no se encuentran datos
  if (data && Object.keys(data).length === 0) {
    const errorMessage = 'No se encontraron clientes con los filtros proporcionados';
    logError(errorMessage, { 
    code:404,
    service: 'clienteService', 
    method: 'getClientes', 
    filtros
    });
    return errorMessage;
  }
  
  return data || [];
}

/**
 * Actualiza una reserva con el ID del cliente
 * @param reservaId ID de la reserva a actualizar
 * @param clienteId ID del cliente a asociar
 * @returns Éxito o error
 */
async function actualizarReservaConCliente(reservaId: number, clienteId: string) {
  const supabase = await getSupabase();
  
  // Verificar que la reserva exista
  const { data: reservaExistente, error: errorConsulta } = await supabase
    .from('reservas')
    .select('id, cliente_id')
    .eq('id', reservaId)
    .single();
    
  if (errorConsulta) {
    logError(errorConsulta, {
      service: 'clienteService',
      method: 'actualizarReservaConCliente',
      reservaId,
      clienteId
    });
    return { error: 'No se encontró la reserva especificada' };
  }
  
  // Si la reserva ya tiene un cliente asociado diferente, log warning pero permitir
  if (reservaExistente.cliente_id && reservaExistente.cliente_id !== clienteId) {
    logInfo('Reserva ya tiene un cliente asociado que será reemplazado', {
      reservaId,
      clienteIdAnterior: reservaExistente.cliente_id,
      clienteIdNuevo: clienteId
    });
  }
  
  // Actualizar la reserva con el ID del cliente
  const { error: errorUpdate } = await supabase
    .from('reservas')
    .update({ cliente_id: clienteId })
    .eq('id', reservaId);
    
  if (errorUpdate) {
    logError(errorUpdate, {
      service: 'clienteService',
      method: 'actualizarReservaConCliente',
      reservaId,
      clienteId
    });
    return { error: 'Error al actualizar la reserva con el ID del cliente' };
  }
  
  logInfo('Reserva actualizada con el ID del cliente', { reservaId, clienteId });
  return { success: true };
}

/**
 * Obtiene un cliente por email o lo crea si no existe
 * @param email Email del cliente a buscar o crear
 * @param clienteData Datos del cliente para crear si no existe
 * @returns Cliente encontrado o creado, o error
 */
async function getOrCreateClienteByEmail(email: string, clienteData: Cliente) {
  const supabase = await getSupabase();
  
  // Buscar cliente por email
  const { data: clienteExistente, error: errorBusqueda } = await supabase
    .from('clientes')
    .select('*')
    .eq('email', email)
    .is('deleted_at', null)
    .single();
    
  // Si el cliente existe, devolverlo
  if (clienteExistente) {
    return { data: clienteExistente, isNew: false };
  }
  
  // Si no existe, crearlo
  const resultadoCreacion = await createCliente(clienteData);
  if (resultadoCreacion.error) {
    return { error: resultadoCreacion.error };
  }
  
  return { data: resultadoCreacion.data, isNew: true };
}

/**
 * Crea un nuevo cliente
 * @param clienteData Datos del cliente a crear
 * @returns Cliente creado o error
 */
export async function createCliente(clienteData: Cliente) {
  const supabase = await getSupabaseAdmin();
  const now = new Date().toISOString();
  const reservaId = clienteData.reserva_id;
  
  // Si se proporciona un email, verificar si ya existe un cliente
  if (clienteData.email) {
    const { data: clienteExistente, error: errorBusqueda } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', clienteData.email)
      .is('deleted_at', null)
      .single();
    
    // Si el cliente ya existe y se proporciona un ID de reserva, actualizar la reserva
    if (clienteExistente && reservaId) {
      const resultado = await actualizarReservaConCliente(reservaId, clienteExistente.id);
      if (resultado.error) {
        return { data: clienteExistente, warning: resultado.error };
      }
      return { data: clienteExistente, reservaActualizada: true };
    }
    
    // Si el cliente ya existe pero no hay reserva para actualizar, simplemente devolver el cliente
    if (clienteExistente) {
      return { data: clienteExistente, isExisting: true };
    }
  }
  
  // Insertar el nuevo cliente
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: clienteData.nombre,
      apellido: clienteData.apellido,
      email: clienteData.email,
      telefono: clienteData.telefono,
      activo: clienteData.activo !== undefined ? clienteData.activo : "pending",
      created_at: now,
      updated_at: now
    })
    .select('*')
    .single();
    
  if (error) {
    logError(error, { 
      service: 'clienteService', 
      method: 'createCliente', 
      data: clienteData
    });
    return { error: error.message };
  }
  
  logInfo('Cliente creado exitosamente', { id: data.id });
  
  // Si se proporciona un ID de reserva, actualizar la reserva con el ID del cliente
  if (reservaId) {
    const resultado = await actualizarReservaConCliente(reservaId, data.id);
    if (resultado.error) {
      return { data, warning: resultado.error };
    }
    return { data, reservaActualizada: true };
  }
  
  return { data };
}

/**
 * Actualiza un cliente existente
 * @param id ID del cliente a actualizar
 * @param clienteData Datos del cliente
 * @returns Cliente actualizado o error
 */
export async function updateCliente(id: string, clienteData: Cliente) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();
  
  // Verificar que el cliente existe
  const clienteExistente = await getClienteById(id);
  if (!clienteExistente) {
    return { error: 'Cliente no encontrado' };
  }
  
  // Verificar que el email no esté en uso por otro cliente
  const emailExiste = await verificarEmailExistente(clienteData.email, id);
  if (emailExiste) {
    return { error: 'El email ya está en uso por otro cliente' };
  }
  
  // Actualizar el cliente
  const { data, error } = await supabase
    .from('clientes')
    .update({
      nombre: clienteData.nombre,
      apellido: clienteData.apellido,
      email: clienteData.email,
      telefono: clienteData.telefono,
      activo: clienteData.activo,
      updated_at: now
    })
    .eq('id', id)
    .select('*')
    .single();
    
  if (error) {
    logError(error, { 
      service: 'clienteService', 
      method: 'updateCliente', 
      id, 
      data: clienteData
    });
    return { error: error.message };
  }
  
  logInfo('Cliente actualizado exitosamente', { id });
  
  return { data };
}

/**
 * Elimina un cliente (soft delete)
 * @param id ID del cliente a eliminar
 * @returns Datos del cliente eliminado o error
 */
export async function deleteCliente(id: string) {
  const supabase = await getSupabase();
  
  // Verificar que el cliente existe
  const clienteExistente = await getClienteById(id);
  if (!clienteExistente) {
    return { error: 'Cliente no encontrado' };
  }
  
  // Realizar soft delete
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('clientes')
    .update({
      activo: false,
      deleted_at: now,
      updated_at: now
    })
    .eq('id', id)
    .is ('deleted_at', null)
    .select('id, deleted_at')
    .single();
    
  if (error) {
    logError(error, { 
      service: 'clienteService', 
      method: 'deleteCliente', 
      id
    });
    return { error: error.message };
  }
  
  logInfo('Cliente marcado como eliminado', { id, deleted_at: now });
  
  return { data };
}