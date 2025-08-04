import { logError, logInfo } from '../../../../utils/error/logger';
import { 
  getAgencias, 
  getAgenciaById, 
  createAgencia, 
  updateAgencia, 
  deactivateAgencia
} from '../services/agenciaService';
import { AgenciaData, FiltrosAgencia } from '../types';


/**
 * Obtiene agencias según los filtros proporcionados
 * @param filtros Filtros para la consulta
 * @returns Resultado de la consulta
 */
export async function getAgenciasFiltradas(filtros: FiltrosAgencia = {}) {
  try {
    let data;
    const { id, activa } = filtros;

    if (id) {
      // Si se proporciona un ID, obtenemos una agencia específica
      data = await getAgenciaById(id);
      return {
        code: 200,
        message: 'Agencia obtenida exitosamente',
        data: [data]
      };
    } else {
      // Si hay otros filtros o ninguno, obtenemos todas las agencias aplicando filtros
      data = await getAgencias(filtros);
      return {
        code: 200,
        message: 'Agencias obtenidas exitosamente',
        data
      };
    }
  } catch (err: any) {
    logError({
      message: 'Error en getAgenciasFiltradas',
      error: err,
      endpoint: '/api/agencias'
    });
    
    throw {
      code: err.code || 500,
      message: err.message || 'Error al obtener agencias'
    };
  }
}

/**
 * Crea una nueva agencia
 * @param data Datos para crear la agencia
 * @returns Resultado de la creación
 */
export async function createNuevaAgencia(data: AgenciaData) {
  try {
    // Llamar al servicio para crear la agencia
    const nuevaAgencia = await createAgencia(data);
    
    // Usar el sistema centralizado de logging
    logInfo(`Agencia creada exitosamente: ${nuevaAgencia.nombre}`, { 
      endpoint: '/api/agencias/POST',
      id: nuevaAgencia.id,
      email: data.email_contacto // Agregar información útil para auditoría
    });
    
    return {
      code: 201,
      message: 'Agencia creada exitosamente',
      data: nuevaAgencia
    };
  } catch (err) {
    // Usar el sistema centralizado de logging
    logError(err, {
      endpoint: '/api/agencias/POST',
      context: 'Error al crear agencia',
      data: { email: data.email_contacto } // Info para debugging
    });
    
    // Preservar códigos de error específicos (409 Conflict, etc.) del servicio
    const statusCode = err && typeof err === 'object' && 'code' in err && typeof err.code === 'number' ? err.code : 500;
    const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al crear agencia';
    
    throw {
      code: statusCode,
      message: message
    };
  }
}

/**
 * Actualiza una agencia existente
 * @param id ID de la agencia a actualizar
 * @param data Datos para actualizar la agencia
 * @returns Resultado de la actualización
 */
export async function actualizarAgencia(id: number, data: Partial<AgenciaData>) {
  try {
    // Llamar al servicio para actualizar la agencia
    const agenciaActualizada = await updateAgencia(id, data);
    
    logInfo(`Agencia actualizada exitosamente: ${agenciaActualizada.nombre}`, {
      endpoint: '/api/agencias/PUT',
      id: agenciaActualizada.id
    });
    
    return {
      code: 200,
      message: 'Agencia actualizada exitosamente',
      data: agenciaActualizada
    };
  } catch (err: any) {
    logError(err, {
      endpoint: '/api/agencias/PUT',
      context: 'Error al actualizar agencia',
      id
    });
    
    throw {
      code: err.code || 500,
      message: err.message || 'Error al actualizar agencia'
    };
  }
}

/**
 * Desactiva una agencia (eliminación lógica)
 * @param id ID de la agencia a desactivar
 * @returns Resultado de la desactivación
 */
export async function desactivarAgencia(id: number) {
  try {
    // Llamar al servicio para desactivar la agencia
    const resultado = await deactivateAgencia(id);
    
    if (resultado.agenciaExistente) {
      // La agencia ya estaba desactivada
      logInfo(`Agencia ya estaba desactivada: ${resultado.agenciaExistente.nombre}`, {
        endpoint: '/api/agencias/DELETE',
        id
      });
    } else {
      // La agencia fue desactivada exitosamente
      logInfo(`Agencia desactivada exitosamente: ${resultado.data.nombre}`, {
        endpoint: '/api/agencias/DELETE',
        id
      });
    }
    
    return {
      code: 200,
      message: resultado.message,
      data: resultado.data || resultado.agenciaExistente
    };
  } catch (err: any) {
    logError(err, {
      endpoint: '/api/agencias/DELETE',
      context: 'Error al desactivar agencia',
      id
    });
    
    throw {
      code: err.code || 500,
      message: err.message || 'Error al desactivar agencia'
    };
  }
}
