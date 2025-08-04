import { ZodError } from 'zod';
import { logError, logInfo } from '../../../../utils/error/logger';
import { turnoSchema, turnoUpdateSchema } from '../schemas/turnoSchema';
import { 
  getTurnos, 
  getTurnoById, 
  guardarTurno, 
  updateTurno, 
  deleteTurno 
} from '../services/turnoService';

/**
 * Obtiene turnos filtrando según parámetros
 */
export async function getTurnosFiltrados(filtros: any = {}) {
  try {
    const turnos = await getTurnos(filtros);
    
    return {
      code: 200,
      message: 'Turnos obtenidos exitosamente',
      data: turnos
    };
  } catch (err) {
    const errorId = new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5);
    logError(err, { controller: 'turnoController', method: 'getTurnosFiltrados', errorId });
    
    const pgError = err as any;
    if (pgError.code) {
      return {
        code: 500,
        message: 'Error al consultar turnos',
        errorId,
        detail: process.env.NODE_ENV === 'development' ? pgError.details : undefined
      };
    }
    
    throw err;
  }
}

/**
 * Crea un nuevo turno
 */
export async function crearTurno(body: any) {
  try {
    // Preparar datos: Si solo se especifica cupo_total, copiar valor a cupo_disponible
    let datosPreparados = { ...body };
    if (datosPreparados.cupo_total !== undefined && datosPreparados.cupo_disponible === undefined) {
      datosPreparados.cupo_disponible = datosPreparados.cupo_total;
      
      logInfo('Auto-asignando cupo_disponible = cupo_total', {
        controller: 'turnoController',
        method: 'crearTurno',
        data: { cupo_total: datosPreparados.cupo_total }
      });
    }
    
    // Validar datos (para creación se requiere el esquema completo)
    const data = turnoSchema.parse(datosPreparados);
    
    // Crear turno
    const nuevoTurno = await guardarTurno(data);
    
    logInfo('Turno creado', {
      controller: 'turnoController',
      method: 'crearTurno',
      data: { id: nuevoTurno.id }
    });
    
    return {
      code: 201,
      message: 'Turno creado exitosamente',
      data: nuevoTurno
    };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        code: 400,
        message: 'Datos de turno inválidos',
        errors: err.errors
      };
    }
    
    // Manejo de errores específicos de Supabase/PostgreSQL
    const pgError = err as any;
    
    // Error de violación de clave foránea
    if (pgError.code === '23503') {
      let campo = 'id';
      let entidad = 'referenciada';
      
      // Detectar qué relación está causando el problema
      if (pgError.details?.includes('horario_id')) {
        campo = 'horario_id';
        entidad = 'horario';
      } else if (pgError.details?.includes('actividad_id')) {
        campo = 'actividad_id';
        entidad = 'actividad';
      } else if (pgError.details?.includes('agencia_id')) {
        campo = 'agencia_id';
        entidad = 'agencia';
      }
      
      return {
        code: 400,
        message: `Referencia inválida: El ${entidad} especificado no existe`,
        errors: [{
          code: 'foreign_key_violation',
          field: campo,
          message: `El ID proporcionado no existe en la tabla de ${entidad}s`
        }]
      };
    }
    
    // Error de violación de NOT NULL
    if (pgError.code === '23502') {
      const campoFaltante = pgError.details?.match(/column "([^"]+)"/) ? 
                            pgError.details.match(/column "([^"]+)"/)[1] : 
                            'desconocido';
      
      return {
        code: 400,
        message: 'Faltan campos obligatorios',
        errors: [{
          code: 'not_null_violation',
          field: campoFaltante,
          message: `El campo ${campoFaltante} es obligatorio`
        }]
      };
    }
    
    // Otros errores de base de datos
    if (pgError.code) {
      const errorId = new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5);
      logError(err, { controller: 'turnoController', method: 'crearTurno', errorId });
      
      return {
        code: 500,
        message: 'Error al crear el turno',
        errorId,
        detail: process.env.NODE_ENV === 'development' ? pgError.details : undefined
      };
    }
    
    // Error genérico
    const errorId = new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5);
    logError(err, { controller: 'turnoController', method: 'crearTurno', errorId });
    throw err;
  }
}

/**
 * Actualiza un turno existente
 */
export async function actualizarTurno(id: number, body: any) {
  try {
    // Obtener turno actual para comparar cambios
    const turnoActual = await getTurnoById(id);
    if (!turnoActual) {
      return {
        code: 404,
        message: 'Turno no encontrado'
      };
    }

    // Preparar datos: Si se actualiza cupo_total pero no cupo_disponible, y el cupo_total es distinto al anterior,
    // auto-calcular cupo_disponible basado en la diferencia
    let datosPreparados = { ...body };
    if (datosPreparados.cupo_total !== undefined && datosPreparados.cupo_disponible === undefined) {
      const cupoTotalAnterior = turnoActual.cupo_total || 0;
      const cupoTotalNuevo = datosPreparados.cupo_total;
      const cupoDisponibleActual = turnoActual.cupo_disponible || 0;
      
      // Si hay un cambio en el cupo total, ajustar el disponible proporcionalmente
      if (cupoTotalNuevo !== cupoTotalAnterior) {
        // Si cupo_total aumenta, el cupo_disponible aumenta en la misma cantidad
        // Si cupo_total disminuye, cupo_disponible se ajusta pero no puede ser negativo
        const diferencia = cupoTotalNuevo - cupoTotalAnterior;
        let nuevoCupoDisponible = Math.max(0, cupoDisponibleActual + diferencia);
        // Si el nuevo cupo es mayor que el cupo total, ajustarlo
        nuevoCupoDisponible = Math.min(nuevoCupoDisponible, cupoTotalNuevo);
        
        datosPreparados.cupo_disponible = nuevoCupoDisponible;
        
        logInfo('Auto-calculando cupo_disponible en actualización', {
          controller: 'turnoController',
          method: 'actualizarTurno',
          data: { 
            id, 
            cupo_total_anterior: cupoTotalAnterior, 
            cupo_total_nuevo: cupoTotalNuevo,
            cupo_disponible_anterior: cupoDisponibleActual,
            cupo_disponible_nuevo: nuevoCupoDisponible
          }
        });
      }
    }
    
    // Validar datos usando el esquema de actualización (parcial)
    const data = turnoUpdateSchema.parse(datosPreparados);
    
    // Actualizar turno
    const turnoActualizado = await updateTurno(id, data);
    
    if (!turnoActualizado) {
      return {
        code: 404,
        message: 'Turno no encontrado'
      };
    }
    
    logInfo('Turno actualizado', {
      controller: 'turnoController',
      method: 'actualizarTurno',
      data: { id }
    });
    
    return {
      code: 200,
      message: 'Turno modificado exitosamente',
      data: turnoActualizado
    };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        code: 400,
        message: 'Datos de turno inválidos',
        errors: err.errors
      };
    }
    
    // Manejo de errores específicos de Supabase/PostgreSQL
    const pgError = err as any;
    
    // Error de violación de clave foránea
    if (pgError.code === '23503') {
      let campo = 'id';
      let entidad = 'referenciada';
      
      // Detectar qué relación está causando el problema
      if (pgError.details?.includes('horario_id')) {
        campo = 'horario_id';
        entidad = 'horario';
      } else if (pgError.details?.includes('actividad_id')) {
        campo = 'actividad_id';
        entidad = 'actividad';
      } else if (pgError.details?.includes('agencia_id')) {
        campo = 'agencia_id';
        entidad = 'agencia';
      }
      
      return {
        code: 400,
        message: `Referencia inválida: El ${entidad} especificado no existe`,
        errors: [{
          code: 'foreign_key_violation',
          field: campo,
          message: `El ID proporcionado no existe en la tabla de ${entidad}s`
        }]
      };
    }
    
    // Error de violación de NOT NULL
    if (pgError.code === '23502') {
      const campoFaltante = pgError.details?.match(/column "([^"]+)"/) ? 
                            pgError.details.match(/column "([^"]+)"/)[1] : 
                            'desconocido';
      
      return {
        code: 400,
        message: 'Faltan campos obligatorios',
        errors: [{
          code: 'not_null_violation',
          field: campoFaltante,
          message: `El campo ${campoFaltante} es obligatorio`
        }]
      };
    }
    
    // Otros errores de base de datos
    if (pgError.code) {
      const errorId = new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5);
      logError(err, { controller: 'turnoController', method: 'actualizarTurno', errorId });
      
      return {
        code: 500,
        message: 'Error al actualizar el turno',
        errorId,
        detail: process.env.NODE_ENV === 'development' ? pgError.details : undefined
      };
    }
    
    // Error genérico
    const errorId = new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5);
    logError(err, { controller: 'turnoController', method: 'actualizarTurno', errorId });
    throw err;
  }
}

/**
 * Elimina un turno (soft delete)
 */
export async function eliminarTurno(id: number) {
  try {
    // Verificar primero si el turno existe
    const turnoExistente = await getTurnoById(id);
    if (!turnoExistente) {
      return {
        code: 404,
        message: 'Turno no encontrado'
      };
    }
    
    // Realizar eliminación lógica
    const resultado = await deleteTurno(id);
    
    if (!resultado) {
      return {
        code: 404,
        message: 'Turno no encontrado'
      };
    }
    
    logInfo('Turno eliminado (soft delete)', {
      controller: 'turnoController',
      method: 'eliminarTurno',
      data: { id }
    });
    
    return {
      code: 200,
      message: 'Turno marcado como eliminado exitosamente',
      data: resultado
    };
  } catch (err) {
    const errorId = new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5);
    logError(err, { controller: 'turnoController', method: 'eliminarTurno', errorId });
    
    const pgError = err as any;
    if (pgError.code) {
      return {
        code: 500,
        message: 'Error al eliminar el turno',
        errorId,
        detail: process.env.NODE_ENV === 'development' ? pgError.details : undefined
      };
    }
    
    throw err;
  }
}
