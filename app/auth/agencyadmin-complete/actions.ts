"use server";

import { createClient } from '@/utils/supabase/server';
import { logError, logInfo } from '@/utils/error/logger';

/**
 * Helper function to get a usuario by ID para acciones del servidor
 */
async function getUsuarioByIdForAction(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, agencia_id, email') 
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { 
    logError(error, {
      service: 'agencyAdminCompleteActions',
      method: 'getUsuarioByIdForAction',
      id,
      errorMessage: error.message
    });
    throw new Error(`Error al buscar usuario: ${error.message}`);
  }

  return data;
}

/**
 * Activa un usuario después de confirmar la agencia y establecer contraseña
 */
export async function activateAgencyUserAction(
  id: string
): Promise<{ data?: any; error?: string; agencyName?: string; agencyId?: number }> {
  try {
    const supabase = await createClient();

    // 1. Verificar que el usuario existe
    const usuarioExistente = await getUsuarioByIdForAction(id);
    if (!usuarioExistente) {
      return { error: 'Usuario no encontrado' };
    }
    
    // 2. Verificar que el usuario tiene una agencia asignada
    let agenciaId = usuarioExistente.agencia_id;
    if (!agenciaId) {
      // 2b. Si no tiene agencia, intentar obtenerla por el email
      const { data: agencyByEmail, error: findAgencyError } = await supabase
        .from('agencias')
        .select('id, nombre')
        .eq('email_contacto', usuarioExistente.email)
        .single();
      
      if (findAgencyError || !agencyByEmail) {
        logError(findAgencyError || new Error('No se encontró agencia'), {
          service: 'agencyAdminCompleteActions',
          method: 'activateAgencyUserAction',
          id,
          email: usuarioExistente.email
        });
        return { error: 'No se encontró una agencia asociada a este usuario' };
      }
      
      // Asignar la agencia al usuario
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          agencia_id: agencyByEmail.id,
        })
        .eq('id', id);

      if (updateError) {
        logError(updateError, {
          service: 'agencyAdminCompleteActions',
          method: 'activateAgencyUserAction',
          id
        });
        return { error: 'No se pudo asignar la agencia al usuario' };
      }
      
      // Actualizar la variable local de agenciaId
      agenciaId = agencyByEmail.id;
    }

    // 3. Obtener el nombre de la agencia
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencias')
      .select('id, nombre')
      .eq('id', agenciaId)
      .single();

    if (agencyError) {
      logError(agencyError, {
        service: 'agencyAdminCompleteActions',
        method: 'activateAgencyUserAction',
        id
      });
      return { error: 'No se pudo obtener información de la agencia' };
    }

    // 4. Activar el usuario
    const { data: userData, error: updateError } = await supabase
      .from('usuarios')
      .update({
        activo: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logError(updateError, {
        service: 'agencyAdminCompleteActions',
        method: 'activateAgencyUserAction',
        id
      });
      return { error: 'No se pudo activar el usuario' };
    }

    logInfo('Usuario de agencia activado', { 
      id, 
      agenciaId,
      agencyName: agencyData.nombre
    });
    
    return { 
      data: userData, 
      agencyId: agenciaId,
      agencyName: agencyData.nombre
    };

  } catch (e: any) {
    logError(e, {
      service: 'agencyAdminCompleteActions',
      method: 'activateAgencyUserAction',
      id,
      unexpectedError: true,
      errorMessage: e.message
    });
    return { error: e.message || 'Ocurrió un error inesperado al activar el usuario de agencia.' };
  }
}
