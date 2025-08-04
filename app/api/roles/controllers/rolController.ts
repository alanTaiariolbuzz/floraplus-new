import { logError, logInfo } from '../../../../utils/error/logger';
import { getRoles, getRolById } from '../services/rolService';

export interface FiltrosRol {
  id?: number;
}

export async function getRolesFiltrados(filtros: FiltrosRol = {}) {
  try {
    let data;
    const { id } = filtros;

    if (id) {
      // Si se proporciona un ID, obtenemos un rol específico
      data = await getRolById(id);
      return {
        code: 200,
        message: 'Rol obtenido exitosamente',
        data: [data]
      };
    } else {
      // Si no hay filtros, obtenemos todos los roles
      data = await getRoles();
      return {
        code: 200,
        message: 'Roles obtenidos exitosamente',
        data
      };
    }
  } catch (err: any) {
    logError({
      message: 'Error en getRolesFiltrados',
      error: err,
      endpoint: '/api/roles'
    });
    
    throw {
      code: err.code || 500,
      message: err.message || 'Error al obtener roles'
    };
  }
}
