import { Stripe } from 'stripe';

// Extender los tipos de Stripe para incluir future_requirements
declare module 'stripe' {
  namespace Stripe {
    interface Requirements {
      currently_due: string[];
      eventually_due: string[];
      past_due: string[];
      pending_verification: string[];
    }

    interface Account {
      future_requirements?: {
        currently_due: string[];
        eventually_due: string[];
        past_due: string[];
        pending_verification: string[];
      };
    }
  }
}
