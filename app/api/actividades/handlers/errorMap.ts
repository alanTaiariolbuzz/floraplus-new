// app/api/actividades/handlers/errorMap.ts
import { DomainError, ValidationError,  DuplicateIdError, PastDateError, TimeRangeError,
  ReservationsConflictError, } from './error-types';
import { ZodError } from 'zod';


export function mapError(err: unknown) {
  // 1) Errores de dominio ya traen {code,message}
  if (err instanceof DomainError) {
    if (err instanceof ValidationError) {
      return { code: err.code, message: err.message, errors: err.errors };
    }
    return { code: err.code, message: err.message };
  }

  
  if (err instanceof DuplicateIdError)      return { code: 400, message: err.message };
  if (err instanceof PastDateError)         return { code: 400, message: err.message };
  if (err instanceof TimeRangeError)        return { code: 400, message: err.message };
  if (err instanceof ReservationsConflictError) return { code: 409, message: err.message };
  // 2) Validación Zod directa (por si alguien la lanza sin envolver)
  if (err instanceof ZodError) {
    return { code: 400, message: 'Datos de entrada inválidos', errors: err.flatten() };
  }

  // 3) Default 500
  return { code: 500, message: 'Error interno del servidor' };
}


