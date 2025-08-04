
import { logError, logInfo } from '../../../../utils/error/logger';
import { 
  getAdicionales, 
  getAdicionalesByActividadId, 
  getAdicionalById,
  createAdicional,
  updateAdicional,
  deleteAdicional
} from '../services/adicionalService';

export interface FiltrosAdicional {
  id?: number;
  actividad_id?: number;
  aplica_a_todas?: boolean;
}

/**
 * Obtiene adicionales filtrados según los parámetros proporcionados
 */
export async function getAdicionalesFiltrados(filtros: FiltrosAdicional = {}) {
  try {
    let data;
    const { id, actividad_id, aplica_a_todas } = filtros;

    if (id) {
      // Si se proporciona un ID, obtenemos un adicional específico
      data = await getAdicionalById(id);
      return {
        code: 200,
        message: 'Adicional obtenido exitosamente',
        data: data ? [data] : []
      };
    } else if (actividad_id) {
      // Si se proporciona un ID de actividad, obtenemos los adicionales de esa actividad
      data = await getAdicionalesByActividadId(actividad_id);
      return {
        code: 200,
        message: 'Adicionales obtenidos exitosamente',
        data
      };
    } else {
      // Si hay otros filtros o ninguno, obtenemos todos los adicionales aplicando filtros
      const filters: any = {};
      if (aplica_a_todas !== undefined) {
        filters.aplica_a_todas = aplica_a_todas;
      }
      
      data = await getAdicionales(filters);
      return {
        code: 200,
        message: 'Adicionales obtenidos exitosamente',
        data
      };
    }
  } catch (err: any) {
    // Utilizar el sistema centralizado de logging para registrar el error
    logError(err, {
      service: 'adicionalController',
      context: 'getAdicionalesFiltrados',
      data: { filtros }
    });
    
    // Manejar caso especial para 404 Not Found
    if (err && typeof err === 'object' && err.code === 404) {
      throw {
        code: 404,
        message: err.message || `Adicional no encontrado`
      };
    }
    
    // Error de la base de datos
    if (err && typeof err === 'object' && err.code === 'PGRST116') {
      throw {
        code: 404,
        message: 'Recurso no encontrado'
      };
    }
    
    // Error genérico
    throw {
      code: err && typeof err === 'object' && err.code ? err.code : 500,
      message: err && typeof err === 'object' && err.message ? err.message : 'Error al obtener adicionales'
    };
  }
}

/**
 * Crea un nuevo adicional
 */
export async function crearAdicional(data: any, agenciaId: number) {
  try {
    // Validar datos de entrada a través del esquema Zod en la ruta

    // agrego la agencia al adicional
    const datosConAgencia = { ...data, agencia_id: agenciaId };
    
    const nuevoAdicional = await createAdicional(datosConAgencia);
    
    return {
      code: 201,
      message: 'Adicional creado',
      data: nuevoAdicional
    };
  } catch (err: any) {
    logError({
      message: 'Error en crearAdicional',
      error: err,
      endpoint: '/api/adicionales'
    });
    
    throw {
      code: err.code || 500,
      message: err.message || 'Error al crear adicional'
    };
  }
}

/**
 * Actualiza un adicional existente
 */
export async function actualizarAdicional(id: number, data: any) {
  try {
    // Validar datos de entrada a través del esquema Zod en la ruta
    
    // Actualizar el adicional utilizando el servicio
    const adicionalActualizado = await updateAdicional(id, data);
    
    return {
      code: 200,
      message: 'Adicional actualizado exitosamente',
      data: adicionalActualizado
    };
  } catch (err: any) {
    logError({
      message: 'Error en actualizar Adicional',
      error: err,
      endpoint: '/api/adicionales'
    });
    
    throw {
      code: err.code || 500,
      message: err.message || 'Error al actualizar adicional'
    };
  }
}

/**
 * Elimina un adicional (soft delete)
 */
export async function eliminarAdicional(id: number) {
  try {
    // Eliminar el adicional utilizando el servicio
    await deleteAdicional(id);
    
    return {
      code: 200,
      message: 'Adicional eliminado exitosamente'
    };
  } catch (err: any) {
    logError({
      message: 'Error en eliminarAdicional',
      error: err,
      endpoint: '/api/adicionales'
    });
    
    throw {
      code: err.code || 500,
      message: err.message || 'Error al eliminar adicional'
    };
  }
}
