import { ZodError } from 'zod';
import { logError, logInfo } from '../../../../utils/error/logger';
import { horarioSchema } from '../schemas/horarioSchema';
import { 
  getHorarios, 
  getHorarioById, 
  createHorario, 
  updateHorario, 
  deleteHorario 
} from '../services/horarioService';
import { deleteTurnosByHorario } from '../../turnos/services/turnoService';

/**
 * Obtiene la lista de horarios según los filtros proporcionados
 */
export async function getHorariosFiltrados(queryParams: URLSearchParams) {
  try {
    // Extraer parámetros de consulta
    const actividadId = queryParams.get('actividad_id') ? parseInt(queryParams.get('actividad_id')!) : undefined;
    const id = queryParams.get('id') ? parseInt(queryParams.get('id')!) : undefined;
    const habilitada = queryParams.get('habilitada') !== null ? queryParams.get('habilitada') === 'true' : undefined;
    const fechaDesde = queryParams.get('fecha_desde') || undefined;
    const fechaHasta = queryParams.get('fecha_hasta') || undefined;
    const agencia_id = queryParams.get('agencia_id') ? Number(queryParams.get('agencia_id')) : undefined;
    
    // Obtener horarios con los filtros aplicados
    const horarios = await getHorarios({
      actividad_id: actividadId,
      id,
      habilitada,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      agencia_id: agencia_id
    });
    
    return {
      code: 200,
      message: 'Horarios obtenidos exitosamente',
      data: horarios
    };
  } catch (err) {
    logError(err, { controller: 'horarioController', method: 'getHorariosFiltrados' });
    throw err;
  }
}

/**
 * Crea un nuevo horario
 */
export async function crearHorario(body: any, agenciaId: number) {
  try {
    // Validar datos
    const data = horarioSchema.parse(body);


    // Crear horario con el ID de la agencia
    const resultado = await createHorario(data, agenciaId);
    
    if (resultado.error) {
      return {
        code: 400,
        message: resultado.error
      };
    }
    
    return {
      code: 201,
      message: 'Horario creado exitosamente',
      data: resultado.data
    };
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { controller: 'horarioController', method: 'crearHorario', errorType: 'validationError' });
      throw {
        code: 400,
        message: 'Datos de horario inválidos',
        errors: err.errors
      };
    }
    
    logError(err, { controller: 'horarioController', method: 'crearHorario' });
    throw err;
  }
}

/**
 * Actualiza un horario existente
 */
export async function actualizarHorario(id: number, body: any) {
  try {
    // Validar datos
    const data = horarioSchema.parse(body);
    
    // Actualizar horario
    const resultado = await updateHorario(id, data);
    
    if (resultado.error) {
      if (resultado.error === 'Horario no encontrado') {
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
      message: 'Horario modificado exitosamente',
      data: resultado.data
    };
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { controller: 'horarioController', method: 'actualizarHorario', errorType: 'validationError' });
      throw {
        code: 400,
        message: 'Datos de horario inválidos',
        errors: err.errors
      };
    }
    
    logError(err, { controller: 'horarioController', method: 'actualizarHorario' });
    throw err;
  }
}

/**
 * Elimina un horario (soft delete) y todos los turnos asociados
 */
export async function eliminarHorario(id: number) {
  try {
    // Eliminar horario
    const resultado = await deleteHorario(id);
    
    if (resultado.error) {
      return {
        code: 404,
        message: resultado.error
      };
    }
    
    // Eliminar todos los turnos asociados al horario
    void deleteTurnosByHorario(id);
    
    return {
      code: 200,
      message: 'Horario marcado como eliminado exitosamente. Los turnos asociados se eliminarán en segundo plano.',
      data: resultado.data
    };
  } catch (err) {
    logError(err, { controller: 'horarioController', method: 'eliminarHorario' });
    throw err;
  }
}
