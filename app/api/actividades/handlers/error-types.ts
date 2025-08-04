
export class DomainError extends Error {
  public readonly code: number;
  constructor(code: number, msg: string) {
    super(msg);
    this.code = code;
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(id: number) {
    super(404, `Actividad ${id} no encontrada o sin permiso`);
  }
}

export class ValidationError extends DomainError {
  public readonly errors: unknown;
  constructor(errors: unknown) {
    super(400, 'Datos de entrada inválidos');
    this.errors = errors;
  }
}

export class ForeignKeyViolationError extends DomainError {
  constructor(resource = 'Recurso') {
    super(409, `${resource} está vinculado a otros registros y no puede eliminarse`);
  }
}


export class DuplicateIdError extends DomainError {
  constructor() { super(400,'IDs duplicados en cronograma'); }
}
export class PastDateError extends DomainError {
  constructor() { super(400,'fecha_inicio no puede ser anterior a hoy'); }
}
export class TimeRangeError extends DomainError {
  constructor() { super(400,'hora_inicio debe ser < hora_fin'); }
}
export class ReservationsConflictError extends DomainError {
  constructor() { super(409,'Horario con reservas confirmadas'); }
}