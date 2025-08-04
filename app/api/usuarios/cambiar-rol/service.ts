import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { logError, logInfo } from '@/utils/error/logger';
import { verificarRol } from '../services/usuarioService';
import { CambiarRolRequest } from './schemas';
import { ROLES } from '@/utils/auth/roles';

/**
 * Actualiza el rol de un usuario existente
 * @param cambiarRolData Datos para cambiar el rol
 * @returns Resultado de la operación
 */
export async function cambiarRolUsuario(cambiarRolData: CambiarRolRequest) {
  try {
    const supabase = await createClient();
    const { id, email, rol_id } = cambiarRolData;

    // Verificar que el rol existe
    const rolExiste = await verificarRol(rol_id);
    if (!rolExiste) {
      return { success: false, error: `El rol con ID ${rol_id} no existe` };
    }

    // Buscar el usuario por ID o email
    let query = supabase.from('usuarios').select('id, email, rol_id, nombre')
      .is('deleted_at', null);
    
    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.ilike('email', email);
    }

    const { data: usuario, error: buscarError } = await query.single();

    if (buscarError || !usuario) {
      logError(buscarError || new Error('Usuario no encontrado'), {
        service: 'cambiarRolService',
        method: 'cambiarRolUsuario',
        id,
        email
      });
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Si el rol es el mismo, no hacer cambios
    if (usuario.rol_id === rol_id) {
      return { 
        success: true, 
        message: `El usuario ya tiene el rol ${rol_id}`,
        usuario
      };
    }


    // 2. Actualizar metadata del usuario en Supabase Auth
    const supabaseAdmin = createAdminClient();
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      usuario.id,
      {
        user_metadata: { role: rol_id } // Actualizamos el rol en la metadata
      }
    );

    if (authError) {
      logError(authError, {
        service: 'cambiarRolService',
        method: 'cambiarRolUsuario',
        id: usuario.id,
        email: usuario.email,
        rol_id
      });
      return { success: false, error: `Error al actualizar la metadata del usuario: ${authError.message}` };
    }

    // 3. Actualizar el usuario con el nuevo rol en la tabla de usuarios
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        rol_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', usuario.id)
      .select('*')
      .single();

    if (error) {
      logError(error, {
        service: 'cambiarRolService',
        method: 'cambiarRolUsuario',
        id: usuario.id,
        email: usuario.email,
        rol_id
      });
      return { success: false, error: `Error al actualizar el rol en la base de datos: ${error.message}` };
    }

    logInfo(`Rol actualizado para usuario ${usuario.email}`, {
      service: 'cambiarRolService',
      method: 'cambiarRolUsuario',
      id: usuario.id,
      email: usuario.email,
      rol_anterior: usuario.rol_id,
      rol_nuevo: rol_id
    });

    return {
      success: true,
      message: `Rol actualizado correctamente para ${usuario.email}`,
      usuario: data
    };

  } catch (e: any) {
    logError(e, {
      service: 'cambiarRolService',
      method: 'cambiarRolUsuario',
      cambiarRolData,
      unexpectedError: true
    });
    return { success: false, error: 'Error inesperado al cambiar el rol' };
  }
}
