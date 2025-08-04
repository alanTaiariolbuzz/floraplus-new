import { createAdminClient } from '@/utils/supabase/admin';
import { logError, logInfo } from '@/utils/error/logger';

const getSupabase = async () => await createAdminClient();

export async function asignarIdAgencia(agencia_id: number | null | undefined, user_id: string) {
  const supabase = await getSupabase();

  if (agencia_id) {
    const error = await validarID(agencia_id);
    if (error) {
      return { code: 400, message: error.error || 'ID de agencia no válido' };
    }

    const { data: agenciaIdData, error: agenciaIdError } = await supabase
      .from('usuarios')
      .update({ agencia_id: agencia_id,
                rol_id: 2})
      .eq('id', user_id).select()
      .single();
    
    const {error: updateError} = await supabase.auth.admin.updateUserById(user_id, {
      user_metadata: { role: "AGENCY_ADMIN",
                       agencia: agencia_id
       }
    });
    if (updateError) throw updateError;
    

    if (agenciaIdError || !agenciaIdData) {
      return { code: 500, message: agenciaIdError?.message || 'Error al actualizar usuario' };
    }

    return {
      code: 200,
      message: 'Cliente modificado exitosamente',
      data: agenciaIdData,
    };
  }

  // Si no se envió ningún id de agencia y sos superadmin en app_metadata, se pone en valor null en la tabla
  
  const { data, error } = await supabase.auth.admin.getUserById(user_id);
  if (error) throw error;
  const super_admin= await data?.user?.app_metadata?.role === "SUPER_ADMIN";
  if (!super_admin) {
  return { code: 403, message:data };}
  if (super_admin) {
    // Es superadmin
    const { data: agenciaIdData, error: agenciaIdError } = await supabase
    .from('usuarios')
    .update({ agencia_id: null,
              rol_id : 1
     })
    .eq('id', user_id).select()
    .single();
    const {error: updateError} = await supabase.auth.admin.updateUserById(user_id, {
      user_metadata: { role: "SUPER_ADMIN",
                       agencia: null
       }
    });
    if (updateError) throw updateError;
    if (agenciaIdError || !agenciaIdData) {
    return { code: 500, message: agenciaIdError?.message || 'Error al actualizar usuario' };
  }
  return {
    code: 200,
    message: 'Cliente modificado exitosamente',
    data: agenciaIdData,
  };
}
  }
  

  

export async function validarID(agencia_id: number) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('agencias')
    .select('*')
    .eq('id', agencia_id);

  if (error || !data || data.length === 0) {
    logError(error, {
      code: 404,
      service: 'spy_mode',
      method: 'validarID',
      message: 'ID de agencia no encontrado',
    });
    return { error: error?.message || 'ID de agencia no encontrado' };
  }

  return null;
}