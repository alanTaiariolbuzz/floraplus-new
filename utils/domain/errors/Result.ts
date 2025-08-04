/**
 * Clase genérica para devolver resultados tipados con éxito o error
 * Esto proporciona una manera consistente de manejar resultados en toda la aplicación
 * y evita la necesidad de usar excepciones para flujos de control normales
 */
export class Result<T, E = Error> {
  private readonly _value?: T;
  private readonly _error?: E;
  private readonly _isSuccess: boolean;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;

    // Hacer inmutable el objeto
    Object.freeze(this);
  }

  /**
   * Crea un Result exitoso con un valor
   */
  public static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  /**
   * Crea un Result fallido con un error
   */
  public static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Verifica si el Result es exitoso
   */
  public isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * Verifica si el Result ha fallado
   */
  public isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * Obtiene el valor si el Result es exitoso
   * @throws Error si el Result no es exitoso
   */
  public getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from a failed result');
    }
    return this._value as T;
  }

  /**
   * Obtiene el error si el Result ha fallado
   * @throws Error si el Result es exitoso
   */
  public getError(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from a successful result');
    }
    return this._error as E;
  }

  /**
   * Ejecuta una función si el Result es exitoso
   */
  public onSuccess(fn: (value: T) => void): Result<T, E> {
    if (this._isSuccess) {
      fn(this._value as T);
    }
    return this;
  }

  /**
   * Ejecuta una función si el Result ha fallado
   */
  public onFailure(fn: (error: E) => void): Result<T, E> {
    if (!this._isSuccess) {
      fn(this._error as E);
    }
    return this;
  }

  /**
   * Transforma el valor si el Result es exitoso
   */
  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.ok<U, E>(fn(this._value as T));
    }
    return Result.fail<U, E>(this._error as E);
  }

  /**
   * Devuelve el valor o un valor por defecto si el Result ha fallado
   */
  public getOrElse(defaultValue: T): T {
    if (this._isSuccess) {
      return this._value as T;
    }
    return defaultValue;
  }

  /**
   * Devuelve el valor o lanza el error si el Result ha fallado
   */
  public getOrThrow(): T {
    if (this._isSuccess) {
      return this._value as T;
    }

    if (this._error instanceof Error) {
      throw this._error;
    } else {
      throw new Error(String(this._error));
    }
  }
}
