"use server";

import { createClient } from '@/utils/supabase/server';
import { logError, logInfo } from '@/utils/error/logger';

/**
 * Helper function to get a user by ID for the action.
 * This is a simplified version of getUsuarioById from usuarioService.ts,
 * tailored for use within this server action.
 */
async function getUsuarioByIdForAction(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('usuarios')
    .select('id') // Only need to check existence
    .eq('id', id)
    .single();

  // PGRST116: "Searched for a single row, but 0 rows were found"
  // This is an expected case if the user is not found, not necessarily an error to log.
  if (error && error.code !== 'PGRST116') { 
    logError(error, {
      service: 'adminCompleteActions',
      method: 'getUsuarioByIdForAction',
      id,
      errorMessage: error.message
    });
    // Re-throw to be caught by the main action handler
    throw new Error(`Error fetching user: ${error.message}`);
  }

  return data; // Returns the user object (or just {id}) if found, null otherwise
}

/**
 * Server Action to activate a user.
 * Replicates the logic of updateUsuarioActivo from usuarioService.ts.
 */
export async function activateUserAction(id: string): Promise<{ data?: any; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Verify that the user exists
    const usuarioExistente = await getUsuarioByIdForAction(id);
    if (!usuarioExistente) {
      return { error: 'Usuario no encontrado' };
    }

    // 2. Update the user to set activo = true
    const { data, error: updateError } = await supabase
      .from('usuarios')
      .update({
        activo: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select() // Return the updated record
      .single();

    if (updateError) {
      logError(updateError, {
        service: 'adminCompleteActions',
        method: 'activateUserAction',
        id,
        errorMessage: updateError.message
      });
      return { error: updateError.message };
    }

    logInfo('Usuario marcado como activo via Server Action', { id, data });
    return { data };

  } catch (e: any) {
    // Catch any unexpected errors, including those from getUsuarioByIdForAction
    logError(e, {
      service: 'adminCompleteActions',
      method: 'activateUserAction',
      id,
      unexpectedError: true,
      errorMessage: e.message
    });
    return { error: e.message || 'Ocurrió un error inesperado al activar el usuario.' };
  }
}
