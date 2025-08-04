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
      service: 'onboardingCompleteActions',
      method: 'getUsuarioByIdForAction',
      id,
      errorMessage: error.message
    });
    throw new Error(`Error al buscar usuario: ${error.message}`);
  }

  return data;
}

/**
 * Activa un usuario y registra su país bancario (paso 1 del onboarding)
 */
export async function activateAgencyUserAction(
  id: string, 
  bankCountry: string
): Promise<{ data?: any; error?: string; agencyId?: number }> {
  try {
    const supabase = await createClient();

    // 1. Verificar que el usuario existe
    const usuarioExistente = await getUsuarioByIdForAction(id);
    if (!usuarioExistente) {
      return { error: 'Usuario no encontrado' };
    }
    
    // 2. Obtener el ID de la agencia usando el email de contacto


      const { data: agencyByEmail, error: findAgencyError } = await supabase
      .from('agencias')
      .select('id, nombre, email_contacto')
      .eq('email_contacto', usuarioExistente.email)
      .order('created_at', { ascending: false })
      .limit(1);

      
    if (findAgencyError) {
      logError(findAgencyError, {
        service: 'onboardingCompleteActions',
        method: 'activateAgencyUserAction',
        id,
        email: usuarioExistente.email,
        errorMessage: findAgencyError.message
      });
      return { error: `No se pudo encontrar la agencia con email: ${usuarioExistente.email}` };
    }
    
    if (!agencyByEmail || !agencyByEmail[0].id) {
      return { error: 'No se encontró una agencia asociada a este email' };
    }

    const agency = agencyByEmail[0];

    // 3. Actualizar el usuario a activo y asignarle la agencia
    const { data: userData, error: updateError } = await supabase
      .from('usuarios')
      .update({
        activo: true,
        agencia_id: agency.id, // Asignar el ID de agencia al usuario
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logError(updateError, {
        service: 'onboardingCompleteActions',
        method: 'activateAgencyUserAction',
        id,
        agenciaId: agency.id,
        errorMessage: updateError.message
      });
      return { error: updateError.message };
    }
    
    // 4. Actualizar la agencia con el país bancario (dejando inactiva hasta completar Stripe)
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencias')
      .update({
        pais: bankCountry,
        updated_at: new Date().toISOString(),
        // La agencia se activa solo hasta completar la configuración de Stripe
      })
      .eq('id', agency.id)
      .select()
      .single();

    if (agencyError) {
      logError(agencyError, {
        service: 'onboardingCompleteActions',
        method: 'activateAgencyUserAction',
        id,
        agenciaId: agency.id,
        errorMessage: agencyError.message
      });
      return { error: agencyError.message };
    }

    logInfo('Usuario de agencia activado y país bancario registrado', { 
      id, 
      agenciaId: agency.id,
      bankCountry 
    });
    
    return { 
      data: userData, 
      agencyId: agency.id 
    };

  } catch (e: any) {
    logError(e, {
      service: 'onboardingCompleteActions',
      method: 'activateAgencyUserAction',
      id,
      unexpectedError: true,
      errorMessage: e.message
    });
    return { error: e.message || 'Ocurrió un error inesperado al activar el usuario de agencia.' };
  }
}

/**
 * Completa la configuración de Stripe y activa la agencia (paso 2 del onboarding)
 */
export async function completeAgencyStripeSetupAction(
  agencyId: number,
  stripeAccountId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Actualizar la agencia con la información de Stripe y marcarla como activa
    const { data, error } = await supabase
      .from('agencias')
      .update({
        activa: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', agencyId)
      .select()
      .single();

    if (error) {
      logError(error, {
        service: 'onboardingCompleteActions',
        method: 'completeAgencyStripeSetupAction',
        agencyId,
        errorMessage: error.message
      });
      return { error: error.message };
    }

    logInfo('Configuración de Stripe completada y agencia activada', { 
      agencyId, 
      stripeAccountId 
    });
    
    return { success: true };

  } catch (e: any) {
    logError(e, {
      service: 'onboardingCompleteActions',
      method: 'completeAgencyStripeSetupAction',
      agencyId,
      unexpectedError: true,
      errorMessage: e.message
    });
    return { error: e.message || 'Ocurrió un error inesperado al completar la configuración de Stripe.' };
  }
}
