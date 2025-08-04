/**
 * Clase de error específica para errores de Stripe
 * Proporciona un manejo consistente de errores de Stripe en toda la aplicación
 */
export class StripeError extends Error {
  readonly statusCode?: number;
  readonly stripeCode?: string;
  readonly stripeType?: string;
  readonly declineCode?: string;
  readonly rawError: any;
  readonly context?: Record<string, any>;

  constructor(
    message: string,
    rawError: any,
    context?: Record<string, any>
  ) {
    super(message || 'Error al procesar operación con Stripe');
    this.name = 'StripeError';
    this.rawError = rawError;
    this.context = context;

    // Extraer información relevante del error de Stripe
    if (rawError && typeof rawError === 'object') {
      this.statusCode = rawError.statusCode;
      this.stripeCode = rawError.code;
      this.stripeType = rawError.type;

      // Extraer decline_code si existe para errores de pago
      if (rawError.decline_code) {
        this.declineCode = rawError.decline_code;
      } else if (rawError.raw && rawError.raw.decline_code) {
        this.declineCode = rawError.raw.decline_code;
      }
    }

    // Mantener rastro de la pila de llamadas
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StripeError);
    }
  }

  /**
   * Proporciona una representación JSON del error para logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      stripeCode: this.stripeCode,
      stripeType: this.stripeType,
      declineCode: this.declineCode,
      context: this.context,
      stack: this.stack
    };
  }
}
