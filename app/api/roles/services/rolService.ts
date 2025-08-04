import { createClient } from '../../../../utils/supabase/server';
import { logError } from '../../../../utils/error/logger';

export async function getRoles() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('id');
    
    if (error) throw error;
    
    return data || [];
  } catch (err: any) {
    logError({
      message: 'Error en getRoles',
      error: err,
      service: 'rolService'
    });
    
    throw {
      code: 500,
      message: 'Error al obtener roles'
    };
  }
}

export async function getRolById(id: number) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw {
          code: 404,
          message: `Rol con ID ${id} no encontrado`
        };
      }
      throw error;
    }
    
    return data;
  } catch (err: any) {
    logError({
      message: `Error en getRolById (id: ${id})`,
      error: err,
      service: 'rolService'
    });
    
    if (err.code && err.message) {
      throw err;
    }
    
    throw {
      code: 500,
      message: 'Error al obtener rol'
    };
  }
}
