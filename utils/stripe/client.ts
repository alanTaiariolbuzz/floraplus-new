import Stripe from 'stripe';
import { logError, logInfo } from '../error/logger';

const secretKey = process.env.STRIPE_SECRET_KEY;

// Usar versión estable de la API o tomar de variables de entorno
// Casteamos a Stripe.LatestApiVersion para evitar error de tipos
const stripeVersion = 
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) || 
  '2023-10-16';

// Define un tipo Result para manejar mejor los resultados
type Result<T> = { success: true; data: T } | { success: false; error: string };

// Variable para cachear la instancia de Stripe
let cachedStripeInstance: Stripe | null = null;

const stripeClient = (): Result<Stripe> => {
  // Si ya existe una instancia en caché, la retornamos directamente
  if (cachedStripeInstance) {
    return { success: true, data: cachedStripeInstance };
  }

  try {
    if (!secretKey) {
      const errorMsg = 'STRIPE_SECRET_KEY no está definido';
      logError({
        context: 'stripeClient',
        message: errorMsg,
      });
      return { success: false, error: errorMsg };
    }

    // Creamos una nueva instancia y la guardamos en caché
    // Ahora appInfo se pasa directamente en el constructor en lugar de usar setAppInfo
    const stripe = new Stripe(secretKey, {
      apiVersion: stripeVersion,
      maxNetworkRetries: 3, // Añadimos reintentos para mayor resiliencia
      appInfo: {
        name: 'TuAgenciaApp',
        version: '1.0.0',
        url: 'https://tuagencia.com',
      }
    });

    cachedStripeInstance = stripe;
    return { success: true, data: stripe };

  } catch (error) {
    const errorMsg = 'Error al inicializar el cliente Stripe';
    logError({
      context: 'stripeClient',
      message: errorMsg,
      error,
    });
    return { success: false, error: errorMsg };
  }
};

export default stripeClient;
