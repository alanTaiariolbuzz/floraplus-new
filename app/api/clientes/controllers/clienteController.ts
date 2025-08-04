import { ZodError } from 'zod';
import { logError, logInfo } from '../../../../utils/error/logger';
import { clienteSchema } from '../schemas/clienteSchema';
import { 
  getClientes, 
  getClienteById, 
  createCliente, 
  updateCliente, 
  deleteCliente 
} from '../services/clienteService';

/**
 * Obtiene la lista de clientes según los filtros proporcionados
 */
export async function getClientesFiltrados(queryParams: URLSearchParams) {
  try {
    // Extraer parámetros de consulta
    const email = queryParams.get('email') || undefined;
    const telefono = queryParams.get('telefono') || undefined;
    const activo = queryParams.get('activo') !== null ? queryParams.get('activo') === 'true' : undefined;
    const id = queryParams.get('id') || undefined;
    
    // Obtener clientes con los filtros aplicados
    const clientes = await getClientes({
      email,
      telefono,
      activo,
      id
    });
    
    if (typeof clientes !== 'object' || ('error' in clientes && clientes.error)) {
      return {
        code: 404,
        message: typeof clientes === 'object' && 'error' in clientes ? clientes.error : 'No se encontraron clientes con los filtros proporcionados'
      };
    }

    return {
      code: 200,
      message: 'Clientes obtenidos exitosamente',
      data: clientes
    };
  } catch (err) {
    logError(err, { controller: 'clienteController', method: 'getClientesFiltrados' });
    throw err;
  }
}

/**
 * Crea un nuevo cliente
 */
export async function crearCliente(body: any) {
  try {
    // Validar datos
    const data = clienteSchema.parse(body);
    
    // Crear cliente
    const resultado = await createCliente(data);
    
    if (resultado.error) {
      return {
        code: 400,
        message: resultado.error
      };
    }
    
    return {
      code: 201,
      message: 'Cliente creado exitosamente',
      data: resultado.data
    };
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { controller: 'clienteController', method: 'crearCliente', errorType: 'validationError' });
      throw {
        code: 400,
        message: 'Datos de cliente inválidos',
        errors: err.errors
      };
    }
    
    logError(err, { controller: 'clienteController', method: 'crearCliente' });
    throw err;
  }
}

/**
 * Actualiza un cliente existente
 */
export async function actualizarCliente(id: string, body: any) {
  try {
    // Validar datos
    const data = clienteSchema.parse(body);
    
    // Actualizar cliente
    const resultado = await updateCliente(id, data);
    
    if (resultado.error) {
      if (resultado.error === 'Cliente no encontrado') {
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
      message: 'Cliente modificado exitosamente',
      data: resultado.data
    };
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { controller: 'clienteController', method: 'actualizarCliente', errorType: 'validationError' });
      throw {
        code: 400,
        message: 'Datos de cliente inválidos',
        errors: err.errors
      };
    }
    
    logError(err, { controller: 'clienteController', method: 'actualizarCliente' });
    throw err;
  }
}

/**
 * Elimina un cliente (soft delete)
 */
export async function eliminarCliente(id: string) {
  try {
    // Eliminar cliente (soft delete)
    const resultado = await deleteCliente(id);
    
    if (resultado.error) {
      return {
        code: 404,
        message: resultado.error
      };
    }
    
    return {
      code: 200,
      message: 'Cliente marcado como eliminado exitosamente',
      data: resultado.data
    };
  } catch (err) {
    logError(err, { controller: 'clienteController', method: 'eliminarCliente' });
    throw err;
  }
}