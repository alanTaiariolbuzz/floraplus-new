import { ZodError } from 'zod';
import { logError, logInfo } from '../../../../utils/error/logger';
import { tarifaSchema } from '../schemas/tarifaSchema';
import { 
  getTarifas, 
  getTarifaById, 
  createTarifa, 
  updateTarifa, 
  deleteTarifa 
} from '../services/tarifaService';

/**
 * Obtiene la lista de tarifas según los filtros proporcionados
 */
export async function getTarifasFiltradas(queryParams: URLSearchParams) {
  try {
    // Extraer parámetros de consulta
    const actividadId = queryParams.get('actividad_id') ? parseInt(queryParams.get('actividad_id')!) : undefined;
    const id = queryParams.get('id') ? parseInt(queryParams.get('id')!) : undefined;
    const esPrincipal = queryParams.get('es_principal') !== null ? queryParams.get('es_principal') === 'true' : undefined;
    const activa = queryParams.get('activa') !== null ? queryParams.get('activa') === 'true' : undefined;
    
    // Obtener tarifas con los filtros aplicados
    const tarifas = await getTarifas({
      actividad_id: actividadId,
      id,
      es_principal: esPrincipal,
      activa
    });
    
    return {
      code: 200,
      message: 'Tarifas obtenidas exitosamente',
      data: tarifas
    };
  } catch (err) {
    logError(err, { controller: 'tarifaController', method: 'getTarifasFiltradas' });
    throw err;
  }
}

/**
 * Crea una nueva tarifa
 */
export async function crearTarifa(body: any) {
  try {
    // Validar datos
    const data = tarifaSchema.parse(body);
    
    // Crear tarifa
    const resultado = await createTarifa(data);
    
    if (resultado.error) {
      return {
        code: 400,
        message: resultado.error
      };
    }
    
    return {
      code: 201,
      message: 'Tarifa creada exitosamente',
      data: resultado.data
    };
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { controller: 'tarifaController', method: 'crearTarifa', errorType: 'validationError' });
      throw {
        code: 400,
        message: 'Datos de tarifa inválidos',
        errors: err.errors
      };
    }
    
    logError(err, { controller: 'tarifaController', method: 'crearTarifa' });
    throw err;
  }
}

/**
 * Actualiza una tarifa existente
 */
export async function actualizarTarifa(id: number, body: any) {
  try {
    // Validar datos
    const data = tarifaSchema.parse(body);
    
    // Actualizar tarifa
    const resultado = await updateTarifa(id, data);
    
    if (resultado.error) {
      if (resultado.error === 'Tarifa no encontrada') {
        return {
          code: 404,
          message: resultado.error
        };
      }
      
      return {
        code: 400,
        message: resultado.error
      };
    }
    
    return {
      code: 200,
      message: 'Tarifa modificada exitosamente',
      data: resultado.data
    };
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { controller: 'tarifaController', method: 'actualizarTarifa', errorType: 'validationError' });
      throw {
        code: 400,
        message: 'Datos de tarifa inválidos',
        errors: err.errors
      };
    }
    
    logError(err, { controller: 'tarifaController', method: 'actualizarTarifa' });
    throw err;
  }
}

/**
 * Elimina una tarifa (soft delete)
 */
export async function eliminarTarifa(id: number) {
  try {
    // Eliminar tarifa (soft delete)
    const resultado = await deleteTarifa(id);
    
    if (resultado.error) {
      return {
        code: 404,
        message: resultado.error
      };
    }
    
    return {
      code: 200,
      message: 'Tarifa marcada como eliminada exitosamente',
      data: resultado.data
    };
  } catch (err) {
    logError(err, { controller: 'tarifaController', method: 'eliminarTarifa' });
    throw err;
  }
}
