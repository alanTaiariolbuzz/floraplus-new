import { handleCheckoutSessionCompleted } from "./handlers/stripe/checkoutSessionCompleted";
import { handlePaymentIntentSucceeded } from "./handlers/stripe/paymentIntentSucceeded";
import {
  handleAccountUpdated,
  handleAccountDeauthorized,
  handleAccountAuthorized,
} from "./handlers/stripe/accountEvents";
import { handleReservaCreada } from "./handlers/reserva/reservaCreada";
import { handlePaymentIntentEvent } from "./handlers/stripe/paymentIntentEvent";
import { EventType } from "./types/eventos";

export interface EventHandlerResult {
  success: boolean;
  message?: string;
  [key: string]: any; // para permitir campos extra
}

export const eventHandlers: Record<
  EventType | string,
  Array<(payload: any) => Promise<EventHandlerResult>>
> = {
  "checkout.session.completed": [handleCheckoutSessionCompleted],
  "account.updated": [handleAccountUpdated],
  "payment_intent.succeeded": [handlePaymentIntentSucceeded], // ✅ este es el nuevo
  "account.application.deauthorized": [handleAccountDeauthorized],
  "account.application.authorized": [handleAccountAuthorized],
};
